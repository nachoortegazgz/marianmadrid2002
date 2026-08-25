/**
 * =============================================================================
 * MODULE: backend/staff.js
 * VERSION: v19.6.2-canonical-staff-labels
 * RESPONSIBILITY: Private staff identity resolution from Secrets Manager.
 * STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
 * HISTORIAL DE VERSIONES:
 *   - v19.0.0: Backend-only staff catalog introduced.
 *   - v19.6.2: Limits presentation labels to MARIAN MADRID, ALBA STAFF, and ANDREA STAFF.
 *   - v19.4.5: Sources the staff cache TTL exclusively from public/mmUtils.js SSOT.
 *   - v19.4.4: Added scheduleId from MAPA_STAFF for Bookings V2 slot construction.
 *   - v19.0.1: Replaced hardcoded staff identifiers with MAPA_STAFF secret.
 * =============================================================================
 */

import { getSecret } from 'wix-secrets-backend';
import { SECRETS } from 'backend/mmSecrets';
import {
    _safeEmail,
    _safeTrim,
    withTimeout,
} from "public/mmUtils";
import {
    SDK_CONFIG,
} from "backend/internalConfig";

const STAFF_CACHE_TTL_MS = SDK_CONFIG.CACHE.STAFF_TTL_MS;
let staffCache = { loadedAt: 0, items: [] };

function _canonicalStaffDisplayName(rawName) {
    const normalized = _safeTrim(rawName).toUpperCase();
    if (normalized.includes('MARIAN')) return 'MARIAN MADRID';
    if (normalized.includes('ALBA')) return 'ALBA STAFF';
    if (normalized.includes('ANDREA')) return 'ANDREA STAFF';
    return 'PROFESIONAL SEGUN HORARIO';
}

function _normalizeStaffRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const resourceId = _safeTrim(raw.resourceId);
    if (!resourceId) return null;

    const email = _safeEmail(raw.email);
    const memberId = _safeTrim(raw.memberId);
    const scheduleId = _safeTrim(raw.scheduleId);
    const displayName = _canonicalStaffDisplayName(raw.displayName || raw.name);
    const role = _safeTrim(raw.role).toUpperCase();

    return Object.freeze({ resourceId, email, memberId, scheduleId, displayName, name: displayName, role });
}

async function _loadStaffCatalog() {
    const now = Date.now();
    if (staffCache.loadedAt && now - staffCache.loadedAt < STAFF_CACHE_TTL_MS) {
        return staffCache.items;
    }

    const secretName = SECRETS.MAPA_STAFF;
    const raw = await withTimeout(
        getSecret(secretName),
        SDK_CONFIG.TIMEOUTS.API_MS,
        'loadStaffCatalog'
    );

    let parsed;
    try {
        parsed = JSON.parse(String(raw || '[]'));
    } catch (_) {
        throw new Error('STAFF_CATALOG_SECRET_INVALID_JSON');
    }

    if (!Array.isArray(parsed)) {
        throw new Error('STAFF_CATALOG_SECRET_NOT_ARRAY');
    }

    const items = parsed.map(_normalizeStaffRecord).filter(Boolean);
    staffCache = { loadedAt: now, items };
    return items;
}

export async function findStaff(identifier) {
    const raw = _safeTrim(identifier);
    if (!raw) return null;

    const email = _safeEmail(raw);
    const items = await _loadStaffCatalog();

    return items.find((staff) =>
        staff.resourceId === raw ||
        (staff.memberId && staff.memberId === raw) ||
        (staff.email && staff.email === email)
    ) || null;
}

export async function getAllStaff() {
    return [...await _loadStaffCatalog()];
}

export function clearStaffCache() {
    staffCache = { loadedAt: 0, items: [] };
}
