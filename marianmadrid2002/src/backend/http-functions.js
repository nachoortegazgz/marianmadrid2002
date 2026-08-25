/*
=============================================================================
MODULE: backend/http-functions.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: External REST endpoints for Power Automate / M365 integration.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { ok, badRequest, serverError, forbidden } from 'wix-http-functions';
import { getSecret } from 'wix-secrets-backend';
import { makeTraceId, _safeTrim, withTimeout } from 'public/mmUtils';
import { COLLECTIONS, SDK_CONFIG } from 'backend/internalConfig';
import { SECRETS } from 'backend/mmSecrets';
import { successResponse, errorResponse } from 'backend/responseUtils';
import { rateLimiter } from 'backend/security';
import { getQuarterlyTaxSummary } from 'backend/fiscalAggregator.web';

const CMSTIMEOUTMS = SDK_CONFIG.TIMEOUTS.CMS_MS;

function _safeTraceId(value, fallbackPrefix) {
    const raw = _safeTrim(value);
    if (!raw) return makeTraceId(fallbackPrefix);
    const normalized = raw.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
    return normalized || makeTraceId(fallbackPrefix);
}

function _getHeader(headers, name) {
    if (!headers) return undefined;
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
}

export async function get_getMovements(request) {
    const traceId = _safeTraceId(_getHeader(request && request.headers, 'x-trace-id'), 'http-movs');
    try {
        const rate = rateLimiter({ surface: 'http.getMovements', key: 'm365' }, 20, 5000);
        if (!rate.allowed) {
            return badRequest({ body: errorResponse('RATELIMITEXCEEDED', 'Too many requests', { traceId }) });
        }
        const date = _safeTrim(request?.query?.date);
        const res = await withTimeout(
            wixData.query(COLLECTIONS.MOVIMIENTOS_CAJA).eq('diaKey', date).limit(100).find({ suppressAuth: true }),
            CMSTIMEOUTMS,
            'queryMovimientos'
        );
        return ok({ body: successResponse(res?.items || [], { traceId, date }) });
    } catch (e) {
        return serverError({ body: errorResponse('SERVER_ERROR', e?.message, { traceId }) });
    }
}

export async function get_getTaxSummary(request) {
    const traceId = _safeTraceId(_getHeader(request && request.headers, 'x-trace-id'), 'http-tax');
    try {
        const year = Number(request?.query?.year) || new Date().getFullYear();
        const quarter = Number(request?.query?.quarter) || 1;
        const res = await getQuarterlyTaxSummary(year, quarter, { traceId });
        return ok({ body: successResponse(res?.data || {}, { traceId, year, quarter }) });
    } catch (e) {
        return serverError({ body: errorResponse('SERVER_ERROR', e?.message, { traceId }) });
    }
}
