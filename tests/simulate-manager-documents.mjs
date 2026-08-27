import assert from 'node:assert/strict';
import crypto from 'node:crypto';

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

class ManagerDocumentsSimulator {
  constructor({ isMarianManager, emailConfigured, movements }) {
    this.isMarianManager = isMarianManager;
    this.emailConfigured = emailConfigured;
    this.movements = movements || [];
    this.history = [];
  }

  _requireMarian() {
    if (!this.isMarianManager) throw new Error('ACCESS_DENIED');
  }

  _periodKey(year, quarter) {
    if (!Number.isInteger(year) || ![1, 2, 3, 4].includes(quarter)) throw new Error('DOCUMENT_INVALID_PERIOD');
    return `DOC_GESTORIA_${year}_T${quarter}_PAQUETE_GESTORIA`;
  }

  _package(key, version) {
    const rows = this.movements.map((movement) => ({
      naturaleza: movement.naturaleza,
      importeContable: movement.importeContable,
      baseImponible: movement.baseImponible,
      cuotaIva: movement.cuotaIva,
      tratamientoIva: movement.tratamientoIva,
    }));
    const summary = rows.reduce((acc, row) => {
      if (row.naturaleza === 'PROPINA') acc.propinas += row.importeContable;
      else if (row.naturaleza === 'DEVOLUCION') {
        acc.devoluciones += row.importeContable;
        acc.base += row.baseImponible;
        acc.iva += row.cuotaIva;
      } else if (row.naturaleza === 'VENTA') {
        acc.ventas += row.importeContable;
        acc.base += row.baseImponible;
        acc.iva += row.cuotaIva;
      }
      return acc;
    }, { ventas: 0, devoluciones: 0, propinas: 0, base: 0, iva: 0 });
    const documentId = `${key}_V${String(version).padStart(4, '0')}`;
    const content = JSON.stringify({ documentId, rows, summary });
    return { documentId, content, contentHash: hash(content), summary };
  }

  preview(year, quarter) {
    this._requireMarian();
    const key = this._periodKey(year, quarter);
    return { status: 'PREVIEW', key, summary: this._package(key, 0).summary, defaultRecipient: 'gestion@marianmadrid.es' };
  }

  create(year, quarter) {
    this._requireMarian();
    const key = this._periodKey(year, quarter);
    const version = this.history.filter((event) => event.key === key && event.event === 'CREATED').length + 1;
    const document = this._package(key, version);
    this.history.push({ event: 'CREATED', key, version, ...document });
    return { status: 'CREATED', version, ...document };
  }

  download(documentId) {
    this._requireMarian();
    const created = this.history.find((event) => event.event === 'CREATED' && event.documentId === documentId);
    if (!created) throw new Error('DOCUMENT_NOT_FOUND');
    const current = this._package(created.key, created.version);
    if (current.contentHash !== created.contentHash) throw new Error('DOCUMENT_SOURCE_CHANGED');
    return { status: 'READY', ...current };
  }

  email({ documentId, recipient, confirmed }) {
    this._requireMarian();
    if (confirmed !== true) throw new Error('DOCUMENT_SEND_CONFIRMATION_REQUIRED');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipient)) throw new Error('DOCUMENT_INVALID_RECIPIENT');
    const ready = this.download(documentId);
    const deliveryKey = hash(`${ready.documentId}|${recipient}|${ready.contentHash}`);
    if (this.history.some((event) => event.event === 'SENT' && event.deliveryKey === deliveryKey)) return { status: 'ALREADY_SENT', deliveryKey };
    if (!this.emailConfigured) throw new Error('DOCUMENT_EMAIL_NOT_CONFIGURED');
    this.history.push({ event: 'SENT', documentId, deliveryKey, recipient, contentHash: ready.contentHash });
    return { status: 'SENT', deliveryKey };
  }
}

const movements = [
  { naturaleza: 'VENTA', importeContable: 121, baseImponible: 100, cuotaIva: 21, tratamientoIva: 'IVA_GENERAL' },
  { naturaleza: 'DEVOLUCION', importeContable: -24.2, baseImponible: -20, cuotaIva: -4.2, tratamientoIva: 'IVA_GENERAL' },
  { naturaleza: 'PROPINA', importeContable: 5, baseImponible: 0, cuotaIva: 0, tratamientoIva: 'PROPINA_PENDIENTE_GESTORIA' },
];

const tests = [];
function test(name, fn) {
  try {
    fn();
    tests.push({ name, status: 'PASS' });
  } catch (error) {
    tests.push({ name, status: 'FAIL', detail: error.message });
  }
}

test('documentos de gestoría rechazan toda sesión que no sea Marian', () => {
  const sim = new ManagerDocumentsSimulator({ isMarianManager: false, emailConfigured: false, movements });
  assert.throws(() => sim.preview(2026, 3), /ACCESS_DENIED/);
  assert.equal(sim.history.length, 0);
});

test('vista previa y versionado separan propinas y conservan devoluciones con signo', () => {
  const sim = new ManagerDocumentsSimulator({ isMarianManager: true, emailConfigured: false, movements });
  const preview = sim.preview(2026, 3);
  const first = sim.create(2026, 3);
  const second = sim.create(2026, 3);
  assert.equal(preview.defaultRecipient, 'gestion@marianmadrid.es');
  assert.equal(preview.summary.ventas, 121);
  assert.equal(preview.summary.devoluciones, -24.2);
  assert.equal(preview.summary.propinas, 5);
  assert.equal(preview.summary.base, 80);
  assert.equal(preview.summary.iva, 16.8);
  assert.equal(first.version, 1);
  assert.equal(second.version, 2);
  assert.notEqual(first.documentId, second.documentId);
  assert.match(first.contentHash, /^[0-9a-f]{64}$/);
});

test('descarga bloquea una versión cuyo contenido de origen cambió', () => {
  const sim = new ManagerDocumentsSimulator({ isMarianManager: true, emailConfigured: false, movements: [...movements] });
  const created = sim.create(2026, 3);
  assert.equal(sim.download(created.documentId).status, 'READY');
  sim.movements[0].importeContable = 122;
  assert.throws(() => sim.download(created.documentId), /DOCUMENT_SOURCE_CHANGED/);
});

test('envío exige confirmación y falla de forma segura sin proveedor configurado', () => {
  const sim = new ManagerDocumentsSimulator({ isMarianManager: true, emailConfigured: false, movements });
  const created = sim.create(2026, 3);
  assert.throws(() => sim.email({ documentId: created.documentId, recipient: 'gestion@marianmadrid.es', confirmed: false }), /DOCUMENT_SEND_CONFIRMATION_REQUIRED/);
  assert.throws(() => sim.email({ documentId: created.documentId, recipient: 'gestion@marianmadrid.es', confirmed: true }), /DOCUMENT_EMAIL_NOT_CONFIGURED/);
  assert.equal(sim.history.filter((event) => event.event === 'SENT').length, 0);
});

test('envío configurado es idempotente por versión, destinatario y huella', () => {
  const sim = new ManagerDocumentsSimulator({ isMarianManager: true, emailConfigured: true, movements });
  const created = sim.create(2026, 3);
  const first = sim.email({ documentId: created.documentId, recipient: 'gestion@marianmadrid.es', confirmed: true });
  const retry = sim.email({ documentId: created.documentId, recipient: 'gestion@marianmadrid.es', confirmed: true });
  assert.equal(first.status, 'SENT');
  assert.equal(retry.status, 'ALREADY_SENT');
  assert.equal(sim.history.filter((event) => event.event === 'SENT').length, 1);
});

for (const result of tests) {
  console.log(`${result.status}\t${result.name}`);
  if (result.detail) console.log(result.detail);
}
const failed = tests.filter((result) => result.status === 'FAIL');
console.log(`TOTAL=${tests.length} PASS=${tests.length - failed.length} FAIL=${failed.length}`);
process.exitCode = failed.length ? 1 : 0;
