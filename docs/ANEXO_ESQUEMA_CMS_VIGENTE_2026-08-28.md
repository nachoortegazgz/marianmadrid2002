# Anexo — esquema CMS vigente del ecosistema

**Fecha de extracción:** 28 de agosto de 2026, 01:39 UTC.

Este anexo procede de una consulta de solo lectura a la API de colecciones CMS de Wix. Incluye las 34 colecciones reconocidas por `COLLECTIONS`, sus permisos efectivos, límites de índice, índices explícitos devueltos y campos. `*` identifica un campo de sistema de Wix; no se devolvieron campos marcados como cifrados ni índices explícitos en este conjunto.

## `ASIENTOS_CONTABLES` — ASIENTOS_CONTABLES

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idAsiento` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idAsiento` | `TEXT` |
| `numeroAsiento` | `NUMBER` |
| `ejercicioFiscal` | `NUMBER` |
| `periodoFiscal` | `TEXT` |
| `fechaOperacion` | `DATETIME` |
| `fechaHoraRegistro` | `DATETIME` |
| `zonaHorariaOperacion` | `TEXT` |
| `tipoAsiento` | `TEXT` |
| `categoriaOperacion` | `TEXT` |
| `subcategoriaOperacion` | `TEXT` |
| `conceptoAsiento` | `TEXT` |
| `origenRegistro` | `TEXT` |
| `idOrigen` | `TEXT` |
| `idTransaccion` | `TEXT` |
| `idPedidoWix` | `TEXT` |
| `idDevolucionWix` | `TEXT` |
| `idReservaWix` | `TEXT` |
| `referenciaExterna` | `TEXT` |
| `serieFactura` | `TEXT` |
| `numeroFactura` | `TEXT` |
| `fechaExpedicionFactura` | `DATETIME` |
| `fechaOperacionFiscal` | `DATETIME` |
| `tipoFactura` | `TEXT` |
| `idAsientoRectificado` | `TEXT` |
| `motivoRectificacion` | `TEXT` |
| `moneda` | `TEXT` |
| `totalDebe` | `NUMBER` |
| `totalHaber` | `NUMBER` |
| `importeTotalDocumento` | `NUMBER` |
| `medioPago` | `TEXT` |
| `estadoAsiento` | `TEXT` |
| `idResponsableOperativo` | `TEXT` |
| `idMiembroRegistrador` | `TEXT` |
| `nombreRegistrador` | `TEXT` |
| `idCentroCoste` | `TEXT` |
| `codigoActividadIae` | `TEXT` |
| `versionEsquema` | `TEXT` |
| `versionAlgoritmoIntegridad` | `TEXT` |
| `hashAnterior` | `TEXT` |
| `hashAsiento` | `TEXT` |
| `firmaAsiento` | `TEXT` |
| `idTraza` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `AddonsCatalogo` — EXTRAS_CATALOGO

| Propiedad | Valor |
|---|---|
| Campo de presentación | `tituloAddon` |
| Lectura | `SITE_MEMBER` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `bookingsAddonGroupId` | `TEXT` |
| `addonId` | `TEXT` |
| `bookingsAddonId` | `TEXT` |
| `tituloAddon` | `TEXT` |
| `resumenCortoAddon` | `TEXT` |
| `imagenAddon` | `TEXT` |
| `textoAlternativoImagenAddon` | `TEXT` |
| `id` | `TEXT` |
| `fechaCreacion` | `DATETIME` |
| `fechaActualizacion` | `DATETIME` |
| `owner` | `TEXT` |
| `grupoInterno` | `TEXT` |
| `precioAddon` | `NUMBER` |
| `tiempoAddon` | `NUMBER` |
| `descripcionLargaAddon` | `TEXT` |
| `categoriaAddon` | `TEXT` |
| `urlIconoImagen` | `TEXT` |
| `disponibleOnline` | `BOOLEAN` |
| `activo` | `BOOLEAN` |
| `fechaPublicacion` | `DATETIME` |
| `fechaDespublicacion` | `DATETIME` |
| `etiquetasAddon` | `ARRAY_STRING` |
| `cantidadMaximaAddon` | `NUMBER` |
| `grupoImpuestos` | `TEXT` |
| `camposExtendidos` | `OBJECT` |
| `mediaPrincipal` | `TEXT` |
| `estado` | `TEXT` |
| `createdDate` | `DATETIME` |
| `updatedDate` | `DATETIME` |
| `localizacionId` | `TEXT` |
| `localizacion` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |
| `Import2_addonsOptions` | `MULTI_REFERENCE` |
| `Import2_tituloAddons` | `MULTI_REFERENCE` |

## `AvailabilityDaysCache` — AVAILABILITY_DAYS_CACHE

| Propiedad | Valor |
|---|---|
| Campo de presentación | `serviceId` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `phaseOneServiceId` | `TEXT` |
| `createdAt` | `DATETIME` |
| `days` | `OBJECT` |
| `resourceKeyHash` | `TEXT` |
| `serviceId` | `TEXT` |
| `staffKey` | `TEXT` |
| `yearMonth` | `TEXT` |
| `daysArr` | `ARRAY_STRING` |
| `version` | `NUMBER` |
| `generatedAt` | `DATETIME` |
| `expiresAt` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `AvailabilitySlotsCache` — AVAILABILITY_SLOTS_CACHE

| Propiedad | Valor |
|---|---|
| Campo de presentación | `phaseOneServiceId` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `phaseOneServiceId` | `TEXT` |
| `resourceKeyHash` | `TEXT` |
| `fromLocal` | `TEXT` |
| `toLocal` | `TEXT` |
| `slots` | `OBJECT` |
| `expiresAt` | `DATETIME` |
| `createdAt` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `BookingTransactions` — BOOKING_TRANSACTIONS

| Propiedad | Valor |
|---|---|
| Campo de presentación | `status` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `status` | `TEXT` |
| `payloadHash` | `TEXT` |
| `traceId` | `TEXT` |
| `result` | `OBJECT` |
| `error` | `TEXT` |
| `createdAt` | `DATETIME` |
| `updatedAt` | `DATETIME` |
| `pairToken` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `BookingsServiceSyncQueue` — BookingsServiceSyncQueue

| Propiedad | Valor |
|---|---|
| Campo de presentación | `title` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `failedAt` | `DATETIME` |
| `updatedAt` | `DATETIME` |
| `completedAt` | `DATETIME` |
| `nextAttemptAt` | `DATETIME` |
| `attempts` | `NUMBER` |
| `sourceItemId` | `TEXT` |
| `errorCode` | `TEXT` |
| `status` | `TEXT` |
| `createdAt` | `DATETIME` |
| `desiredHash` | `TEXT` |
| `traceId` | `TEXT` |
| `title` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |
| `serviceId` | `TEXT` |

## `CONFIGURACION_FISCAL` — CONFIGURACION_FISCAL

| Propiedad | Valor |
|---|---|
| Campo de presentación | `nombreRazonSocial` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `nombreRazonSocial` | `TEXT` |
| `nifEmisor` | `TEXT` |
| `direccionFiscal` | `TEXT` |
| `codigoPostalFiscal` | `TEXT` |
| `municipioFiscal` | `TEXT` |
| `provinciaFiscal` | `TEXT` |
| `paisFiscal` | `TEXT` |
| `moneda` | `TEXT` |
| `zonaHoraria` | `TEXT` |
| `regimenIva` | `TEXT` |
| `sujetoSii` | `BOOLEAN` |
| `serieFacturaPredeterminada` | `TEXT` |
| `versionConfiguracion` | `TEXT` |
| `activo` | `BOOLEAN` |
| `fechaActualizacion` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `CitasF2` — CITAS

| Propiedad | Valor |
|---|---|
| Campo de presentación | `bookingId` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `endDate` | `DATETIME` |
| `uiPairToken` | `TEXT` |
| `bookingId` | `TEXT` |
| `revision` | `NUMBER` |
| `scheduleId` | `TEXT` |
| `resourceId` | `TEXT` |
| `pairToken` | `TEXT` |
| `startDate` | `DATETIME` |
| `startDateLocal` | `TEXT` |
| `endDateLocal` | `TEXT` |
| `fechaYmdMadrid` | `TEXT` |
| `tipo` | `TEXT` |
| `meta` | `OBJECT` |
| `contactDetails` | `OBJECT` |
| `traceId` | `TEXT` |
| `fechaCreacion` | `DATETIME` |
| `fechaActualizacion` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |
| `status` | `TEXT` |
| `statusPago` | `TEXT` |
| `serviceId` | `TEXT` |

## `ConciliacionStockWix` — CONCILIACION_STOCK_WIX

| Propiedad | Valor |
|---|---|
| Campo de presentación | `sku` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `sku` | `TEXT` |
| `locationCode` | `TEXT` |
| `productName` | `TEXT` |
| `quantityDelta` | `NUMBER` |
| `movementToken` | `TEXT` |
| `movementId` | `TEXT` |
| `status` | `TEXT` |
| `wixProductId` | `TEXT` |
| `wixVariantId` | `TEXT` |
| `reason` | `TEXT` |
| `source` | `TEXT` |
| `referenceId` | `TEXT` |
| `createdAt` | `DATETIME` |
| `updatedAt` | `DATETIME` |
| `appliedAt` | `DATETIME` |
| `appliedByNote` | `TEXT` |
| `traceId` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `DualSlotCache` — DUAL_SLOT_CACHE

| Propiedad | Valor |
|---|---|
| Campo de presentación | `pairToken` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `updatedAt` | `DATETIME` |
| `expiresAt` | `DATETIME` |
| `createdAt` | `DATETIME` |
| `pairToken` | `TEXT` |
| `serviceId` | `TEXT` |
| `slotF1` | `OBJECT` |
| `slotF2` | `OBJECT` |
| `resourceId` | `TEXT` |
| `candidateResourceIds` | `ARRAY_STRING` |
| `dateYMD` | `TEXT` |
| `status` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |
| `phaseOneServiceId` | `TEXT` |
| `bookingIdF2` | `TEXT` |
| `phaseTwoServiceId` | `TEXT` |

## `EVENTOS_SISTEMA_FACTURACION` — EVENTOS_SISTEMA_FACTURACION

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idEventoSistema` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idEventoSistema` | `TEXT` |
| `fechaHoraEvento` | `DATETIME` |
| `tipoEvento` | `TEXT` |
| `severidad` | `TEXT` |
| `origenEvento` | `TEXT` |
| `idUsuarioResponsable` | `TEXT` |
| `idMiembroResponsable` | `TEXT` |
| `idAsiento` | `TEXT` |
| `idTransaccion` | `TEXT` |
| `idReferencia` | `TEXT` |
| `versionSistema` | `TEXT` |
| `versionEsquema` | `TEXT` |
| `resultado` | `TEXT` |
| `detalleSeguro` | `OBJECT` |
| `hashEventoAnterior` | `TEXT` |
| `hashEvento` | `TEXT` |
| `firmaEvento` | `TEXT` |
| `idTraza` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `HISTORICO_CIERRES_Z` — CIERRES_Z

| Propiedad | Valor |
|---|---|
| Campo de presentación | `diaKey` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `hashFin` | `TEXT` |
| `firmaCierre` | `TEXT` |
| `hashCierre` | `TEXT` |
| `fechaVerificacion` | `DATETIME` |
| `totalRegistrosVerificados` | `NUMBER` |
| `integridadVerificada` | `BOOLEAN` |
| `resumenTipoIva` | `OBJECT` |
| `resumenTiposMovimiento` | `OBJECT` |
| `cuotaIvaNeta` | `NUMBER` |
| `baseImponibleNeta` | `NUMBER` |
| `totalAjustes` | `NUMBER` |
| `totalReembolsos` | `NUMBER` |
| `totalVentas` | `NUMBER` |
| `ticketFin` | `TEXT` |
| `ticketInicio` | `TEXT` |
| `diaKey` | `TEXT` |
| `hashInicio` | `TEXT` |
| `seqFin` | `NUMBER` |
| `seqInicio` | `NUMBER` |
| `source` | `TEXT` |
| `timezone` | `TEXT` |
| `version` | `TEXT` |
| `totalEfectivo` | `NUMBER` |
| `totalTarjeta` | `NUMBER` |
| `totalBizum` | `NUMBER` |
| `totalOnline` | `NUMBER` |
| `totalGeneral` | `NUMBER` |
| `numOperaciones` | `NUMBER` |
| `estado` | `TEXT` |
| `fechaCierre` | `DATETIME` |
| `traceId` | `TEXT` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `Import2` — SERVICIOS

| Propiedad | Valor |
|---|---|
| Campo de presentación | `serviceId` |
| Lectura | `ANYONE` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `localizacion` | `TEXT` |
| `staffDisponible` | `OBJECT` |
| `categoriaId` | `TEXT` |
| `tituloServicio` | `TEXT` |
| `pagoPresencial` | `BOOLEAN` |
| `notasInternas` | `TEXT` |
| `codigoSku` | `TEXT` |
| `impuestoIncluido` | `BOOLEAN` |
| `buffer` | `NUMBER` |
| `depositoValor` | `NUMBER` |
| `precio` | `NUMBER` |
| `pagoOnline` | `BOOLEAN` |
| `tiempoFase1` | `NUMBER` |
| `tiempoFase2` | `NUMBER` |
| `linkFases` | `TEXT` |
| `categoriaNombre` | `TEXT` |
| `title` | `TEXT` |
| `descripcionLarga` | `TEXT` |
| `duracionTotal` | `NUMBER` |
| `imagenPrincipal` | `TEXT` |
| `depositoTipo` | `TEXT` |
| `modeloPrecio` | `TEXT` |
| `moneda` | `TEXT` |
| `oculto` | `BOOLEAN` |
| `permitirCombinar` | `BOOLEAN` |
| `resumenCorto` | `TEXT` |
| `serviceId` | `TEXT` |
| `slugUrl` | `TEXT` |
| `tiempoExposicion` | `NUMBER` |
| `tipoServicio` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |
| `localizacionId` | `TEXT` |
| `impuestoIva` | `NUMBER` |
| `addonsOptions` | `MULTI_REFERENCE` |
| `tituloAddons` | `MULTI_REFERENCE` |

## `InventarioProductos` — PRODUCTOS_VENTA

| Propiedad | Valor |
|---|---|
| Campo de presentación | `sku` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `sku` | `TEXT` |
| `stockMinimo` | `NUMBER` |
| `lastInventoryMovementAt` | `DATETIME` |
| `lastInventoryMovementId` | `TEXT` |
| `productName` | `TEXT` |
| `description` | `TEXT` |
| `category` | `TEXT` |
| `collectionName` | `TEXT` |
| `salePriceTaxIncluded` | `NUMBER` |
| `costExTax` | `NUMBER` |
| `supplier` | `TEXT` |
| `supplierReference` | `TEXT` |
| `unitsPerCase` | `NUMBER` |
| `stockExpected` | `NUMBER` |
| `lowStockAlert` | `NUMBER` |
| `reorderPoint` | `NUMBER` |
| `location` | `TEXT` |
| `wixProductId` | `TEXT` |
| `wixVariantId` | `TEXT` |
| `needsWixReconciliation` | `BOOLEAN` |
| `active` | `BOOLEAN` |
| `createdAt` | `DATETIME` |
| `updatedAt` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `LIBRO_INVENTARIO_CIERRE` — LIBRO_INVENTARIO_CIERRE

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idCierreInventario` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idCierreInventario` | `TEXT` |
| `ejercicioFiscal` | `NUMBER` |
| `fechaCierre` | `DATETIME` |
| `tipoCierre` | `TEXT` |
| `idProducto` | `TEXT` |
| `sku` | `TEXT` |
| `descripcionProducto` | `TEXT` |
| `cantidadExistencias` | `NUMBER` |
| `costeUnitario` | `NUMBER` |
| `valorExistencias` | `NUMBER` |
| `codigoCuentaContable` | `TEXT` |
| `saldoDebe` | `NUMBER` |
| `saldoHaber` | `NUMBER` |
| `hashCierre` | `TEXT` |
| `firmaCierre` | `TEXT` |
| `idTraza` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `LIBRO_IVA_BIENES_INVERSION` — LIBRO_IVA_BIENES_INVERSION

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idRegistroBien` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idRegistroBien` | `TEXT` |
| `ejercicioFiscal` | `NUMBER` |
| `periodoFiscal` | `TEXT` |
| `tipoBien` | `TEXT` |
| `identificadorBien` | `TEXT` |
| `descripcionBien` | `TEXT` |
| `fechaInicioUtilizacion` | `DATETIME` |
| `valorAdquisicion` | `NUMBER` |
| `valorAmortizable` | `NUMBER` |
| `metodoAmortizacion` | `TEXT` |
| `porcentajeAmortizacion` | `NUMBER` |
| `amortizacionAcumulada` | `NUMBER` |
| `fechaExpedicionFactura` | `DATETIME` |
| `serieNumeroFacturaProveedor` | `TEXT` |
| `nifProveedor` | `TEXT` |
| `nombreProveedor` | `TEXT` |
| `baseImponible` | `NUMBER` |
| `tipoIva` | `NUMBER` |
| `cuotaIvaDeducible` | `NUMBER` |
| `referenciaExterna` | `TEXT` |
| `idAsiento` | `TEXT` |
| `idTraza` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `LIBRO_IVA_FACTURAS_EXPEDIDAS` — LIBRO_IVA_FACTURAS_EXPEDIDAS

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idRegistroIva` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idRegistroIva` | `TEXT` |
| `idAsiento` | `TEXT` |
| `ejercicioFiscal` | `NUMBER` |
| `periodoFiscal` | `TEXT` |
| `codigoActividad` | `TEXT` |
| `tipoActividad` | `TEXT` |
| `epigrafeIae` | `TEXT` |
| `tipoFactura` | `TEXT` |
| `conceptoIngreso` | `TEXT` |
| `importeIngresoComputable` | `NUMBER` |
| `fechaExpedicion` | `DATETIME` |
| `fechaOperacion` | `DATETIME` |
| `serieFactura` | `TEXT` |
| `numeroFactura` | `TEXT` |
| `numeroFacturaFinal` | `TEXT` |
| `tipoIdentificacionDestinatario` | `TEXT` |
| `codigoPaisDestinatario` | `TEXT` |
| `nifDestinatario` | `TEXT` |
| `nombreDestinatario` | `TEXT` |
| `claveOperacion` | `TEXT` |
| `calificacionOperacion` | `TEXT` |
| `operacionExenta` | `TEXT` |
| `importeTotalFactura` | `NUMBER` |
| `baseImponible` | `NUMBER` |
| `tipoIva` | `NUMBER` |
| `cuotaIvaRepercutida` | `NUMBER` |
| `tipoRecargoEquivalencia` | `NUMBER` |
| `cuotaRecargoEquivalencia` | `NUMBER` |
| `fechaCobro` | `DATETIME` |
| `importeCobrado` | `NUMBER` |
| `medioCobro` | `TEXT` |
| `identificacionMedioCobro` | `TEXT` |
| `tipoRetencionIrpf` | `NUMBER` |
| `importeRetenidoIrpf` | `NUMBER` |
| `referenciaExterna` | `TEXT` |
| `idFacturaRectificada` | `TEXT` |
| `idTraza` | `TEXT` |
| `fechaHoraRegistro` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `LIBRO_IVA_FACTURAS_RECIBIDAS` — LIBRO_IVA_FACTURAS_RECIBIDAS

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idRegistroIva` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idRegistroIva` | `TEXT` |
| `idAsiento` | `TEXT` |
| `ejercicioFiscal` | `NUMBER` |
| `periodoFiscal` | `TEXT` |
| `codigoActividad` | `TEXT` |
| `tipoActividad` | `TEXT` |
| `epigrafeIae` | `TEXT` |
| `tipoFactura` | `TEXT` |
| `conceptoGasto` | `TEXT` |
| `importeGastoDeducible` | `NUMBER` |
| `fechaExpedicion` | `DATETIME` |
| `fechaOperacion` | `DATETIME` |
| `fechaRecepcion` | `DATETIME` |
| `serieNumeroFacturaProveedor` | `TEXT` |
| `numeroFacturaFinal` | `TEXT` |
| `numeroRecepcion` | `TEXT` |
| `numeroRecepcionFinal` | `TEXT` |
| `tipoIdentificacionProveedor` | `TEXT` |
| `codigoPaisProveedor` | `TEXT` |
| `nifProveedor` | `TEXT` |
| `nombreProveedor` | `TEXT` |
| `claveOperacion` | `TEXT` |
| `bienInversion` | `BOOLEAN` |
| `inversionSujetoPasivo` | `BOOLEAN` |
| `deduciblePeriodoPosterior` | `BOOLEAN` |
| `ejercicioDeduccion` | `NUMBER` |
| `periodoDeduccion` | `TEXT` |
| `importeTotalFactura` | `NUMBER` |
| `baseImponible` | `NUMBER` |
| `tipoIva` | `NUMBER` |
| `cuotaIvaSoportado` | `NUMBER` |
| `cuotaIvaDeducible` | `NUMBER` |
| `tipoRecargoEquivalencia` | `NUMBER` |
| `cuotaRecargoEquivalencia` | `NUMBER` |
| `fechaPago` | `DATETIME` |
| `importePagado` | `NUMBER` |
| `medioPago` | `TEXT` |
| `identificacionMedioPago` | `TEXT` |
| `tipoRetencionIrpf` | `NUMBER` |
| `importeRetenidoIrpf` | `NUMBER` |
| `referenciaExterna` | `TEXT` |
| `idTraza` | `TEXT` |
| `fechaHoraRegistro` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `LIBRO_IVA_INTRACOMUNITARIO` — LIBRO_IVA_INTRACOMUNITARIO

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idRegistroOperacion` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idRegistroOperacion` | `TEXT` |
| `idAsiento` | `TEXT` |
| `ejercicioFiscal` | `NUMBER` |
| `periodoFiscal` | `TEXT` |
| `tipoOperacion` | `TEXT` |
| `fechaOperacion` | `DATETIME` |
| `nifIvaContraparte` | `TEXT` |
| `nombreContraparte` | `TEXT` |
| `codigoPaisContraparte` | `TEXT` |
| `descripcionBienServicio` | `TEXT` |
| `importeOperacion` | `NUMBER` |
| `referenciaExterna` | `TEXT` |
| `idTraza` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `LINEAS_ASIENTO_CONTABLE` — LINEAS_ASIENTO_CONTABLE

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idLineaAsiento` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idLineaAsiento` | `TEXT` |
| `idAsiento` | `TEXT` |
| `numeroLinea` | `NUMBER` |
| `fechaOperacion` | `DATETIME` |
| `codigoCuentaContable` | `TEXT` |
| `nombreCuentaContable` | `TEXT` |
| `grupoCuentaContable` | `TEXT` |
| `importeDebe` | `NUMBER` |
| `importeHaber` | `NUMBER` |
| `importeNeto` | `NUMBER` |
| `categoriaOperacion` | `TEXT` |
| `idCentroCoste` | `TEXT` |
| `idResponsableOperativo` | `TEXT` |
| `codigoProductoServicio` | `TEXT` |
| `descripcionLinea` | `TEXT` |
| `baseImponible` | `NUMBER` |
| `tipoIva` | `NUMBER` |
| `cuotaIva` | `NUMBER` |
| `claveOperacionIva` | `TEXT` |
| `nifContraparte` | `TEXT` |
| `nombreContraparte` | `TEXT` |
| `referenciaExterna` | `TEXT` |
| `idTraza` | `TEXT` |
| `hashLinea` | `TEXT` |
| `fechaHoraRegistro` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `M365GraphSyncQueue` — M365GraphSyncQueue

| Propiedad | Valor |
|---|---|
| Campo de presentación | `payload` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `payload` | `OBJECT` |
| `payloadHash` | `TEXT` |
| `status` | `TEXT` |
| `attempts` | `NUMBER` |
| `nextAttemptAt` | `DATETIME` |
| `traceId` | `TEXT` |
| `errorCode` | `TEXT` |
| `externalRecordId` | `TEXT` |
| `createdAt` | `DATETIME` |
| `updatedAt` | `DATETIME` |
| `completedAt` | `DATETIME` |
| `blockedAt` | `DATETIME` |
| `failedAt` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `MAYOR_CONTABLE_SALDOS` — MAYOR_CONTABLE_SALDOS

| Propiedad | Valor |
|---|---|
| Campo de presentación | `idMayor` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `idMayor` | `TEXT` |
| `ejercicioFiscal` | `NUMBER` |
| `periodoFiscal` | `TEXT` |
| `codigoCuentaContable` | `TEXT` |
| `nombreCuentaContable` | `TEXT` |
| `saldoInicialDebe` | `NUMBER` |
| `saldoInicialHaber` | `NUMBER` |
| `movimientosDebe` | `NUMBER` |
| `movimientosHaber` | `NUMBER` |
| `saldoFinalDebe` | `NUMBER` |
| `saldoFinalHaber` | `NUMBER` |
| `fechaCalculo` | `DATETIME` |
| `idTraza` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `MM_AUDIT_LOG` — AUDITORIA

| Propiedad | Valor |
|---|---|
| Campo de presentación | `tipoEvento` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `tipoEvento` | `TEXT` |
| `level` | `TEXT` |
| `message` | `TEXT` |
| `data` | `OBJECT` |
| `resourceId` | `TEXT` |
| `source` | `TEXT` |
| `traceId` | `TEXT` |
| `fechaLog` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `MM_LOCKS` — MUTEXES

| Propiedad | Valor |
|---|---|
| Campo de presentación | `slotKey` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `updatedAt` | `DATETIME` |
| `slotKey` | `TEXT` |
| `traceId` | `TEXT` |
| `expiresAt` | `DATETIME` |
| `createdAt` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `MapaStaff` — MAPA_STAFF

| Propiedad | Valor |
|---|---|
| Campo de presentación | `displayName` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |
| `displayName` | `TEXT` |
| `telefono` | `TEXT` |
| `localizacion` | `TEXT` |
| `resourceId` | `TEXT` |
| `email` | `TEXT` |
| `staffMemberId` | `TEXT` |
| `localizacionId` | `TEXT` |
| `activo` | `BOOLEAN` |
| `scheduleId` | `TEXT` |
| `notas` | `TEXT` |

## `PLAN_CUENTAS_CONTABLES` — PLAN_CUENTAS_CONTABLES

| Propiedad | Valor |
|---|---|
| Campo de presentación | `codigoCuentaContable` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `nombreCuentaDebePredeterminada` | `TEXT` |
| `nombreCuentaIvaSoportado` | `TEXT` |
| `codigoCuentaIvaSoportado` | `TEXT` |
| `nombreCuentaIvaRepercutido` | `TEXT` |
| `codigoCuentaIvaRepercutido` | `TEXT` |
| `nombreCuentaHaberPredeterminada` | `TEXT` |
| `codigoCuentaContable` | `TEXT` |
| `nombreCuentaContable` | `TEXT` |
| `grupoCuentaContable` | `TEXT` |
| `subgrupoCuentaContable` | `TEXT` |
| `naturalezaCuenta` | `TEXT` |
| `categoriaOperacion` | `TEXT` |
| `subcategoriaOperacion` | `TEXT` |
| `codigoCuentaDebePredeterminada` | `TEXT` |
| `codigoCuentaHaberPredeterminada` | `TEXT` |
| `tipoIvaPredeterminado` | `NUMBER` |
| `centroCostePredeterminado` | `TEXT` |
| `activa` | `BOOLEAN` |
| `validadaPorGestoria` | `BOOLEAN` |
| `fechaValidacion` | `DATETIME` |
| `fechaActualizacion` | `DATETIME` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `PendingCompensations` — COMPENSACIONES_PENDIENTES

| Propiedad | Valor |
|---|---|
| Campo de presentación | `bookingId` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `resourceId` | `TEXT` |
| `failedAt` | `DATETIME` |
| `completedAt` | `DATETIME` |
| `updatedAt` | `DATETIME` |
| `createdAt` | `DATETIME` |
| `alertRequired` | `BOOLEAN` |
| `lastError` | `TEXT` |
| `tipoMovimiento` | `TEXT` |
| `orderId` | `TEXT` |
| `concept` | `TEXT` |
| `paymentMethod` | `TEXT` |
| `transactionId` | `TEXT` |
| `bookingId` | `TEXT` |
| `amount` | `NUMBER` |
| `bookingIds` | `TEXT` |
| `kind` | `TEXT` |
| `phase` | `TEXT` |
| `status` | `TEXT` |
| `attempts` | `NUMBER` |
| `traceId` | `TEXT` |
| `error` | `TEXT` |
| `fechaFallo` | `DATETIME` |
| `fechaProcesado` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `refundId` | `TEXT` |
| `_createdDate` | `DATETIME*` |
| `origin` | `TEXT` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `REGISTRO_HORARIO` — FICHAJES

| Propiedad | Valor |
|---|---|
| Campo de presentación | `resourceName` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `hora` | `TEXT` |
| `resourceName` | `TEXT` |
| `resourceId` | `TEXT` |
| `registradoPor` | `TEXT` |
| `motivoAjuste` | `TEXT` |
| `ipDispositivo` | `TEXT` |
| `mesKey` | `TEXT` |
| `empleadaNombre` | `TEXT` |
| `tipo` | `TEXT` |
| `empleada` | `TEXT` |
| `tipoFichaje` | `TEXT` |
| `fechaHora` | `DATETIME` |
| `diaKey` | `TEXT` |
| `ip` | `TEXT` |
| `firma` | `TEXT` |
| `traceId` | `TEXT` |
| `meta` | `OBJECT` |
| `fechaCreacion` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `registradoPorMemberId` | `TEXT` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `RESUMEN_CONTEO_X` — ARQUEOS_X

| Propiedad | Valor |
|---|---|
| Campo de presentación | `diaKey` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `diaKey` | `TEXT` |
| `fechaConteo` | `DATETIME` |
| `metalicoCaja` | `NUMBER` |
| `totalEfectivoTeorico` | `NUMBER` |
| `descuadre` | `NUMBER` |
| `estadoCuadre` | `TEXT` |
| `fechaArqueo` | `DATETIME` |
| `traceId` | `TEXT` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `SecuenciaTickets` — SECUENCIA_TICKETS

| Propiedad | Valor |
|---|---|
| Campo de presentación | `data` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `data` | `OBJECT` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `cajaActual` — CAJA_ACTUAL

| Propiedad | Valor |
|---|---|
| Campo de presentación | `saldoEfectivo` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `saldoEfectivo` | `NUMBER` |
| `fechaCierre` | `DATETIME` |
| `fechaApertura` | `DATETIME` |
| `fechaActualizacion` | `DATETIME` |
| `totalOperaciones` | `NUMBER` |
| `diaKey` | `TEXT` |
| `saldoTarjeta` | `NUMBER` |
| `saldoBizum` | `NUMBER` |
| `saldoOnline` | `NUMBER` |
| `saldoTotal` | `NUMBER` |
| `estado` | `TEXT` |
| `ultimaActualizacion` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `m365SyncLog` — SYNC_M365

| Propiedad | Valor |
|---|---|
| Campo de presentación | `origen` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `origen` | `TEXT` |
| `destino` | `TEXT` |
| `estado` | `TEXT` |
| `cantidadRegistros` | `NUMBER` |
| `mensaje` | `TEXT` |
| `meta` | `OBJECT` |
| `tipo` | `TEXT` |
| `fechaSync` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `movimientoCaja` — MOVIMIENTOS_CAJA

| Propiedad | Valor |
|---|---|
| Campo de presentación | `tipoMovimiento` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `origen` | `TEXT` |
| `integrityPayloadVersion` | `TEXT` |
| `detalleLineas` | `ARRAY` |
| `referenciaRectificativa` | `TEXT` |
| `tratamientoIva` | `TEXT` |
| `naturalezaOperacion` | `TEXT` |
| `nifEmisor` | `TEXT` |
| `refundId` | `TEXT` |
| `orderId` | `TEXT` |
| `seqGlobal` | `NUMBER` |
| `concepto` | `TEXT` |
| `tipoMovimiento` | `TEXT` |
| `importeTotal` | `NUMBER` |
| `signo` | `NUMBER` |
| `importeContable` | `NUMBER` |
| `baseImponible` | `NUMBER` |
| `cuotaIva` | `NUMBER` |
| `tasaIva` | `NUMBER` |
| `numTicketFactura` | `TEXT` |
| `prevHash` | `TEXT` |
| `hashCadena` | `TEXT` |
| `firmaDigital` | `TEXT` |
| `formaPago` | `TEXT` |
| `reservaIdVinculada` | `TEXT` |
| `transactionId` | `TEXT` |
| `resourceId` | `TEXT` |
| `diaKey` | `TEXT` |
| `mesKey` | `TEXT` |
| `traceId` | `TEXT` |
| `fechaCreacion` | `DATETIME` |
| `Owner` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## `movimientoInventario` — MOVIMIENTOS_INVENTARIO

| Propiedad | Valor |
|---|---|
| Campo de presentación | `movementToken` |
| Lectura | `ADMIN` |
| Inserción / actualización / borrado | `ADMIN` / `ADMIN` / `ADMIN` |
| Cuota de índices | regulares `3`, único `1`, total `4` |
| Índices explícitos | Ninguno devuelto por la API |

| Campo | Tipo |
|---|---|
| `variantId` | `TEXT` |
| `refundId` | `TEXT` |
| `orderId` | `TEXT` |
| `appliedAt` | `DATETIME` |
| `status` | `TEXT` |
| `stockAfter` | `NUMBER` |
| `stockBefore` | `NUMBER` |
| `movementToken` | `TEXT` |
| `productId` | `TEXT` |
| `movementType` | `TEXT` |
| `sku` | `TEXT` |
| `productName` | `TEXT` |
| `quantity` | `NUMBER` |
| `quantityDelta` | `NUMBER` |
| `stockExpected` | `NUMBER` |
| `referenceId` | `TEXT` |
| `reason` | `TEXT` |
| `note` | `TEXT` |
| `source` | `TEXT` |
| `actorEmail` | `TEXT` |
| `actorMemberId` | `TEXT` |
| `traceId` | `TEXT` |
| `createdAt` | `DATETIME` |
| `requiresWixReconciliation` | `BOOLEAN` |
| `nativeCommercialMovement` | `BOOLEAN` |
| `wixProductId` | `TEXT` |
| `wixVariantId` | `TEXT` |
| `_id` | `TEXT*` |
| `_createdDate` | `DATETIME*` |
| `_updatedDate` | `DATETIME*` |
| `_owner` | `TEXT*` |

## Referencia

[1]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/list-data-collections "Wix CMS — List Data Collections"
