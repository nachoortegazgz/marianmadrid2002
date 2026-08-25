/*
=============================================================================
MODULE: backend/events.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Wix eCommerce and Bookings webhooks listener.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { COLLECTIONS, SDK_CONFIG, ESTADO_CITA, ESTADO_PAGO, FORMA_PAGO, TIPO_MOVIMIENTO } from 'backend/internalConfig';
import { registerBookingPayment, queueFiscalRecovery } from 'backend/cajas.web';
import { makeTraceId, withTimeout, normalizeIdPart } from 'public/mmUtils';
import { logger } from 'backend/booking/bookingCore';

const log = logger;
const APITIMEOUTMS = SDK_CONFIG.TIMEOUTS.API_MS;

async function _markCitasPaidByBookingIds(bookingIds, orderId, traceId) {
    const ids = Array.isArray(bookingIds) ? bookingIds.map(String).filter(Boolean) : [];
    if (!ids.length) return;
    try {
        const res = await withTimeout(
            wixData.query(COLLECTIONS.CITAS).hasSome('bookingId', ids).limit(ids.length).find({ suppressAuth: true }),
            APITIMEOUTMS,
            'batchQueryCitasForPaid'
        );
        const citas = res?.items || [];
        await Promise.allSettled(citas.map(async (cita) => {
            const { _createdDate, _updatedDate, _owner, ...safeCita } = cita;
            safeCita.status = ESTADO_CITA.CONFIRMED;
            safeCita.statusPago = ESTADO_PAGO.PAID;
            safeCita.fechaActualizacion = new Date();
            await wixData.update(COLLECTIONS.CITAS, safeCita, { suppressAuth: true });
        }));
    } catch (e) {
        log.warn('Batch mark citas paid failed', { traceId, error: e?.message });
    }
}

export async function wixEcom_onOrderPaymentStatusUpdated(event) {
    const order = event?.entity || event;
    const orderId = order?._id || order?.id;
    const traceId = makeTraceId('evt-paid');

    if (order?.paymentStatus === 'PAID') {
        const bookingIds = (order?.lineItems || [])
            .map((it) => it?.catalogReference?.catalogItemId)
            .filter(Boolean);

        const totalAmount = Number(order?.priceSummary?.total?.amount || 0);

        try {
            await registerBookingPayment(bookingIds.join(','), totalAmount, FORMA_PAGO.ONLINE, {
                orderId,
                transactionId: `ORDER_${normalizeIdPart(orderId, 80)}`,
                traceId,
                tipoMovimiento: TIPO_MOVIMIENTO.VENTAONLINE
            });
            await _markCitasPaidByBookingIds(bookingIds, orderId, traceId);
        } catch (e) {
            log.error('Payment ledger registration failed', { orderId, traceId, error: e?.message });
            await queueFiscalRecovery({
                bookingIds: bookingIds.join(','),
                amount: totalAmount,
                paymentMethod: FORMA_PAGO.ONLINE,
                transactionId: `ORDER_${normalizeIdPart(orderId, 80)}`,
                orderId,
                origin: "events.js",
                concept: `Pago pedido ${orderId}`,
                traceId,
                lastError: e?.message
            });
        }
    }
}

export async function wixEcom_onOrderRefunded(event) {
    const order = event?.entity || event;
    const orderId = order?._id || order?.id;
    const traceId = makeTraceId('evt-refund');
    const refundAmount = Number(event?.refund?.amount || order?.priceSummary?.total?.amount || 0);

    try {
        await registerBookingPayment(null, -refundAmount, FORMA_PAGO.ONLINE, {
            orderId,
            refundId: event?.refund?.id || makeTraceId('ref'),
            transactionId: `REFUND_${normalizeIdPart(orderId, 80)}`,
            traceId,
            tipoMovimiento: TIPO_MOVIMIENTO.REEMBOLSO
        });
    } catch (e) {
        log.error('Refund ledger registration failed', { orderId, traceId, error: e?.message });
    }
}
