/*
=============================================================================
MODULE: backend/fiscalAggregator.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Aggregated tax summaries and official invoice/ticket ledgers.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { webMethod, Permissions } from 'wix-web-module';
import { COLLECTIONS, SDK_CONFIG } from 'backend/internalConfig';
import { requireAdmin } from 'backend/security';
import { makeTraceId, withTimeout } from 'public/mmUtils';
import { toPublicError } from 'backend/responseUtils';

const CMSTIMEOUTMS = SDK_CONFIG.TIMEOUTS.CMS_MS;

export const getQuarterlyTaxSummary = webMethod(Permissions.SiteMember, async (year, quarter, options = {}) => {
    const traceId = options.traceId || makeTraceId("tax-summary");
    try {
        await requireAdmin(traceId);
        const y = Number(year) || new Date().getFullYear();
        const q = Number(quarter) || 1;

        const res = await withTimeout(
            wixData.query(COLLECTIONS.MOVIMIENTOS_CAJA)
                .startsWith("mesKey", `${y}-`)
                .limit(1000)
                .find({ suppressAuth: true }),
            CMSTIMEOUTMS,
            "queryTaxMovements"
        );

        const items = res?.items || [];
        let baseTotal = 0;
        let cuotaTotal = 0;
        let totalGeneral = 0;

        items.forEach((it) => {
            baseTotal += Number(it.baseImponible || 0);
            cuotaTotal += Number(it.cuotaIva || 0);
            totalGeneral += Number(it.importeContable || 0);
        });

        return {
            status: "SUCCESS",
            data: {
                ejercicio: y,
                trimestre: `T${q}`,
                baseImponibleTotal: Math.round(baseTotal * 100) / 100,
                cuotaIvaTotal: Math.round(cuotaTotal * 100) / 100,
                importeTotal: Math.round(totalGeneral * 100) / 100,
                numFacturas: items.length,
            },
            error: null
        };
    } catch (e) {
        return { status: "ERROR", data: null, error: toPublicError(e, "TAXSUMMARY_FAIL") };
    }
});

export const getLibroRegistroFacturasExpedidas = webMethod(Permissions.SiteMember, async (options = {}) => {
    const traceId = options.traceId || makeTraceId("tax-book");
    try {
        await requireAdmin(traceId);
        const res = await withTimeout(
            wixData.query(COLLECTIONS.MOVIMIENTOS_CAJA)
                .descending("fechaCreacion")
                .limit(100)
                .find({ suppressAuth: true }),
            CMSTIMEOUTMS,
            "queryFacturasExpedidas"
        );
        return { status: "SUCCESS", data: { facturas: res?.items || [] }, error: null };
    } catch (e) {
        return { status: "ERROR", data: null, error: toPublicError(e, "TAXBOOK_FAIL") };
    }
});
