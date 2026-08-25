/*=============================================================================
MODULE: backend/booking/bookingSaga.js
VERSION: v19.8.1-excellence-consolidated
RESPONSIBILITY: Transactional orchestration of simple and dual bookings.
            Implements the Saga pattern with automatic compensation,
            distributed mutex with heartbeat, idempotency by pairToken,
            artificial gap between F1 and F2, and CMS persistence.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
CHANGELOG:
v19.8.1-excellence-consolidated:
    FIX-SAGA-1: Added revalidateExactAvailabilitySlot call BEFORE lock
                acquisition to detect overlaps as clean rejections.
    FIX-SAGA-2: Added artificial gap of 400 to 1000 ms between F1 and F2
                creation to allow Wix Bookings propagation.
    FIX-SAGA-3: Added lock heartbeat of 15 seconds to prevent lock
                expiration during long dual operations.
    FIX-SAGA-4: Added compensation queue via queueBookingCompensation
                when ledger registration fails after booking creation.
    FIX-SAGA-5: Fixed all syntax defects: trailing spaces in strings,
                broken arrow functions and broken logical operators.
    FIX-SAGA-6: Added CMS persistence failure compensation: if _persistBooking
                fails after Wix Bookings creation, all created bookings are
                canceled via cancelBookingElevated.
    FIX-SAGA-7: Added proper lock release in finally block for all paths.
    FIX-SAGA-8: Added slot past rejection before any lock or booking creation.
v19.6.15-pending-compensations-recovery: Prior version.
=============================================================================
*/
import wixData from "wix-data";
import { createHash } from "crypto";
import {
    createBookingElevated,
    cancelBookingElevated,
    confirmOrDeclineBookingElevated,
    createCheckoutElevated,
    getCheckoutUrlSafe,
    _projectWriterSlotFromAvailability,
    _lockSlotKeyOrFail,
    _unlockSlotKey,
    _renewLock,
    _generateSlotKey,
    _buildLockKeys,
    _initTransaction,
    _completeTransaction,
    _failTransaction,
    _persistBooking,
    _sumAddons,
    createBookingError,
    normalizeError,
    logger,
} from "backend/booking/bookingCore";
import {
    COLLECTIONS,
    CONCURRENCY,
    SDK_CONFIG,
    APP_IDS,
} from "backend/internalConfig";
import {
    _safeTrim,
    _looksLikeGuid,
    getUtcDateFromMadridLocal,
    getMadridLocalStringNoZ,
    makeTraceId,
    withTimeout,
} from "public/mmUtils";
import {
    revalidateExactAvailabilitySlot,
    resolveStaffForSlot,
} from "backend/reservas.web";

const log = logger;
const MUTEXTTLMS = Number(CONCURRENCY?.MUTEXTTLMS) || 120000;
const HEARTBEATMS = Number(CONCURRENCY?.HEARTBEATMS) || 15000;
const APITIMEOUTMS = Number(SDKCONFIG?.TIMEOUTS?.APIMS) || 15000;
const GAPMINMS = 400;
const GAPMAXMS = 1000;

// -----------------------------------------------------------------------------
// Helper: deterministic pairToken builder
// -----------------------------------------------------------------------------
function _buildServerPairToken(email, serviceId, startLocal, isDual) {
    const raw = ${safeTrim(email)}|${safeTrim(serviceId)}|${_safeTrim(startLocal)}|${isDual ? "dual" : "simple"};
    return "PT_" + createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

// -----------------------------------------------------------------------------
// Helper: payload hash for idempotency verification
// -----------------------------------------------------------------------------
function _payloadHash(payload) {
    return createHash("sha256")
        .update(JSON.stringify(payload, Object.keys(payload || {}).sort(), 2))
        .digest("hex");
}

// -----------------------------------------------------------------------------
// Helper: slot past rejection
// FIX-SAGA-8: Reject past slots BEFORE any lock or booking creation.
// -----------------------------------------------------------------------------
function _rejectIfPastSlot(localStartDate, traceId) {
    const slotUtc = getUtcDateFromMadridLocal(localStartDate);
    if (!slotUtc) {
        throw createBookingError("INVALID_SLOT", "Invalid slot date format", { traceId });
    }
    if (slotUtc.getTime()  {
        heartbeatInterval = setInterval(() => {
            Promise.allSettled(
                slotKeys.map((key) => renewLock(key, lockOwnerId, MUTEXTTL_MS))
            ).then((results) => {
                const anyFailed = results.some((r) => r.status === "rejected" || !r.value?.ok);
                if (anyFailed) {
                    log.warn("Lock heartbeat renewal partially failed", { traceId, lockOwnerId });
                }
            });
        }, HEARTBEAT_MS);
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    };

    try {
        for (const slotKey of slotKeys) {
            const lockResult = await lockSlotKeyOrFail(slotKey, lockOwnerId, MUTEXTTL_MS);
            if (!lockResult?.ok) {
                await _releaseAcquiredLocks(acquired, lockOwnerId);
                stopHeartbeat();
                throw createBookingError("LOCK_BUSY", lockResult?.message || "Slot lock unavailable", {
                    traceId,
                    slotKey,
                    retryAfterMs: lockResult?.retryAfterMs || 0,
                });
            }
            acquired.push(slotKey);
        }
        startHeartbeat();
        return { acquired, stopHeartbeat };
    } catch (error) {
        stopHeartbeat();
        await _releaseAcquiredLocks(acquired, lockOwnerId);
        throw error;
    }
}

async function _releaseAcquiredLocks(acquired, lockOwnerId) {
    await Promise.allSettled(
        acquired.map((key) => _unlockSlotKey(key, lockOwnerId))
    );
}

// -----------------------------------------------------------------------------
// Helper: compensation queue
// FIX-SAGA-4: Queue compensation when ledger registration fails.
// -----------------------------------------------------------------------------
async function _queueBookingCompensation(payload, traceId) {
    try {
        const recordId = COMP${safeTrim(payload.pairToken || payload.transactionId || traceId)};
        await wixData.insert(COLLECTIONS.COMPENSATIONS, {
            _id: recordId,
            kind: "BOOKING_COMPENSATION",
            status: "PENDING",
            attempts: 0,
            bookingIds: _safeTrim(payload.bookingIds || ""),
            transactionId: _safeTrim(payload.transactionId || ""),
            orderId: _safeTrim(payload.orderId || ""),
            concept: _safeTrim(payload.concept || "Booking saga compensation"),
            resourceId: _safeTrim(payload.resourceId || ""),
            traceId: String(traceId),
            lastError: _safeTrim(payload.lastError || ""),
            createdAt: new Date(),
            updatedAt: new Date(),
        }, { suppressAuth: true });
    } catch (compError) {
        log.error("Failed to queue booking compensation", {
            traceId,
            error: compError?.message,
        });
    }
}

// -----------------------------------------------------------------------------
// Helper: cancel created bookings on compensation
// FIX-SAGA-6: Cancel all created bookings when CMS persistence fails.
// -----------------------------------------------------------------------------
async function _compensateCreatedBookings(createdBookings, traceId) {
    const cancelResults = [];
    for (const bookingId of createdBookings) {
        try {
            const cancelResult = await withTimeout(
                cancelBookingElevated(bookingId),
                APITIMEOUTMS,
                cancelBooking_${bookingId}
            );
            cancelResults.push({ bookingId, ok: true, cancelResult });
        } catch (cancelError) {
            log.error("Compensation cancel failed", {
                bookingId,
                traceId,
                error: cancelError?.message,
            });
            cancelResults.push({ bookingId, ok: false, error: cancelError?.message });
            await _queueBookingCompensation({
                bookingIds: bookingId,
                concept: "Cancel booking after saga failure",
                lastError: cancelError?.message,
            }, traceId);
        }
    }
    return cancelResults;
}

// -----------------------------------------------------------------------------
// Helper: create and confirm a single booking in Wix Bookings
// -----------------------------------------------------------------------------
async function _createAndConfirmBooking(slot, resourceId, serviceId, paymentStatus, traceId) {
    const projectedSlot = _projectWriterSlotFromAvailability(slot, resourceId, serviceId);
    if (!projectedSlot) {
        throw createBookingError("INVALID_SLOT", "Slot projection failed for Writer V2", { traceId });
    }

    const createResult = await withTimeout(
        createBookingElevated(projectedSlot),
        APITIMEOUTMS,
        "createBooking"
    );

    const bookingId = createResult?.booking?._id || createResult?.bookingId;
    if (!bookingId) {
        throw createBookingError("BOOKINGCREATIONFAILED", "No bookingId returned from Wix", { traceId });
    }

    const confirmResult = await withTimeout(
        confirmOrDeclineBookingElevated(bookingId, { paymentStatus }),
        APITIMEOUTMS,
        confirmBooking_${bookingId}
    );

    return {
        bookingId,
        revision: createResult?.booking?.revision || 1,
        confirmResult,
    };
}

// -----------------------------------------------------------------------------
// Helper: create checkout for online payment
// -----------------------------------------------------------------------------
async function _createOnlineCheckout(bookingId, amount, traceId) {
    try {
        const checkoutSession = await withTimeout(
            createCheckoutElevated({
                lineItems: [{
                    catalogReference: {
                        appId: APP_IDS.BOOKINGS,
                        catalogItemId: bookingId,
                    },
                    quantity: 1,
                }],
                channelType: "WEB",
            }),
            APITIMEOUTMS,
            "createCheckout"
        );
        const checkoutUrl = await getCheckoutUrlSafe(checkoutSession);
        return { checkoutUrl, checkoutSession };
    } catch (checkoutError) {
        log.error("Checkout creation failed", { traceId, bookingId, error: checkoutError?.message });
        throw createBookingError("CHECKOUT_FAILED", "Failed to create checkout", {
            traceId,
            bookingId,
        });
    }
}

// -----------------------------------------------------------------------------
// Helper: resolve staff for saga (auto-assignment when no filter provided)
// -----------------------------------------------------------------------------
async function _resolveStaffForSaga(serviceId, linkFases, slotF1, slotF2, resourceFilterId, traceId) {
    try {
        const resolution = await resolveStaffForSlot({
            serviceId,
            linkFases,
            slotF1,
            slotF2,
            resourceFilterId,
            traceId,
        });

        if (resolution?.status === "SUCCESS" && resolution?.data?.resourceId) {
            return {
                resourceId: resolution.data.resourceId,
                slotF1: resolution.data.slotF1,
                slotF2: resolution.data.slotF2,
                autoAssigned: !resourceFilterId,
            };
        }

        return {
            resourceId: null,
            message: resolution?.error?.message || "Staff resolution failed",
        };
    } catch (staffError) {
        log.error("Staff resolution threw", { traceId, error: staffError?.message });
        return { resourceId: null, message: staffError?.message };
    }
}

// =============================================================================
// MAIN SAGA: executeBookingSaga
// =============================================================================
export async function executeBookingSaga(payload, traceId) {
    const activeTraceId = _safeTrim(traceId) || makeTraceId("saga");
    const email = _safeTrim(payload?.cliente?.email || payload?.contactDetails?.email || "");
    const serviceId = _safeTrim(payload?.metaCita?.serviceId || payload?.slotF1?.serviceId || "");
    const linkFases = _safeTrim(payload?.metaCita?.linkFases || "");
    const isDual = Boolean(linkFases && payload?.slotF2);
    const metodoPago = _safeTrim(payload?.metaCita?.metodoPago || "PRESENCIAL").toUpperCase();
    const isOnline = metodoPago === "ONLINE";

    const slotF1 = payload?.slotF1 || null;
    const slotF2 = isDual ? payload?.slotF2 : null;

    const lockOwnerId = String(activeTraceId);
    let acquiredLocks = [];
    let stopHeartbeat = null;
    const createdBookings = [];

    try {
        // STEP 0: Validate serviceId
        if (!_looksLikeGuid(serviceId)) {
            return {
                status: "ERROR",
                data: null,
                error: { code: "SERVICEIDINVALID", message: "serviceId is not a valid GUID" },
            };
        }

        // STEP 1: FIX-SAGA-8 - Reject past slots before any side effect
        _rejectIfPastSlot(slotF1?.localStartDate, activeTraceId);
        if (isDual && slotF2) {
            _rejectIfPastSlot(slotF2?.localStartDate, activeTraceId);
        }

        // STEP 2: Build deterministic pairToken and check idempotency
        const pairToken = _buildServerPairToken(email, serviceId, slotF1?.localStartDate, isDual);
        const payloadHash = _payloadHash({ serviceId, email, slotF1Start: slotF1?.localStartDate, isDual });
        const txInit = await _initTransaction(pairToken, payloadHash, activeTraceId);

        if (!txInit.success) {
            return {
                status: "ERROR",
                data: null,
                error: { code: txInit.error || "TXINITFAILED", message: "Transaction initialization failed" },
            };
        }
        if (!txInit.isNew) {
            return {
                status: "SUCCESS",
                data: { idempotent: true, pairToken, existing: txInit.existing },
                error: null,
            };
        }

        // STEP 3: Resolve staff - auto-assignment when no filter provided
        const resourceFilterId = _safeTrim(payload?.metaCita?.resourceFilterId || "") || null;
        const staffResolution = await _resolveStaffForSaga(
            serviceId,
            isDual ? linkFases : null,
            slotF1,
            slotF2,
            resourceFilterId,
            activeTraceId
        );

        if (!staffResolution?.resourceId) {
            await failTransaction(pairToken, "NORESOURCE_AVAILABLE");
            return {
                status: "ERROR",
                data: null,
                error: { code: "NORESOURCEAVAILABLE", message: staffResolution?.message || "No professional available" },
            };
        }

        const resourceId = staffResolution.resourceId;
        const slotF1Resolved = staffResolution.slotF1;
        const slotF2Resolved = isDual ? staffResolution.slotF2 : null;

        // STEP 4: FIX-SAGA-1 - Revalidate slots BEFORE acquiring locks
        const revalidateF1 = await revalidateExactAvailabilitySlot(
            serviceId,
            resourceId,
            slotF1Resolved?.localStartDate,
            slotF1Resolved?.localEndDate,
            activeTraceId
        );
        if (!revalidateF1?.available) {
            await failTransaction(pairToken, "SLOTUNAVAILABLE_F1");
            return {
                status: "ERROR",
                data: null,
                error: { code: "SLOT_UNAVAILABLE", message: "Slot F1 is no longer available" },
            };
        }

        if (isDual && slotF2Resolved) {
            const revalidateF2 = await revalidateExactAvailabilitySlot(
                linkFases,
                resourceId,
                slotF2Resolved?.localStartDate,
                slotF2Resolved?.localEndDate,
                activeTraceId
            );
            if (!revalidateF2?.available) {
                await failTransaction(pairToken, "SLOTUNAVAILABLE_F2");
                return {
                    status: "ERROR",
                    data: null,
                    error: { code: "SLOT_UNAVAILABLE", message: "Slot F2 is no longer available" },
                };
            }
        }

        // STEP 5: Acquire distributed locks with heartbeat
        const phases = [
            { rawSlot: slotF1Resolved, localStart: slotF1Resolved?.localStartDate, localEnd: slotF1Resolved?.localEndDate },
        ];
        if (isDual && slotF2Resolved) {
            phases.push({ rawSlot: slotF2Resolved, localStart: slotF2Resolved?.localStartDate, localEnd: slotF2Resolved?.localEndDate });
        }
        const slotKeys = _buildLockKeys(phases, resourceId);
        const lockResult = await _acquireLocksWithHeartbeat(slotKeys, lockOwnerId, activeTraceId);
        acquiredLocks = lockResult.acquired;
        stopHeartbeat = lockResult.stopHeartbeat;

        // STEP 6: Create F1 booking in Wix Bookings
        const paymentStatus = isOnline ? "PENDINGPAYMENT" : "NOTPAID";
        const f1Result = await _createAndConfirmBooking(
            slotF1Resolved, resourceId, serviceId, paymentStatus, activeTraceId
        );
        createdBookings.push(f1Result.bookingId);

        if (isDual) {
            // STEP 7: FIX-SAGA-2 - Artificial gap between F1 and F2
            const gapMs = GAPMINMS + Math.floor(Math.random() * (GAPMAXMS - GAPMINMS));
            await new Promise((resolve) => setTimeout(resolve, gapMs));

            // Create F2 booking
            const f2Result = await _createAndConfirmBooking(
                slotF2Resolved, resourceId, linkFases, paymentStatus, activeTraceId
            );
            createdBookings.push(f2Result.bookingId);

            // STEP 8: Persist both phases in CitasF2
            // FIX-SAGA-6: If CMS persistence fails, cancel both bookings.
            try {
                await _persistBooking({
                    bookingId: f1Result.bookingId,
                    revision: f1Result.revision,
                    serviceId,
                    scheduleId: slotF1Resolved?.scheduleId || null,
                    resourceId,
                    startDate: slotF1Resolved?.startDate,
                    endDate: slotF1Resolved?.endDate,
                    contactDetails: payload?.cliente || payload?.contactDetails || {},
                    tipo: "dual_fase1",
                    meta: {
                        pairToken,
                        statusPago: isOnline ? "PENDING_PAYMENT" : "UNPAID",
                        esCombinado: true,
                    },
                }, activeTraceId);

                await _persistBooking({
                    bookingId: f2Result.bookingId,
                    revision: f2Result.revision,
                    serviceId: linkFases,
                    scheduleId: slotF2Resolved?.scheduleId || null,
                    resourceId,
                    startDate: slotF2Resolved?.startDate,
                    endDate: slotF2Resolved?.endDate,
                    contactDetails: payload?.cliente || payload?.contactDetails || {},
                    tipo: "dual_fase2",
                    meta: {
                        pairToken,
                        statusPago: isOnline ? "PENDING_PAYMENT" : "UNPAID",
                        esCombinado: true,
                    },
                }, activeTraceId);
            } catch (persistError) {
                await failTransaction(pairToken, "CMSPERSISTENCE_FAILED");
                await _compensateCreatedBookings(createdBookings, activeTraceId);
                return {
                    status: "ERROR",
                    data: null,
                    error: {
                        code: "CMSPERSISTENCEFAILED",
                        message: "Failed to persist bookings in CitasF2; created bookings were compensated",
                    },
                };
            }

            // STEP 9: Create checkout if online payment
            let checkoutUrl = null;
            if (isOnline) {
                const totalAmount = _sumAddons(payload?.metaCita?.addons || []) +
                    Number(payload?.metaCita?.precioBase || 0);
                const checkout = await _createOnlineCheckout(f1Result.bookingId, totalAmount, activeTraceId);
                checkoutUrl = checkout.checkoutUrl;
            }

            await _completeTransaction(pairToken, {
                bookingIdF1: f1Result.bookingId,
                bookingIdF2: f2Result.bookingId,
                resourceId,
                isDual: true,
            });

            return {
                status: "SUCCESS",
                data: {
                    bookingIdF1: f1Result.bookingId,
                    bookingIdF2: f2Result.bookingId,
                    pairToken,
                    resourceId,
                    isDual: true,
                    requiresPayment: isOnline,
                    checkoutUrl,
                },
                error: null,
            };

        } else {
            // SIMPLE BOOKING: persist F1 in CitasF2
            try {
                await _persistBooking({
                    bookingId: f1Result.bookingId,
                    revision: f1Result.revision,
                    serviceId,
                    scheduleId: slotF1Resolved?.scheduleId || null,
                    resourceId,
                    startDate: slotF1Resolved?.startDate,
                    endDate: slotF1Resolved?.endDate,
                    contactDetails: payload?.cliente || payload?.contactDetails || {},
                    tipo: "simple",
                    meta: {
                        pairToken,
                        statusPago: isOnline ? "PENDING_PAYMENT" : "UNPAID",
                    },
                }, activeTraceId);
            } catch (persistError) {
                await failTransaction(pairToken, "CMSPERSISTENCE_FAILED");
                await _compensateCreatedBookings(createdBookings, activeTraceId);
                return {
                    status: "ERROR",
                    data: null,
                    error: {
                        code: "CMSPERSISTENCEFAILED",
                        message: "Failed to persist booking in CitasF2; created booking was compensated",
                    },
                };
            }

            let checkoutUrl = null;
            if (isOnline) {
                const totalAmount = _sumAddons(payload?.metaCita?.addons || []) +
                    Number(payload?.metaCita?.precioBase || 0);
                const checkout = await _createOnlineCheckout(f1Result.bookingId, totalAmount, activeTraceId);
                checkoutUrl = checkout.checkoutUrl;
            }

            await _completeTransaction(pairToken, {
                bookingId: f1Result.bookingId,
                resourceId,
                isDual: false,
            });

            return {
                status: "SUCCESS",
                data: {
                    bookingId: f1Result.bookingId,
                    pairToken,
                    resourceId,
                    isDual: false,
                    requiresPayment: isOnline,
                    checkoutUrl,
                },
                error: null,
            };
        }

    } catch (error) {
        // GLOBAL COMPENSATION: cancel all created bookings and fail transaction
        if (createdBookings.length > 0) {
            await _compensateCreatedBookings(createdBookings, activeTraceId);
        }

        const pairToken = _buildServerPairToken(
            email, serviceId, slotF1?.localStartDate, isDual
        );
        await failTransaction(pairToken, error?.message || "SAGAUNEXPECTED_ERROR");

        const normalized = normalizeError(error);
        log.error("Booking saga failed with compensation", {
            traceId: activeTraceId,
            code: normalized.code,
            message: normalized.message,
            createdBookings,
        });

        return {
            status: "ERROR",
            data: null,
            error: {
                code: normalized.code || "SAGAUNEXPECTEDERROR",
                message: normalized.message || "Unexpected saga error",
                compensated: createdBookings.length > 0,
            },
        };

    } finally {
        // FIX-SAGA-7: Release all locks in finally block for all paths
        if (stopHeartbeat) stopHeartbeat();
        await _releaseAcquiredLocks(acquiredLocks, lockOwnerId);
    }
}
