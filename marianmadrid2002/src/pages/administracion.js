/*
=============================================================================
PAGE: administracion.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Frontend administration manager panel for $w('#htmlAdministracion').
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { initMarianAdministration } from 'public/marianAdministrationController';

$w.onReady(function () {
    const widget = $w("#htmlAdministracion");
    if (widget) {
        initMarianAdministration(widget, "administracion");
    }
});
