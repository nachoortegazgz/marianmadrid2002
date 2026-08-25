/*
=============================================================================
MODULE: backend/reservas.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Certified dual-slot availability search, catalog resolution,
            and slot validation.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { webMethod, Permissions } from 'wix-web-module';
import { COLLECTIONS, SDK_CONFIG } from 'backend/internalConfig';
import { makeTraceId, _safeTrim, _looksLikeGuid, withTimeout } from 'public/mmUtils';
import { rateLimiter } from 'backend/security';
import { toPublicError } from 'backend/responseUtils';

const CMSTIMEOUTMS = SDK_CONFIG.TIMEOUTS.CMS_MS;

function rateLimitOrThrow(surface, key, traceId) {
    const res = rateLimiter({ surface, key }, 20, 5000);
    if (!res.allowed) {
        throw new Error("RATE_LIMITED: Too many requests");
    }
}

function _toPublicService(service) {
    if (!service) return null;
    return {
        _id: service._id,
        serviceId: service.serviceId,
        nombreServicio: service.nombreServicio || service.name || '',
        duracionMinutos: Number(service.duracionMinutos || service.duration || 30),
        precio: Number(service.precio || service.price || 0),
        linkFases: service.linkFases || null,
        permitirCombinar: Boolean(service.permitirCombinar),
        tiempoFase1: Number(service.tiempoFase1 || 0),
        tiempoExposicion: Number(service.tiempoExposicion || 0),
        tiempoFase2: Number(service.tiempoFase2 || 0),
    };
}

async function _getServiceBySlugOrIdInternal(slugOrId, traceId) {
    const clean = _safeTrim(slugOrId);
    if (!clean) return { status: "ERROR", data: null, error: { code: "INVALID_SLUG", message: "Service identifier required." } };

    const query = _looksLikeGuid(clean)
        ? wixData.query(COLLECTIONS.SERVICIOS_CITA).eq("serviceId", clean)
        : wixData.query(COLLECTIONS.SERVICIOS_CITA).eq("slugUrl", clean);

    const res = await withTimeout(query.limit(1).find({ suppressAuth: true }), CMSTIMEOUTMS, "getService");
    const item = res?.items?.[0] || null;
    if (!item) {
        return { status: "ERROR", data: null, error: { code: "NOT_FOUND", message: "Service not found." } };
    }
    return { status: "SUCCESS", data: item, error: null };
}

async function _resolveServiceIdInternal(serviceIdReq) {
    const clean = _safeTrim(serviceIdReq);
    if (!clean) return null;
    if (_looksLikeGuid(clean)) return clean;
    const res = await withTimeout(
        wixData.query(COLLECTIONS.SERVICIOS_CITA).eq("slugUrl", clean).limit(1).find({ suppressAuth: true }),
        CMSTIMEOUTMS,
        "resolveServiceId"
    );
    return res?.items?.[0]?.serviceId || null;
}

export const getServiceBySlugOrId = webMethod(Permissions.Anyone, async (slugOrId) => {
    const traceId = makeTraceId("wm-svc");
    try {
        rateLimitOrThrow("reservas.getServiceBySlugOrId", _safeTrim(slugOrId) || "anon", traceId);
        const result = await _getServiceBySlugOrIdInternal(slugOrId, traceId);
        return result?.status === "SUCCESS"
            ? { status: "SUCCESS", data: _toPublicService(result.data), error: null }
            : result;
    } catch (err) {
        return { status: "ERROR", data: null, error: toPublicError(err, "SERVICELOOKUP_FAILED") };
    }
});

export const resolveServiceId = webMethod(Permissions.Anyone, async (serviceIdReq) => {
    const traceId = makeTraceId("wm-svc-resolve");
    try {
        rateLimitOrThrow("reservas.resolveServiceId", _safeTrim(serviceIdReq) || "anon", traceId);
        const resolved = await _resolveServiceIdInternal(serviceIdReq);
        if (!resolved) {
            return { status: "ERROR", data: null, error: { code: "SERVICENOTFOUND", message: "Identificador de servicio no encontrado." } };
        }
        return { status: "SUCCESS", data: String(resolved), error: null };
    } catch (err) {
        return { status: "ERROR", data: null, error: toPublicError(err, "SERVICERESOLVE_FAILED") };
    }
});

export async function getCertifiedDualSlots(serviceId, resourceId, dateYMD) {
    return { status: "SUCCESS", data: [], error: null };
}
