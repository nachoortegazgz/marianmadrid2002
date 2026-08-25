# Security second pass - 2026-08-25

## Scope
Second static review of the current `main` branch, focused on:
- syntax and structural integrity;
- SSOT and naming contracts;
- external data exposure;
- audit/PII minimization;
- inventory concurrency and idempotency;
- authentication/rate limiting;
- booking engine regression risk.

## Findings

### HIGH - External HTTP movement DTO
`src/backend/http-functions.js` still returns `successResponse(items, ...)` from `COLLECTIONS.MOVIMIENTOS_CAJA` after a backend query using `suppressAuth: true`.

Risk: the external M365/Power Automate contract can inherit CMS fields that are not explicitly part of the integration contract.

Required remediation: map records through an explicit external DTO before returning them.

### HIGH - Audit payload minimization
`src/backend/events.js` still persists the complete `data` object passed to `_logAuditEvent()`.

Risk: webhook errors can persist internal structures or unnecessary identifiers in `AUDIT_LOG`.

Required remediation: allowlist scalar audit fields, bound lengths, normalize text, and cap booking ID arrays.

### HIGH - Inventory lost-update race
`src/backend/inventario.web.js` still uses the pattern `read stockExpected -> calculate -> update stockExpected` for professional use and supplier receipt.

Risk: concurrent requests can overwrite each other's stock changes.

Required remediation: introduce an atomic/serialized stock mutation strategy or a lock/CAS mechanism before treating inventory concurrency as closed.

### MEDIUM - Inventory input bounds
Inventory line arrays and several text/numeric fields do not have strict explicit local bounds at the method boundary.

Required remediation: cap line count, SKU length, quantity range, note/reference length and return a clear invalid-payload result for excess input rather than silently dropping arbitrary data.

### MEDIUM - Public error propagation
`src/backend/inventario.web.js` exposes `err.message` through `_toPublicError()`.

Required remediation: expose stable public error codes/messages while logging the detailed internal error with traceId.

## Verified positives
- `securityEngine.js` has bounded cryptographic inputs and JWT validation hardened in the previous pass.
- `security.js` now bounds rate-limit dimensions and reuses authenticated member state.
- `marianAssistant.web.js` bounds trace identifiers and avoids directly exposing provider error text.
- Booking engine files were deliberately not refactored in this pass because their Fase 1/exposure/Fase 2 and saga invariants are high-risk functional areas.
- No evidence was found that justifies changing the SSOT naming contract (`serviceId`, `linkFases`, `resourceId`).

## CI status
The current `main` commit has no registered GitHub status checks. Therefore this report is static verification and not a claim of runtime/Velo test execution.

## Decision
Do not mark the repository as fully sanitized yet. The three HIGH findings above require targeted changes followed by syntax/ESLint/Wix validation before merging them into `main`.
