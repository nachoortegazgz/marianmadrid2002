/*
=============================================================================
MODULE: backend/responseUtils.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Canonical response format envelopes, public error conversion.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
export function successResponse(data, meta = {}) {
    return {
        status: "SUCCESS",
        data,
        error: null,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    };
}

export function errorResponse(code, message, meta = {}) {
    return {
        status: "ERROR",
        data: null,
        error: {
            code: String(code || "INTERNAL_ERROR"),
            message: String(message || "An unexpected error occurred.")
        },
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    };
}

export function toPublicError(err, fallbackCode = 'INTERNAL_ERROR', fallbackMessage = 'Error interno') {
    const code = String(err?.code || fallbackCode);
    const message = String(err?.message || fallbackMessage);
    return { code, message };
}
