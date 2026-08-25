# Security third pass - 2026-08-25

## Scope
Deep static review after the first two sanitation passes. Focus:
- booking lock lifecycle and concurrency;
- saga input trust and mutation boundaries;
- HTTP authentication and rate-limit correctness;
- public error/data exposure;
- scheduled recovery and cleanup;
- SSOT and compatibility aliases;
- JWT/HMAC edge cases;
- availability-resource selection semantics.

## Findings

### CRITICAL - Main remaining exposure is still the external movement contract
`src/backend/http-functions.js` returns CMS movement records directly from `MOVIMIENTOS_CAJA` after a privileged query.

Risk: integration consumers can receive fields outside the intended M365 contract.

Action: explicit allowlisted DTO, with bounded arrays/strings and no internal metadata.

### HIGH - Expired booking locks can block new bookings until cleanup
`bookingCore._lockSlotKeyOrFail()` detects an expired existing lock but returns `LOCK_EXPIRED_PENDING_CLEANUP` instead of reclaiming it. `jobs.config` schedules `cleanExpiredLocks` once per hour, while `LOCK_CLEANUP_GRACE_MS` is 60 seconds.

Risk: after a lock TTL expires, the slot can remain unavailable until the next cleanup execution. This can create an availability outage substantially longer than the configured 120 second mutex TTL.

Action: replace expired-lock handling with a race-safe lease-reclamation strategy or shorten/align cleanup cadence. Do not simply delete-and-insert without preserving atomic ownership semantics.

### HIGH - Inventory lost-update race remains open
`inventario.web.js` still performs read -> calculate -> update of `stockExpected` for professional use and supplier receipt.

Risk: concurrent requests can overwrite stock changes.

Action: serialized per-SKU mutation using the existing mutex infrastructure, or a version/CAS field if Wix Data constraints allow it.

### HIGH - Audit log stores arbitrary event data
`events.js` persists the complete `data` object supplied to `_logAuditEvent()`.

Risk: internal structures, excess identifiers, and future webhook payload fields can become durable audit PII.

Action: strict audit DTO/allowlist with bounded scalar fields and capped booking IDs.

### HIGH - Saga trusts and mutates caller metadata
`bookingSaga.js` derives its trace id directly from `unsafePayload.traceId` and mutates `metaCita.resourceFilterId` when recovering a cached dual pair.

Risk: unbounded trace input and side effects on caller-owned payload make trust boundaries less explicit and complicate deterministic auditing/retries.

Action: normalize trace id at saga boundary and use a local immutable canonical metadata object instead of mutating the caller payload.

### MEDIUM - HTTP rate limiter trusts client forwarding headers
`http-functions.js` derives the rate-limit key from `x-forwarded-for` / `x-real-ip`.

Risk: if the hosting layer does not overwrite these headers, a caller can rotate them to bypass per-IP rate limiting.

Action: use a platform-trusted client identifier where available; otherwise treat forwarded headers only as diagnostic data, not as an authoritative security identity.

### MEDIUM - Tax HTTP parameters lack strict range validation
`get_getTaxSummary()` converts arbitrary `year` and `quarter` query values to numbers and falls back to current values, but does not enforce a reasonable year range or quarter 1..4.

Risk: malformed or adversarial inputs can cause unintended queries or inconsistent integration behavior.

Action: validate integer year within an explicit supported range and quarter in 1..4.

### MEDIUM - Availability resource input can silently downgrade to ANY
`reservas.web.js` `_normalizeResourceIds()` treats a non-GUID identifier as an ANY-resource request.

Risk: an invalid explicit staff/resource selection can become broader availability rather than a deterministic rejection.

Action: distinguish `ANY` from invalid explicit resource identifiers and reject invalid explicit identifiers.

### MEDIUM - Public error surfaces remain broadly message-driven
`responseUtils.errorResponse()` and several backend web modules preserve arbitrary error messages, truncated only by length.

Risk: truncation limits payload size but does not prevent internal implementation details from reaching callers.

Action: public error codes/messages should be mapped from a stable allowlist; detailed errors stay server-side with traceId.

### LOW - In-memory rate limiter is process-local
`security.js` keeps rate-limit state in a module-global Map.

Risk: in multi-instance/serverless execution, limits are approximate and can be bypassed across instances.

Action: retain as a local burst-control layer but add a distributed limiter if the deployment threat model requires hard global quotas.

### LOW - Compatibility alias remains in COLLECTIONS
`internalConfig.js` still exposes both `PRODUCTOS_VENTA` and `INVENTARIO_PRODUCTOS` for the same collection.

Risk: duplicate symbolic names can reintroduce semantic ambiguity even when they resolve to the same CMS collection.

Action: retain only if a verified caller still depends on the alias; otherwise remove after reference audit.

## Verified positives
- JWT/HMAC inputs are bounded and signature validation is strict.
- RBAC no longer caches request identity globally.
- Rate-limit dimensions and capacities are bounded.
- Booking Saga already has exact slot revalidation, lease heartbeat, compensation and transaction/idempotency machinery.
- `jobs.config` provides scheduled recovery/cleanup for locks, dual cache and compensations, but lock cleanup cadence does not match the mutex TTL closely enough for user-facing availability guarantees.
- The SSOT naming contract remains `serviceId`, `linkFases`, `resourceId`.

## CI / runtime validation
The current repository commit has no registered GitHub status checks. This report is static code verification; it is not a claim of successful Wix runtime execution.

## Recommended remediation order
1. External movement DTO.
2. Safe expired-lock reclamation.
3. Inventory serialized/CAS stock mutation.
4. Audit DTO minimization.
5. Saga trace/metadata trust boundary.
6. HTTP forwarded-header/rate-limit handling.
7. Tax parameter validation.
8. Availability invalid-resource semantics.
9. Stable public error mapping.
10. Remove compatibility aliases only after reference audit.

## Decision
Do not declare the system fully sanitized until the HIGH findings are closed and validated with syntax, lint, and Wix runtime checks.