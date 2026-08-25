/*
=============================================================================
FILE: public/qrHelper.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Generates Veri*Factu verification URLs, query strings, and
            metadata for customer receipts, lightboxes, and transactional emails
            in strict compliance with RD 1007/2023 and Orden HAC/1177/2024.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { _safeTrim } from "public/mmUtils";

const VERIFACTUBASEURL = "https://sede.agenciatributaria.gob.es/verifactu/consulta";

export function extractHuella8(hashCadena) {
    const raw = _safeTrim(hashCadena);
    return raw.length >= 8 ? raw.slice(0, 8).toUpperCase() : "";
}

export function generateVerifactuUrl(params = {}) {
    const nif = _safeTrim(params.nifEmisor);
    if (!nif) return null;
    const num = _safeTrim(params.numTicket || params.numTicketFactura);
    const fechaRaw = _safeTrim(params.fechaIso || params.diaKey);
    const fecha = fechaRaw.slice(0, 10);
    const impNum = Number(params.importeTotal);
    const imp = Number.isFinite(impNum) ? Math.abs(impNum).toFixed(2) : "0.00";
    const huella = extractHuella8(params.hashCadena);
    const queryParts = [
        `nif=${encodeURIComponent(nif)}`,
        `num=${encodeURIComponent(num)}`,
        `fecha=${encodeURIComponent(fecha)}`,
        `imp=${encodeURIComponent(imp)}`,
        `h=${encodeURIComponent(huella)}`
    ];
    return `${VERIFACTUBASEURL}?${queryParts.join("&")}`;
}

export function buildVerifactuReceiptMeta(movimiento = {}) {
    const numTicket = _safeTrim(movimiento.numTicketFactura || movimiento.numTicket);
    const fechaIso = _safeTrim(movimiento.diaKey || movimiento.fechaCreacion || new Date().toISOString());
    const importeTotal = Number(movimiento.importeTotal || movimiento.importeContable || 0);
    const hashCadena = _safeTrim(movimiento.hashCadena);
    const nifEmisor = _safeTrim(movimiento.nifEmisor);
    const qrUrl = generateVerifactuUrl({
        nifEmisor,
        numTicket,
        fechaIso,
        importeTotal,
        hashCadena
    });
    const huella8 = extractHuella8(hashCadena);
    return {
        nifEmisor: nifEmisor || null,
        numTicketFactura: numTicket,
        fechaExpedicion: fechaIso.slice(0, 10),
        importeTotal: Math.abs(importeTotal),
        baseImponible: Number(movimiento.baseImponible) || 0,
        cuotaIva: Number(movimiento.cuotaIva) || 0,
        tasaIva: "21%",
        huellaVerifactu: huella8,
        hashCompleto: hashCadena,
        qrVerificationUrl: qrUrl,
        leyendaFiscal: "Factura simplificada emitida mediante Sistema Informatico de Facturacion (SIF) Veri*Factu RD 1007/2023."
    };
}
