/*
=============================================================================
MODULE: backend/staff.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Staff lookup from MAPA_STAFF secret with RAM cache.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { getSecret } from 'wix-secrets-backend';
import { SECRETS } from 'backend/mmSecrets';
import { SDK_CONFIG } from 'backend/internalConfig';
import { logger } from 'backend/booking/bookingCore';

const log = logger;
let _staffCache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = SDK_CONFIG?.CACHE?.STAFFTTLMS || 300000;

export async function getStaffMap(traceId = 'staff-map') {
    const now = Date.now();
    if (_staffCache && (now - _cacheTime < CACHE_TTL_MS)) {
        return _staffCache;
    }
    try {
        const raw = await getSecret(SECRETS.MAPASTAFF).catch(() => '[]');
        const parsed = JSON.parse(raw);
        _staffCache = Array.isArray(parsed) ? parsed : [];
        _cacheTime = now;
        return _staffCache;
    } catch (e) {
        log.warn('Failed to parse MAPA_STAFF secret', { traceId, error: e?.message });
        return [];
    }
}

export async function findStaff(resourceId, traceId = 'find-staff') {
    const map = await getStaffMap(traceId);
    const idStr = String(resourceId || '').trim();
    return map.find((s) => String(s.resourceId || s._id || s.id || '').trim() === idStr) || null;
}
