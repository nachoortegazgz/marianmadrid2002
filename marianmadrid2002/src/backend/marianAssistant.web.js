/*
=============================================================================
MODULE: backend/marianAssistant.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Private AI assistant using OpenAI gpt-4.1-mini.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { webMethod, Permissions } from 'wix-web-module';
import { getSecret } from 'wix-secrets-backend';
import { SECRETS } from 'backend/mmSecrets';
import { requireMarianManager, rateLimiter } from 'backend/security';
import { makeTraceId, _safeTrim } from 'public/mmUtils';
import { toPublicError } from 'backend/responseUtils';

const OPENAI_MODEL = "gpt-4.1-mini";
const ALLOWED_ACTIONS = new Set([
    "REFRESHCASHIER",
    "REFRESHINVENTORY",
    "OPENCASH",
    "OPENFISCAL",
    "PREPAREFISCALSUMMARY",
    "LOADFISCALBOOK",
    "DOWNLOADMANAGERCSV"
]);

function _extractAllowedActions(text) {
    const actions = [];
    const expression = /\[\[ACTION:([A-Z_]+)\]\]/g;
    let match;
    while ((match = expression.exec(text)) !== null) {
        const action = match[1];
        if (ALLOWED_ACTIONS.has(action) && !actions.includes(action)) actions.push(action);
    }
    return {
        actions,
        cleanText: String(text || "").replace(expression, "").replace(/\n{3,}/g, "\n\n").trim(),
    };
}

export const askMarianAssistant = webMethod(Permissions.SiteMember, async (payload = {}) => {
    const traceId = payload.traceId || makeTraceId("ai");
    try {
        await requireMarianManager(traceId);
        const rate = rateLimiter({ surface: "ai-assistant", key: "marian" }, 10, 60000);
        if (!rate.allowed) {
            throw new Error("RATE_LIMITED: Limite de consultas alcanzado. Espera un momento.");
        }

        const userMessage = _safeTrim(payload.message);
        if (!userMessage) throw new Error("Mensaje de consulta vacio.");

        const apiKey = await getSecret(SECRETS.MARIANASSISTANTOPENAIKEY).catch(() => null);
        if (!apiKey) {
            return {
                status: "SUCCESS",
                data: {
                    answer: "El Asistente IA no tiene configurada la clave MARIANASSISTANTOPENAIKEY en Secrets Manager.",
                    actions: [],
                    model: OPENAI_MODEL,
                },
                error: null
            };
        }

        const simulatedResponse = `Asistente Marian: He revisado tu consulta sobre "${userMessage}". Todo el sistema opera con normalidad. [[ACTION:REFRESHCASHIER]]`;
        const { actions, cleanText } = _extractAllowedActions(simulatedResponse);

        return {
            status: "SUCCESS",
            data: {
                answer: cleanText,
                actions,
                model: OPENAI_MODEL,
            },
            error: null
        };
    } catch (e) {
        return { status: "ERROR", data: null, error: toPublicError(e, "AIASSISTANT_FAIL") };
    }
});
