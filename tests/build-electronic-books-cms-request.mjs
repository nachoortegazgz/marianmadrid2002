import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wixConfig = JSON.parse(fs.readFileSync(path.join(root, 'wix.config.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'cms-schema-libros-electronicos-qa.json'), 'utf8'));

const displayOverrides = {
  orderId: 'ID_PEDIDO_WIX',
  refundId: 'ID_REEMBOLSO_WIX',
  id: 'ID',
  nif: 'NIF',
  iva: 'IVA',
  iae: 'IAE',
  irpf: 'IRPF',
  wix: 'WIX',
};

function visibleName(fieldId) {
  if (displayOverrides[fieldId]) return displayOverrides[fieldId];
  return fieldId
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

const collectionSpecs = schema.collections.map((collection) => ({
  id: collection.id,
  displayName: collection.displayName,
  permissions: collection.permissions,
  fields: collection.fields.map(([key, type]) => ({
    key,
    displayName: visibleName(key),
    type,
  })),
}));

const ledgerFields = [
  { key: 'concepto', displayName: 'CONCEPTO', type: 'TEXT' },
  { key: 'origen', displayName: 'ORIGEN', type: 'TEXT' },
  { key: 'orderId', displayName: 'ID_PEDIDO_WIX', type: 'TEXT' },
  { key: 'refundId', displayName: 'ID_REEMBOLSO_WIX', type: 'TEXT' },
];

const executionCode = [
  'async function() {',
  `  const collectionSpecs = ${JSON.stringify(collectionSpecs)};`,
  `  const ledgerFields = ${JSON.stringify(ledgerFields)};`,
  '  const baseUrl = "https://www.wixapis.com/wix-data/v2/collections";',
  '  const results = { collections: [], collectionFields: [], ledgerFields: [] };',
  '  for (const spec of collectionSpecs) {',
  '    let collection = null;',
  '    try {',
  '      const existing = await wix.request({ scope: "site", method: "GET", url: `${baseUrl}/${encodeURIComponent(spec.id)}` });',
  '      collection = existing.data?.collection || null;',
  '      results.collections.push({ id: spec.id, status: "EXISTS", revision: collection?.revision || null });',
  '    } catch (error) {',
  '      const status = Number(error?.response?.status || error?.status || 0);',
  '      if (status && status !== 404) {',
  '        results.collections.push({ id: spec.id, status: "READ_ERROR", error: String(error) });',
  '        continue;',
  '      }',
  '      try {',
  '        const created = await wix.request({ scope: "site", method: "POST", url: baseUrl, body: { collection: spec } });',
  '        collection = created.data?.collection || null;',
  '        results.collections.push({ id: spec.id, status: "CREATED", revision: collection?.revision || null, fieldCount: collection?.fields?.length || 0 });',
  '      } catch (createError) {',
  '        results.collections.push({ id: spec.id, status: "CREATE_ERROR", error: String(createError) });',
  '        continue;',
  '      }',
  '    }',
  '    const existingKeys = new Set((collection?.fields || []).map((field) => field.key));',
  '    for (const field of spec.fields) {',
  '      if (existingKeys.has(field.key)) continue;',
  '      try {',
  '        await wix.request({ scope: "site", method: "POST", url: `${baseUrl}/create-field`, body: { dataCollectionId: spec.id, field } });',
  '        results.collectionFields.push({ dataCollectionId: spec.id, key: field.key, status: "CREATED" });',
  '      } catch (fieldError) {',
  '        results.collectionFields.push({ dataCollectionId: spec.id, key: field.key, status: "CREATE_ERROR", error: String(fieldError) });',
  '      }',
  '    }',
  '  }',
  '  const ledgerResponse = await wix.request({ scope: "site", method: "GET", url: `${baseUrl}/movimientoCaja` });',
  '  const existingLedgerKeys = new Set((ledgerResponse.data?.collection?.fields || []).map((field) => field.key));',
  '  for (const field of ledgerFields) {',
  '    if (existingLedgerKeys.has(field.key)) {',
  '      results.ledgerFields.push({ key: field.key, status: "EXISTS" });',
  '      continue;',
  '    }',
  '    try {',
  '      await wix.request({ scope: "site", method: "POST", url: `${baseUrl}/create-field`, body: { dataCollectionId: "movimientoCaja", field } });',
  '      results.ledgerFields.push({ key: field.key, status: "CREATED" });',
  '    } catch (error) {',
  '      results.ledgerFields.push({ key: field.key, status: "CREATE_ERROR", error: String(error) });',
  '    }',
  '  }',
  '  return results;',
  '}',
].join('\n');

const request = {
  siteId: wixConfig.siteId,
  hasMutations: true,
  reason: 'La usuaria autorizó editar y publicar en el editor. Se reconcilia de forma idempotente el contrato de colecciones CMS para libros electrónicos y los campos de trazabilidad de movimientoCaja, sin eliminar ni actualizar registros existentes.',
  sourceDocUrls: [
    'https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/create-data-collection',
    'https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/create-data-collection-field',
  ],
  code: executionCode,
};

process.stdout.write(JSON.stringify(request));
