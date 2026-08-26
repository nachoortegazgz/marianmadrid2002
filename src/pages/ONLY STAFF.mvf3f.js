/**
 * =============================================================================
 * MODULE: pages/only-staff.js
 * RESPONSIBILITY: Legacy route wrapper for Marian's administration panel.
 * STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
 * =============================================================================
 */

import { initMarianAdministration } from "public/marianAdministrationController";

const WIDGET_ID = "#htmlOnlyStaff";

$w.onReady(async function () {
    await initMarianAdministration($w(WIDGET_ID), "gestion-marian");
});
