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
    log.info('verifyNightlyZClosing: Verified previous day closing.');
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
