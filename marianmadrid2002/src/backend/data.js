/*
=============================================================================
MODULE: backend/data.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: CMS Data Hooks, Inmutability Enforcement, Cache Invalidation,
            and Canonical Format Guards.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { COLLECTIONS, SDK_CONFIG } from 'backend/internalConfig';
import { getMadridLocalStringNoZ } from 'public/mmUtils';

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAYSCACHECOL = COLLECTIONS.DAYS_CACHE;
const SLOTSCACHECOL = COLLECTIONS.SLOTS_CACHE;
const DUALCACHECOL = COLLECTIONS.DUAL_CACHE;

async function _removeDualPairsByServiceId(serviceId) {
    const cleanServiceId = String(serviceId || "").trim();
    if (!GUID_RE.test(cleanServiceId)) return;
    const queryByField = async (field) => {
        const result = await wixData.query(DUALCACHECOL).eq(field, cleanServiceId).limit(1000).find({ suppressAuth: true });
        await Promise.allSettled(
            (result?.items || []).map((item) => wixData.remove(DUALCACHECOL, item._id, { suppressAuth: true }))
        );
    };
    await Promise.allSettled([
        queryByField("serviceId"),
        queryByField("phaseOneServiceId"),
        queryByField("phaseTwoServiceId"),
    ]);
}

async function _invalidateAvailabilityCachesByServiceId(serviceId) {
    const cleanServiceId = String(serviceId || "").trim();
    if (!GUID_RE.test(cleanServiceId)) return;
    const removeByField = async (collectionName, field) => {
        try {
            const result = await wixData
                .query(collectionName)
                .eq(field, cleanServiceId)
                .limit(1000)
                .find({ suppressAuth: true });
            await Promise.allSettled(
                (result?.items || []).map((item) =>
                    wixData.remove(collectionName, item._id, { suppressAuth: true }).catch(() => null)
                )
            );
        } catch (_) {}
    };
    await Promise.allSettled([
        removeByField(DAYSCACHECOL, "serviceId"),
        removeByField(DAYSCACHECOL, "phaseOneServiceId"),
        removeByField(SLOTSCACHECOL, "phaseOneServiceId"),
    ]);
}

export async function Import2_afterUpdate(item, context) {
    if (!item || context?.suppressHooks === true) return item;
    await _removeDualPairsByServiceId(item.serviceId);
    await _removeDualPairsByServiceId(item.linkFases);
    await _invalidateAvailabilityCachesByServiceId(item.serviceId);
    await _invalidateAvailabilityCachesByServiceId(item.linkFases);
    return item;
}

export function movimientoCaja_beforeUpdate(item, context) {
    if (context?.suppressHooks === true) return item;
    throw new Error("FISCAL_VIOLATION: movimientoCaja is an immutable ledger. Updates forbidden.");
}

export function movimientoCaja_beforeRemove(item, context) {
    if (context?.suppressHooks === true) return item;
    throw new Error("FISCAL_VIOLATION: movimientoCaja is an immutable ledger. Deletion forbidden.");
}

export function REGISTROHORARIO_beforeUpdate(item, context) {
    if (context?.suppressHooks === true) return item;
    throw new Error("LABORLOG_VIOLATION: REGISTROHORARIO records are immutable. Updates forbidden.");
}

export function REGISTROHORARIO_beforeRemove(item, context) {
    if (context?.suppressHooks === true) return item;
    throw new Error("LABORLOG_VIOLATION: REGISTROHORARIO records are immutable. Deletion forbidden.");
}

export function REGISTROHORARIO_beforeInsert(item) {
    const now = new Date();
    const madrid = getMadridLocalStringNoZ(now);
    item.diaKey = madrid.slice(0, 10);
    item.mesKey = madrid.slice(0, 7);
    item.hora = madrid.slice(11, 19);
    item.fechaHora = now;
    return item;
}

export function cajaActual_beforeRemove() {
    throw new Error("SINGLETON_PROTECTED: cajaActual singleton cannot be deleted.");
}

export function cajaActual_beforeInsert(item) {
    item._id = COLLECTIONS.CAJA_ACTUAL || "cajaActual";
    return item;
}

export function cajaActual_beforeUpdate(item) {
    item._id = COLLECTIONS.CAJA_ACTUAL || "cajaActual";
    return item;
}
