/*
=============================================================================
MODULE: backend/security.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Server-side RBAC, secret-cached email allowlists,
            sliding-window rate limiter, and elevated permissions guards.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { getSecret } from 'wix-secrets-backend';
import { currentMember } from 'wix-members-backend';
import { COLLAB_ROLES, SDK_CONFIG } from "backend/internalConfig";
import { SECRETS } from 'backend/mmSecrets';
import { logger } from 'backend/booking/bookingCore';
import { hmacSha256Hex as generateHMAC, verifyHMAC, timingSafeEqual } from 'backend/securityEngine';
import { withTimeout } from "public/mmUtils";

const log = logger;
let _adminsCache = null;
let _cajerosCache = null;
let _cacheLoadedAt = 0;
const CACHETTLMS = Number(SDK_CONFIG?.SECURITY?.SECRETCACHETTL_MS) || 300000;
const _rateLimitCache = new Map();
const RATELIMITCLEANUPTTLMS = Number(SDK_CONFIG?.SECURITY?.RATELIMITCACHECLEANUPTTL_MS) || 60000;
const MAXRATELIMITCACHESIZE = Number(SDK_CONFIG?.SECURITY?.RATELIMITCACHEMAXENTRIES) || 5000;
let _rateLimitLastCleanup = 0;

export { generateHMAC, verifyHMAC, timingSafeEqual };

function _makeAccessDeniedError(code, message, meta) {
    const err = new Error(message);
    err.code = code || 'ACCESS_DENIED';
    if (meta && typeof meta === 'object') err.meta = meta;
    return err;
}

function _throwAccessDenied(code, message, meta) {
    throw _makeAccessDeniedError(code, message, meta);
}

function _roleMatches(role, allowedNamesUpper, allowedIds) {
    if (!role || typeof role !== 'object') return false;
    const roleId = String(role._id || role.id || '').trim();
    if (roleId && Array.isArray(allowedIds) && allowedIds.includes(roleId)) return true;
    const roleName = String(role.name || role.title || '').trim().toUpperCase();
    if (roleName && Array.isArray(allowedNamesUpper) && allowedNamesUpper.includes(roleName)) return true;
    return false;
}

async function _getMemberFull(traceId) {
    try {
        return await withTimeout(
            currentMember.getMember({ fieldsets: ['FULL'] }),
            Number(SDK_CONFIG?.TIMEOUTS?.API_MS) || 15000,
            'getMemberFull'
        );
    } catch (error) {
        log.warn('RBAC member fetch failed', { traceId, error: error?.message });
        return null;
    }
}

export function rateLimiter(key, maxRequests, windowMs) {
    const now = Date.now();
    const maxReq = Number.isFinite(maxRequests) ? Number(maxRequests) : Number(SDK_CONFIG?.RATE_LIMIT?.MAX_REQUESTS || 20);
    const winMs = Number.isFinite(windowMs) ? Number(windowMs) : Number(SDK_CONFIG?.RATE_LIMIT?.WINDOW_MS || 5000);

    if (_rateLimitCache.size >= MAXRATELIMITCACHESIZE || now - _rateLimitLastCleanup > RATELIMITCLEANUPTTLMS) {
        for (const [cacheKey, cacheEntry] of _rateLimitCache) {
            const lastSeen = cacheEntry.lastSeen || cacheEntry.windowStart;
            if (now - lastSeen > cacheEntry.windowMs) _rateLimitCache.delete(cacheKey);
        }
        _rateLimitLastCleanup = now;
    }

    let surface = 'default';
    let rawKey = key;
    if (key && typeof key === 'object') {
        surface = String(key.surface || 'default').trim() || 'default';
        rawKey = key.key;
    }
    const cleanRaw = String(rawKey ?? '').trim() || 'anon:empty';
    const k = `${surface}:${cleanRaw}`;
    const entry = _rateLimitCache.get(k);

    if (!entry || now - entry.windowStart > entry.windowMs) {
        _rateLimitCache.set(k, { count: 1, windowStart: now, windowMs: winMs, lastSeen: now });
        return { allowed: true, retryAfter: 0 };
    }

    entry.lastSeen = now;
    entry.count++;
    if (entry.count > maxReq) {
        const retryAfter = entry.windowMs - (now - entry.windowStart);
        return { allowed: false, retryAfter: Math.max(0, retryAfter) };
    }
    return { allowed: true, retryAfter: 0 };
}

export function clearRateLimitCache() {
    _rateLimitCache.clear();
    _rateLimitLastCleanup = 0;
}

function _parseEmails(csv) {
    return String(csv || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

async function _loadCachesIfNeeded(traceId) {
    const now = Date.now();
    if (_cacheLoadedAt && now - _cacheLoadedAt < CACHETTLMS && _adminsCache && _cajerosCache) {
        return { ok: true };
    }
    try {
        const [adminsRaw, cajerosRaw] = await Promise.all([
            getSecret(SECRETS.ADMINEMAILS).catch(() => ''),
            getSecret(SECRETS.CAJEROEMAILS).catch(() => '')
        ]);
        _adminsCache = _parseEmails(adminsRaw);
        _cajerosCache = _parseEmails(cajerosRaw);
        _cacheLoadedAt = now;
        return { ok: true };
    } catch (error) {
        log.error('RBAC error loading secrets', { traceId, error: error?.message });
        _adminsCache = [];
        _cajerosCache = [];
        _cacheLoadedAt = now;
        return { ok: false };
    }
}

export async function isAdmin(traceId = 'unknown') {
    const member = await _getMemberFull(traceId);
    if (!member) return false;
    const roles = member.roles || [];
    const adminNames = [String(COLLAB_ROLES.ADMIN || '').toUpperCase()];
    if (roles.some((r) => _roleMatches(r, adminNames, []))) return true;
    const email = String(member.loginEmail || '').trim().toLowerCase();
    const cache = await _loadCachesIfNeeded(traceId);
    return cache.ok && _adminsCache.includes(email);
}

export async function isCajero(traceId = 'unknown') {
    const member = await _getMemberFull(traceId);
    if (!member) return false;
    const roles = member.roles || [];
    const cajeroNames = [String(COLLAB_ROLES.ADMIN || '').toUpperCase(), String(COLLAB_ROLES.GESTION || '').toUpperCase()];
    if (roles.some((r) => _roleMatches(r, cajeroNames, []))) return true;
    const email = String(member.loginEmail || '').trim().toLowerCase();
    const cache = await _loadCachesIfNeeded(traceId);
    return cache.ok && (_adminsCache.includes(email) || _cajerosCache.includes(email));
}

export async function isStaffCollaborator(traceId = 'unknown') {
    const member = await _getMemberFull(traceId);
    if (!member) return false;
    const roles = member.roles || [];
    const allowedNames = [COLLAB_ROLES.ADMIN, COLLAB_ROLES.GESTION, COLLAB_ROLES.ESTILISTA, COLLAB_ROLES.MARIANMANAGER].map((r) => String(r || '').toUpperCase());
    if (roles.some((r) => _roleMatches(r, allowedNames, []))) return true;
    const email = String(member.loginEmail || '').trim().toLowerCase();
    const cache = await _loadCachesIfNeeded(traceId);
    return cache.ok && (_adminsCache.includes(email) || _cajerosCache.includes(email));
}

export async function requireAdmin(traceId = 'unknown') {
    const activeTraceId = traceId || 'rbac';
    const member = await _getMemberFull(activeTraceId);
    if (!member) {
        _throwAccessDenied('AUTHREQUIRED', 'ACCESS_DENIED: Login required for this operation.', { traceId: activeTraceId });
    }
    const roles = member.roles || [];
    const adminNames = [String(COLLAB_ROLES.ADMIN || '').toUpperCase()];
    if (roles.some((r) => _roleMatches(r, adminNames, []))) return true;
    const memberEmail = String(member.loginEmail || '').trim().toLowerCase();
    const cache = await _loadCachesIfNeeded(activeTraceId);
    if (cache.ok && _adminsCache.includes(memberEmail)) return true;
    _throwAccessDenied('ADMINREQUIRED', 'ACCESS_DENIED: Admin privileges required.', { traceId: activeTraceId });
}

export async function requireCajero(traceId = 'unknown') {
    const activeTraceId = traceId || 'rbac';
    const member = await _getMemberFull(activeTraceId);
    if (!member) {
        _throwAccessDenied('AUTHREQUIRED', 'ACCESS_DENIED: Login required for cashier operations.', { traceId: activeTraceId });
    }
    const roles = member.roles || [];
    const cajeroNames = [String(COLLAB_ROLES.ADMIN || '').toUpperCase(), String(COLLAB_ROLES.GESTION || '').toUpperCase()];
    if (roles.some((r) => _roleMatches(r, cajeroNames, []))) return true;
    const memberEmail = String(member.loginEmail || '').trim().toLowerCase();
    const cache = await _loadCachesIfNeeded(activeTraceId);
    if (cache.ok && (_cajerosCache.includes(memberEmail) || _adminsCache.includes(memberEmail))) return true;
    _throwAccessDenied('CAJEROREQUIRED', 'ACCESS_DENIED: Cashier privileges required.', { traceId: activeTraceId });
}

export async function requireStaffCollaborator(traceId = 'unknown') {
    const ok = await isStaffCollaborator(traceId);
    if (!ok) {
        _throwAccessDenied('COLLABREQUIRED', 'ACCESS_DENIED: Collaborator role required (ADMIN/GESTION/ESTILISTA)', { traceId });
    }
}

export async function isMarianManager(traceId = 'unknown') {
    return isAdmin(traceId);
}

export async function requireMarianManager(traceId = 'unknown') {
    return requireAdmin(traceId);
}
