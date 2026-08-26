import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalPath = path.join(root, 'tests', 'cms-schema-canonical.json');
const contractPath = path.join(root, 'tests', 'cms-contract.json');
const electronicPath = path.join(root, 'docs', 'cms-schema-libros-electronicos-qa.json');

const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const electronic = JSON.parse(fs.readFileSync(electronicPath, 'utf8'));
const existing = new Map(canonical.collections.map((collection) => [collection.id, collection]));

for (const collection of electronic.collections) {
  const normalized = {
    id: collection.id,
    purpose: collection.purpose,
    fields: collection.fields,
    indexes: collection.indexes || [],
    notes: [
      'Creada en el CMS productivo el 2026-08-25. Escrituras habilitadas solo por backend autorizado y tras validar la configuracion contable.',
      ...(collection.conditional ? ['Coleccion condicional: no genera registros hasta confirmar su aplicabilidad con gestoría.'] : []),
      ...(collection.appendOnly ? ['Los registros confirmados son append-only; las rectificaciones se realizan mediante nuevos registros vinculados.'] : []),
    ],
  };
  existing.set(collection.id, normalized);
}

canonical.schemaVersion = '2026-08-25-production-books-v1';
canonical.scope = 'Colecciones personalizadas activas y de compatibilidad requeridas por el runtime Wix actual, incluidos los libros electronicos creados el 2026-08-25.';
canonical.collections = [...existing.values()];

const constants = {
  CONFIGURACION_FISCAL: 'CONFIGURACION_FISCAL',
  PLAN_CUENTAS_CONTABLES: 'PLAN_CUENTAS_CONTABLES',
  ASIENTOS_CONTABLES: 'ASIENTOS_CONTABLES',
  LINEAS_ASIENTO_CONTABLE: 'LINEAS_ASIENTO_CONTABLE',
  LIBRO_IVA_FACTURAS_EXPEDIDAS: 'LIBRO_IVA_FACTURAS_EXPEDIDAS',
  LIBRO_IVA_FACTURAS_RECIBIDAS: 'LIBRO_IVA_FACTURAS_RECIBIDAS',
  LIBRO_IVA_BIENES_INVERSION: 'LIBRO_IVA_BIENES_INVERSION',
  LIBRO_IVA_INTRACOMUNITARIO: 'LIBRO_IVA_INTRACOMUNITARIO',
  MAYOR_CONTABLE_SALDOS: 'MAYOR_CONTABLE_SALDOS',
  LIBRO_INVENTARIO_CIERRE: 'LIBRO_INVENTARIO_CIERRE',
  EVENTOS_SISTEMA_FACTURACION: 'EVENTOS_SISTEMA_FACTURACION',
};
Object.assign(contract.collections, constants);
Object.assign(contract.requiredFields, {
  ASIENTOS_CONTABLES: ['idAsiento', 'numeroAsiento', 'fechaOperacion', 'fechaHoraRegistro', 'idTransaccion', 'totalDebe', 'totalHaber', 'idMiembroRegistrador', 'hashAnterior', 'hashAsiento', 'firmaAsiento', 'idTraza'],
  LINEAS_ASIENTO_CONTABLE: ['idLineaAsiento', 'idAsiento', 'numeroLinea', 'codigoCuentaContable', 'importeDebe', 'importeHaber', 'baseImponible', 'tipoIva', 'cuotaIva', 'hashLinea'],
  LIBRO_IVA_FACTURAS_EXPEDIDAS: ['idRegistroIva', 'idAsiento', 'ejercicioFiscal', 'periodoFiscal', 'fechaExpedicion', 'numeroFactura', 'importeTotalFactura', 'baseImponible', 'tipoIva', 'cuotaIvaRepercutida', 'idTraza'],
  LIBRO_IVA_FACTURAS_RECIBIDAS: ['idRegistroIva', 'idAsiento', 'ejercicioFiscal', 'periodoFiscal', 'fechaExpedicion', 'fechaRecepcion', 'serieNumeroFacturaProveedor', 'nifProveedor', 'importeTotalFactura', 'baseImponible', 'tipoIva', 'cuotaIvaSoportado', 'idTraza'],
  MAYOR_CONTABLE_SALDOS: ['idMayor', 'ejercicioFiscal', 'periodoFiscal', 'codigoCuentaContable', 'movimientosDebe', 'movimientosHaber', 'fechaCalculo', 'idTraza'],
  EVENTOS_SISTEMA_FACTURACION: ['idEventoSistema', 'fechaHoraEvento', 'tipoEvento', 'severidad', 'origenEvento', 'versionSistema', 'versionEsquema', 'resultado', 'hashEvento', 'firmaEvento', 'idTraza'],
});
const productionBooksNote = 'Las colecciones de libros electronicos se crearon en produccion el 2026-08-25 con permisos ADMIN. Su activacion funcional depende de la configuracion contable validada por gestoría.';
if (!contract.notes.includes(productionBooksNote)) contract.notes.push(productionBooksNote);

fs.writeFileSync(canonicalPath, `${JSON.stringify(canonical, null, 2)}\n`);
fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
