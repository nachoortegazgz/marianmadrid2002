/*
=============================================================================
MODULE: public/marianAdministrationController.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Shared frontend controller for Marian-only administration panel.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixMembersFrontend from "wix-members-frontend";
import wixLocation from "wix-location";
import { checkStaffCollaboratorAccess } from "backend/security.web";
import { getMyStaffContext } from "backend/horario.web";
import { getCashierState, registerManualTransaction, registerXCount, registerZClosing } from "backend/cajas.web";
import { getInventoryDashboard, getInventoryReconciliationQueue } from "backend/inventario.web";
import { getQuarterlyTaxSummary, getLibroRegistroFacturasExpedidas } from "backend/fiscalAggregator.web";
import { askMarianAssistant } from "backend/marianAssistant.web";
import { URLS, SDK_CONFIG, MONEY, makeTraceId, _safeTrim } from "public/mmUtils";
import { createWidgetBridge } from "public/widgetBridge";

export async function initMarianAdministration(widget, slug = "administracion") {
    const traceId = makeTraceId("marian-admin");
    if (!widget || typeof widget.postMessage !== "function") return;

    const member = await wixMembersFrontend.currentMember.getMember().catch(() => null);
    if (!member) {
        await wixMembersFrontend.authentication.promptLogin();
        return;
    }

    const accessRes = await checkStaffCollaboratorAccess(traceId).catch(() => null);
    const isMarianManager = accessRes?.data?.isMarianManager === true;

    if (!isMarianManager) {
        wixLocation.to(URLS.SERVICIOS);
        return;
    }

    createWidgetBridge(widget, {
        slug,
        traceId,
        onContextReady: async () => {
            const cashier = await getCashierState({ traceId }).catch(() => null);
            return {
                isMarianManager: true,
                memberName: "Marian Madrid",
                timeZone: SDK_CONFIG.TZ,
                currencyCode: MONEY.DISPLAY_CURRENCY,
                cashierState: cashier?.data || null
            };
        },
        onWidgetMessage: async (msg, post) => {
            const type = String(msg?.type || "").toUpperCase();
            if (type === "AI_CHAT") {
                const res = await askMarianAssistant({ message: msg?.payload?.message, traceId });
                post("AICHAT_RES", res, msg?.meta?.messageId);
            }
        }
    });
}
