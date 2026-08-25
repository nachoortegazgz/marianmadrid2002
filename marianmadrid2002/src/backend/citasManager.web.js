/*
=============================================================================
MODULE: backend/citasManager.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Web-method facade for booking execution and payment validation.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { webMethod, Permissions } from 'wix-web-module';
import { rateLimiter } from 'backend/security';
import { makeTraceId, _safeTrim, _looksLikeGuid } from 'public/mmUtils';
import { logger } from 'backend/booking/bookingCore';
import { executeBookingSaga } from 'backend/booking/bookingSaga';
import { SDK_CONFIG, ESTADO_PAGO } from 'backend/internalConfig';
import { toPublicError } from 'backend/responseUtils';

const log = logger;

function _handleError(error, context, traceId, loggerInstance) {
    loggerInstance.error(`Error in ${context}`, { error: error?.message, traceId });
    return { status: "ERROR", data: null, error: toPublicError(error, "BOOKING_ERROR") };
}

export const processDualBooking = webMethod(Permissions.Anyone, async (unsafePayload) => {
    const traceId = makeTraceId("booking-wrapper");
    try {
        if (!unsafePayload || typeof unsafePayload !== "object") throw new Error("Invalid booking payload");
        if (!unsafePayload.cliente || typeof unsafePayload.cliente !== "object") throw new Error("Client information required");
        if (!unsafePayload.metaCita || typeof unsafePayload.metaCita !== "object") throw new Error("Booking metadata required");

        const slotF1 = unsafePayload.slotF1 || {};
        const slotF2 = unsafePayload.slotF2 || null;
        const metaCita = unsafePayload.metaCita;
        const serviceId = _safeTrim(slotF1.serviceId || metaCita.serviceId || "");

        if (!_looksLikeGuid(serviceId)) {
            return { status: "ERROR", data: null, error: { code: "SERVICEIDINVALID", message: "The first booking phase requires a valid serviceId." } };
        }
        if (Object.prototype.hasOwnProperty.call(metaCita, "resourceId")) {
            return { status: "ERROR", data: null, error: { code: "RESOURCECONTRACTINVALID", message: "Booking metadata must use resourceFilterId." } };
        }

        unsafePayload.slotF1 = { ...slotF1, serviceId };
        unsafePayload.slotF2 = slotF2 ? { ...slotF2 } : null;
        unsafePayload.metaCita = { ...metaCita, serviceId };

        const requestedStart = _safeTrim(slotF1.localStartDate || slotF1.startDate || "");
        const requestedResourceId = _safeTrim(slotF1.resourceId || slotF1.resource?.id || "");
        const rateKey = `${serviceId}:${requestedStart || "no-start"}:${requestedResourceId || "any-resource"}`;

        const rate = rateLimiter(
            { surface: "public-booking", key: rateKey },
            Number(SDK_CONFIG?.RATE_LIMIT?.BOOKINGMAXREQUESTS || 5),
            Number(SDK_CONFIG?.RATE_LIMIT?.BOOKINGWINDOWMS || 10000)
        );

        if (!rate.allowed) {
            return {
                status: "ERROR",
                data: { retryAfterMs: rate.retryAfter },
                error: { code: "RATE_LIMITED", message: "Too many booking requests. Retry later." },
            };
        }

        return await executeBookingSaga({ ...unsafePayload, traceId });
    } catch (error) {
        return _handleError(error, "processDualBooking(wrapper)", traceId, log);
    }
});

export function _validatePaymentCitaSet(citas, orderId) {
    const items = Array.isArray(citas) ? citas : [];
    const isDual = items.some((cita) => Boolean(cita?.meta?.esCombinado) || String(cita?.tipo || "").startsWith("dual"));
    const pairTokens = Array.from(new Set(items.map((cita) => _safeTrim(cita?.pairToken)).filter(Boolean)));

    if (isDual && (items.length !== 2 || pairTokens.length !== 1)) throw new Error("DUALPAYMENTPAIR_INVALID");
    if (!isDual && items.length !== 1) throw new Error("PAYMENTBOOKINGSET_INVALID");

    const paidStates = items.map((cita) => String(cita?.statusPago || cita?.meta?.statusPago || "").toUpperCase());
    const allPaid = paidStates.length > 0 && paidStates.every((state) => state === ESTADO_PAGO.PAID);
    const storedOrderIds = Array.from(new Set(items.map((cita) => _safeTrim(cita?.meta?.orderId)).filter(Boolean)));

    if (allPaid && storedOrderIds.length > 0 && (storedOrderIds.length !== 1 || storedOrderIds[0] !== orderId)) {
        throw new Error("ORDERIDEMPOTENCYCONFLICT");
    }

    return { isDual, allPaid };
}
