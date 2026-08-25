/*
=============================================================================
MODULE: backend/contabilidad.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Double-entry ledger projections and official bookkeeping.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { COLLECTIONS, SDK_CONFIG } from 'backend/internalConfig';
import { _safeTrim } from 'public/mmUtils';
import { logger } from 'backend/booking/bookingCore';

const log = logger;

function _cleanText(val, maxLen = 200) {
    const s = String(val || "").trim();
    return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function _buildBase(movimiento) {
    const fechaOperacion = movimiento?.fechaCreacion ? new Date(movimiento.fechaCreacion) : new Date();
    const idAsiento = `ASIENTO_${_cleanText(movimiento?._id, 120)}`;
    return {
        idAsiento,
        numeroAsiento: Number(movimiento?.seqGlobal || 0),
        fechaOperacion,
        fechaHoraRegistro: new Date(),
        zonaHorariaOperacion: SDK_CONFIG?.TZ || "Europe/Madrid",
        tipoAsiento: String(movimiento?.tipoMovimiento || "AJUSTE").toUpperCase(),
        categoriaOperacion: String(movimiento?.tipoMovimiento || "AJUSTE").toUpperCase(),
        subcategoriaOperacion: null,
        conceptoAsiento: _cleanText(movimiento?.concepto || movimiento?.tipoMovimiento || "Movimiento de caja"),
        origenRegistro: _cleanText(movimiento?.origen || "MOVIMIENTOCAJA", 80),
        idOrigen: _cleanText(movimiento?._id, 120),
        idTransaccion: _cleanText(movimiento?.transactionId, 120),
        idPedidoWix: _cleanText(movimiento?.orderId, 120) || null,
        idDevolucionWix: _cleanText(movimiento?.refundId, 120) || null,
        idReservaWix: _cleanText(movimiento?.reservaIdVinculada, 120) || null,
        referenciaExterna: _cleanText(movimiento?.numTicketFactura, 120) || null,
        serieFactura: null,
        numeroFactura: _cleanText(movimiento?.numTicketFactura, 120) || null,
        fechaExpedicionFactura: fechaOperacion,
        fechaOperacionFiscal: fechaOperacion,
        moneda: "EUR",
        importeTotalDocumento: Math.abs(Number(movimiento?.importeContable) || 0),
        medioPago: _cleanText(movimiento?.formaPago, 40) || null,
        estadoAsiento: "CONFIRMADO",
        idResponsableOperativo: _cleanText(movimiento?.resourceId, 120) || null,
        idMiembroRegistrador: "SYSTEMFISCALLEDGER",
        nombreRegistrador: "SISTEMA_FISCAL",
        versionEsquema: "ASIENTO_V1",
        versionAlgoritmoIntegridad: "HMACSHA256V1",
        hashAnterior: _cleanText(movimiento?.prevHash, 64),
        hashOrigen: _cleanText(movimiento?.hashCadena, 64),
        idTraza: _cleanText(movimiento?.traceId, 120),
    };
}

export async function registrarAsientoContableDesdeMovimiento(movimiento) {
    try {
        const base = _buildBase(movimiento);
        await wixData.insert(COLLECTIONS.ASIENTOSCONTABLES, base, { suppressAuth: true });
    } catch (e) {
        log.warn("Proyeccion contable omitida (esperando activacion gestoria)", { error: e?.message });
    }
}
