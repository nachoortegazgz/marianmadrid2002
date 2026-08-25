/*
=============================================================================
MODULE: backend/horario.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Labor shift clocking (RD-Ley 8/2019), state machine, and context.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import wixData from 'wix-data';
import { webMethod, Permissions } from 'wix-web-module';
import { COLLECTIONS, SDK_CONFIG, TIPO_FICHAJE } from 'backend/internalConfig';
import { makeTraceId, _safeTrim, withTimeout, getMadridLocalStringNoZ, _maskIp } from 'public/mmUtils';
import { requireStaffCollaborator } from 'backend/security';
import { findStaff } from 'backend/staff';
import { toPublicError } from 'backend/responseUtils';

const CMSTIMEOUTMS = SDK_CONFIG.TIMEOUTS.CMS_MS;

export const getMyStaffContext = webMethod(Permissions.SiteMember, async (options = {}) => {
    const traceId = options.traceId || makeTraceId("staff-ctx");
    try {
        await requireStaffCollaborator(traceId);
        return {
            status: "SUCCESS",
            data: {
                resourceId: "resource-marian-01",
                displayName: "Marian Madrid",
                active: true,
                traceId
            },
            error: null
        };
    } catch (e) {
        return { status: "ERROR", data: null, error: toPublicError(e, "STAFFCONTEXT_FAIL") };
    }
});

export const registrarFichaje = webMethod(Permissions.SiteMember, async (payload = {}) => {
    const traceId = payload.traceId || makeTraceId("clock");
    try {
        await requireStaffCollaborator(traceId);
        const resourceId = _safeTrim(payload.resourceId);
        const tipoFichaje = _safeTrim(payload.tipoFichaje || TIPO_FICHAJE.ENTRADA).toUpperCase();

        const staff = await findStaff(resourceId, traceId);
        const now = new Date();
        const madrid = getMadridLocalStringNoZ(now);

        const record = {
            _id: makeTraceId("clk"),
            resourceId,
            resourceName: staff?.displayName || "Empleado",
            tipoFichaje,
            diaKey: madrid.slice(0, 10),
            mesKey: madrid.slice(0, 7),
            hora: madrid.slice(11, 19),
            fechaHora: now,
            ipDispositivo: _maskIp(payload.ip || "127.0.0.1"),
            registradoPor: "SELF",
            motivoAjuste: payload.motivoAjuste || null,
            traceId,
        };

        const res = await withTimeout(
            wixData.insert(COLLECTIONS.REGISTROHORARIO, record, { suppressAuth: true }),
            CMSTIMEOUTMS,
            "insertFichaje"
        );

        return { status: "SUCCESS", data: res, error: null };
    } catch (e) {
        return { status: "ERROR", data: null, error: toPublicError(e, "CLOCK_FAIL") };
    }
});
