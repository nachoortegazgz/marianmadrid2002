/*
=============================================================================
PAGE: calendario-2.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Frontend booking wizard page code for $w('#html1').
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { processDualBooking } from 'backend/citasManager.web';
import { getServiceBySlugOrId } from 'backend/reservas.web';
import { createWidgetBridge } from 'public/widgetBridge';
import { makeTraceId } from 'public/mmUtils';

function _showError(msg) {
    try {
        const el = $w("#errorText");
        if (el && "text" in el) {
            el.text = msg ? `Error: ${msg}` : "";
            if (msg && typeof el.show === "function") el.show();
            if (!msg && typeof el.hide === "function") el.hide();
        }
    } catch (_) {}
}

$w.onReady(function () {
    const traceId = makeTraceId("cal-page");
    const widget = $w("#html1");
    if (!widget) return;

    createWidgetBridge(widget, {
        traceId,
        onWidgetMessage: async (msg, post) => {
            const type = String(msg?.type || "").toUpperCase();
            if (type === "MM_BOOK") {
                const res = await processDualBooking(msg.payload);
                post("MM_BOOK_RES", res, msg?.meta?.messageId);
            }
        }
    });
});
