/*
=============================================================================
MODULE: backend/booking/bookingCore.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Elevated booking primitives, mutex locks, audit logs, and PII masking.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { COLLECTIONS, SDK_CONFIG, CONCURRENCY } from 'backend/internalConfig';
import { withTimeout, makeTraceId, _safeTrim } from 'public/mmUtils';

export const ERROR_CODES = Object.freeze({
    INVALIDPAYLOAD: "INVALIDPAYLOAD",
    TOKENBUSY: "TOKENBUSY",
    FISCALSIGNFAIL: "FISCALSIGNFAIL",
    FISCALVIOLATION: "FISCALVIOLATION",
    BOOKINGCREATIONFAILED: "BOOKINGCREATIONFAILED",
    CHECKOUTFAILED: "CHECKOUTFAILED",
    INVALIDEMPLOYEE: "INVALIDEMPLOYEE",
    AUTHREQUIRED: "AUTHREQUIRED",
    ACCESSDENIED: "ACCESSDENIED",
    INVALIDCLOCKTYPE: "INVALIDCLOCKTYPE",
    RATELIMITED: "RATELIMITED",
});

const PII_KEYS = new Set([
    "nombre",
    "apellidos",
    "firstname",
    "lastname",
    "email",
    "telefono",
    "phone",
    "address",
    "cliente",
    "contactdetails",
    "contactid",
    "identity",
]);

export const logger = {
    info: (msg, meta = {}) => console.log(`[INFO] ${msg}`, JSON.stringify(meta)),
    warn: (msg, meta = {}) => console.warn(`[WARN] ${msg}`, JSON.stringify(meta)),
    error: (msg, meta = {}) => console.error(`[ERROR] ${msg}`, JSON.stringify(meta)),
};

export function normalizeError(error) {
    if (!error) return { code: "UNKNOWN_ERROR", message: "Unknown error occurred" };
    const code = String(error.code || error.name || "ERROR");
    const message = String(error.message || error);
    return { code, message };
}

export function createBookingError(code, message, meta = {}) {
    const err = new Error(message);
    err.code = code;
    err.meta = meta;
    return err;
}

export async function lockSlotKeyOrFail(slotKey, traceId = "lock") {
    const lockId = `lk_${_safeTrim(slotKey).slice(0, 100)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CONCURRENCY.MUTEXTTLMS);

    try {
        const record = {
            _id: lockId,
            slotKey,
            traceId,
            createdAt: now,
            expiresAt,
        };
        await withTimeout(
            wixData.insert(COLLECTIONS.LOCKS, record, { suppressAuth: true }),
            SDK_CONFIG.TIMEOUTS.CMS_MS,
            "acquireLock"
        );
        return { ok: true, lockId };
    } catch (e) {
        logger.warn("Lock acquisition failed or already locked", { lockId, traceId, error: e?.message });
        throw createBookingError(ERROR_CODES.TOKENBUSY, "Slot is currently locked by another transaction", { slotKey, traceId });
    }
}

export async function unlockSlotKey(slotKey, traceId = "unlock") {
    const lockId = `lk_${_safeTrim(slotKey).slice(0, 100)}`;
    try {
        await withTimeout(
            wixData.remove(COLLECTIONS.LOCKS, lockId, { suppressAuth: true }).catch(() => null),
            SDK_CONFIG.TIMEOUTS.CMS_MS,
            "releaseLock"
        );
        return true;
    } catch (e) {
        logger.warn("Failed to release lock", { lockId, traceId, error: e?.message });
        return false;
    }
}

export async function logAuditEvent(action, details = {}, traceId = "audit") {
    try {
        const sanitized = {};
        for (const [k, v] of Object.entries(details)) {
            if (PII_KEYS.has(k.toLowerCase())) {
                sanitized[k] = "***MASKED***";
            } else {
                sanitized[k] = v;
            }
        }
        await withTimeout(
            wixData.insert(COLLECTIONS.AUDITLOG, {
                _id: makeTraceId("aud"),
                action: String(action),
                details: sanitized,
                traceId: String(traceId),
                fechaLog: new Date(),
            }, { suppressAuth: true }),
            SDK_CONFIG.TIMEOUTS.CMS_MS,
            "logAuditEvent"
        );
    } catch (e) {
        logger.warn("Failed to persist audit log", { action, traceId, error: e?.message });
    }
}
