import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'cms-schema-libros-electronicos-qa.json'), 'utf8'));
const byId = new Map(schema.collections.map((collection) => [collection.id, collection]));

for (const id of ['CONFIGURACION_FISCAL', 'PLAN_CUENTAS_CONTABLES', 'ASIENTOS_CONTABLES', 'LINEAS_ASIENTO_CONTABLE', 'LIBRO_IVA_FACTURAS_EXPEDIDAS', 'LIBRO_IVA_FACTURAS_RECIBIDAS', 'MAYOR_CONTABLE_SALDOS', 'LIBRO_INVENTARIO_CIERRE', 'EVENTOS_SISTEMA_FACTURACION']) {
  assert.ok(byId.has(id), `Falta la colección propuesta ${id}`);
}

for (const collection of schema.collections) {
  assert.match(collection.id, /^[A-Z0-9_]+$/, `${collection.id} no respeta MAYUSCULAS_CON_GUIONES_BAJOS`);
  const fields = new Set(collection.fields.map(([fieldId]) => fieldId));
  assert.equal(fields.size, collection.fields.length, `${collection.id} contiene campos repetidos`);
  for (const [fieldId, type, required] of collection.fields) {
    assert.match(fieldId, /^[a-z][A-Za-z0-9]*$/, `${collection.id}.${fieldId} no respeta camelCase`);
    assert.ok(typeof type === 'string' && type.length > 0, `${collection.id}.${fieldId} sin tipo`);
    assert.equal(typeof required, 'boolean', `${collection.id}.${fieldId} sin obligatoriedad`);
  }
  for (const index of collection.indexes || []) {
    for (const fieldId of index.filter((value) => typeof value === 'string')) {
      assert.ok(fields.has(fieldId), `${collection.id}.${fieldId} indexa un campo inexistente`);
    }
  }
}

const journal = byId.get('ASIENTOS_CONTABLES');
const journalFields = new Set(journal.fields.map(([fieldId]) => fieldId));
for (const fieldId of ['idAsiento', 'numeroAsiento', 'fechaOperacion', 'fechaHoraRegistro', 'idTransaccion', 'totalDebe', 'totalHaber', 'idMiembroRegistrador', 'hashAnterior', 'hashAsiento', 'firmaAsiento', 'idTraza']) {
  assert.ok(journalFields.has(fieldId), `ASIENTOS_CONTABLES no cubre ${fieldId}`);
}

const lines = byId.get('LINEAS_ASIENTO_CONTABLE');
const lineFields = new Set(lines.fields.map(([fieldId]) => fieldId));
for (const fieldId of ['idLineaAsiento', 'idAsiento', 'numeroLinea', 'codigoCuentaContable', 'importeDebe', 'importeHaber', 'baseImponible', 'tipoIva', 'cuotaIva', 'hashLinea']) {
  assert.ok(lineFields.has(fieldId), `LINEAS_ASIENTO_CONTABLE no cubre ${fieldId}`);
}

console.log(`PASS\tColecciones=${schema.collections.length}\tEstado=${schema.status}`);
