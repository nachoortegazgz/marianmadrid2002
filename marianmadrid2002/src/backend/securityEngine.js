/*
=============================================================================
FILE: backend/securityEngine.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Pure cryptographic primitives, token sign/verify, HMAC hashing.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { createHmac, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';
import { getSecret } from 'wix-secrets-backend';
import { SECRETS } from 'backend/mmSecrets';
import { JWT } from 'backend/internalConfig';
import { makeTraceId } from 'public/mmUtils';
import { logger } from 'backend/booking/bookingCore';

const log = logger;

export function base64UrlEncode(str) {
    return Buffer.from(String(str), 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function base64UrlDecode(str) {
    if (typeof str !== 'string') return '';
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    try {
        return Buffer.from(padded, 'base64').toString('utf8');
    } catch (_) {
        return '';
    }
}

export function signJWT(secretKey, data) {
    return createHmac('sha256', secretKey)
        .update(String(data), 'utf8')
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function hmacSha256Hex(secretKey, data) {
    return createHmac('sha256', secretKey)
        .update(String(data), 'utf8')
        .digest('hex');
}

export function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return cryptoTimingSafeEqual(bufA, bufB);
}

export function verifyHMAC(secretKey, data, signatureHex) {
    if (!secretKey || !data || !signatureHex) return false;
    const expected = hmacSha256Hex(secretKey, data);
    return timingSafeEqual(expected.toLowerCase(), String(signatureHex).toLowerCase());
}

function _stringifySafe(val) {
    try {
        return JSON.stringify(val);
    } catch (_) {
        return '{}';
    }
}

async function _getJwtSecretOrThrow(traceId) {
    const secretKey = await getSecret(SECRETS.AUTHJWTKEY).catch(() => '');
    if (!secretKey) {
        log.error('AUTHJWTKEY missing in Secrets Manager', { traceId });
        throw new Error('SECURITYALERT: Missing AUTHJWT_KEY secret');
    }
    return String(secretKey);
}

export async function generarToken(payload, traceId) {
    const activeTraceId = traceId || makeTraceId('jwt-gen');
    if (!payload || typeof payload !== 'object') {
        throw new Error('INVALID_PAYLOAD: Payload object required for token generation');
    }
    const secretKey = await _getJwtSecretOrThrow(activeTraceId);
    const header = { alg: (JWT && JWT.ALGORITHM) ? JWT.ALGORITHM : 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const expirationMs = (JWT && JWT.EXPIRATION_MS) ? JWT.EXPIRATION_MS : 30 * 60 * 1000;
    const exp = now + Math.floor(expirationMs / 1000);
    const safePayload = { ...payload };
    delete safePayload.exp;
    delete safePayload.iat;
    delete safePayload.jti;
    const jwtPayload = { ...safePayload, iat: now, exp, jti: makeTraceId('jti') };
    const encodedHeader = base64UrlEncode(_stringifySafe(header));
    const encodedPayload = base64UrlEncode(_stringifySafe(jwtPayload));
    const signature = signJWT(secretKey, `${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verificarToken(token, traceId) {
    const activeTraceId = traceId || makeTraceId('jwt-verify');
    try {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const encodedHeader = parts[0];
        const encodedPayload = parts[1];
        const signature = parts[2];
        let header;
        try {
            header = JSON.parse(base64UrlDecode(encodedHeader));
        } catch (_) {
            return null;
        }
        const targetAlg = (JWT && JWT.ALGORITHM) ? JWT.ALGORITHM : 'HS256';
        if (!header || String(header.alg || '').toUpperCase() !== String(targetAlg).toUpperCase()) return null;
        const secretKey = await _getJwtSecretOrThrow(activeTraceId);
        const expectedSignature = signJWT(secretKey, `${encodedHeader}.${encodedPayload}`);
        if (!timingSafeEqual(signature, expectedSignature)) return null;
        let payload;
        try {
            payload = JSON.parse(base64UrlDecode(encodedPayload));
        } catch (_) {
            return null;
        }
        const exp = Number(payload && payload.exp);
        const iat = Number(payload && payload.iat);
        if (!Number.isFinite(exp) || !Number.isFinite(iat)) return null;
        const now = Math.floor(Date.now() / 1000);
        if (iat > now + 60) return null;
        if (exp <= now) return null;
        return payload;
    } catch (error) {
        log.error('Failed to verify JWT token', { error: error?.message, traceId: activeTraceId });
        return null;
    }
}
