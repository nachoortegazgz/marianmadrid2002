# CMS canonical schema provenance

Date: 2026-08-25

The canonical CMS baseline at `tests/cms-schema-canonical.json` is reconstructed only from the canonical schema supplied for this repository during the remediation review.

It intentionally does not invent field-level `fieldId` or Wix Data types that were not present in the supplied source. Such details remain a separate verification task against the real QA CMS export.

Authoritative hierarchy:

1. Canonical CMS schema.
2. `src/backend/internalConfig.js` and other SSOT modules.
3. Booking and fiscal invariants implemented by the runtime.
4. Security and performance optimizations.

No migration, field deletion, index creation, or destructive rename should be inferred solely from this baseline. QA must export the real collection schemas and data before applying CMS mutations.
