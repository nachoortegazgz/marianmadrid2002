/*
=============================================================================
MODULE: backend/inventario.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Stock inventory adjustments, reconciliations, and queue queries.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { webMethod, Permissions } from 'wix-web-module';
import { COLLECTIONS, SDK_CONFIG } from 'backend/internalConfig';
import { requireCajero } from 'backend/security';
import { makeTraceId, _safeTrim, withTimeout } from 'public/mmUtils';
import { toPublicError } from 'backend/responseUtils';

const CMSTIMEOUTMS = SDK_CONFIG.TIMEOUTS.CMS_MS;

export const getInventoryDashboard = webMethod(Permissions.SiteMember, async () => {
    const traceId = makeTraceId("inv-dash");
    try {
        await requireCajero(traceId);
        const res = await withTimeout(
            wixData.query(COLLECTIONS.INVENTARIO_PRODUCTOS).limit(100).find({ suppressAuth: true }),
            CMSTIMEOUTMS,
            "getInventoryDashboard"
        );
        return { status: "SUCCESS", data: { items: res?.items || [] }, error: null };
    } catch (error) {
        return { status: "ERROR", data: null, error: toPublicError(error, "INVENTORYDASH_FAIL") };
    }
});

export const getInventoryReconciliationQueue = webMethod(Permissions.SiteMember, async () => {
    const traceId = makeTraceId("inv-queue");
    try {
        await requireCajero(traceId);
        const res = await withTimeout(
            wixData.query(COLLECTIONS.CONCILIACIONSTOCKWIX)
                .eq("status", "PENDING")
                .ascending("createdAt")
                .limit(100)
                .find({ suppressAuth: true }),
            CMSTIMEOUTMS,
            "getReconciliationQueue"
        );
        return { status: "SUCCESS", data: { items: res?.items || [] }, error: null };
    } catch (error) {
        return { status: "ERROR", data: null, error: toPublicError(error, "INVENTORYQUEUE_FAIL") };
    }
});

export const registerInternalInventoryUse = webMethod(Permissions.SiteMember, async (payload = {}) => {
    const traceId = payload.traceId || makeTraceId("inv-use");
    try {
        await requireCajero(traceId);
        const sku = _safeTrim(payload.sku);
        const quantity = Number(payload.quantity || 1);

        await wixData.insert(COLLECTIONS.MOVIMIENTO_INVENTARIO, {
            _id: makeTraceId("mov-inv"),
            sku,
            quantityDelta: -quantity,
            movementType: "CONSUMO_PROFESIONAL",
            referenceId: payload.note || "Uso interno en salon",
            createdAt: new Date(),
            traceId,
        }, { suppressAuth: true });

        await wixData.insert(COLLECTIONS.CONCILIACIONSTOCKWIX, {
            _id: makeTraceId("rec"),
            sku,
            quantityDelta: -quantity,
            status: "PENDING",
            source: "ONLYSTAFF_USE",
            createdAt: new Date(),
            traceId,
        }, { suppressAuth: true });

        return { status: "SUCCESS", data: { sku, quantityUsed: quantity }, error: null };
    } catch (e) {
        return { status: "ERROR", data: null, error: toPublicError(e, "INVUSE_FAIL") };
    }
});
