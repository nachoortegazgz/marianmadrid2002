/*
=============================================================================
FILE: backend/security.web.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Web-module facade for RBAC checks (thin wrapper).
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { webMethod, Permissions } from 'wix-web-module';
import {
    isAdmin,
    isCajero,
    isStaffCollaborator,
    isMarianManager,
    requireAdmin as requireAdminInternal
} from 'backend/security';

function toPublicError(err, fallbackCode = 'ACCESSDENIED', fallbackMessage = 'Acceso denegado.') {
    const code = String(err?.code || fallbackCode);
    const message = String(err?.message || fallbackMessage);
    return { code, message };
}

export const checkStaffCollaboratorAccess = webMethod(
    Permissions.SiteMember,
    async (traceId = 'staff-access') => {
        try {
            const ok = await isStaffCollaborator(traceId);
            if (!ok) {
                return {
                    status: 'ERROR',
                    data: null,
                    error: {
                        code: 'COLLAB_REQUIRED',
                        message: 'Acceso denegado. Se requieren permisos de empleado.'
                    }
                };
            }
            const [admin, cajero, marianManager] = await Promise.all([
                isAdmin(traceId),
                isCajero(traceId),
                isMarianManager(traceId)
            ]);
            return {
                status: 'SUCCESS',
                data: {
                    isAdmin: !!admin,
                    isCajero: !!cajero,
                    isMarianManager: !!marianManager
                },
                error: null
            };
        } catch (err) {
            return { status: 'ERROR', data: null, error: toPublicError(err, 'ACCESSDENIED') };
        }
    }
);

export const requireAdmin = webMethod(
    Permissions.SiteMember,
    async (traceId = 'require-admin') => {
        try {
            await requireAdminInternal(traceId);
            return { status: 'SUCCESS', data: true, error: null };
        } catch (err) {
            return { status: 'ERROR', data: null, error: toPublicError(err, 'ADMINREQUIRED') };
        }
    }
);
