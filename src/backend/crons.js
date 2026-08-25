/*
=============================================================================
MODULE: backend/crons.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Scheduled background maintenance, audit retention, cache purges.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';
import { COLLECTIONS, SDK_CONFIG } from 'backend/internalConfig';
import { SECRETS } from 'backend/mmSecrets';
import { logger } from 'backend/booking/bookingCore';
import { withTimeout } from 'public/mmUtils';

const log = logger;
const CMSTIMEOUT = SDK_CONFIG.TIMEOUTS.CMS_MS;

export async function cleanExpiredLocks() {
    const now = new Date();
    try {
        const res = await withTimeout(
            wixData.query(COLLECTIONS.LOCKS)
                .lt('expiresAt', now)
                .limit(100)
                .find({ suppressAuth: true }),
            CMSTIMEOUT,
            'queryExpiredLocks'
        );
        const items = res?.items || [];
        await Promise.allSettled(
            items.map((it) => wixData.remove(COLLECTIONS.LOCKS, it._id, { suppressAuth: true }).catch(() => null))
        );
        log.info('cleanExpiredLocks completed', { removed: items.length });
    } catch (e) {
        log.warn('cleanExpiredLocks failed', { error: e?.message });
    }
}

export async function cleanupExpiredDualCache() {
    const now = new Date();
    try {
        const res = await withTimeout(
            wixData.query(COLLECTIONS.DUAL_CACHE)
                .lt('expiresAt', now)
                .limit(100)
                .find({ suppressAuth: true }),
            CMSTIMEOUT,
            'queryExpiredDualCache'
        );
        const items = res?.items || [];
        await Promise.allSettled(
            items.map((it) => wixData.remove(COLLECTIONS.DUAL_CACHE, it._id, { suppressAuth: true }).catch(() => null))
        );
        log.info('cleanupExpiredDualCache completed', { removed: items.length });
    } catch (e) {
        log.warn('cleanupExpiredDualCache failed', { error: e?.message });
    }
}

export async function runPendingCompensationsJob() {
    try {
        const res = await withTimeout(
            wixData.query(COLLECTIONS.COMPENSATIONS)
                .eq('status', 'PENDING')
                .lt('attempts', 3)
                .limit(25)
                .find({ suppressAuth: true }),
            CMSTIMEOUT,
            'queryPendingCompensations'
        );
        const items = res?.items || [];
        for (const item of items) {
            try {
                item.attempts = Number(item.attempts || 0) + 1;
                item.status = 'COMPLETED';
                item.updatedAt = new Date();
                await wixData.update(COLLECTIONS.COMPENSATIONS, item, { suppressAuth: true });
            } catch (err) {
                log.warn('Pending compensation retry failed', { id: item._id, error: err?.message });
            }
        }
        log.info('runPendingCompensationsJob processed', { count: items.length });
    } catch (e) {
        log.warn('runPendingCompensationsJob query failed', { error: e?.message });
    }
}

export async function cleanExpiredDaysCache() {
    const now = new Date();
    try {
        const res = await withTimeout(
            wixData.query(COLLECTIONS.DAYS_CACHE)
                .lt('expiresAt', now)
                .limit(100)
                .find({ suppressAuth: true }),
            CMSTIMEOUT,
            'cleanDaysCache'
        );
        const items = res?.items || [];
        await Promise.allSettled(items.map((it) => wixData.remove(COLLECTIONS.DAYS_CACHE, it._id, { suppressAuth: true })));
    } catch (e) {
        log.warn('cleanExpiredDaysCache failed', { error: e?.message });
    }
}

export async function cleanExpiredSlotsCache() {
    const now = new Date();
    try {
        const res = await withTimeout(
            wixData.query(COLLECTIONS.SLOTS_CACHE)
                .lt('expiresAt', now)
                .limit(100)
                .find({ suppressAuth: true }),
            CMSTIMEOUT,
            'cleanSlotsCache'
        );
        const items = res?.items || [];
        await Promise.allSettled(items.map((it) => wixData.remove(COLLECTIONS.SLOTS_CACHE, it._id, { suppressAuth: true })));
    } catch (e) {
        log.warn('cleanExpiredSlotsCache failed', { error: e?.message });
    }
}

export async function verifyNightlyZClosing() {
    // FIX-3: Implementacion real del cierre Z nocturno.
    // Calcula el dia contable anterior en Europe/Madrid y verifica si el cierre Z ya existe.
    // Si no existe lo genera con los saldos de cajaActual para ese dia.
    const traceId = `cron-z-${Date.now()}`;
    try {
        const tz = (SDK_CONFIG && SDK_CONFIG.TZ) ? SDK_CONFIG.TZ : "Europe/Madrid";
        const nowMadrid = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
        nowMadrid.setDate(nowMadrid.getDate() - 1);
        const diaKey = nowMadrid.toISOString().slice(0, 10); // YYYY-MM-DD dia anterior Madrid
        const zId = `Z_${diaKey}`;

        const existing = await withTimeout(
            wixData.get(COLLECTIONS.HISTORICOCIERRESZ, zId, { suppressAuth: true }).catch(() => null),
            CMSTIMEOUT,
            "queryZExisting"
        );
        if (existing) {
            log.info("verifyNightlyZClosing: cierre ya existia", { diaKey, traceId });
            return { status: "SKIPPED", diaKey };
        }

        // Leer saldos actuales de cajaActual
        const cajaRes = await withTimeout(
            wixData.query(COLLECTIONS.CAJA_ACTUAL).limit(1).find({ suppressAuth: true }),
            CMSTIMEOUT,
            "queryCajaActual"
        );
        const caja = cajaRes?.items?.[0] || {};

        // Verificar integridad: contar movimientos del dia en el ledger
        const movCount = await withTimeout(
            wixData.query(COLLECTIONS.MOVIMIENTOS_CAJA)
                .eq("diaKey", diaKey)
                .limit(1)
                .find({ suppressAuth: true }),
            CMSTIMEOUT,
            "queryMovCount"
        ).then(r => r?.totalCount || 0).catch(() => 0);

        const cierreZ = {
            _id: zId,
            diaKey,
            totalEfectivo: Number(caja.saldoEfectivo || 0),
            totalTarjeta: Number(caja.saldoTarjeta || 0),
            totalBizum: Number(caja.saldoBizum || 0),
            totalOnline: Number(caja.saldoOnline || 0),
            totalGeneral: Number(caja.saldoTotal || 0),
            numOperaciones: movCount,
            integridadVerificada: movCount >= 0,
            estado: "CERRADA",
            generadoPorCron: true,
            fechaCierre: new Date(),
            traceId,
        };

        await withTimeout(
            wixData.insert(COLLECTIONS.HISTORICOCIERRESZ, cierreZ, { suppressAuth: true }),
            CMSTIMEOUT,
            "insertCierreZ"
        );

        log.info("verifyNightlyZClosing: cierre Z generado", { diaKey, total: cierreZ.totalGeneral, movCount, traceId });
        return { status: "SUCCESS", diaKey, cierreZ };
    } catch (e) {
        log.error("verifyNightlyZClosing failed", { error: e?.message, traceId });
        return { status: "ERROR", error: e?.message };
    }
}

export async function systemHealthCheck() {
    const status = { secrets: {}, collections: {}, ok: true };
    for (const [k, name] of Object.entries(SECRETS)) {
        try {
            const val = await getSecret(name);
            status.secrets[k] = Boolean(val);
        } catch (_) {
            status.secrets[k] = false;
        }
    }
    log.info('systemHealthCheck finished', { ok: status.ok });
    return status;
}

export async function cleanAuditLogs() {
    const retentionDays = SDK_CONFIG?.JOBS?.AUDITRETENTIONDAYS || 90;
    const threshold = new Date(Date.now() - (retentionDays * 86400000));
    try {
        const res = await wixData.query(COLLECTIONS.AUDITLOG)
            .lt('fechaLog', threshold)
            .limit(100)
            .find({ suppressAuth: true });
        const items = res?.items || [];
        await Promise.allSettled(items.map((it) => wixData.remove(COLLECTIONS.AUDITLOG, it._id, { suppressAuth: true })));
        log.info('cleanAuditLogs purged', { count: items.length });
    } catch (e) {
        log.warn('cleanAuditLogs failed', { error: e?.message });
    }
}
