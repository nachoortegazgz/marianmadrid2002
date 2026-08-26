# Esquema canónico de colecciones CMS

**Versión de contrato:** `2026-08-25-production-books-v1`

Este documento se genera a partir de `tests/cms-schema-canonical.json`, que es el contrato machine-readable del runtime. Incluye los campos de negocio; Wix administra automáticamente `_id`, `_createdDate`, `_updatedDate` y `_owner`.

> **Regla de seguridad:** el ID técnico de una colección o campo no se renombra directamente. Cualquier cambio exige migración compatible, revisión de índices y copia de seguridad. Los nombres visibles indicados son etiquetas objetivo/operativas; se deben contrastar con el CMS real antes de modificarlos.

## Convenciones

| Concepto | Regla |
|---|---|
| Zona horaria | `Europe/Madrid`; claves `diaKey=YYYY-MM-DD`, `mesKey=YYYY-MM`. |
| Importe | `NUMBER`, redondeado a dos decimales por backend. |
| Fechas | `DATETIME` UTC; valores `*Local` en `TEXT` para trazabilidad de interfaz. |
| Identificadores | `TEXT`; no convertir IDs Wix, tokens ni trazas a número. |
| Índices | `_id` es inherente en Wix y no se repite. Índices únicos solo tras comprobar duplicados. |

## Inventario de colecciones

| # | ID técnico | Nombre visible / lógico | Finalidad | Campos | Índices |
|---:|---|---|---|---:|---:|
| 1 | `Import2` | SERVICIOS_CITA | Catalogo de servicios y configuracion dual de reservas. | 18 | 3 |
| 2 | `AddonsCatalogo` | EXTRAS_CATALOGO | Catalogo y opciones de complementos de Wix Bookings. | 11 | 2 |
| 3 | `DualSlotCache` | DUAL_SLOT_CACHE | Cache efimera de parejas F1/F2 generadas para reservas duales. | 12 | 3 |
| 4 | `AvailabilityDaysCache` | AVAILABILITY_DAYS_CACHE | Cache de compatibilidad para dias disponibles; el runtime actual solo invalida y supervisa esta coleccion. | 6 | 2 |
| 5 | `AvailabilitySlotsCache` | AVAILABILITY_SLOTS_CACHE | Cache de compatibilidad para slots; el runtime actual solo realiza limpieza y comprobacion de salud. | 7 | 2 |
| 6 | `CitasF2` | CITAS_F2 | Proyeccion durable de cada booking Wix y de sus estados de pago. | 20 | 4 |
| 7 | `BookingTransactions` | BOOKING_TRANSACTIONS | Idempotencia y resultado durable de la Saga de reservas. | 8 | 2 |
| 8 | `MM_LOCKS` | MM_LOCKS | Mutexes efimeros de slots y del ledger. | 5 | 2 |
| 9 | `PendingCompensations` | PENDING_COMPENSATIONS | Recuperacion durable de asientos fiscales no registrados. | 21 | 3 |
| 10 | `movimientoCaja` | LIBRO_DE_ASIENTOS | Ledger fiscal inmutable y fuente de verdad de caja. | 25 | 6 |
| 11 | `cajaActual` | CAJA_ACTUAL | Proyeccion singleton derivada del ledger; no es una fuente contable. | 12 | 1 |
| 12 | `HISTORICO_CIERRES_Z` | HISTORICO_CIERRES_Z | Cierre diario idempotente derivado del ledger. | 31 | 4 |
| 13 | `RESUMEN_CONTEO_X` | RESUMEN_CONTEO_X | Arqueos de efectivo append-only. | 8 | 1 |
| 14 | `SecuenciaTickets` | SECUENCIA_TICKETS | Contador singleton de tickets y secuencia global. | 1 | 0 |
| 15 | `REGISTRO_HORARIO` | REGISTRO_HORARIO | Registro laboral append-only de fichajes. | 12 | 3 |
| 16 | `InventarioProductos` | PRODUCTOS_VENTA | Stock interno esperado para conciliacion con Wix Stores/POS. | 23 | 3 |
| 17 | `movimientoInventario` | MOVIMIENTO_INVENTARIO | Ledger interno de movimientos y espejo de pedidos online. | 27 | 4 |
| 18 | `ConciliacionStockWix` | CONCILIACION_STOCK_WIX | Cola durable de ajustes que deben conciliarse con Wix Stores/POS. | 17 | 3 |
| 19 | `MM_AUDIT_LOG` | MM_AUDIT_LOG | Auditoria tecnica append-only y limpieza con retencion definida por codigo. | 8 | 3 |
| 20 | `m365SyncLog` | M365_SYNC_LOG | Trazabilidad append-only de sincronizaciones externas. | 8 | 3 |
| 21 | `CONFIGURACION_FISCAL` | CONFIGURACION_FISCAL | Constantes no secretas del emisor, periodos y versiones de integración fiscal. | 15 | 1 |
| 22 | `PLAN_CUENTAS_CONTABLES` | PLAN_CUENTAS_CONTABLES | Mapa de cuentas y dimensiones analíticas validado por gestoría; no codifica decisiones contables en el frontend. | 21 | 3 |
| 23 | `ASIENTOS_CONTABLES` | ASIENTOS_CONTABLES | Cabecera inmutable de un hecho económico equilibrado por líneas Debe/Haber. | 42 | 8 |
| 24 | `LINEAS_ASIENTO_CONTABLE` | LINEAS_ASIENTO_CONTABLE | Detalle inmutable de la partida doble y del desglose fiscal y analítico de cada asiento. | 25 | 5 |
| 25 | `LIBRO_IVA_FACTURAS_EXPEDIDAS` | LIBRO_IVA_FACTURAS_EXPEDIDAS | Proyección fiscal de facturas emitidas y rectificativas, basada en el diario y en el documento nativo de origen. | 38 | 6 |
| 26 | `LIBRO_IVA_FACTURAS_RECIBIDAS` | LIBRO_IVA_FACTURAS_RECIBIDAS | Registro documental de facturas de proveedores y gastos, con soporte de IVA deducible y pago. | 43 | 6 |
| 27 | `MAYOR_CONTABLE_SALDOS` | MAYOR_CONTABLE_SALDOS | Proyección reconstruible por cuenta y periodo; nunca se usa como fuente de verdad. | 13 | 2 |
| 28 | `LIBRO_INVENTARIO_CIERRE` | LIBRO_INVENTARIO_CIERRE | Snapshot inmutable de inventario y saldos para cierre de ejercicio o periodo autorizado. | 16 | 3 |
| 29 | `EVENTOS_SISTEMA_FACTURACION` | EVENTOS_SISTEMA_FACTURACION | Evidencia técnica append-only de configuración, integridad, errores y operaciones relevantes del sistema de facturación. | 18 | 5 |
| 30 | `LIBRO_IVA_BIENES_INVERSION` | LIBRO_IVA_BIENES_INVERSION | Libro condicional de bienes de inversión, que se habilita solo tras confirmar aplicabilidad con gestoría. | 22 | 3 |
| 31 | `LIBRO_IVA_INTRACOMUNITARIO` | LIBRO_IVA_INTRACOMUNITARIO | Libro condicional para operaciones intracomunitarias; no se activa por defecto. | 13 | 4 |

## 1. SERVICIOS_CITA

- **ID técnico Wix CMS:** `Import2`
- **Nombre visible / lógico:** `SERVICIOS_CITA`
- **Finalidad:** Catalogo de servicios y configuracion dual de reservas.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `serviceId` | `TEXT` | Sí |
| `slugUrl` | `TEXT` | No |
| `linkFases` | `TEXT` | No |
| `permitirCombinar` | `BOOLEAN` | Sí |
| `oculto` | `BOOLEAN` | Sí |
| `tituloServicio` | `TEXT` | No |
| `resumenCorto` | `TEXT` | No |
| `descripcionLarga` | `TEXT` | No |
| `precio` | `NUMBER` | Sí |
| `moneda` | `TEXT` | No |
| `tiempoFase1` | `NUMBER` | Sí |
| `tiempoExposicion` | `NUMBER` | Sí |
| `tiempoFase2` | `NUMBER` | Sí |
| `duracionTotal` | `NUMBER` | No |
| `pagoOnline` | `BOOLEAN` | Sí |
| `pagoPresencial` | `BOOLEAN` | Sí |
| `addonsOptions` | `MULTI_REFERENCE` | No |
| `staffDisponible` | `OBJECT` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `serviceId` — **único** | Único |
| `slugUrl` — **único** | Único |
| `linkFases` | No único |

## 2. EXTRAS_CATALOGO

- **ID técnico Wix CMS:** `AddonsCatalogo`
- **Nombre visible / lógico:** `EXTRAS_CATALOGO`
- **Finalidad:** Catalogo y opciones de complementos de Wix Bookings.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `tituloAddon` | `TEXT` | No |
| `resumenCortoAddon` | `TEXT` | No |
| `precioAddon` | `NUMBER` | No |
| `tiempoAddon` | `NUMBER` | No |
| `bookingsAddonId` | `TEXT` | No |
| `bookingsAddonGroupId` | `TEXT` | No |
| `categoriaAddon` | `TEXT` | No |
| `grupoInterno` | `TEXT` | No |
| `disponibleOnline` | `BOOLEAN` | No |
| `activo` | `BOOLEAN` | No |
| `cantidadMaximaAddon` | `NUMBER` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `bookingsAddonId` — **único** | Único |
| `activo` | No único |

## 3. DUAL_SLOT_CACHE

- **ID técnico Wix CMS:** `DualSlotCache`
- **Nombre visible / lógico:** `DUAL_SLOT_CACHE`
- **Finalidad:** Cache efimera de parejas F1/F2 generadas para reservas duales.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `pairToken` | `TEXT` | Sí |
| `slotF1` | `OBJECT` | Sí |
| `slotF2` | `OBJECT` | Sí |
| `resourceId` | `TEXT` | Sí |
| `candidateResourceIds` | `ARRAY_STRING` | No |
| `phaseOneServiceId` | `TEXT` | Sí |
| `phaseTwoServiceId` | `TEXT` | Sí |
| `dateYMD` | `TEXT` | Sí |
| `expiresAt` | `DATETIME` | Sí |
| `createdAt` | `DATETIME` | Sí |
| `status` | `TEXT` | Sí |
| `serviceId` | `TEXT` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `phaseOneServiceId + dateYMD` | No único |
| `expiresAt` | No único |
| `pairToken` — **único** | Único |

## 4. AVAILABILITY_DAYS_CACHE

- **ID técnico Wix CMS:** `AvailabilityDaysCache`
- **Nombre visible / lógico:** `AVAILABILITY_DAYS_CACHE`
- **Finalidad:** Cache de compatibilidad para dias disponibles; el runtime actual solo invalida y supervisa esta coleccion.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `serviceId` | `TEXT` | No |
| `resourceKeyHash` | `TEXT` | No |
| `yearMonth` | `TEXT` | No |
| `days` | `OBJECT` | No |
| `expiresAt` | `DATETIME` | No |
| `createdAt` | `DATETIME` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `expiresAt` | No único |
| `serviceId + yearMonth` | No único |

## 5. AVAILABILITY_SLOTS_CACHE

- **ID técnico Wix CMS:** `AvailabilitySlotsCache`
- **Nombre visible / lógico:** `AVAILABILITY_SLOTS_CACHE`
- **Finalidad:** Cache de compatibilidad para slots; el runtime actual solo realiza limpieza y comprobacion de salud.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `phaseOneServiceId` | `TEXT` | No |
| `resourceKeyHash` | `TEXT` | No |
| `fromLocal` | `TEXT` | No |
| `toLocal` | `TEXT` | No |
| `slots` | `OBJECT` | No |
| `expiresAt` | `DATETIME` | No |
| `createdAt` | `DATETIME` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `expiresAt` | No único |
| `phaseOneServiceId + resourceKeyHash + fromLocal + toLocal` | No único |

## 6. CITAS_F2

- **ID técnico Wix CMS:** `CitasF2`
- **Nombre visible / lógico:** `CITAS_F2`
- **Finalidad:** Proyeccion durable de cada booking Wix y de sus estados de pago.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `bookingId` | `TEXT` | Sí |
| `pairToken` | `TEXT` | Sí |
| `uiPairToken` | `TEXT` | Sí |
| `revision` | `NUMBER` | Sí |
| `serviceId` | `TEXT` | Sí |
| `scheduleId` | `TEXT` | No |
| `resourceId` | `TEXT` | Sí |
| `startDate` | `DATETIME` | Sí |
| `endDate` | `DATETIME` | Sí |
| `startDateLocal` | `TEXT` | Sí |
| `endDateLocal` | `TEXT` | Sí |
| `fechaYmdMadrid` | `TEXT` | Sí |
| `tipo` | `TEXT` | Sí |
| `status` | `TEXT` | Sí |
| `statusPago` | `TEXT` | Sí |
| `meta` | `OBJECT` | Sí |
| `contactDetails` | `OBJECT` | Sí |
| `traceId` | `TEXT` | Sí |
| `fechaCreacion` | `DATETIME` | Sí |
| `fechaActualizacion` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `bookingId` — **único** | Único |
| `fechaYmdMadrid + status + resourceId` | No único |
| `pairToken` | No único |
| `resourceId + startDate` | No único |

## 7. BOOKING_TRANSACTIONS

- **ID técnico Wix CMS:** `BookingTransactions`
- **Nombre visible / lógico:** `BOOKING_TRANSACTIONS`
- **Finalidad:** Idempotencia y resultado durable de la Saga de reservas.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `pairToken` | `TEXT` | Sí |
| `status` | `TEXT` | Sí |
| `payloadHash` | `TEXT` | No |
| `result` | `OBJECT` | No |
| `error` | `TEXT` | No |
| `traceId` | `TEXT` | No |
| `createdAt` | `DATETIME` | Sí |
| `updatedAt` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `pairToken` — **único** | Único |
| `status + updatedAt` | No único |

## 8. MM_LOCKS

- **ID técnico Wix CMS:** `MM_LOCKS`
- **Nombre visible / lógico:** `MM_LOCKS`
- **Finalidad:** Mutexes efimeros de slots y del ledger.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `slotKey` | `TEXT` | Sí |
| `traceId` | `TEXT` | Sí |
| `expiresAt` | `DATETIME` | Sí |
| `createdAt` | `DATETIME` | Sí |
| `updatedAt` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `slotKey` — **único** | Único |
| `expiresAt` | No único |

## 9. PENDING_COMPENSATIONS

- **ID técnico Wix CMS:** `PendingCompensations`
- **Nombre visible / lógico:** `PENDING_COMPENSATIONS`
- **Finalidad:** Recuperacion durable de asientos fiscales no registrados.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `kind` | `TEXT` | Sí |
| `status` | `TEXT` | Sí |
| `attempts` | `NUMBER` | Sí |
| `bookingIds` | `TEXT` | No |
| `amount` | `NUMBER` | Sí |
| `paymentMethod` | `TEXT` | Sí |
| `transactionId` | `TEXT` | Sí |
| `orderId` | `TEXT` | No |
| `refundId` | `TEXT` | No |
| `origin` | `TEXT` | Sí |
| `concept` | `TEXT` | No |
| `resourceId` | `TEXT` | No |
| `tipoMovimiento` | `TEXT` | Sí |
| `phase` | `TEXT` | No |
| `traceId` | `TEXT` | Sí |
| `lastError` | `TEXT` | No |
| `alertRequired` | `BOOLEAN` | No |
| `createdAt` | `DATETIME` | Sí |
| `updatedAt` | `DATETIME` | Sí |
| `completedAt` | `DATETIME` | No |
| `failedAt` | `DATETIME` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `kind + status + createdAt` | No único |
| `transactionId` — **único** | Único |
| `orderId` | No único |

## 10. LIBRO_DE_ASIENTOS

- **ID técnico Wix CMS:** `movimientoCaja`
- **Nombre visible / lógico:** `LIBRO_DE_ASIENTOS`
- **Finalidad:** Ledger fiscal inmutable y fuente de verdad de caja.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `seqGlobal` | `NUMBER` | Sí |
| `tipoMovimiento` | `TEXT` | Sí |
| `concepto` | `TEXT` | Sí |
| `origen` | `TEXT` | Sí |
| `orderId` | `TEXT` | No |
| `refundId` | `TEXT` | No |
| `importeTotal` | `NUMBER` | Sí |
| `signo` | `NUMBER` | Sí |
| `importeContable` | `NUMBER` | Sí |
| `baseImponible` | `NUMBER` | Sí |
| `cuotaIva` | `NUMBER` | Sí |
| `tasaIva` | `NUMBER` | Sí |
| `nifEmisor` | `TEXT` | No |
| `numTicketFactura` | `TEXT` | Sí |
| `prevHash` | `TEXT` | Sí |
| `hashCadena` | `TEXT` | Sí |
| `firmaDigital` | `TEXT` | Sí |
| `formaPago` | `TEXT` | Sí |
| `reservaIdVinculada` | `TEXT` | No |
| `transactionId` | `TEXT` | Sí |
| `resourceId` | `TEXT` | No |
| `diaKey` | `TEXT` | Sí |
| `mesKey` | `TEXT` | Sí |
| `traceId` | `TEXT` | Sí |
| `fechaCreacion` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `seqGlobal` — **único** | Único |
| `transactionId` — **único** | Único |
| `diaKey + seqGlobal` | No único |
| `mesKey + seqGlobal` | No único |
| `formaPago + diaKey` | No único |
| `reservaIdVinculada` | No único |

## 11. CAJA_ACTUAL

- **ID técnico Wix CMS:** `cajaActual`
- **Nombre visible / lógico:** `CAJA_ACTUAL`
- **Finalidad:** Proyeccion singleton derivada del ledger; no es una fuente contable.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `diaKey` | `TEXT` | Sí |
| `saldoEfectivo` | `NUMBER` | Sí |
| `saldoTarjeta` | `NUMBER` | Sí |
| `saldoBizum` | `NUMBER` | Sí |
| `saldoOnline` | `NUMBER` | Sí |
| `saldoTotal` | `NUMBER` | Sí |
| `totalOperaciones` | `NUMBER` | Sí |
| `estado` | `TEXT` | Sí |
| `fechaApertura` | `DATETIME` | Sí |
| `fechaCierre` | `DATETIME` | No |
| `ultimaActualizacion` | `DATETIME` | Sí |
| `fechaActualizacion` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `diaKey` | No único |

## 12. HISTORICO_CIERRES_Z

- **ID técnico Wix CMS:** `HISTORICO_CIERRES_Z`
- **Nombre visible / lógico:** `HISTORICO_CIERRES_Z`
- **Finalidad:** Cierre diario idempotente derivado del ledger.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `version` | `TEXT` | Sí |
| `diaKey` | `TEXT` | Sí |
| `timezone` | `TEXT` | Sí |
| `source` | `TEXT` | Sí |
| `seqInicio` | `NUMBER` | Sí |
| `seqFin` | `NUMBER` | Sí |
| `hashInicio` | `TEXT` | Sí |
| `hashFin` | `TEXT` | Sí |
| `ticketInicio` | `TEXT` | No |
| `ticketFin` | `TEXT` | No |
| `totalEfectivo` | `NUMBER` | Sí |
| `totalTarjeta` | `NUMBER` | Sí |
| `totalBizum` | `NUMBER` | Sí |
| `totalOnline` | `NUMBER` | Sí |
| `totalVentas` | `NUMBER` | Sí |
| `totalReembolsos` | `NUMBER` | Sí |
| `totalAjustes` | `NUMBER` | Sí |
| `baseImponibleNeta` | `NUMBER` | Sí |
| `cuotaIvaNeta` | `NUMBER` | Sí |
| `resumenTiposMovimiento` | `OBJECT` | Sí |
| `resumenTipoIva` | `OBJECT` | Sí |
| `numOperaciones` | `NUMBER` | Sí |
| `integridadVerificada` | `BOOLEAN` | Sí |
| `totalRegistrosVerificados` | `NUMBER` | Sí |
| `totalGeneral` | `NUMBER` | Sí |
| `estado` | `TEXT` | Sí |
| `fechaCierre` | `DATETIME` | Sí |
| `fechaVerificacion` | `DATETIME` | Sí |
| `hashCierre` | `TEXT` | Sí |
| `firmaCierre` | `TEXT` | Sí |
| `traceId` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `diaKey` — **único** | Único |
| `seqInicio` | No único |
| `seqFin` | No único |
| `hashFin` | No único |

## 13. RESUMEN_CONTEO_X

- **ID técnico Wix CMS:** `RESUMEN_CONTEO_X`
- **Nombre visible / lógico:** `RESUMEN_CONTEO_X`
- **Finalidad:** Arqueos de efectivo append-only.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `diaKey` | `TEXT` | Sí |
| `metalicoCaja` | `NUMBER` | Sí |
| `totalEfectivoTeorico` | `NUMBER` | Sí |
| `descuadre` | `NUMBER` | Sí |
| `estadoCuadre` | `TEXT` | Sí |
| `fechaConteo` | `DATETIME` | Sí |
| `fechaArqueo` | `DATETIME` | Sí |
| `traceId` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `diaKey + fechaConteo` | No único |

## 14. SECUENCIA_TICKETS

- **ID técnico Wix CMS:** `SecuenciaTickets`
- **Nombre visible / lógico:** `SECUENCIA_TICKETS`
- **Finalidad:** Contador singleton de tickets y secuencia global.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `data` | `OBJECT` | Sí |

### Índices

No declara índices de negocio adicionales en el contrato.

## 15. REGISTRO_HORARIO

- **ID técnico Wix CMS:** `REGISTRO_HORARIO`
- **Nombre visible / lógico:** `REGISTRO_HORARIO`
- **Finalidad:** Registro laboral append-only de fichajes.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `resourceId` | `TEXT` | Sí |
| `resourceName` | `TEXT` | Sí |
| `tipoFichaje` | `TEXT` | Sí |
| `diaKey` | `TEXT` | Sí |
| `mesKey` | `TEXT` | Sí |
| `hora` | `TEXT` | Sí |
| `fechaHora` | `DATETIME` | Sí |
| `fechaCreacion` | `DATETIME` | Sí |
| `ipDispositivo` | `TEXT` | No |
| `motivoAjuste` | `TEXT` | No |
| `registradoPor` | `TEXT` | Sí |
| `registradoPorMemberId` | `TEXT` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `resourceId + fechaHora` | No único |
| `resourceId + diaKey + fechaHora` | No único |
| `mesKey + resourceId` | No único |

## 16. PRODUCTOS_VENTA

- **ID técnico Wix CMS:** `InventarioProductos`
- **Nombre visible / lógico:** `PRODUCTOS_VENTA`
- **Finalidad:** Stock interno esperado para conciliacion con Wix Stores/POS.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `sku` | `TEXT` | Sí |
| `lastInventoryMovementAt` | `DATETIME` | No |
| `lastInventoryMovementId` | `TEXT` | No |
| `productName` | `TEXT` | No |
| `description` | `TEXT` | No |
| `category` | `TEXT` | No |
| `collectionName` | `TEXT` | No |
| `salePriceTaxIncluded` | `NUMBER` | No |
| `costExTax` | `NUMBER` | No |
| `supplier` | `TEXT` | No |
| `supplierReference` | `TEXT` | No |
| `unitsPerCase` | `NUMBER` | No |
| `stockExpected` | `NUMBER` | Sí |
| `stockMinimo` | `NUMBER` | No |
| `lowStockAlert` | `NUMBER` | No |
| `reorderPoint` | `NUMBER` | No |
| `location` | `TEXT` | No |
| `wixProductId` | `TEXT` | No |
| `wixVariantId` | `TEXT` | No |
| `needsWixReconciliation` | `BOOLEAN` | No |
| `active` | `BOOLEAN` | No |
| `createdAt` | `DATETIME` | No |
| `updatedAt` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `sku` — **único** | Único |
| `wixProductId` — **único** | Único |
| `stockExpected` | No único |

## 17. MOVIMIENTO_INVENTARIO

- **ID técnico Wix CMS:** `movimientoInventario`
- **Nombre visible / lógico:** `MOVIMIENTO_INVENTARIO`
- **Finalidad:** Ledger interno de movimientos y espejo de pedidos online.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `variantId` | `TEXT` | No |
| `appliedAt` | `DATETIME` | No |
| `status` | `TEXT` | No |
| `stockAfter` | `NUMBER` | No |
| `stockBefore` | `NUMBER` | No |
| `movementToken` | `TEXT` | Sí |
| `productId` | `TEXT` | No |
| `movementType` | `TEXT` | Sí |
| `sku` | `TEXT` | No |
| `productName` | `TEXT` | No |
| `quantity` | `NUMBER` | Sí |
| `quantityDelta` | `NUMBER` | Sí |
| `stockExpected` | `NUMBER` | No |
| `referenceId` | `TEXT` | No |
| `orderId` | `TEXT` | No |
| `refundId` | `TEXT` | No |
| `reason` | `TEXT` | No |
| `note` | `TEXT` | No |
| `source` | `TEXT` | No |
| `actorEmail` | `TEXT` | No |
| `actorMemberId` | `TEXT` | No |
| `traceId` | `TEXT` | Sí |
| `createdAt` | `DATETIME` | Sí |
| `requiresWixReconciliation` | `BOOLEAN` | Sí |
| `nativeCommercialMovement` | `BOOLEAN` | Sí |
| `wixProductId` | `TEXT` | No |
| `wixVariantId` | `TEXT` | No |

### Índices

| Campos indexados | Tipo |
|---|---|
| `movementToken` — **único** | Único |
| `sku + createdAt` | No único |
| `referenceId` | No único |
| `movementType + createdAt` | No único |

## 18. CONCILIACION_STOCK_WIX

- **ID técnico Wix CMS:** `ConciliacionStockWix`
- **Nombre visible / lógico:** `CONCILIACION_STOCK_WIX`
- **Finalidad:** Cola durable de ajustes que deben conciliarse con Wix Stores/POS.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `sku` | `TEXT` | Sí |
| `locationCode` | `TEXT` | No |
| `productName` | `TEXT` | No |
| `quantityDelta` | `NUMBER` | Sí |
| `movementToken` | `TEXT` | Sí |
| `movementId` | `TEXT` | Sí |
| `status` | `TEXT` | Sí |
| `wixProductId` | `TEXT` | No |
| `wixVariantId` | `TEXT` | No |
| `reason` | `TEXT` | No |
| `source` | `TEXT` | No |
| `referenceId` | `TEXT` | No |
| `createdAt` | `DATETIME` | Sí |
| `updatedAt` | `DATETIME` | Sí |
| `appliedAt` | `DATETIME` | No |
| `appliedByNote` | `TEXT` | No |
| `traceId` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `status + createdAt` | No único |
| `sku + status` | No único |
| `movementId` — **único** | Único |

## 19. MM_AUDIT_LOG

- **ID técnico Wix CMS:** `MM_AUDIT_LOG`
- **Nombre visible / lógico:** `MM_AUDIT_LOG`
- **Finalidad:** Auditoria tecnica append-only y limpieza con retencion definida por codigo.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `tipoEvento` | `TEXT` | Sí |
| `level` | `TEXT` | Sí |
| `message` | `TEXT` | Sí |
| `data` | `OBJECT` | No |
| `resourceId` | `TEXT` | No |
| `source` | `TEXT` | No |
| `fechaLog` | `DATETIME` | Sí |
| `traceId` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `fechaLog` | No único |
| `traceId` | No único |
| `level + fechaLog` | No único |

## 20. M365_SYNC_LOG

- **ID técnico Wix CMS:** `m365SyncLog`
- **Nombre visible / lógico:** `M365_SYNC_LOG`
- **Finalidad:** Trazabilidad append-only de sincronizaciones externas.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `origen` | `TEXT` | Sí |
| `destino` | `TEXT` | Sí |
| `estado` | `TEXT` | Sí |
| `cantidadRegistros` | `NUMBER` | No |
| `mensaje` | `TEXT` | No |
| `meta` | `OBJECT` | No |
| `tipo` | `TEXT` | No |
| `fechaSync` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `fechaSync` | No único |
| `estado + fechaSync` | No único |
| `tipo + fechaSync` | No único |

## 21. CONFIGURACION_FISCAL

- **ID técnico Wix CMS:** `CONFIGURACION_FISCAL`
- **Nombre visible / lógico:** `CONFIGURACION_FISCAL`
- **Finalidad:** Constantes no secretas del emisor, periodos y versiones de integración fiscal.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `nombreRazonSocial` | `TEXT` | Sí |
| `nifEmisor` | `TEXT` | Sí |
| `direccionFiscal` | `TEXT` | No |
| `codigoPostalFiscal` | `TEXT` | No |
| `municipioFiscal` | `TEXT` | No |
| `provinciaFiscal` | `TEXT` | No |
| `paisFiscal` | `TEXT` | Sí |
| `moneda` | `TEXT` | Sí |
| `zonaHoraria` | `TEXT` | Sí |
| `regimenIva` | `TEXT` | No |
| `sujetoSii` | `BOOLEAN` | Sí |
| `serieFacturaPredeterminada` | `TEXT` | No |
| `versionConfiguracion` | `TEXT` | Sí |
| `activo` | `BOOLEAN` | Sí |
| `fechaActualizacion` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `nifEmisor` — **único** | Único |

## 22. PLAN_CUENTAS_CONTABLES

- **ID técnico Wix CMS:** `PLAN_CUENTAS_CONTABLES`
- **Nombre visible / lógico:** `PLAN_CUENTAS_CONTABLES`
- **Finalidad:** Mapa de cuentas y dimensiones analíticas validado por gestoría; no codifica decisiones contables en el frontend.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `codigoCuentaContable` | `TEXT` | Sí |
| `nombreCuentaContable` | `TEXT` | Sí |
| `grupoCuentaContable` | `TEXT` | Sí |
| `subgrupoCuentaContable` | `TEXT` | No |
| `naturalezaCuenta` | `TEXT` | Sí |
| `categoriaOperacion` | `TEXT` | No |
| `subcategoriaOperacion` | `TEXT` | No |
| `codigoCuentaDebePredeterminada` | `TEXT` | No |
| `nombreCuentaDebePredeterminada` | `TEXT` | No |
| `codigoCuentaHaberPredeterminada` | `TEXT` | No |
| `nombreCuentaHaberPredeterminada` | `TEXT` | No |
| `codigoCuentaIvaRepercutido` | `TEXT` | No |
| `nombreCuentaIvaRepercutido` | `TEXT` | No |
| `codigoCuentaIvaSoportado` | `TEXT` | No |
| `nombreCuentaIvaSoportado` | `TEXT` | No |
| `tipoIvaPredeterminado` | `NUMBER` | No |
| `centroCostePredeterminado` | `TEXT` | No |
| `activa` | `BOOLEAN` | Sí |
| `validadaPorGestoria` | `BOOLEAN` | No |
| `fechaValidacion` | `DATETIME` | No |
| `fechaActualizacion` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `codigoCuentaContable` — **único** | Único |
| `activa` | No único |
| `categoriaOperacion` | No único |

## 23. ASIENTOS_CONTABLES

- **ID técnico Wix CMS:** `ASIENTOS_CONTABLES`
- **Nombre visible / lógico:** `ASIENTOS_CONTABLES`
- **Finalidad:** Cabecera inmutable de un hecho económico equilibrado por líneas Debe/Haber.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idAsiento` | `TEXT` | Sí |
| `numeroAsiento` | `NUMBER` | Sí |
| `ejercicioFiscal` | `NUMBER` | Sí |
| `periodoFiscal` | `TEXT` | Sí |
| `fechaOperacion` | `DATETIME` | Sí |
| `fechaHoraRegistro` | `DATETIME` | Sí |
| `zonaHorariaOperacion` | `TEXT` | Sí |
| `tipoAsiento` | `TEXT` | Sí |
| `categoriaOperacion` | `TEXT` | Sí |
| `subcategoriaOperacion` | `TEXT` | No |
| `conceptoAsiento` | `TEXT` | Sí |
| `origenRegistro` | `TEXT` | Sí |
| `idOrigen` | `TEXT` | Sí |
| `idTransaccion` | `TEXT` | Sí |
| `idPedidoWix` | `TEXT` | No |
| `idDevolucionWix` | `TEXT` | No |
| `idReservaWix` | `TEXT` | No |
| `referenciaExterna` | `TEXT` | No |
| `serieFactura` | `TEXT` | No |
| `numeroFactura` | `TEXT` | No |
| `fechaExpedicionFactura` | `DATETIME` | No |
| `fechaOperacionFiscal` | `DATETIME` | No |
| `tipoFactura` | `TEXT` | No |
| `idAsientoRectificado` | `TEXT` | No |
| `motivoRectificacion` | `TEXT` | No |
| `moneda` | `TEXT` | Sí |
| `totalDebe` | `NUMBER` | Sí |
| `totalHaber` | `NUMBER` | Sí |
| `importeTotalDocumento` | `NUMBER` | No |
| `medioPago` | `TEXT` | No |
| `estadoAsiento` | `TEXT` | Sí |
| `idResponsableOperativo` | `TEXT` | No |
| `idMiembroRegistrador` | `TEXT` | Sí |
| `nombreRegistrador` | `TEXT` | No |
| `idCentroCoste` | `TEXT` | No |
| `codigoActividadIae` | `TEXT` | No |
| `versionEsquema` | `TEXT` | Sí |
| `versionAlgoritmoIntegridad` | `TEXT` | Sí |
| `hashAnterior` | `TEXT` | Sí |
| `hashAsiento` | `TEXT` | Sí |
| `firmaAsiento` | `TEXT` | Sí |
| `idTraza` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idAsiento` — **único** | Único |
| `numeroAsiento` — **único** | Único |
| `idTransaccion` — **único** | Único |
| `fechaOperacion + numeroAsiento` | No único |
| `ejercicioFiscal + periodoFiscal` | No único |
| `idPedidoWix` | No único |
| `idReservaWix` | No único |
| `estadoAsiento + fechaOperacion` | No único |

## 24. LINEAS_ASIENTO_CONTABLE

- **ID técnico Wix CMS:** `LINEAS_ASIENTO_CONTABLE`
- **Nombre visible / lógico:** `LINEAS_ASIENTO_CONTABLE`
- **Finalidad:** Detalle inmutable de la partida doble y del desglose fiscal y analítico de cada asiento.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idLineaAsiento` | `TEXT` | Sí |
| `idAsiento` | `TEXT` | Sí |
| `numeroLinea` | `NUMBER` | Sí |
| `fechaOperacion` | `DATETIME` | Sí |
| `codigoCuentaContable` | `TEXT` | Sí |
| `nombreCuentaContable` | `TEXT` | Sí |
| `grupoCuentaContable` | `TEXT` | No |
| `importeDebe` | `NUMBER` | Sí |
| `importeHaber` | `NUMBER` | Sí |
| `importeNeto` | `NUMBER` | Sí |
| `categoriaOperacion` | `TEXT` | Sí |
| `idCentroCoste` | `TEXT` | No |
| `idResponsableOperativo` | `TEXT` | No |
| `codigoProductoServicio` | `TEXT` | No |
| `descripcionLinea` | `TEXT` | Sí |
| `baseImponible` | `NUMBER` | No |
| `tipoIva` | `NUMBER` | No |
| `cuotaIva` | `NUMBER` | No |
| `claveOperacionIva` | `TEXT` | No |
| `nifContraparte` | `TEXT` | No |
| `nombreContraparte` | `TEXT` | No |
| `referenciaExterna` | `TEXT` | No |
| `idTraza` | `TEXT` | Sí |
| `hashLinea` | `TEXT` | Sí |
| `fechaHoraRegistro` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idLineaAsiento` — **único** | Único |
| `idAsiento + numeroLinea` | No único |
| `codigoCuentaContable + fechaOperacion` | No único |
| `fechaOperacion` | No único |
| `categoriaOperacion + fechaOperacion` | No único |

## 25. LIBRO_IVA_FACTURAS_EXPEDIDAS

- **ID técnico Wix CMS:** `LIBRO_IVA_FACTURAS_EXPEDIDAS`
- **Nombre visible / lógico:** `LIBRO_IVA_FACTURAS_EXPEDIDAS`
- **Finalidad:** Proyección fiscal de facturas emitidas y rectificativas, basada en el diario y en el documento nativo de origen.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idRegistroIva` | `TEXT` | Sí |
| `idAsiento` | `TEXT` | Sí |
| `ejercicioFiscal` | `NUMBER` | Sí |
| `periodoFiscal` | `TEXT` | Sí |
| `codigoActividad` | `TEXT` | No |
| `tipoActividad` | `TEXT` | No |
| `epigrafeIae` | `TEXT` | No |
| `tipoFactura` | `TEXT` | Sí |
| `conceptoIngreso` | `TEXT` | No |
| `importeIngresoComputable` | `NUMBER` | No |
| `fechaExpedicion` | `DATETIME` | Sí |
| `fechaOperacion` | `DATETIME` | No |
| `serieFactura` | `TEXT` | No |
| `numeroFactura` | `TEXT` | Sí |
| `numeroFacturaFinal` | `TEXT` | No |
| `tipoIdentificacionDestinatario` | `TEXT` | No |
| `codigoPaisDestinatario` | `TEXT` | No |
| `nifDestinatario` | `TEXT` | No |
| `nombreDestinatario` | `TEXT` | No |
| `claveOperacion` | `TEXT` | No |
| `calificacionOperacion` | `TEXT` | No |
| `operacionExenta` | `TEXT` | No |
| `importeTotalFactura` | `NUMBER` | Sí |
| `baseImponible` | `NUMBER` | Sí |
| `tipoIva` | `NUMBER` | Sí |
| `cuotaIvaRepercutida` | `NUMBER` | Sí |
| `tipoRecargoEquivalencia` | `NUMBER` | No |
| `cuotaRecargoEquivalencia` | `NUMBER` | No |
| `fechaCobro` | `DATETIME` | No |
| `importeCobrado` | `NUMBER` | No |
| `medioCobro` | `TEXT` | No |
| `identificacionMedioCobro` | `TEXT` | No |
| `tipoRetencionIrpf` | `NUMBER` | No |
| `importeRetenidoIrpf` | `NUMBER` | No |
| `referenciaExterna` | `TEXT` | No |
| `idFacturaRectificada` | `TEXT` | No |
| `idTraza` | `TEXT` | Sí |
| `fechaHoraRegistro` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idRegistroIva` — **único** | Único |
| `idAsiento` — **único** | Único |
| `ejercicioFiscal + periodoFiscal` | No único |
| `serieFactura + numeroFactura` | No único |
| `fechaExpedicion` | No único |
| `nifDestinatario` | No único |

## 26. LIBRO_IVA_FACTURAS_RECIBIDAS

- **ID técnico Wix CMS:** `LIBRO_IVA_FACTURAS_RECIBIDAS`
- **Nombre visible / lógico:** `LIBRO_IVA_FACTURAS_RECIBIDAS`
- **Finalidad:** Registro documental de facturas de proveedores y gastos, con soporte de IVA deducible y pago.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idRegistroIva` | `TEXT` | Sí |
| `idAsiento` | `TEXT` | Sí |
| `ejercicioFiscal` | `NUMBER` | Sí |
| `periodoFiscal` | `TEXT` | Sí |
| `codigoActividad` | `TEXT` | No |
| `tipoActividad` | `TEXT` | No |
| `epigrafeIae` | `TEXT` | No |
| `tipoFactura` | `TEXT` | Sí |
| `conceptoGasto` | `TEXT` | No |
| `importeGastoDeducible` | `NUMBER` | No |
| `fechaExpedicion` | `DATETIME` | Sí |
| `fechaOperacion` | `DATETIME` | No |
| `fechaRecepcion` | `DATETIME` | Sí |
| `serieNumeroFacturaProveedor` | `TEXT` | Sí |
| `numeroFacturaFinal` | `TEXT` | No |
| `numeroRecepcion` | `TEXT` | No |
| `numeroRecepcionFinal` | `TEXT` | No |
| `tipoIdentificacionProveedor` | `TEXT` | No |
| `codigoPaisProveedor` | `TEXT` | No |
| `nifProveedor` | `TEXT` | Sí |
| `nombreProveedor` | `TEXT` | Sí |
| `claveOperacion` | `TEXT` | No |
| `bienInversion` | `BOOLEAN` | No |
| `inversionSujetoPasivo` | `BOOLEAN` | No |
| `deduciblePeriodoPosterior` | `BOOLEAN` | No |
| `ejercicioDeduccion` | `NUMBER` | No |
| `periodoDeduccion` | `TEXT` | No |
| `importeTotalFactura` | `NUMBER` | Sí |
| `baseImponible` | `NUMBER` | Sí |
| `tipoIva` | `NUMBER` | Sí |
| `cuotaIvaSoportado` | `NUMBER` | Sí |
| `cuotaIvaDeducible` | `NUMBER` | No |
| `tipoRecargoEquivalencia` | `NUMBER` | No |
| `cuotaRecargoEquivalencia` | `NUMBER` | No |
| `fechaPago` | `DATETIME` | No |
| `importePagado` | `NUMBER` | No |
| `medioPago` | `TEXT` | No |
| `identificacionMedioPago` | `TEXT` | No |
| `tipoRetencionIrpf` | `NUMBER` | No |
| `importeRetenidoIrpf` | `NUMBER` | No |
| `referenciaExterna` | `TEXT` | No |
| `idTraza` | `TEXT` | Sí |
| `fechaHoraRegistro` | `DATETIME` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idRegistroIva` — **único** | Único |
| `idAsiento` — **único** | Único |
| `ejercicioFiscal + periodoFiscal` | No único |
| `serieNumeroFacturaProveedor` | No único |
| `fechaRecepcion` | No único |
| `nifProveedor` | No único |

## 27. MAYOR_CONTABLE_SALDOS

- **ID técnico Wix CMS:** `MAYOR_CONTABLE_SALDOS`
- **Nombre visible / lógico:** `MAYOR_CONTABLE_SALDOS`
- **Finalidad:** Proyección reconstruible por cuenta y periodo; nunca se usa como fuente de verdad.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idMayor` | `TEXT` | Sí |
| `ejercicioFiscal` | `NUMBER` | Sí |
| `periodoFiscal` | `TEXT` | Sí |
| `codigoCuentaContable` | `TEXT` | Sí |
| `nombreCuentaContable` | `TEXT` | Sí |
| `saldoInicialDebe` | `NUMBER` | Sí |
| `saldoInicialHaber` | `NUMBER` | Sí |
| `movimientosDebe` | `NUMBER` | Sí |
| `movimientosHaber` | `NUMBER` | Sí |
| `saldoFinalDebe` | `NUMBER` | Sí |
| `saldoFinalHaber` | `NUMBER` | Sí |
| `fechaCalculo` | `DATETIME` | Sí |
| `idTraza` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idMayor` — **único** | Único |
| `ejercicioFiscal + periodoFiscal + codigoCuentaContable` | No único |

## 28. LIBRO_INVENTARIO_CIERRE

- **ID técnico Wix CMS:** `LIBRO_INVENTARIO_CIERRE`
- **Nombre visible / lógico:** `LIBRO_INVENTARIO_CIERRE`
- **Finalidad:** Snapshot inmutable de inventario y saldos para cierre de ejercicio o periodo autorizado.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idCierreInventario` | `TEXT` | Sí |
| `ejercicioFiscal` | `NUMBER` | Sí |
| `fechaCierre` | `DATETIME` | Sí |
| `tipoCierre` | `TEXT` | Sí |
| `idProducto` | `TEXT` | No |
| `sku` | `TEXT` | No |
| `descripcionProducto` | `TEXT` | No |
| `cantidadExistencias` | `NUMBER` | No |
| `costeUnitario` | `NUMBER` | No |
| `valorExistencias` | `NUMBER` | No |
| `codigoCuentaContable` | `TEXT` | No |
| `saldoDebe` | `NUMBER` | No |
| `saldoHaber` | `NUMBER` | No |
| `hashCierre` | `TEXT` | Sí |
| `firmaCierre` | `TEXT` | Sí |
| `idTraza` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idCierreInventario` — **único** | Único |
| `ejercicioFiscal + fechaCierre` | No único |
| `sku` | No único |

## 29. EVENTOS_SISTEMA_FACTURACION

- **ID técnico Wix CMS:** `EVENTOS_SISTEMA_FACTURACION`
- **Nombre visible / lógico:** `EVENTOS_SISTEMA_FACTURACION`
- **Finalidad:** Evidencia técnica append-only de configuración, integridad, errores y operaciones relevantes del sistema de facturación.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idEventoSistema` | `TEXT` | Sí |
| `fechaHoraEvento` | `DATETIME` | Sí |
| `tipoEvento` | `TEXT` | Sí |
| `severidad` | `TEXT` | Sí |
| `origenEvento` | `TEXT` | Sí |
| `idUsuarioResponsable` | `TEXT` | No |
| `idMiembroResponsable` | `TEXT` | No |
| `idAsiento` | `TEXT` | No |
| `idTransaccion` | `TEXT` | No |
| `idReferencia` | `TEXT` | No |
| `versionSistema` | `TEXT` | Sí |
| `versionEsquema` | `TEXT` | Sí |
| `resultado` | `TEXT` | Sí |
| `detalleSeguro` | `OBJECT` | No |
| `hashEventoAnterior` | `TEXT` | Sí |
| `hashEvento` | `TEXT` | Sí |
| `firmaEvento` | `TEXT` | Sí |
| `idTraza` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idEventoSistema` — **único** | Único |
| `fechaHoraEvento` | No único |
| `idAsiento` | No único |
| `idTransaccion` | No único |
| `tipoEvento + fechaHoraEvento` | No único |

## 30. LIBRO_IVA_BIENES_INVERSION

- **ID técnico Wix CMS:** `LIBRO_IVA_BIENES_INVERSION`
- **Nombre visible / lógico:** `LIBRO_IVA_BIENES_INVERSION`
- **Finalidad:** Libro condicional de bienes de inversión, que se habilita solo tras confirmar aplicabilidad con gestoría.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idRegistroBien` | `TEXT` | Sí |
| `ejercicioFiscal` | `NUMBER` | Sí |
| `periodoFiscal` | `TEXT` | Sí |
| `tipoBien` | `TEXT` | Sí |
| `identificadorBien` | `TEXT` | Sí |
| `descripcionBien` | `TEXT` | Sí |
| `fechaInicioUtilizacion` | `DATETIME` | Sí |
| `valorAdquisicion` | `NUMBER` | Sí |
| `valorAmortizable` | `NUMBER` | No |
| `metodoAmortizacion` | `TEXT` | No |
| `porcentajeAmortizacion` | `NUMBER` | No |
| `amortizacionAcumulada` | `NUMBER` | No |
| `fechaExpedicionFactura` | `DATETIME` | Sí |
| `serieNumeroFacturaProveedor` | `TEXT` | Sí |
| `nifProveedor` | `TEXT` | Sí |
| `nombreProveedor` | `TEXT` | Sí |
| `baseImponible` | `NUMBER` | Sí |
| `tipoIva` | `NUMBER` | Sí |
| `cuotaIvaDeducible` | `NUMBER` | No |
| `referenciaExterna` | `TEXT` | No |
| `idAsiento` | `TEXT` | Sí |
| `idTraza` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idRegistroBien` — **único** | Único |
| `ejercicioFiscal + identificadorBien` | No único |
| `idAsiento` — **único** | Único |

## 31. LIBRO_IVA_INTRACOMUNITARIO

- **ID técnico Wix CMS:** `LIBRO_IVA_INTRACOMUNITARIO`
- **Nombre visible / lógico:** `LIBRO_IVA_INTRACOMUNITARIO`
- **Finalidad:** Libro condicional para operaciones intracomunitarias; no se activa por defecto.

### Campos

| Campo / ID técnico | Tipo Wix Data | Obligatorio |
|---|---|---|
| `idRegistroOperacion` | `TEXT` | Sí |
| `idAsiento` | `TEXT` | Sí |
| `ejercicioFiscal` | `NUMBER` | Sí |
| `periodoFiscal` | `TEXT` | Sí |
| `tipoOperacion` | `TEXT` | Sí |
| `fechaOperacion` | `DATETIME` | Sí |
| `nifIvaContraparte` | `TEXT` | Sí |
| `nombreContraparte` | `TEXT` | Sí |
| `codigoPaisContraparte` | `TEXT` | Sí |
| `descripcionBienServicio` | `TEXT` | Sí |
| `importeOperacion` | `NUMBER` | Sí |
| `referenciaExterna` | `TEXT` | No |
| `idTraza` | `TEXT` | Sí |

### Índices

| Campos indexados | Tipo |
|---|---|
| `idRegistroOperacion` — **único** | Único |
| `ejercicioFiscal + periodoFiscal` | No único |
| `idAsiento` — **único** | Único |
| `nifIvaContraparte` | No único |

## Exclusiones y compatibilidad

| Elemento | Decisión canónica |
|---|---|
| `MapaStaff` | Colección runtime privada que resuelve personal, permisos, horarios y la selección de `SERVICIOS_CITA`; no usa secreto homónimo. |
| `ProveedoresInventario` | No pertenece al runtime activo hasta que exista un flujo propietario de proveedores. |
| `bookingIdf1` | Legacy no canónico; no renombrar ni borrar sin inventario y migración. |
| PII plana de `CitasF2` | `contactDetails` es el objeto canónico. No duplicar en campos planos. |
| `InventarioProductos` | ID técnico estable; `PRODUCTOS_VENTA` es su nombre comercial visible y alias canónico de código. |

## Fuente

- `tests/cms-schema-canonical.json`
- `src/backend/internalConfig.js`
- `docs/CMS_SCHEMA_CANONICO.md`
