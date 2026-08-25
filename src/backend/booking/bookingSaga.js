/*
=============================================================================
MODULE: backend/booking/bookingSaga.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Transaccional Saga orchestrator for simple and dual bookings.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { makeTraceId, _safeTrim, withTimeout } from 'public/mmUtils';
import { COLLECTIONS, SDK_CONFIG, ESTADO_CITA, ESTADO_PAGO } from 'backend/internalConfig';
import { lockSlotKeyOrFail, unlockSlotKey, logger } from 'backend/booking/bookingCore';

const log = logger;
const CMSTIMEOUT = SDK_CONFIG.TIMEOUTS.CMS_MS;

export async function executeBookingSaga(payload = {}) {
    const traceId = payload.traceId || makeTraceId("saga");
    const slotF1 = payload.slotF1 || {};
    const cliente = payload.cliente || {};
    const metaCita = payload.metaCita || {};
    const serviceId = slotF1.serviceId;
    const slotKeyF1 = `${serviceId}_${slotF1.startDate || 'now'}_${slotF1.resourceId || 'any'}`;

    log.info("Executing Booking Saga", { traceId, serviceId });
    await lockSlotKeyOrFail(slotKeyF1, traceId);

    try {
        const bookingIdF1 = makeTraceId("bkg");
        const citaRecord = {
            _id: `booking_${bookingIdF1}`,
            bookingId: bookingIdF1,
            serviceId,
            resourceId: slotF1.resourceId || 'resource-default',
            clienteNombre: cliente.nombre || '',
            clienteEmail: cliente.email || '',
            clienteTelefono: cliente.telefono || '',
            status: ESTADO_CITA.CONFIRMED,
            statusPago: metaCita.metodoPago === 'ONLINE' ? ESTADO_PAGO.PENDINGPAYMENT : ESTADO_PAGO.UNPAID,
            pairToken: payload.pairToken || makeTraceId("pair"),
            fechaCreacion: new Date(),
            meta: {
                ...metaCita,
                traceId
            }
        };

        await withTimeout(
            wixData.insert(COLLECTIONS.CITAS, citaRecord, { suppressAuth: true }),
            CMSTIMEOUT,
            "persistCita"
        );

        await unlockSlotKey(slotKeyF1, traceId);

        return {
            status: "SUCCESS",
            data: {
                bookingIdF1,
                pairToken: citaRecord.pairToken,
                status: citaRecord.status,
                statusPago: citaRecord.statusPago
            },
            error: null
        };
    } catch (error) {
        await unlockSlotKey(slotKeyF1, traceId);
        log.error("Booking Saga Failed", { traceId, error: error?.message });
        throw error;
    }
}
