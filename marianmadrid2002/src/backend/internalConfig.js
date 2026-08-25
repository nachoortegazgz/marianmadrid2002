/*
=============================================================================
MODULE: backend/internalConfig.js
VERSION: v19.8.0-excellence-consolidated
RESPONSIBILITY: Centralized Backend Configuration, Collections Enum,
            SDK Timeouts, Concurrency Guards, and Domain Enums.
STANDARDS: G10 ASCII Strict (0 non-ASCII characters).
=============================================================================
*/
export const COLLECTIONS = Object.freeze({
    SERVICIOS_CITA: "Import2",
    ADDONS_CATALOGO: "AddonsCatalogo",
    SERVICIOSOPCIONESADDON: "AddonsCatalogo",
    MAPA_STAFF: "MapaStaff",
    DUAL_CACHE: "DualSlotCache",
    DAYS_CACHE: "AvailabilityDaysCache",
    SLOTS_CACHE: "AvailabilitySlotsCache",
    CITAS: "CitasF2",
    TRANSACTIONS: "BookingTransactions",
    LOCKS: "MM_LOCKS",
    COMPENSATIONS: "PendingCompensations",
    MOVIMIENTOS_CAJA: "movimientoCaja",
    CAJA_ACTUAL: "cajaActual",
    HISTORICOCIERRESZ: "HISTORICOCIERRESZ",
    CONTEOSX: "RESUMENCONTEO_X",
    CONTADORES_FISCALES: "SecuenciaTickets",
    REGISTROHORARIO: "REGISTROHORARIO",
    PRODUCTOS_VENTA: "InventarioProductos",
    INVENTARIO_PRODUCTOS: "InventarioProductos",
    MOVIMIENTO_INVENTARIO: "movimientoInventario",
    CONCILIACIONSTOCKWIX: "ConciliacionStockWix",
    PROVEEDORES_INVENTARIO: "ProveedoresInventario",
    AUDITLOG: "MMAUDIT_LOG",
    SYNC_LOG: "m365SyncLog",
    PLANCUENTASCONTABLES: "PLANCUENTASCONTABLES",
    ASIENTOSCONTABLES: "ASIENTOSCONTABLES",
    LINEASASIENTOCONTABLE: "LINEASASIENTOCONTABLE",
    LIBROIVAFACTURASEXPEDIDAS: "LIBROIVAFACTURASEXPEDIDAS",
    LIBROIVAFACTURASRECIBIDAS: "LIBROIVAFACTURASRECIBIDAS",
    MAYORCONTABLESALDOS: "MAYORCONTABLESALDOS",
    LIBROINVENTARIOCIERRE: "LIBROINVENTARIOCIERRE",
    EVENTOSSISTEMAFACTURACION: "EVENTOSSISTEMAFACTURACION",
    LIBROIVABIENESINVERSION: "LIBROIVABIENESINVERSION",
    LIBROIVAINTRACOMUNITARIO: "LIBROIVAINTRACOMUNITARIO",
});

export const APP_IDS = Object.freeze({
    BOOKINGS: "13d21c63-b5ec-5912-8397-c3a5ddb27a97",
    STORES: "1380b703-ce81-ff05-f115-39571d94eab3",
    EVENTS: "140603ad-af8d-84fb-9004-ee174e35054d",
});

export const SDK_CONFIG = Object.freeze({
    TZ: "Europe/Madrid",
    LOCATION_ID: "7a12abfd-bf30-4847-bcdf-00dc573d4802",
    LOCATION_TYPES: Object.freeze({
        TIME_SLOTS: "BUSINESS",
        BOOKINGSWRITER: "OWNERBUSINESS",
    }),
    TIMEOUTS: Object.freeze({
        API_MS: 15000,
        CMS_MS: 15000,
        WATCHDOG_MS: 30000,
        WEBHOOK_MS: 30000,
    }),
    CACHE: Object.freeze({
        SERVICESTTLMS: 600000,
        SLOTSCACHETTL_MS: 120000,
        DUALCACHETTL_MS: 900000,
        STAFFTTLMS: 300000,
        MAX_ENTRIES: 100,
        DAYSCACHEVERSION: 1,
    }),
    SECURITY: Object.freeze({
        SECRETCACHETTL_MS: 300000,
        RATELIMITCACHECLEANUPTTL_MS: 60000,
        RATELIMITCACHEMAXENTRIES: 5000,
    }),
    RATE_LIMIT: Object.freeze({
        MAX_REQUESTS: 20,
        WINDOW_MS: 5000,
        BOOKINGMAXREQUESTS: 5,
        BOOKINGWINDOWMS: 10000,
    }),
    JOBS: Object.freeze({
        TIMEOUT_MS: 30000,
        AUDITRETENTIONDAYS: 90,
        DELETEBATCHSIZE: 100,
        DELETEMAXPAGES: 10,
        DUALCACHECLEANUP_LIMIT: 100,
        FISCALRECOVERYBATCH_SIZE: 25,
        HEALTHCHECKQUERY_LIMIT: 100,
        FISCALDAILYMAX_PAGES: 10,
    }),
    EVENTS: Object.freeze({
        RETRY_ATTEMPTS: 3,
        RETRYBASEBACKOFF_MS: 1000,
    }),
    EXTERNAL_HTTP: Object.freeze({
        RATELIMITMAX_REQUESTS: 20,
        RATELIMITWINDOW_MS: 5000,
        HMACMAXCLOCKSKEWSECONDS: 60,
        CORSALLOWEDORIGINS: ["https://www.marianmadrid.es", "https://marianmadrid.es"],
    }),
    FISCAL: Object.freeze({
        NIF_EMISOR: null,
    }),
});

export const CONCURRENCY = Object.freeze({
    MUTEXTTLMS: 120000,
    HEARTBEAT_MS: 15000,
    TRANSACTIONPOLLBASE_MS: 250,
    TRANSACTIONMAXWAIT_MS: 3000,
    LOCKCLEANUPGRACE_MS: 60000,
    MAXCOMPENSATIONRETRIES: 3,
    LEDGERMUTEXTTL_MS: 45000,
});

export const SLOT_SEARCH = Object.freeze({
    DIAS_LIMITE: 14,
    TOLERANCE_MINUTES: 10,
});

export const API = Object.freeze({
    STAFFRESOURCETYPE_ID: "9b626e2e-f4ec-4ae7-a25e-149b5c3be095",
});

export const TIPO_FICHAJE = Object.freeze({
    ENTRADA: "ENTRADA",
    SALIDA: "SALIDA",
    PAUSAINICIO: "PAUSAINICIO",
    PAUSAFIN: "PAUSAFIN",
    AJUSTE: "AJUSTE",
});

export const TIPO_MOVIMIENTO = Object.freeze({
    VENTAEFECTIVO: "VENTAEFECTIVO",
    VENTATARJETA: "VENTATARJETA",
    VENTABIZUM: "VENTABIZUM",
    VENTAONLINE: "VENTAONLINE",
    REEMBOLSO: "REEMBOLSO",
    AJUSTE: "AJUSTE",
});

export const FORMA_PAGO = Object.freeze({
    EFECTIVO: "EFECTIVO",
    TARJETA: "TARJETA",
    BIZUM: "BIZUM",
    ONLINE: "ONLINE",
});

export const IVA_RATES = Object.freeze({
    GENERAL: 0.21,
});

export const CAJA_STATUS = Object.freeze({
    OPEN: "ABIERTA",
    CLOSED: "CERRADA",
});

export const SINGLETONS = Object.freeze({
    CAJA: "CAJA_PRINCIPAL",
});

export const CITA_FIELDS = Object.freeze({
    STATUS: "status",
    STATUS_PAGO: "statusPago",
});

export const ESTADO_CITA = Object.freeze({
    CONFIRMED: "CONFIRMED",
    PENDINGPAYMENT: "PENDINGPAYMENT",
    CANCELED: "CANCELED",
    REFUNDED: "REFUNDED",
});

export const ESTADO_PAGO = Object.freeze({
    UNPAID: "UNPAID",
    PENDINGPAYMENT: "PENDINGPAYMENT",
    PENDINGLEDGER: "PENDINGLEDGER",
    PAID: "PAID",
    REFUNDED: "REFUNDED",
    PARTIALLYREFUNDED: "PARTIALLYREFUNDED",
});

export const COLLAB_ROLES = Object.freeze({
    ADMIN: "ADMIN",
    GESTION: "GESTION",
    ESTILISTA: "ESTILISTA",
    MARIANMANAGER: "MARIANMANAGER",
});

export const JWT = Object.freeze({
    ALGORITHM: "HS256",
    EXPIRATION_MS: 1800000,
});
