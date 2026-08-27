/**
 * Paquetes de revision para gestoria.
 * No crea facturas ni declaraciones oficiales y no sustituye la revision fiscal profesional.
 */
import { webMethod, Permissions } from "wix-web-module";
import wixData from "wix-data";
import { getSecret } from "wix-secrets-backend";

import { COLLECTIONS, SDK_CONFIG, TIPO_MOVIMIENTO } from "backend/internalConfig";
import { SECRETS } from "backend/mmSecrets";
import { requireMarianManager } from "backend/security";
import { hashSHA256 } from "backend/securityEngine";
import { makeTraceId } from "public/mmUtils";

const PACKAGE_CLASS = "PAQUETE_GESTORIA";
const EVENT_CREATED = "GESTORIA_DOCUMENT_CREATED";
const EVENT_SENT = "GESTORIA_DOCUMENT_SENT";
const EVENT_FAILED = "GESTORIA_DOCUMENT_FAILED";
const MAX_HISTORY_ROWS = 50;
const MAX_MOVEMENT_PAGES = 20;
const PAGE_SIZE = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function _safeText(value, max = 240) {
    return String(value ?? "").trim().replace(/[\r\n\t]+/g, " ").slice(0, max);
}

function _money(value) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function _iso(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
}

function _dateRange(year, quarter) {
    const monthStart = (quarter - 1) * 3;
    return {
        start: new Date(Date.UTC(year, monthStart, 1, 0, 0, 0)),
        end: new Date(Date.UTC(year, monthStart + 3, 1, 0, 0, 0)),
    };
}

function _assertPeriod(input) {
    const year = Number(input?.year);
    const quarter = Number(input?.quarter);
    const currentYear = new Date().getUTCFullYear();
    if (!Number.isInteger(year) || year < 2020 || year > currentYear + 1) {
        throw new Error("DOCUMENT_INVALID_PERIOD");
    }
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
        throw new Error("DOCUMENT_INVALID_PERIOD");
    }
    return { year, quarter };
}

function _documentKey(period) {
    return `DOC_GESTORIA_${period.year}_T${period.quarter}_${PACKAGE_CLASS}`;
}

function _documentId(key, version) {
    return `${key}_V${String(version).padStart(4, "0")}`;
}

function _movementKind(movement) {
    const declared = _safeText(movement?.naturalezaOperacion, 30).toUpperCase();
    if (["VENTA", "DEVOLUCION", "PROPINA", "AJUSTE"].includes(declared)) return declared;
    const type = _safeText(movement?.tipoMovimiento, 60).toUpperCase();
    if (type === TIPO_MOVIMIENTO.PROPINA) return "PROPINA";
    if (type.includes("REEMBOLSO") || Number(movement?.importeContable) < 0) return "DEVOLUCION";
    if (type.includes("AJUSTE")) return "AJUSTE";
    return "VENTA";
}

function _toBookRow(movement) {
    const total = _money(movement?.importeContable ?? movement?.importeTotal);
    const base = _money(movement?.baseImponible ?? total - Number(movement?.cuotaIva || 0));
    const iva = _money(movement?.cuotaIva || 0);
    const naturaleza = _movementKind(movement);
    return {
        fecha: _iso(movement?.fechaCreacion || movement?._createdDate),
        numero: _safeText(movement?.numTicketFactura || movement?.transactionId, 120),
        naturaleza,
        tipoMovimiento: _safeText(movement?.tipoMovimiento, 60),
        tratamientoIva: _safeText(movement?.tratamientoIva, 80) || "PENDIENTE_VALIDACION",
        incluidoEnBorradorIva: naturaleza !== "PROPINA" && naturaleza !== "AJUSTE",
        referenciaRectificativa: _safeText(movement?.referenciaRectificativa, 120),
        detalleLineas: Array.isArray(movement?.detalleLineas) ? movement.detalleLineas.slice(0, 50) : [],
        formaPago: _safeText(movement?.formaPago, 40),
        concepto: _safeText(movement?.concepto, 180),
        baseImponible: base,
        cuotaIva: iva,
        importeTotal: total,
        hashCadena: _safeText(movement?.hashCadena, 64),
        transactionId: _safeText(movement?.transactionId, 120),
    };
}

function _summarize(rows) {
    const totals = {
        ventas: 0,
        devoluciones: 0,
        propinas: 0,
        ajustes: 0,
        baseImponible: 0,
        cuotaIva: 0,
        porFormaPago: {},
    };
    for (const row of rows) {
        const amount = _money(row.importeTotal);
        if (row.naturaleza === "DEVOLUCION") totals.devoluciones = _money(totals.devoluciones + amount);
        else if (row.naturaleza === "PROPINA") totals.propinas = _money(totals.propinas + amount);
        else if (row.naturaleza === "AJUSTE") totals.ajustes = _money(totals.ajustes + amount);
        else totals.ventas = _money(totals.ventas + amount);
        if (row.incluidoEnBorradorIva) {
            totals.baseImponible = _money(totals.baseImponible + row.baseImponible);
            totals.cuotaIva = _money(totals.cuotaIva + row.cuotaIva);
        }
        const payment = row.formaPago || "SIN_ESPECIFICAR";
        totals.porFormaPago[payment] = _money((totals.porFormaPago[payment] || 0) + amount);
    }
    return {
        ...totals,
        ventasNetas: _money(totals.ventas + totals.devoluciones),
        registros: rows.length,
        nota: "Las propinas se separan del resumen de IVA hasta la validacion de su tratamiento por la gestoria.",
    };
}

async function _findMovements(period) {
    const { start, end } = _dateRange(period.year, period.quarter);
    let result = await wixData.query(COLLECTIONS.MOVIMIENTOS_CAJA)
        .ge("fechaCreacion", start)
        .lt("fechaCreacion", end)
        .ascending("fechaCreacion")
        .limit(PAGE_SIZE)
        .find();
    const items = [...result.items];
    let pages = 1;
    while (result.hasNext() && pages < MAX_MOVEMENT_PAGES) {
        result = await result.next();
        items.push(...result.items);
        pages += 1;
    }
    if (result.hasNext()) throw new Error("DOCUMENT_PERIOD_TOO_LARGE");
    return items;
}

function _csvEscape(value) {
    const raw = String(value ?? "");
    return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function _buildCsv(packageData) {
    const { period, generatedAt, summary, rows, documentId, version } = packageData;
    const lines = [
        ["DOCUMENTO", "PAQUETE DE REVISION PARA GESTORIA"],
        ["AVISO", "No es una factura, declaracion, modelo oficial ni prueba de cumplimiento regulatorio."],
        ["PERIODO", `${period.year}-T${period.quarter}`],
        ["VERSION", version],
        ["IDENTIFICADOR", documentId],
        ["GENERADO_UTC", generatedAt],
        ["REGISTROS", summary.registros],
        ["VENTAS_NETAS", summary.ventasNetas],
        ["BASE_IMPONIBLE", summary.baseImponible],
        ["CUOTA_IVA", summary.cuotaIva],
        ["PROPINAS_SEPARADAS", summary.propinas],
        [],
        ["FECHA_UTC", "NUMERO", "NATURALEZA", "TRATAMIENTO_IVA", "INCLUIDO_BORRADOR_IVA", "REFERENCIA_RECTIFICATIVA", "TIPO_MOVIMIENTO", "FORMA_PAGO", "CONCEPTO", "BASE_IMPONIBLE", "CUOTA_IVA", "IMPORTE_TOTAL", "LINEAS", "HASH_LEDGER", "TRANSACCION"],
        ...rows.map((row) => [
            row.fecha, row.numero, row.naturaleza, row.tratamientoIva, row.incluidoEnBorradorIva, row.referenciaRectificativa, row.tipoMovimiento, row.formaPago,
            row.concepto, row.baseImponible, row.cuotaIva, row.importeTotal, JSON.stringify(row.detalleLineas), row.hashCadena, row.transactionId,
        ]),
    ];
    return `\uFEFF${lines.map((line) => line.map(_csvEscape).join(",")).join("\r\n")}\r\n`;
}

async function _loadPackage(period, documentId = "", version = 0, generatedAt = "") {
    const movements = await _findMovements(period);
    const rows = movements.map(_toBookRow);
    const stableGeneratedAt = _iso(generatedAt) || new Date().toISOString();
    const packageData = {
        period,
        documentId,
        version,
        generatedAt: stableGeneratedAt,
        summary: _summarize(rows),
        rows,
    };
    const csv = _buildCsv(packageData);
    return {
        ...packageData,
        csv,
        contentHash: hashSHA256(csv),
        bytes: Buffer.byteLength(csv, "utf8"),
    };
}

async function _historyForKey(documentKey) {
    const result = await wixData.query(COLLECTIONS.AUDIT_LOG)
        .eq("resourceId", documentKey)
        .descending("fechaLog")
        .limit(MAX_HISTORY_ROWS)
        .find();
    return result.items.filter((item) => [EVENT_CREATED, EVENT_SENT, EVENT_FAILED].includes(item?.tipoEvento));
}

function _publicHistory(items) {
    return items.map((item) => ({
        id: _safeText(item?._id, 120),
        event: _safeText(item?.tipoEvento, 80),
        at: _iso(item?.fechaLog || item?._createdDate),
        documentId: _safeText(item?.data?.documentId, 160),
        version: Number(item?.data?.version || 0),
        status: _safeText(item?.data?.status, 40),
        recipient: _safeText(item?.data?.recipient, 240),
        providerMessageId: _safeText(item?.data?.providerMessageId, 160),
        failureCode: _safeText(item?.data?.failureCode, 80),
        contentHash: _safeText(item?.data?.contentHash, 64),
    }));
}

async function _audit({ id = "", type, level, message, documentKey, data, traceId }) {
    await wixData.insert(COLLECTIONS.AUDIT_LOG, {
        ...(id ? { _id: id } : {}),
        tipoEvento: type,
        level,
        message: _safeText(message, 240),
        data,
        resourceId: documentKey,
        source: "fiscalDocuments",
        fechaLog: new Date(),
        traceId,
    });
}

function _assertEmail(value) {
    const email = _safeText(value, 240).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error("DOCUMENT_INVALID_RECIPIENT");
    return email;
}

function _parseDocumentId(value) {
    const raw = _safeText(value, 180);
    const match = /^DOC_GESTORIA_(20\d{2}|21\d{2})_T([1-4])_PAQUETE_GESTORIA_V(\d{4})$/.exec(raw);
    if (!match) throw new Error("DOCUMENT_INVALID_VERSION");
    return {
        documentId: raw,
        documentKey: raw.replace(/_V\d{4}$/, ""),
        period: { year: Number(match[1]), quarter: Number(match[2]) },
        version: Number(match[3]),
    };
}

function _resultPreview(packageData, history) {
    return {
        status: "PREVIEW",
        class: PACKAGE_CLASS,
        period: packageData.period,
        defaultRecipient: SDK_CONFIG.DOCUMENTS.DEFAULT_MANAGER_EMAIL,
        summary: packageData.summary,
        recordsPreview: packageData.rows.slice(0, 25),
        recordsTruncated: packageData.rows.length > 25,
        bytes: packageData.bytes,
        history: _publicHistory(history),
        disclaimer: "Paquete de revision para gestoria. No es una factura ni una autoliquidacion oficial; requiere validacion profesional antes de cualquier uso fiscal.",
    };
}

export const previewManagerPackage = webMethod(Permissions.Admin, async (input = {}) => {
    const traceId = makeTraceId("fiscal-document-preview");
    await requireMarianManager(traceId);
    const period = _assertPeriod(input);
    const documentKey = _documentKey(period);
    const [packageData, history] = await Promise.all([_loadPackage(period), _historyForKey(documentKey)]);
    return _resultPreview(packageData, history);
});

export const createManagerPackageVersion = webMethod(Permissions.Admin, async (input = {}) => {
    const traceId = makeTraceId("fiscal-document-create");
    await requireMarianManager(traceId);
    const period = _assertPeriod(input);
    const documentKey = _documentKey(period);
    const history = await _historyForKey(documentKey);
    const nextVersion = history.filter((item) => item?.tipoEvento === EVENT_CREATED).length + 1;
    const documentId = _documentId(documentKey, nextVersion);
    const packageData = await _loadPackage(period, documentId, nextVersion);
    await _audit({
        id: documentId,
        type: EVENT_CREATED,
        level: "INFO",
        message: "Version de paquete para gestoria creada.",
        documentKey,
        data: {
            status: "CREADO",
            documentId,
            version: nextVersion,
            period,
            contentHash: packageData.contentHash,
            generatedAt: packageData.generatedAt,
            bytes: packageData.bytes,
            records: packageData.summary.registros,
        },
        traceId,
    });
    return {
        status: "CREATED",
        class: PACKAGE_CLASS,
        documentId,
        filename: `paquete-gestoria-${period.year}-T${period.quarter}-v${nextVersion}.csv`,
        version: nextVersion,
        contentHash: packageData.contentHash,
        bytes: packageData.bytes,
        summary: packageData.summary,
        disclaimer: "Version creada para revision. No se ha enviado ningun correo.",
    };
});

export const downloadManagerPackageVersion = webMethod(Permissions.Admin, async (input = {}) => {
    const traceId = makeTraceId("fiscal-document-download");
    await requireMarianManager(traceId);
    const identity = _parseDocumentId(input?.documentId);
    const history = await _historyForKey(identity.documentKey);
    const created = history.find((item) => item?.tipoEvento === EVENT_CREATED && item?.data?.documentId === identity.documentId);
    if (!created) throw new Error("DOCUMENT_NOT_FOUND");
    const packageData = await _loadPackage(
        identity.period,
        identity.documentId,
        identity.version,
        created?.data?.generatedAt,
    );
    if (packageData.contentHash !== _safeText(created?.data?.contentHash, 64)) {
        throw new Error("DOCUMENT_SOURCE_CHANGED");
    }
    return {
        status: "READY",
        documentId: identity.documentId,
        filename: `paquete-gestoria-${identity.period.year}-T${identity.period.quarter}-v${identity.version}.csv`,
        mimeType: "text/csv;charset=utf-8",
        contentBase64: Buffer.from(packageData.csv, "utf8").toString("base64"),
        contentHash: packageData.contentHash,
    };
});

export const getManagerPackageHistory = webMethod(Permissions.Admin, async (input = {}) => {
    const traceId = makeTraceId("fiscal-document-history");
    await requireMarianManager(traceId);
    const period = _assertPeriod(input);
    const documentKey = _documentKey(period);
    const history = await _historyForKey(documentKey);
    return {
        status: "OK",
        period,
        defaultRecipient: SDK_CONFIG.DOCUMENTS.DEFAULT_MANAGER_EMAIL,
        history: _publicHistory(history),
    };
});

export const emailManagerPackageVersion = webMethod(Permissions.Admin, async (input = {}) => {
    const traceId = makeTraceId("fiscal-document-email");
    await requireMarianManager(traceId);
    if (input?.confirmed !== true) throw new Error("DOCUMENT_SEND_CONFIRMATION_REQUIRED");
    const recipient = _assertEmail(input?.recipient || SDK_CONFIG.DOCUMENTS.DEFAULT_MANAGER_EMAIL);
    const identity = _parseDocumentId(input?.documentId);
    const history = await _historyForKey(identity.documentKey);
    const created = history.find((item) => item?.tipoEvento === EVENT_CREATED && item?.data?.documentId === identity.documentId);
    if (!created) throw new Error("DOCUMENT_NOT_FOUND");

    const packageData = await _loadPackage(
        identity.period,
        identity.documentId,
        identity.version,
        created?.data?.generatedAt,
    );
    if (packageData.contentHash !== _safeText(created?.data?.contentHash, 64)) {
        throw new Error("DOCUMENT_SOURCE_CHANGED");
    }
    if (packageData.bytes > SDK_CONFIG.DOCUMENTS.MAX_EMAIL_ATTACHMENT_BYTES) {
        throw new Error("DOCUMENT_ATTACHMENT_TOO_LARGE");
    }

    const deliveryKey = hashSHA256(`${identity.documentId}|${recipient}|${packageData.contentHash}`);
    const alreadySent = history.some((item) => item?.tipoEvento === EVENT_SENT && item?.data?.deliveryKey === deliveryKey);
    if (alreadySent) {
        return {
            status: "ALREADY_SENT",
            documentId: identity.documentId,
            recipient,
            message: "Esta version ya consta como enviada a ese destinatario.",
        };
    }

    const [apiKey, from] = await Promise.all([
        getSecret(SECRETS.RESEND_API_KEY),
        getSecret(SECRETS.RESEND_FROM_EMAIL),
    ]);
    const safeApiKey = _safeText(apiKey, 500);
    const sender = _safeText(from, 240).toLowerCase();
    if (!safeApiKey || !EMAIL_RE.test(sender)) {
        throw new Error("DOCUMENT_EMAIL_NOT_CONFIGURED");
    }

    const filename = `paquete-gestoria-${identity.period.year}-T${identity.period.quarter}-v${identity.version}.csv`;
    let response;
    try {
        response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${safeApiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `marian-${deliveryKey.slice(0, 56)}`,
            },
            body: JSON.stringify({
                from: sender,
                to: [recipient],
                subject: `Paquete de revision para gestoria ${identity.period.year} T${identity.period.quarter} v${identity.version}`,
                text: "Adjunto se remite el paquete de revision solicitado desde ADMINISTRACION. No es una declaracion ni factura oficial.",
                attachments: [{ filename, content: Buffer.from(packageData.csv, "utf8").toString("base64") }],
                tags: [
                    { name: "source", value: "administracion" },
                    { name: "document", value: "paquete_gestoria" },
                ],
            }),
        });
    } catch (_) {
        await _audit({
            type: EVENT_FAILED,
            level: "WARN",
            message: "No fue posible contactar con el proveedor de correo.",
            documentKey: identity.documentKey,
            data: { status: "FALLIDO", documentId: identity.documentId, version: identity.version, recipient, deliveryKey, failureCode: "PROVIDER_UNAVAILABLE" },
            traceId,
        });
        throw new Error("DOCUMENT_EMAIL_DELIVERY_FAILED");
    }

    if (!response.ok) {
        await _audit({
            type: EVENT_FAILED,
            level: "WARN",
            message: "El proveedor de correo rechazo la solicitud documental.",
            documentKey: identity.documentKey,
            data: { status: "FALLIDO", documentId: identity.documentId, version: identity.version, recipient, deliveryKey, failureCode: `PROVIDER_HTTP_${response.status}` },
            traceId,
        });
        throw new Error("DOCUMENT_EMAIL_DELIVERY_FAILED");
    }

    let providerMessageId = "";
    try {
        const body = await response.json();
        providerMessageId = _safeText(body?.id, 160);
    } catch (_) {
        providerMessageId = "";
    }
    await _audit({
        type: EVENT_SENT,
        level: "INFO",
        message: "Paquete para gestoria aceptado por el proveedor de correo.",
        documentKey: identity.documentKey,
        data: {
            status: "ENVIADO",
            documentId: identity.documentId,
            version: identity.version,
            recipient,
            deliveryKey,
            contentHash: packageData.contentHash,
            providerMessageId,
        },
        traceId,
    });
    return {
        status: "SENT",
        documentId: identity.documentId,
        recipient,
        providerMessageId,
        message: "El proveedor ha aceptado el correo para su entrega.",
    };
});
