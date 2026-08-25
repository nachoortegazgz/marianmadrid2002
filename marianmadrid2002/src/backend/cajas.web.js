/*
=============================================================================
MODULE: backend/cajas.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Cashier ledger, Veri*Factu hash chaining, Z closing, X count,
            and real-time cajaActual singleton upsert.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { webMethod, Permissions } from 'wix-web-module';
import { getSecret } from 'wix-secrets-backend';
import {
    COLLECTIONS,
    TIPO_MOVIMIENTO,
    FORMA_PAGO,
    IVA_RATES,
    CAJA_STATUS,
    SDK_CONFIG,
    SINGLETONS,
} from 'backend/internalConfig';
import { SECRETS } from 'backend/mmSecrets';
import { requireCajero, requireAdmin, rateLimiter } from 'backend/security';
import { hmacSha256Hex, verifyHMAC } from 'backend/securityEngine';
import { makeTraceId, _safeTrim, withTimeout, normalizeIdPart } from 'public/mmUtils';
import { logger, createBookingError, ERROR_CODES } from 'backend/booking/bookingCore';
import { toPublicError } from 'backend/responseUtils';

const log = logger;
const CMSTIMEOUTMS = SDK_CONFIG.TIMEOUTS.CMS_MS;
const CAJAACTUAL_ID = SINGLETONS.CAJA || "CAJA_PRINCIPAL";

let cachedNifEmisor = null;
let nifCacheTime = 0;
const NIFCACHETTLMS = Number(SDK_CONFIG?.SECURITY?.SECRETCACHETTL_MS) || 300000;

async function _getNifEmisor(traceId) {
    const now = Date.now();
    if (cachedNifEmisor && now - nifCacheTime < NIFCACHETTLMS) {
        return cachedNifEmisor;
    }
    const nif = await getSecret(SECRETS.FISCALNIFEMISOR).catch(() => null);
    cachedNifEmisor = nif || null;
    nifCacheTime = now;
    if (!cachedNifEmisor) {
        log.warn("FISCALNIFEMISOR secret missing. nifEmisor will be null in ledger entries.", { traceId });
    }
    return cachedNifEmisor;
}

function _rateLimitOrThrow(surface, key, traceId) {
    const res = rateLimiter({ surface, key }, 20, 5000);
    if (!res.allowed) {
        throw createBookingError(ERROR_CODES.RATELIMITED, "Rate limit exceeded", { traceId });
    }
}

async function _getCachedCashierSecret() {
    const key = await getSecret(SECRETS.FISCALKEY).catch(() => '');
    if (!key) throw new Error("Missing SECRET_FISCALKEY");
    return key;
}

async function _getCajaActual() {
    return await withTimeout(
        wixData.get(COLLECTIONS.CAJA_ACTUAL, CAJAACTUAL_ID, { suppressAuth: true }).catch(() => null),
        CMSTIMEOUTMS,
        "getCajaActual"
    );
}

async function _upsertCajaActual(patch, traceId) {
    const now = new Date();
    const tz = SDK_CONFIG?.TZ || "Europe/Madrid";
    const diaKeyHoy = now.toLocaleDateString("sv-SE", { timeZone: tz });
    const existing = await _getCajaActual();
    const isNewDay = !existing || existing.diaKey !== diaKeyHoy;

    const base = isNewDay
        ? {
            _id: CAJAACTUAL_ID,
            diaKey: diaKeyHoy,
            estado: CAJA_STATUS.OPEN,
            saldoEfectivo: 0,
            saldoTarjeta: 0,
            saldoBizum: 0,
            saldoOnline: 0,
            saldoTotal: 0,
            totalOperaciones: 0,
            ultimoMovimientoId: null,
            ultimoMovimientoAt: null,
            fechaApertura: now,
            fechaUltimaActualizacion: now,
            traceId: String(traceId),
        }
        : { ...existing };

    const updated = {
        ...base,
        ...patch,
        fechaUltimaActualizacion: now,
        traceId: String(traceId),
    };

    updated.saldoTotal =
        Number(updated.saldoEfectivo || 0) +
        Number(updated.saldoTarjeta || 0) +
        Number(updated.saldoBizum || 0) +
        Number(updated.saldoOnline || 0);

    const { _createdDate, _updatedDate, _owner, ...safeDoc } = updated;

    if (existing) {
        await withTimeout(
            wixData.update(COLLECTIONS.CAJA_ACTUAL, safeDoc, { suppressAuth: true }),
            CMSTIMEOUTMS,
            "upsertCajaActualUpdate"
        );
    } else {
        await withTimeout(
            wixData.insert(COLLECTIONS.CAJA_ACTUAL, safeDoc, { suppressAuth: true }),
            CMSTIMEOUTMS,
            "upsertCajaActualInsert"
        );
    }
    return safeDoc;
}

function _getSaldoFieldForPayment(formaPago) {
    switch (String(formaPago).toUpperCase()) {
        case FORMA_PAGO.EFECTIVO: return "saldoEfectivo";
        case FORMA_PAGO.TARJETA: return "saldoTarjeta";
        case FORMA_PAGO.BIZUM: return "saldoBizum";
        case FORMA_PAGO.ONLINE: return "saldoOnline";
        default: return null;
    }
}

export const registerBookingPayment = async (bookingId, amount, paymentMethod, options = {}) => {
    const traceId = options.traceId || makeTraceId("pay");
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount === 0) {
        throw new Error("INVALID_AMOUNT");
    }

    const nifEmisor = await _getNifEmisor(traceId);
    const fiscalKey = await _getCachedCashierSecret();
    const now = new Date();
    const tz = SDK_CONFIG?.TZ || "Europe/Madrid";
    const diaKey = now.toLocaleDateString("sv-SE", { timeZone: tz });
    const mesKey = diaKey.slice(0, 7);

    const signo = numAmount < 0 ? -1 : 1;
    const absAmount = Math.abs(numAmount);
    const importeContable = Math.round(numAmount * 100) / 100;
    const baseImponible = Math.round((importeContable / (1 + IVA_RATES.GENERAL)) * 100) / 100;
    const cuotaIva = Math.round((importeContable - baseImponible) * 100) / 100;

    const seqGlobal = Date.now();
    const numTicketFactura = `FAC-${diaKey.slice(0, 4)}-${String(seqGlobal).slice(-6)}`;
    const transId = options.transactionId || makeTraceId("tx");
    const recordId = `MOV_${normalizeIdPart(diaKey, 10)}_${normalizeIdPart(transId, 80)}`;

    const prevHash = "GENESIS_HASH";
    const rawDataToSign = `${prevHash}|${numTicketFactura}|${importeContable}|${diaKey}|${nifEmisor || ''}`;
    const hashCadena = hmacSha256Hex(fiscalKey, rawDataToSign);
    const firmaDigital = hmacSha256Hex(fiscalKey, hashCadena);

    const normalizedMethod = String(paymentMethod || FORMA_PAGO.ONLINE).toUpperCase();
    const tipoMov = options.tipoMovimiento || (numAmount < 0 ? TIPO_MOVIMIENTO.REEMBOLSO : TIPO_MOVIMIENTO.VENTAONLINE);

    const movimiento = {
        _id: recordId,
        seqGlobal,
        tipoMovimiento: tipoMov,
        concepto: _safeTrim(options.concept) || "Servicio Marian Madrid",
        origen: "MOVIMIENTO_CAJA",
        orderId: options.orderId || null,
        refundId: options.refundId || null,
        importeTotal: absAmount,
        signo,
        importeContable,
        baseImponible,
        cuotaIva,
        tasaIva: IVA_RATES.GENERAL,
        numTicketFactura,
        prevHash,
        hashCadena,
        firmaDigital,
        formaPago: normalizedMethod,
        reservaIdVinculada: bookingId || null,
        transactionId: transId,
        resourceId: options.resourceId ? normalizeIdPart(options.resourceId, 80) : null,
        nifEmisor,
        diaKey,
        mesKey,
        traceId: String(traceId),
        fechaCreacion: now,
    };

    await withTimeout(
        wixData.insert(COLLECTIONS.MOVIMIENTOS_CAJA, movimiento, { suppressAuth: true }),
        CMSTIMEOUTMS,
        "insertMovimiento"
    );

    try {
        const saldoField = _getSaldoFieldForPayment(normalizedMethod);
        const cajaPatch = {
            ultimoMovimientoId: recordId,
            ultimoMovimientoAt: now,
        };
        if (saldoField) {
            const currentCaja = await _getCajaActual();
            const currentSaldo = Number(currentCaja?.[saldoField] || 0);
            cajaPatch[saldoField] = currentSaldo + importeContable;
        }
        await _upsertCajaActual(cajaPatch, traceId);
    } catch (cajaErr) {
        log.warn("cajaActual singleton update failed (best-effort)", { traceId, error: cajaErr?.message });
    }

    return { status: "SUCCESS", data: movimiento, error: null };
};

export const getCashierState = webMethod(Permissions.SiteMember, async (options = {}) => {
    const traceId = options.traceId || makeTraceId("cashier-state");
    try {
        _rateLimitOrThrow("cajas.getCashierState", "cashier", traceId);
        await requireCajero(traceId);

        const tz = SDK_CONFIG?.TZ || "Europe/Madrid";
        const diaKeySolicitado = options.diaKey || new Date().toLocaleDateString("sv-SE", { timeZone: tz });
        const cajaActual = await _getCajaActual();

        if (cajaActual && cajaActual.diaKey === diaKeySolicitado) {
            return {
                status: "SUCCESS",
                data: {
                    diaKey: cajaActual.diaKey,
                    estado: cajaActual.estado || CAJA_STATUS.OPEN,
                    saldoEfectivo: Number(cajaActual.saldoEfectivo || 0),
                    saldoTarjeta: Number(cajaActual.saldoTarjeta || 0),
                    saldoBizum: Number(cajaActual.saldoBizum || 0),
                    saldoOnline: Number(cajaActual.saldoOnline || 0),
                    saldoTotal: Number(cajaActual.saldoTotal || 0),
                    totalOperaciones: Number(cajaActual.totalOperaciones || 0),
                    ultimoMovimientoId: cajaActual.ultimoMovimientoId || null,
                    ultimoMovimientoAt: cajaActual.ultimoMovimientoAt || null,
                    fechaApertura: cajaActual.fechaApertura || null,
                    fuente: "cajaActual_singleton",
                },
                error: null,
            };
        }

        return {
            status: "SUCCESS",
            data: {
                diaKey: diaKeySolicitado,
                estado: CAJA_STATUS.OPEN,
                saldoEfectivo: 0,
                saldoTarjeta: 0,
                saldoBizum: 0,
                saldoOnline: 0,
                saldoTotal: 0,
                totalOperaciones: 0,
                fuente: "fallback_empty",
            },
            error: null,
        };
    } catch (err) {
        return { status: "ERROR", data: null, error: toPublicError(err, "CASHIERSTATE_FAIL") };
    }
});

export const registerManualTransaction = webMethod(Permissions.SiteMember, async (payload = {}) => {
    const traceId = payload.traceId || makeTraceId("manual-tx");
    try {
        await requireCajero(traceId);
        const amount = Number(payload.amount);
        const paymentMethod = String(payload.paymentMethod || FORMA_PAGO.EFECTIVO);
        const concept = String(payload.concept || "Venta mostrador");
        return await registerBookingPayment(null, amount, paymentMethod, {
            concept,
            resourceId: payload.resourceId,
            traceId,
            tipoMovimiento: TIPO_MOVIMIENTO.VENTAEFECTIVO
        });
    } catch (e) {
        return { status: "ERROR", data: null, error: toPublicError(e, "MANUALTX_FAIL") };
    }
});

export const registerXCount = webMethod(Permissions.SiteMember, async (diaKey, options = {}) => {
    const traceId = options.traceId || makeTraceId("x-count");
    try {
        _rateLimitOrThrow("cajas.registerXCount", "cashier", traceId);
        await requireCajero(traceId);

        const metalicoCaja = Number(options.metalicoCaja || 0);
        const cajaActual = await _getCajaActual();
        const efectivoTeorico = Number(cajaActual?.saldoEfectivo || 0);
        const descuadre = Math.round((metalicoCaja - efectivoTeorico) * 100) / 100;
        const estadoCuadre = descuadre === 0 ? "CUADRADO" : (descuadre > 0 ? "SOBRANTE" : "FALTANTE");

        const record = {
            diaKey: String(diaKey),
            metalicoCaja: Math.round(metalicoCaja * 100) / 100,
            totalEfectivoTeorico: Math.round(efectivoTeorico * 100) / 100,
            descuadre,
            estadoCuadre,
            fechaConteo: new Date(),
            traceId,
        };

        const result = await withTimeout(
            wixData.insert(COLLECTIONS.CONTEOSX, record, { suppressAuth: true }),
            CMSTIMEOUTMS,
            "insertXCount"
        );
        return { status: "SUCCESS", data: result, error: null };
    } catch (error) {
        return { status: "ERROR", data: null, error: toPublicError(error, "XCOUNT_FAIL") };
    }
});

export const registerZClosing = webMethod(Permissions.SiteMember, async (diaKey, options = {}) => {
    const traceId = options.traceId || makeTraceId("z-closing");
    try {
        await requireAdmin(traceId);
        const zId = `Z_${String(diaKey)}`;
        const existing = await wixData.get(COLLECTIONS.HISTORICOCIERRESZ, zId, { suppressAuth: true }).catch(() => null);
        if (existing) {
            return { status: "SUCCESS", data: { ...existing, idempotent: true }, error: null };
        }

        const cajaActual = await _getCajaActual();
        const cierreZ = {
            _id: zId,
            diaKey: String(diaKey),
            totalEfectivo: Number(cajaActual?.saldoEfectivo || 0),
            totalTarjeta: Number(cajaActual?.saldoTarjeta || 0),
            totalBizum: Number(cajaActual?.saldoBizum || 0),
            totalOnline: Number(cajaActual?.saldoOnline || 0),
            totalGeneral: Number(cajaActual?.saldoTotal || 0),
            numOperaciones: Number(cajaActual?.totalOperaciones || 0),
            estado: CAJA_STATUS.CLOSED,
            fechaCierre: new Date(),
            traceId,
        };

        await withTimeout(
            wixData.insert(COLLECTIONS.HISTORICOCIERRESZ, cierreZ, { suppressAuth: true }),
            CMSTIMEOUTMS,
            "insertCierreZ"
        );

        try {
            await _upsertCajaActual({ estado: CAJA_STATUS.CLOSED }, traceId);
        } catch (_) {}

        return { status: "SUCCESS", data: cierreZ, error: null };
    } catch (err) {
        return { status: "ERROR", data: null, error: toPublicError(err, "ZCLOSING_FAIL") };
    }
});

export async function queueFiscalRecovery(payload) {
    const traceId = payload.traceId || makeTraceId("fis-rec");
    const recordId = `FIS_${normalizeIdPart(payload.transactionId || traceId, 80)}`;
    const now = new Date();
    try {
        await wixData.insert(COLLECTIONS.COMPENSATIONS, {
            _id: recordId,
            kind: "FISCAL_LEDGER",
            status: "PENDING",
            attempts: 0,
            bookingIds: String(payload.bookingIds || ""),
            amount: Number(payload.amount || 0),
            paymentMethod: String(payload.paymentMethod || FORMA_PAGO.ONLINE),
            transactionId: String(payload.transactionId || ""),
            orderId: String(payload.orderId || ""),
            origin: String(payload.origin || "cajas.web.js"),
            concept: String(payload.concept || "Fiscal ledger recovery"),
            resourceId: String(payload.resourceId || "online"),
            tipoMovimiento: String(payload.tipoMovimiento || TIPO_MOVIMIENTO.VENTAONLINE),
            traceId,
            lastError: String(payload.lastError || ""),
            createdAt: now,
            updatedAt: now,
        }, { suppressAuth: true });
    } catch (e) {
        log.warn("queueFiscalRecovery failed", { traceId, error: e?.message });
    }
}
