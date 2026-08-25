/**
 * =============================================================================
 * MODULE: backend/data.js
 * VERSION: v19.6.16-canonical-ssot
 * RESPONSIBILITY: CMS data hooks for canonical dates, immutable fiscal records,
 *                 and immutable labor records with private staff resolution.
 * STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
 * =============================================================================
 */

import wixData from "wix-data";
import {
    getMadridLocalStringNoZ,
} from "public/mmUtils";
import {
    COLLECTIONS,
    SINGLETONS,
    TIPO_FICHAJE,
    CITA_FIELDS,
    ESTADO_CITA,
} from "backend/internalConfig";
import { findStaff } from "backend/staff";

const CAJA_ACTUAL_ID = SINGLETONS.CAJA;
const DUAL_CACHE_COL = COLLECTIONS.DUAL_CACHE;
const DAYS_CACHE_COL = COLLECTIONS.DAYS_CACHE;
const SLOTS_CACHE_COL = COLLECTIONS.SLOTS_CACHE;
const SHA256_HEX_RE = /^[0-9a-f]{64}$/i;
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function _toDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

function _normalizeDateField(item, field, fallback) {
    const date = _toDate(item[field]);
    item[field] = date || fallback;
}

export function CitasF2_beforeInsert(item, context) {
    if (!item || typeof item !== "object" || context?.suppressHooks === true) return item;

    const bookingId = String(item.bookingId || "").trim();
    if (!bookingId) throw new Error("CITAS_VIOLATION: Missing bookingId.");
    item.bookingId = bookingId;

    const now = new Date();
    _normalizeDateField(item, "startDate", null);
    _normalizeDateField(item, "endDate", null);
    _normalizeDateField(item, "fechaCreacion", now);
    _normalizeDateField(item, "fechaActualizacion", now);

    if (!item.fechaYmdMadrid && item.startDate) {
        item.fechaYmdMadrid = getMadridLocalStringNoZ(item.startDate).slice(0, 10);
    }

    item[CITA_FIELDS.STATUS] = String(item[CITA_FIELDS.STATUS] || ESTADO_CITA.CONFIRMED).toUpperCase();
    item[CITA_FIELDS.STATUS_PAGO] = String(item[CITA_FIELDS.STATUS_PAGO] || "UNPAID").toUpperCase();
    return item;
}

async function _removeCollectionItemsByServiceId(collectionId, fields, serviceId) {
    const cleanServiceId = String(serviceId || "").trim();
    if (!GUID_RE.test(cleanServiceId)) return;

    const matches = await Promise.allSettled(
        fields.map((field) => wixData.query(collectionId).eq(field, cleanServiceId).limit(1000).find({ suppressAuth: true }))
    );
    const ids = new Set(
        matches
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => result.value?.items || [])
            .map((item) => item?._id)
            .filter(Boolean)
    );
    await Promise.allSettled(
        [...ids].map((itemId) => wixData.remove(collectionId, itemId, { suppressAuth: true }))
    );
}

async function _invalidateServiceCaches(serviceId) {
    await Promise.allSettled([
        _removeCollectionItemsByServiceId(DUAL_CACHE_COL, ["serviceId", "phaseOneServiceId", "phaseTwoServiceId"], serviceId),
        _removeCollectionItemsByServiceId(DAYS_CACHE_COL, ["serviceId"], serviceId),
        _removeCollectionItemsByServiceId(SLOTS_CACHE_COL, ["phaseOneServiceId"], serviceId),
    ]);
}

export async function Import2_afterUpdate(item, context) {
    if (!item || context?.suppressHooks === true) return item;
    await _invalidateServiceCaches(item.serviceId);
    await _invalidateServiceCaches(item.linkFases);
    return item;
}

export function DualSlotCache_beforeInsert(item, context) {
    if (!item || typeof item !== "object") return item;
    item.status = String(item.status || "ACTIVE").toUpperCase();
    _normalizeDateField(item, "createdAt", new Date());
    if (item.expiresAt) _normalizeDateField(item, "expiresAt", null);
    return item;
}

export function cajaActual_beforeInsert(item) {
    if (item && typeof item === "object") item._id = CAJA_ACTUAL_ID;
    return item;
}

export function cajaActual_beforeUpdate(item) {
    if (item && typeof item === "object") item._id = CAJA_ACTUAL_ID;
    return item;
}

function _isAuthorizedMigration(context) {
    return context?._migration === true &&
           context?.suppressAuth === true &&
           (context?.userRole === "admin" || context?.authContext?.role === "admin");
}

export function cajaActual_beforeRemove(itemId, context) {
    if (_isAuthorizedMigration(context)) return itemId;
    throw new Error("SINGLETON_PROTECTED: Direct deletion of cajaActual is forbidden.");
}

export function movimientoCaja_beforeInsert(item, context) {
    if (!item || typeof item !== "object") return item;

    if (!SHA256_HEX_RE.test(String(item.hashCadena || "").trim())) {
        throw new Error("FISCAL_VIOLATION: Missing or invalid hashCadena format.");
    }
    if (!SHA256_HEX_RE.test(String(item.prevHash || "").trim())) {
        throw new Error("FISCAL_VIOLATION: Missing or invalid prevHash format.");
    }

    const signatureParts = String(item.firmaDigital || "").trim().split("|");
    if (signatureParts.length !== 2 || !SHA256_HEX_RE.test(signatureParts[0]) || !SHA256_HEX_RE.test(signatureParts[1])) {
        throw new Error("FISCAL_VIOLATION: Invalid firmaDigital format.");
    }
    if (!String(item.numTicketFactura || "").trim()) {
        throw new Error("FISCAL_VIOLATION: Missing numTicketFactura.");
    }

    _normalizeDateField(item, "fechaCreacion", new Date());
    return item;
}

export function movimientoCaja_beforeUpdate(item, context) {
    if (_isAuthorizedMigration(context)) return item;
    throw new Error("FISCAL_VIOLATION: Direct updates to movimientoCaja are forbidden.");
}

export function movimientoCaja_beforeRemove(itemId, context) {
    if (_isAuthorizedMigration(context)) return itemId;
    throw new Error("FISCAL_VIOLATION: Direct removals from movimientoCaja are forbidden.");
}

export async function REGISTRO_HORARIO_beforeInsert(item, context) {
    if (!item || typeof item !== "object") return item;

    const staff = await findStaff(item.resourceId);
    if (!staff) {
        throw new Error("INVALID_EMPLOYEE: Employee resourceId is not registered in MAPA_STAFF.");
    }

    const tipoFichaje = String(item.tipoFichaje || "").toUpperCase();
    if (!Object.values(TIPO_FICHAJE).includes(tipoFichaje)) {
        throw new Error(`INVALID_CLOCK_TYPE: Tipo de fichaje invalido "${tipoFichaje}".`);
    }
    if (tipoFichaje === TIPO_FICHAJE.AJUSTE && !String(item.motivoAjuste || "").trim()) {
        throw new Error("INVALID_CLOCK_ADJUSTMENT: motivoAjuste is required for manual adjustments.");
    }

    const now = new Date();
    const fechaHora = _toDate(item.fechaHora) || now;
    if (fechaHora.getTime() > now.getTime() + 60000) {
        throw new Error("INVALID_TIMESTAMP: Future timestamps are forbidden.");
    }

    const madrid = getMadridLocalStringNoZ(fechaHora);
    item.resourceId = staff.resourceId;
    item.resourceName = staff.displayName;
    item.tipoFichaje = tipoFichaje;
    item.fechaHora = fechaHora;
    item.fechaCreacion = now;
    item.diaKey = madrid.slice(0, 10);
    item.mesKey = madrid.slice(0, 7);
    item.hora = madrid.slice(11, 19);
    return item;
}

export function REGISTRO_HORARIO_beforeUpdate(item, context) {
    if (_isAuthorizedMigration(context)) return item;
    throw new Error("LABOR_LOG_VIOLATION: Direct updates to REGISTRO_HORARIO are forbidden.");
}

export function REGISTRO_HORARIO_beforeRemove(itemId, context) {
    if (_isAuthorizedMigration(context)) return itemId;
    throw new Error("LABOR_LOG_VIOLATION: Direct removals from REGISTRO_HORARIO are forbidden.");
}

function _assertMoney(value, field) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
        throw new Error(`ACCOUNTING_VIOLATION: Invalid ${field}.`);
    }
}

function _assertSignedHashSignature(hash, signature, hashField) {
    if (!SHA256_HEX_RE.test(String(hash || "").trim())) {
        throw new Error(`ACCOUNTING_VIOLATION: Missing or invalid ${hashField}.`);
    }
    const parts = String(signature || "").trim().split("|");
    if (parts.length !== 2 || !SHA256_HEX_RE.test(parts[0]) || !SHA256_HEX_RE.test(parts[1])) {
        throw new Error("ACCOUNTING_VIOLATION: Invalid accounting signature.");
    }
}

export function ASIENTOS_CONTABLES_beforeInsert(item, context) {
    if (!item || typeof item !== "object") return item;
    if (!String(item.idAsiento || "").trim() || !String(item.idTransaccion || "").trim()) {
        throw new Error("ACCOUNTING_VIOLATION: Missing accounting identity.");
    }
    if (!Number.isInteger(Number(item.numeroAsiento)) || Number(item.numeroAsiento) <= 0) {
        throw new Error("ACCOUNTING_VIOLATION: Invalid numeroAsiento.");
    }
    _assertMoney(item.totalDebe, "totalDebe");
    _assertMoney(item.totalHaber, "totalHaber");
    if (Math.abs(Number(item.totalDebe) - Number(item.totalHaber)) > 0.005) {
        throw new Error("ACCOUNTING_VIOLATION: Unbalanced accounting header.");
    }
    if (!SHA256_HEX_RE.test(String(item.hashAnterior || "").trim())) {
        throw new Error("ACCOUNTING_VIOLATION: Missing or invalid hashAnterior.");
    }
    _assertSignedHashSignature(item.hashAsiento, item.firmaAsiento, "hashAsiento");
    _normalizeDateField(item, "fechaOperacion", new Date());
    _normalizeDateField(item, "fechaHoraRegistro", new Date());
    return item;
}

export function ASIENTOS_CONTABLES_beforeUpdate(item, context) {
    if (_isAuthorizedMigration(context)) return item;
    throw new Error("ACCOUNTING_VIOLATION: Direct updates to ASIENTOS_CONTABLES are forbidden.");
}

export function ASIENTOS_CONTABLES_beforeRemove(itemId, context) {
    if (_isAuthorizedMigration(context)) return itemId;
    throw new Error("ACCOUNTING_VIOLATION: Direct removals from ASIENTOS_CONTABLES are forbidden.");
}

export function LINEAS_ASIENTO_CONTABLE_beforeInsert(item, context) {
    if (!item || typeof item !== "object") return item;
    if (!String(item.idLineaAsiento || "").trim() || !String(item.idAsiento || "").trim()) {
        throw new Error("ACCOUNTING_VIOLATION: Missing accounting line identity.");
    }
    if (!Number.isInteger(Number(item.numeroLinea)) || Number(item.numeroLinea) <= 0) {
        throw new Error("ACCOUNTING_VIOLATION: Invalid numeroLinea.");
    }
    _assertMoney(item.importeDebe, "importeDebe");
    _assertMoney(item.importeHaber, "importeHaber");
    const debit = Number(item.importeDebe);
    const credit = Number(item.importeHaber);
    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new Error("ACCOUNTING_VIOLATION: Every accounting line requires one nonzero side.");
    }
    if (!SHA256_HEX_RE.test(String(item.hashLinea || "").trim())) {
        throw new Error("ACCOUNTING_VIOLATION: Missing or invalid hashLinea.");
    }
    _normalizeDateField(item, "fechaOperacion", new Date());
    _normalizeDateField(item, "fechaHoraRegistro", new Date());
    return item;
}

export function LINEAS_ASIENTO_CONTABLE_beforeUpdate(item, context) {
    if (_isAuthorizedMigration(context)) return item;
    throw new Error("ACCOUNTING_VIOLATION: Direct updates to LINEAS_ASIENTO_CONTABLE are forbidden.");
}

export function LINEAS_ASIENTO_CONTABLE_beforeRemove(itemId, context) {
    if (_isAuthorizedMigration(context)) return itemId;
    throw new Error("ACCOUNTING_VIOLATION: Direct removals from LINEAS_ASIENTO_CONTABLE are forbidden.");
}

export function EVENTOS_SISTEMA_FACTURACION_beforeUpdate(item, context) {
    if (_isAuthorizedMigration(context)) return item;
    throw new Error("ACCOUNTING_VIOLATION: Direct updates to EVENTOS_SISTEMA_FACTURACION are forbidden.");
}

export function EVENTOS_SISTEMA_FACTURACION_beforeRemove(itemId, context) {
    if (_isAuthorizedMigration(context)) return itemId;
    throw new Error("ACCOUNTING_VIOLATION: Direct removals from EVENTOS_SISTEMA_FACTURACION are forbidden.");
}
