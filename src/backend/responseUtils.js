/**
 * =============================================================================
 * FILE: backend/responseUtils.js
 * VERSION: v18.3.10-public-error-sanitization-fix
 * RESPONSIBILITY: Centralized response standardization for all modules.
 * STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
 * =============================================================================
 */

import { _cloneDeep, _safeTrim } from 'public/mmUtils';

const MAX_ERROR_MESSAGE_LENGTH = 500;
const MAX_ERROR_CODE_LENGTH = 80;

const PUBLIC_ERROR_MESSAGES = Object.freeze({
    AUTH_REQUIRED: 'Authentication required',
    ACCESS_DENIED: 'Access denied',
    ADMIN_REQUIRED: 'Administrator privileges required',
    CAJERO_REQUIRED: 'Cashier privileges required',
    COLLAB_REQUIRED: 'Collaborator access required',
    RATE_LIMITED: 'Too many requests',
    INVALID_PAYLOAD: 'Invalid request',
    INVALID_PARAMS: 'Invalid parameters',
    INVALID_EMAIL: 'Invalid email',
    INVALID_DATES: 'Invalid dates',
    SERVICE_NOT_FOUND: 'Service not found',
    RESOURCE_NOT_AVAILABLE: 'Requested resource is not available',
    SLOT_ERROR: 'Availability could not be resolved',
    CHECKOUT_FAILED: 'Checkout could not be created',
    BOOKING_CREATION_FAILED: 'Booking could not be created',
    INVENTORY_ERROR: 'Inventory operation failed',
    INVENTORY_USE_FAIL: 'Inventory operation failed',
    INVENTORY_RECEIPT_FAIL: 'Inventory receipt failed',
    INVENTORY_QUEUE_FAIL: 'Inventory queue could not be loaded',
    INVENTORY_APPLY_FAIL: 'Inventory reconciliation could not be applied',
});

function _safePublicCode(code) {
    const normalized = _safeTrim(code).toUpperCase().replace(/[^A-Z0-9_.-]/g, '_');
    return normalized.slice(0, MAX_ERROR_CODE_LENGTH) || 'UNKNOWN_ERROR';
}

function _sanitizePublicMessage(code, message) {
    const stableCode = _safePublicCode(code);
    const fallback = PUBLIC_ERROR_MESSAGES[stableCode] || 'Operation could not be completed';
    const raw = _safeTrim(message);

    if (!raw) return fallback;
    if (PUBLIC_ERROR_MESSAGES[stableCode]) return PUBLIC_ERROR_MESSAGES[stableCode];

    const withoutControlChars = raw.replace(/[\r\n\t]+/g, ' ');
    const withoutSecrets = withoutControlChars
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
        .replace(/(token|secret|api[_-]?key|password)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
        .replace(/https?:\/\/[^\s]+/gi, '[url-redacted]');

    return withoutSecrets.length > MAX_ERROR_MESSAGE_LENGTH
        ? `${withoutSecrets.slice(0, MAX_ERROR_MESSAGE_LENGTH)}...`
        : withoutSecrets;
}

export function successResponse(data, metaExtra = {}) {
    const extra = metaExtra && typeof metaExtra === 'object' ? _cloneDeep(metaExtra) : {};
    return {
        status: 'SUCCESS',
        meta: {
            timestamp: new Date().toISOString(),
            ...extra
        },
        data,
        error: null
    };
}

export function errorResponse(code, message, metaExtra = {}) {
    let finalCode = code;
    let finalMsg = message;

    if (code instanceof Error) {
        finalMsg = code.message || String(code);
        finalCode = code.code || code.name || 'UNKNOWN_ERROR';
    } else if (typeof code === 'object' && code !== null && (message === undefined || message === null)) {
        finalMsg = code.message || code.error || code.reason || null;
        finalCode = code.code || 'UNKNOWN_ERROR';
    } else if (typeof code === 'string' && (message === undefined || message === null)) {
        finalMsg = code;
        finalCode = code;
    }

    const safeCode = _safePublicCode(finalCode);
    const safeMsg = _sanitizePublicMessage(safeCode, finalMsg);
    const extra = metaExtra && typeof metaExtra === 'object' ? _cloneDeep(metaExtra) : {};

    return {
        status: 'ERROR',
        meta: {
            timestamp: new Date().toISOString(),
            ...extra
        },
        data: null,
        error: {
            code: safeCode,
            message: safeMsg
        }
    };
}

export function isSuccess(res) {
    if (!res) return false;
    if (res === true) return true;

    const rawStatus = res?.status ?? res?.payload?.status ?? res?.data?.status;
    if (typeof rawStatus === 'string') {
        const norm = rawStatus.trim().toUpperCase();
        if (norm === 'SUCCESS' || norm === 'OK') return true;
    }

    if (rawStatus === 200 || res?.success === true) return true;
    return false;
}

export function extractError(err, maxLen = MAX_ERROR_MESSAGE_LENGTH) {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return _safeTrim(err).slice(0, maxLen);

    let code = 'UNKNOWN_ERROR';
    let msg = '';

    if (err instanceof Error) {
        code = err.code || err.name || code;
        msg = err.message || String(err);
    } else if (typeof err === 'object') {
        code = err?.response?.data?.error?.code || err?.error?.code || err?.code || err?.details?.code || code;
        const candidates = [
            err?.response?.data?.error?.message,
            err?.response?.data?.message,
            typeof err?.response?.data?.error === 'string' ? err.response.data.error : null,
            err?.error?.message,
            typeof err?.error === 'string' ? err.error : null,
            err?.message,
            err?.details?.message,
            typeof err?.details === 'string' ? err.details : null,
            typeof err?.reason === 'string' ? err.reason : null,
            typeof err?.description === 'string' ? err.description : null,
        ];
        msg = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) || '';
    }

    return `${_safePublicCode(code)}: ${_sanitizePublicMessage(code, msg)}`.slice(0, maxLen);
}
