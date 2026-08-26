# Esquema CMS Canónico del Booking Engine

## Propósito y alcance

Este documento fija la **línea base de colecciones personalizadas** que debe existir en QA para que el runtime actual de Marian Madrid funcione sin traducciones de nombres, campos legacy ni duplicación de fuentes de verdad. El detalle machine-readable de cada `fieldId`, tipo, obligatoriedad e índice está en [`tests/cms-schema-canonical.json`](../tests/cms-schema-canonical.json); ese archivo debe acompañar cualquier migración o creación de colecciones.

> El contrato describe la alineación con el código versionado. No certifica cumplimiento fiscal, laboral o de protección de datos, ni sustituye la comprobación de diferencias con el CMS real antes de cambiar un sitio.

Los tipos del contrato utilizan los tipos nativos de Wix Data. Los campos de negocio no incluyen los campos de sistema `_id`, `_createdDate`, `_updatedDate` y `_owner`, que Wix administra automáticamente. Los IDs deterministas utilizados por el backend se conservan como `_id` de los documentos correspondientes.[1]

## Convenciones canónicas

| Regla | Definición |
|---|---|
| Zona horaria operativa | `Europe/Madrid`. `diaKey` usa `YYYY-MM-DD` y `mesKey` usa `YYYY-MM`. |
| Importes | `NUMBER`; el backend redondea a dos decimales antes de persistir movimientos y proyecciones. |
| Fechas | `DATETIME` en UTC; los campos `*Local` son `TEXT` sin sufijo `Z` para interfaz y trazabilidad local. |
| Identificadores | `TEXT`; los IDs de Wix Bookings, eCommerce, recursos, tokens y trazas no se transforman en números. |
| Objetos | `OBJECT` para payloads variables y metadatos acotados; no se crean campos planos redundantes cuando ya existe un objeto canónico. |
| Índices | El `_id` tiene índice inherente. Los índices del documento JSON se deben crear en QA tras comprobar que los datos actuales no contienen duplicados. |

## Colecciones activas

| Dominio | Colección | Función canónica | Índices de negocio principales |
|---|---|---|---|
| Catálogo | `Import2` | Servicios simples y duales | `serviceId` único; `slugUrl` único; `linkFases` |
| Catálogo | `AddonsCatalogo` | Complementos de Bookings | `bookingsAddonId` único; `activo` |
| Reservas | `DualSlotCache` | Parejas F1/F2 temporales | `phaseOneServiceId + dateYMD`; `expiresAt`; `pairToken` único |
| Reservas | `AvailabilityDaysCache` | Caché de días disponible | `expiresAt`; `serviceId + yearMonth` |
| Reservas | `AvailabilitySlotsCache` | Caché técnica de slots | `expiresAt`; clave compuesta del rango y recurso |
| Reservas | `CitasF2` | Proyección durable de bookings | `bookingId` único; `fechaYmdMadrid + status + resourceId`; `pairToken`; `resourceId + startDate` |
| Reservas | `BookingTransactions` | Idempotencia de la Saga | `pairToken` único; `status + updatedAt` |
| Reservas | `MM_LOCKS` | Mutexes de slots y ledger | `slotKey` único; `expiresAt` |
| Recuperación | `PendingCompensations` | Reintentos de ledger | `kind + status + createdAt`; `transactionId` único; `orderId` |
| Caja | `movimientoCaja` | Ledger fiscal inmutable | `seqGlobal` único; `transactionId` único; `diaKey + seqGlobal`; `mesKey + seqGlobal` |
| Caja | `cajaActual` | Proyección singleton de caja | `_id = CAJA_PRINCIPAL`; `diaKey` |
| Caja | `HISTORICO_CIERRES_Z` | Cierres diarios derivados | `_id = Z_{diaKey}`; `diaKey` único |
| Caja | `RESUMEN_CONTEO_X` | Arqueos append-only | `diaKey + fechaConteo` |
| Caja | `SecuenciaTickets` | Contador global de tickets | `_id = GLOBAL` |
| Laboral | `REGISTRO_HORARIO` | Fichajes append-only | `resourceId + fechaHora`; `resourceId + diaKey + fechaHora`; `mesKey + resourceId` |
| Inventario | `PRODUCTOS_VENTA` visible / `InventarioProductos` técnico | Catálogo comercial y stock interno esperado | `sku` único; `wixProductId` único; `stockExpected` |
| Inventario | `movimientoInventario` | Ledger interno y espejo eCommerce | `movementToken` único; `sku + createdAt`; `referenceId`; `movementType + createdAt` |
| Inventario | `ConciliacionStockWix` | Cola de conciliación con Stores/POS | `status + createdAt`; `sku + status`; `movementId` único |
| Auditoría | `MM_AUDIT_LOG` | Eventos técnicos append-only | `fechaLog`; `traceId`; `level + fechaLog` |
| Integración | `m365SyncLog` | Evidencia de sincronización externa | `fechaSync`; `estado + fechaSync`; `tipo + fechaSync` |

## Reglas de alineación por dominio

### Reservas

`CitasF2` usa **solo** `contactDetails` como objeto de contacto. No se deben crear ni rellenar en paralelo campos planos de PII como `clienteNombre`, `clienteEmail` o `clienteTelefono`, porque el backend no los consume y ello duplica datos personales. Las reservas duales comparten `pairToken`; por esa razón `pairToken` se indexa pero **no** es único en `CitasF2`. `bookingId` sí es único y cada fase se guarda con un `_id` determinista `booking_{bookingId}`.

`DualSlotCache` usa `phaseOneServiceId`, `phaseTwoServiceId`, `slotF1`, `slotF2`, `resourceId`, `dateYMD` y `expiresAt`. El nombre heredado `bookingIdf1` no pertenece al contrato canónico. `serviceId` solo se admite como compatibilidad de invalidación histórica y no debe sustituir el nombre de fase principal.

### Caja y fiscalidad operativa

`movimientoCaja` es la única fuente de verdad contable del runtime. Sus campos obligatorios incluyen la secuencia, importes, hash previo, hash de cadena, firma, ticket, forma de pago, trazabilidad y fecha. `cajaActual` es una **proyección derivada** y el backend la vuelve a calcular desde el ledger; nunca se debe editar como ajuste contable.

Los cierres Z y los conteos X son documentos separados. `HISTORICO_CIERRES_Z` es idempotente por día y `RESUMEN_CONTEO_X` registra efectivo contado, efectivo teórico, descuadre y estado de cuadre. `SecuenciaTickets` solo tiene el documento `GLOBAL` con el objeto `data`, donde `data.seqGlobal` y `data.{YYYY}` son números.

### Laboral

`REGISTRO_HORARIO` usa `resourceId`, `resourceName`, `tipoFichaje`, `diaKey`, `mesKey`, `hora`, `fechaHora`, `ipDispositivo`, `motivoAjuste` y `registradoPor`. `hora` usa el formato `HH:mm:ss`. Para `AJUSTE`, el backend y el hook CMS exigen `motivoAjuste`; los registros son inmutables salvo una migración administrativa explícitamente autorizada.

### Inventario

`PRODUCTOS_VENTA` es el nombre comercial visible del catálogo; su ID técnico estable es `InventarioProductos`. `COLLECTIONS.PRODUCTOS_VENTA` es el alias canónico de código y `COLLECTIONS.INVENTARIO_PRODUCTOS` se conserva como alias de compatibilidad. `InventarioProductos.stockExpected` es el campo que el backend actualiza. Los movimientos utilizan `movementToken`, `quantity`, `quantityDelta`, `stockBefore`, `stockAfter`, `movementType`, `referenceId`, `orderId`, `refundId` y marcas de reconciliación. `ConciliacionStockWix` usa `movementId`, `movementToken`, `status`, `quantityDelta`, `appliedAt` y `appliedByNote`; no debe traducirse a nombres alternativos como `delta` o `sourceMovementId`.

## Correcciones y exclusiones de migración

| Elemento detectado | Decisión canónica | Acción segura en QA |
|---|---|---|
| `MapaStaff` como colección | Colección privada activa, fuente de correspondencia entre miembros Wix, recursos Bookings y selección de personal. | Completar su esquema, restringir permisos y enlazar `SERVICIOS_CITA.personalDisponible`; no usar el secreto `MAPA_STAFF`. |
| `ProveedoresInventario` | Declaración histórica sin lecturas ni escrituras activas. | No crearla para QA hasta que exista un flujo de proveedor que la consuma. |
| `bookingIdf1` | Nombre legacy no canónico. | Migrar a `bookingIdF1` solo si la lectura del CMS confirma que hay datos que deben conservarse; no hacer renombrado destructivo. |
| PII plana en `CitasF2` | `contactDetails` es la fuente canónica. | No duplicar datos. Evaluar campos legacy con inventario y política de retención antes de borrarlos. |
| Campos legacy de fichaje | El runtime usa `resourceId`, `resourceName`, `tipoFichaje`, `ipDispositivo`, `motivoAjuste`. | Migrar datos antiguos antes de retirar campos legacy; no borrar por inferencia. |

## Aplicación en QA

La creación o adecuación se ejecuta por fases. Primero se exporta el esquema y los datos existentes; después se crean campos faltantes sin eliminar nada; a continuación se crean índices no únicos y se revisan duplicados antes de habilitar los únicos. Solo después de pruebas de Local Editor y de flujos controlados se puede retirar un campo legacy confirmado como sin uso.

> Los permisos de colecciones, los cambios de índice y las mutaciones de datos son operaciones de configuración separadas. El contrato no los aplica automáticamente al sitio y no sustituye una copia de seguridad ni una revisión de accesos antes del despliegue.

## Referencias

[1] [Wix CMS: Get Data Collection](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/get-data-collection)
