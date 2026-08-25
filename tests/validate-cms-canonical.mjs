import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const schemaPath = path.join(ROOT, 'tests', 'cms-schema-canonical.json');
const configPath = path.join(ROOT, 'src', 'backend', 'internalConfig.js');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const config = fs.readFileSync(configPath, 'utf8');

const failures = [];

for (const collectionName of Object.keys(schema.collections || {})) {
    const escaped = collectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`['\"]${escaped}['\"]`).test(config)) {
        failures.push(`Missing canonical collection reference in internalConfig.js: ${collectionName}`);
    }
}

for (const [alias, target] of Object.entries(schema.canonicalAliases || {})) {
    const aliasPattern = new RegExp(`${alias}\\s*:\\s*[\"']${target}[\"']`);
    if (!aliasPattern.test(config)) {
        failures.push(`Canonical inventory alias mismatch: ${alias} -> ${target}`);
    }
}

if (!schema.conventions || schema.conventions.timezone !== 'Europe/Madrid') {
    failures.push('Canonical timezone must remain Europe/Madrid');
}

if (!Array.isArray(schema.systemFieldsExcluded) || !schema.systemFieldsExcluded.includes('_id')) {
    failures.push('Wix system fields exclusion contract is missing _id');
}

if (failures.length) {
    console.error('CMS canonical contract validation FAILED');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}

console.log(`CMS canonical contract validation OK: ${Object.keys(schema.collections || {}).length} collections checked.`);
