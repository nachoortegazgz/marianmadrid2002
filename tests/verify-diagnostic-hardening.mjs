import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS\t${name}`);
  } catch (error) {
    console.error(`FAIL\t${name}\t${error.message}`);
    process.exitCode = 1;
  }
}

check("MapaStaff conserva nombreVisible sin identidades codificadas", () => {
  const source = read("src/backend/staff.js");
  assert.match(source, /return _safeTrim\(rawName\) \|\| "PROFESIONAL SEGUN HORARIO"/);
  assert.equal(source.includes('normalized.includes("MARIAN")'), false);
  assert.equal(source.includes('normalized.includes("ALBA")'), false);
  assert.equal(source.includes('normalized.includes("ANDREA")'), false);
});

check("la disponibilidad limita por solicitante efimero y conserva un limite global", () => {
  const config = read("src/backend/internalConfig.js");
  const reservations = read("src/backend/reservas.web.js");
  const calendar = read("src/pages/Calendario de reservas 2.q39h6.js");
  for (const token of ["AVAILABILITY_REQUESTER_MAX_REQUESTS", "AVAILABILITY_GLOBAL_MAX_REQUESTS", "AVAILABILITY_WINDOW_MS"]) assert.ok(config.includes(token), token);
  for (const token of ["_availabilityRequesterKey", "_rateLimitPublicAvailability", "requesterId = \"\"", 'surface: `${surface}:global`']) assert.ok(reservations.includes(token), token);
  assert.match(calendar, /const availabilityRequesterId = makeTraceId\("availability-session"\)/);
  assert.ok(calendar.includes("availabilityRequesterId"));
});

check("locks expirados se reclaman bajo demanda y no se renuevan una vez caducados", () => {
  const source = read("src/backend/booking/bookingCore.js");
  for (const token of ["_reclaimExpiredLock", "Re-read before removal", "LOCK_RECLAIM_RACE", "reclaimed: true", "expired: true"]) assert.ok(source.includes(token), token);
  assert.equal(source.includes("LOCK_EXPIRED_PENDING_CLEANUP"), false);
});

check("los detalles de error cubren variantes de PII por patron", () => {
  const source = read("src/backend/booking/bookingCore.js");
  assert.match(source, /function _isPiiKey\(key\)/);
  assert.match(source, /email\|mail\|telefono\|phone\|movil\|mobile/);
  assert.match(source, /if \(_isPiiKey\(key\)\) sanitized\[key\] = "\[REDACTED\]"/);
});

check("la exportacion externa del ledger usa una proyeccion sin material criptografico", () => {
  const source = read("src/backend/http-functions.js");
  const projectorStart = source.indexOf("function _toExternalMovement");
  const projectorEnd = source.indexOf("async function _logSyncEvent", projectorStart);
  assert.ok(projectorStart >= 0 && projectorEnd > projectorStart);
  const projector = source.slice(projectorStart, projectorEnd);
  for (const allowed of ["movementId", "documentNumber", "taxableBase", "taxAmount", "totalAmount"]) assert.ok(projector.includes(allowed), allowed);
  for (const forbidden of ["hashCadena", "firmaDigital", "traceId", "detalleLineas", "clienteEmail"]) assert.equal(projector.includes(forbidden), false, forbidden);
  assert.ok(source.includes("const items = (res?.items || []).map(_toExternalMovement)"));
});

check("los hooks inmutables no aceptan una excepcion de migracion generica", () => {
  const source = read("src/backend/data.js");
  for (const token of ["movimientoCaja_beforeUpdate", "REGISTRO_HORARIO_beforeRemove", "ASIENTOS_CONTABLES_beforeUpdate", "LINEAS_ASIENTO_CONTABLE_beforeRemove"]) assert.ok(source.includes(token), token);
  assert.equal(source.includes("_isAuthorizedMigration"), false);
  assert.equal(source.includes("context?._migration"), false);
});

check("los reintentos de resultado incierto requieren declaracion explicita", () => {
  const source = read("src/public/mmUtils.js");
  const calendar = read("src/pages/Calendario de reservas 2.q39h6.js");
  assert.match(source, /const retryUncertainOutcome = options\?\.retryUncertainOutcome === true/);
  assert.match(source, /retryUncertainOutcome && uncertainOutcome/);
  assert.match(calendar, /\{ retryUncertainOutcome: true \}/);
});

console.log(`TOTAL=${passed} PASS=${passed} FAIL=${7 - passed}`);
if (passed !== 7) process.exitCode = 1;
