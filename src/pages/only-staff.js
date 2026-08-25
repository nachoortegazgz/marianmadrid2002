/*
=============================================================================
PAGE: only-staff.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Frontend staff TPV terminal for $w('#htmlOnlyStaff').
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
import { initMarianAdministration } from 'public/marianAdministrationController';

$w.onReady(function () {
    const widget = $w("#htmlOnlyStaff");
    if (widget) {
        initMarianAdministration(widget, "onlystaff");
    }
});
