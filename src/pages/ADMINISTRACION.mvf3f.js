/**
 * =============================================================================
 * MODULE: pages/administracion.js
 * RESPONSIBILITY: Marian-only administration page controller.
 * CONFIGURATION: Requires the HTML component #htmlAdministracion in Wix Editor.
 * STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
 * =============================================================================
 */

import { initMarianAdministration } from "public/marianAdministrationController";

const WIDGET_ID = "#htmlAdministracion";

$w.onReady(async function () {
    await initMarianAdministration($w(WIDGET_ID), "administracion-marian");
});
