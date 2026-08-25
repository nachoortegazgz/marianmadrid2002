#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const targets = {
  http: path.join(root, 'src/backend/http-functions.js'),
  events: path.join(root, 'src/backend/events.js'),
  inventory: path.join(root, 'src/backend/inventario.web.js'),
};

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, content) { fs.writeFileSync(file, content, 'utf8'); }
function replaceExactly(content, needle, replacement, label) {
  const count = content.split(needle).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 occurrence, found ${count}`);
  return content.replace(needle, replacement);
}
function replaceRegexExactly(content, regex, replacement, label) {
  const matches = [...content.matchAll(regex)];
  if (matches.length !== 1) throw new Error(`${label}: expected 1 match, found ${matches.length}`);
  return content.replace(regex, replacement);
}
function assertAscii(content, file) {
  const match = /[^\x00-\x7F]/.exec(content);
  if (match) throw new Error(`G10 ASCII violation in ${file} at ${match.index}`);
}
function assertSyntax(file) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Syntax validation failed for ${file}: ${(result.stderr || result.stdout || '').trim()}`);
}

function sanitizeHttp() {
  let c = read(targets.http);
  const anchor = "async function _logSyncEvent(endpoint, status, recordsCount, traceId) {";
  const helper = `function _toExternalMovementItem(item) {
    return {
        movementId: String(item?._id || ''),
        diaKey: _safeTrim(item?.diaKey),
        fechaCreacion: item?.fechaCreacion || null,
        tipoMovimiento: _safeTrim(item?.tipoMovimiento || item?.tipo),
        formaPago: _safeTrim(item?.formaPago || item?.paymentMethod),
        importe: Number(item?.importe ?? item?.amount ?? 0) || 0,
        iva: Number(item?.iva ?? 0) || 0,
        total: Number(item?.total ?? item?.importe ?? item?.amount ?? 0) || 0,
        transactionId: _safeTrim(item?.transactionId),
        orderId: _safeTrim(item?.orderId),
        bookingIds: Array.isArray(item?.bookingIds) ? item.bookingIds.map(String).slice(0, 50) : [],
        resourceId: _safeTrim(item?.resourceId),
        traceId: _safeTrim(item?.traceId),
    };
}

${anchor}`;
  c = replaceExactly(c, anchor, helper, 'http helper anchor');
  c = replaceRegexExactly(
    c,
    /export async function get_getMovements\(request\) \{[\s\S]*?\n\}\n\nexport async function get_getZClosings/s,
    (block) => block.replace("const items = res?.items || [];", "const items = (res?.items || []).map(_toExternalMovementItem);"),
    'http movements block'
  );
  assertAscii(c, targets.http);
  write(targets.http, c);
}

function sanitizeEvents() {
  let c = read(targets.events);
  const anchor = "async function _logAuditEvent(tipoEvento, level, message, data = {}, traceId, entityId = 'system') {";
  const helper = `function _sanitizeAuditData(data = {}) {
    const source = data && typeof data === 'object' ? data : {};
    const out = {};
    const scalarKeys = ['orderId', 'refundId', 'traceId', 'error'];
    for (const key of scalarKeys) {
        const value = source[key];
        if (value !== undefined && value !== null) out[key] = String(value).slice(0, 500);
    }
    if (Array.isArray(source.bookingIds)) {
        out.bookingIds = source.bookingIds.map((id) => String(id).slice(0, 120)).filter(Boolean).slice(0, 50);
    }
    if (source.ledgerError && typeof source.ledgerError === 'object') {
        out.ledgerError = {
            code: source.ledgerError.code ? String(source.ledgerError.code).slice(0, 100) : undefined,
            message: source.ledgerError.message ? String(source.ledgerError.message).slice(0, 500) : undefined,
        };
    }
    return out;
}

function _safeAuditText(value, max = 500) {
    return String(value || '').replace(/[\\r\\n]+/g, ' ').slice(0, max);
}

${anchor}`;
  c = replaceExactly(c, anchor, helper, 'events audit helper anchor');
  c = replaceExactly(c, "{ _id: logId, tipoEvento, level, message, data, resourceId: 'SYSTEM', source: 'backend/events.js', fechaLog: new Date(), traceId }", "{ _id: logId, tipoEvento: _normalizeIdPart(tipoEvento, 60), level: _normalizeIdPart(level, 20), message: _safeAuditText(message), data: _sanitizeAuditData(data), resourceId: 'SYSTEM', source: 'backend/events.js', fechaLog: new Date(), traceId: _normalizeIdPart(traceId, 80) }", 'events audit insert payload');
  assertAscii(c, targets.events);
  write(targets.events, c);
}

function sanitizeInventory() {
  let c = read(targets.inventory);
  const constants = 'const MAX_INVENTORY_LINES = 100;\nconst MAX_INVENTORY_QTY = 10000;\nconst MAX_INVENTORY_TEXT = 240;\n';
  c = replaceExactly(c, 'const CMS_TIMEOUT_MS = Number(SDK_CONFIG?.TIMEOUTS?.CMS_MS) || 15000;\n', 'const CMS_TIMEOUT_MS = Number(SDK_CONFIG?.TIMEOUTS?.CMS_MS) || 15000;\n' + constants, 'inventory constants');
  c = c.replace(/const lines = Array\.isArray\(payload\.lines\) \? payload\.lines : \[\];/g, 'const lines = Array.isArray(payload.lines) ? payload.lines.slice(0, MAX_INVENTORY_LINES) : [];');
  c = c.replace(/const sku = _safeTrim\(line\.sku\);\n\s*const quantity = Math\.abs\(Number\(line\.quantity\) \|\| 0\);/g, 'const sku = _safeTrim(line.sku).slice(0, 80);\n            const quantityRaw = Number(line.quantity);\n            const quantity = Number.isFinite(quantityRaw) ? Math.abs(quantityRaw) : 0;');
  c = c.replace(/if \(!sku \|\| quantity <= 0\) continue;/g, 'if (!sku || quantity <= 0 || quantity > MAX_INVENTORY_QTY) continue;');
  c = c.replace(/_safeTrim\(line\.note\) \|\|/g, '_safeTrim(line.note).slice(0, MAX_INVENTORY_TEXT) ||');
  c = c.replace(/_safeTrim\(line\.referenceId\) \|\|/g, '_safeTrim(line.referenceId).slice(0, MAX_INVENTORY_TEXT) ||');
  c = c.replace(/const movementToken = `USE_\$\{sku\}_\$\{Date\.now\(\)}_\$\{Math\.random\(\)\.toString\(36\)\.slice\(2, 6\)\}`;/g, 'const stableRef = _safeTrim(line.referenceId).slice(0, 120);\n            const movementToken = stableRef ? `USE_${stableRef}_${sku}` : `USE_${sku}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;');
  c = c.replace(/const movementToken = `RECV_\$\{sku\}_\$\{Date\.now\(\)}_\$\{Math\.random\(\)\.toString\(36\)\.slice\(2, 6\)\}`;/g, 'const stableRef = _safeTrim(line.referenceId).slice(0, 120);\n            const movementToken = stableRef ? `RECV_${stableRef}_${sku}` : `RECV_${sku}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;');
  if (!c.includes('slice(0, MAX_INVENTORY_LINES)')) throw new Error('inventory lines bound not applied');
  assertAscii(c, targets.inventory);
  write(targets.inventory, c);
}

sanitizeHttp();
sanitizeEvents();
sanitizeInventory();

for (const [name, file] of Object.entries(targets)) {
  assertAscii(read(file), file);
  assertSyntax(file);
  console.log(`validated ${name}: ${file}`);
}
console.log('SECURITY SANITIZATION APPLIED: http-functions.js, events.js, inventario.web.js');
