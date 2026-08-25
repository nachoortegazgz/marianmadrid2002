/*
=============================================================================
MODULE: public/widgetBridge.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: HTML Widget postMessage handshake and bi-directional RPC channel.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { MESSAGE_TYPES, UI, _safeTrim, makeTraceId } from "public/mmUtils";

export function createWidgetBridge(widget, options = {}) {
    if (!widget || typeof widget.postMessage !== "function") {
        throw new Error("INVALID_WIDGET: Valid $w('#htmlWidget') element required");
    }

    const bridgeId = options.bridgeId || makeTraceId("bridge");
    const traceId = options.traceId || makeTraceId("ui");
    const onContextReady = options.onContextReady || (async () => ({}));
    const onWidgetMessage = options.onWidgetMessage || (async () => {});

    function post(type, payload = {}, messageId = null) {
        try {
            const envelope = {
                type: String(type),
                payload,
                meta: {
                    bridgeId,
                    traceId,
                    messageId: messageId || makeTraceId("msg"),
                    timestamp: Date.now()
                }
            };
            widget.postMessage(envelope);
        } catch (e) {
            console.warn("[widgetBridge] Post error:", e?.message);
        }
    }

    widget.onMessage(async (event) => {
        try {
            const data = event?.data;
            if (!data || typeof data !== "object") return;
            const type = String(data.type || "").toUpperCase();

            if (type === MESSAGE_TYPES.READY) {
                const context = await onContextReady();
                post(MESSAGE_TYPES.CONTEXT, context, data?.meta?.messageId);
                return;
            }

            await onWidgetMessage(data, post);
        } catch (error) {
            console.error("[widgetBridge] Message handling error:", error);
            post("ERROR", { code: "BRIDGE_ERROR", message: error?.message });
        }
    });

    return {
        bridgeId,
        post,
        ping: () => post("PING", { status: "ALIVE" })
    };
}
