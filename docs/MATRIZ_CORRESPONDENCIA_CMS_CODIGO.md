# Matriz de Correspondencia CMS–Código y Nomenclatura Objetivo

**Versión:** 1.0 — 25 de agosto de 2026
**Ámbito:** colecciones personalizadas del sitio Marian Madrid y sus dependencias Velo.
**Propósito:** definir la nomenclatura legible de CMS y la ruta de corrección del código sin alterar datos, índices, flujos de reservas, movimientos de inventario ni el ledger de caja.

> **Alcance normativo.** La AEAT exige que un Sistema Informático de Facturación preserve integridad, conservación, accesibilidad, legibilidad, trazabilidad e inalterabilidad de los registros de facturación. La denominación interna de una colección o campo CMS no sustituye el formato de los registros de facturación exigido por la normativa ni acredita por sí sola cumplimiento SIF o VERI*FACTU. Esta matriz adopta terminología española clara y trazable para facilitar control interno y revisión profesional. [1] [2]

## 1. Reglas de nomenclatura

| Elemento | Regla objetivo | Ejemplo correcto | Decisión de compatibilidad |
|---|---|---|---|
| Nombre visible de colección | **MAYÚSCULAS_CON_GUIONES_BAJOS**, español, singular o plural según su contenido. | `PRODUCTOS_VENTA`, `MOVIMIENTOS_CAJA` | Se puede modificar de forma visual sin alterar el ID técnico si Wix acepta el parche de colección. |
| ID técnico de colección | Se conserva durante la fase de compatibilidad. | `InventarioProductos` | No se renombra en producción. Cambiarlo requeriría crear una colección nueva, migrar datos y actualizar todas las consultas. |
| Clave técnica de campo | **camelCase en español**, sin espacios, sin tildes ni `ñ`, semántica de negocio. | `nombreProducto`, `importeIvaIncluido`, `fechaCreacion` | Las claves existentes se tratan como legacy hasta que exista un campo nuevo, datos migrados y código dual probado. |
| Nombre visible de campo | Español legible con mayúscula inicial, separado de la clave técnica. | `Nombre de producto` | Puede normalizarse sin cambiar la clave técnica existente mediante el parche de campo documentado por Wix. [3] |
| Campos Wix del sistema | No se cambian. | `_id`, `_createdDate`, `_updatedDate`, `_owner` | Son gestionados por Wix y quedan fuera de la matriz de migración. |
| Valores de negocio | Mayúsculas con `_` solo para enum técnico cuando el código ya lo requiere. | `VENTA_ONLINE`, `RECEPCION_PROVEEDOR` | No traducir ni reescribir valores históricos sin una migración específica. |

La operación documentada de Wix para una colección permite actualizar `displayName`, `displayField` y permisos. La operación de campo requiere la `key` existente para localizar el campo y permite, entre otros cambios, modificar su `displayName`; por ello la vía segura es **no tratar una key existente como renombrable**. Para una nueva clave técnica se crea el nuevo campo, se migran valores, se valida lectura dual y únicamente después se retira el campo legacy en QA. [3] [4]

## 2. Estado auditado que condiciona la migración

La lectura administrativa del CMS confirmó 42 colecciones. En el dominio de inventario existen actualmente los IDs técnicos `InventarioProductos`, `movimientoInventario` y `ProveedoresInventario`. Sus nombres visibles ya son `PRODUCTOS_VENTA`, `MOVIMIENTO_INVENTARIO` y `PROVEEDORES_LISTA`, respectivamente. `InventarioProductos` contiene un único registro, la taza personalizable de Wix Stores; `ProveedoresInventario` no contenía registros en el momento de la auditoría.

> La ausencia de registros en `ProveedoresInventario` impide usarla todavía como fuente autorizada para escoger proveedores y cargar el catálogo de 20 productos. El catálogo permanece en fase de propuesta hasta que exista una lista de proveedores aprobada o se aporte su fuente.

## 3. Matriz de colecciones activas

| Constante en `internalConfig.js` | ID técnico actual | Nombre visible objetivo | Estado de código | Acción CMS permitida ahora |
|---|---|---|---|---|
| `SERVICIOS_CITA` | `Import2` | `SERVICIOS_CITA` | Activo | Normalizar solo el nombre visible. |
| `ADDONS_CATALOGO` | `AddonsCatalogo` | `EXTRAS_CATALOGO` | Activo | Ya alineado visualmente; no cambiar ID. |
| `DUAL_CACHE` | `DualSlotCache` | `CACHE_TRAMOS_DUALES` | Activo | Cambiar únicamente nombre visible, tras exportar esquema. |
| `DAYS_CACHE` | `AvailabilityDaysCache` | `CACHE_DISPONIBILIDAD_DIAS` | Activo | Cambiar únicamente nombre visible. |
| `SLOTS_CACHE` | `AvailabilitySlotsCache` | `CACHE_DISPONIBILIDAD_TRAMOS` | Activo | Cambiar únicamente nombre visible. |
| `CITAS` | `CitasF2` | `CITAS_RESERVAS` | Activo | Cambiar únicamente nombre visible; preservar PII y referencias. |
| `TRANSACTIONS` | `BookingTransactions` | `TRANSACCIONES_RESERVAS` | Activo | Cambiar únicamente nombre visible. |
| `LOCKS` | `MM_LOCKS` | `BLOQUEOS_TECNICOS` | Activo | Cambiar únicamente nombre visible. |
| `COMPENSATIONS` | `PendingCompensations` | `COMPENSACIONES_PENDIENTES` | Activo | Cambiar únicamente nombre visible. |
| `MOVIMIENTOS_CAJA` | `movimientoCaja` | `MOVIMIENTOS_CAJA` | Ledger activo | Solo nombre visible; no cambiar ID, campos, índices ni documentos en producción. |
| `CAJA_ACTUAL` | `cajaActual` | `CAJA_ACTUAL` | Proyección activa | Ya semánticamente alineado; solo mejorar etiquetas visibles si procede. |
| `HISTORICO_CIERRES_Z` | `HISTORICO_CIERRES_Z` | `HISTORICO_CIERRES_Z` | Activo | Sin cambio de ID; validar el esquema antes de cambiar etiquetas. |
| `CONTEOS_X` | `RESUMEN_CONTEO_X` | `RESUMEN_CONTEOS_X` | Activo | Cambio visual compatible. |
| `CONTADORES_FISCALES` | `SecuenciaTickets` | `SECUENCIA_TICKETS` | Activo | Cambio visual compatible. |
| `REGISTRO_HORARIO` | `REGISTRO_HORARIO` | `REGISTRO_HORARIO` | Activo | Ya alineado visualmente. |
| `INVENTARIO_PRODUCTOS` | `InventarioProductos` | `PRODUCTOS_VENTA` | Activo | Ya alineado visualmente; la migración de campos debe ser dual. |
| `MOVIMIENTO_INVENTARIO` | `movimientoInventario` | `MOVIMIENTOS_INVENTARIO` | Activo | Cambio visual compatible. |
| `CONCILIACION_STOCK_WIX` | `ConciliacionStockWix` | `CONCILIACION_STOCK_WIX` | Activo | Cambio visual compatible. |
| `AUDIT_LOG` | `MM_AUDIT_LOG` | `AUDITORIA_TECNICA` | Activo | Cambio visual compatible, sin alterar retención. |
| `SYNC_LOG` | `m365SyncLog` | `REGISTRO_SINCRONIZACION_M365` | Activo | Cambio visual compatible. |

La colección `MapaStaff` es una colección privada activa: resuelve la correspondencia entre miembros Wix, recursos Bookings y la selección de `SERVICIOS_CITA.personalDisponible`. `ProveedoresInventario` no es consumida por el runtime actual: puede conservarse con nombre visible `PROVEEDORES_LISTA` y convertirse en fuente aprobada solo tras definir un flujo propietario. Las colecciones `WIX_APP`, como Blog, Bookings, Forms o Campaign Manager, no se renombran ni se traducen: sus contratos pertenecen a Wix.

## 4. Matriz de campos: dominio de inventario

La siguiente tabla es la guía obligatoria para corregir `src/backend/inventario.web.js`, el contrato `tests/cms-schema-canonical.json` y el futuro importador de catálogo. No se modifica todavía ninguna key real del CMS.

| Campo actual CMS / código | Clave objetivo futura | Nombre visible objetivo | Uso actual | Estrategia de corrección |
|---|---|---|---|---|
| `sku` | `sku` | `SKU` | Búsqueda e identidad comercial | Conservar. |
| `productName` | `nombreProducto` | `Nombre de producto` | Inventario, movimientos y cola | Añadir campo nuevo y lectura dual; conservar legacy hasta migración total. |
| `description` | `descripcionProducto` | `Descripción de producto` | Catálogo | Añadir campo nuevo en la fase de catálogo. |
| `category` | `categoriaProducto` | `Categoría de producto` | Catálogo | Añadir campo nuevo; valores controlados como `MERCHANDISING` y `PELUQUERIA_VENTA`. |
| `collectionName` | `coleccionComercial` | `Colección comercial` | Catálogo | Añadir campo nuevo si la funcionalidad lo requiere. |
| `salePriceTaxIncluded` | `precioVentaIvaIncluido` | `Precio de venta con IVA` | Catálogo | Añadir campo nuevo; no inventar precio. |
| `costExTax` | `costeSinIva` | `Coste sin IVA` | Margen y compras | Añadir campo nuevo; dejar vacío cuando el proveedor no lo publique. |
| `supplier` | `proveedor` | `Proveedor` | Catálogo | Añadir campo nuevo; usar solo proveedor aprobado. |
| `supplierReference` | `referenciaProveedor` | `Referencia del proveedor` | Trazabilidad | Añadir campo nuevo; usar EAN o referencia oficial si se publica. |
| `unitsPerCase` | `unidadesPorCaja` | `Unidades por caja` | Compras | Añadir campo nuevo; vacío si no se conoce. |
| `stockExpected` | `stockEsperado` | `Stock esperado` | Campo operativo actualizado por backend | Lectura/escritura dual obligatoria antes de sustituir; no retirar el existente ahora. |
| `stockMinimo` | `stockMinimo` | `Stock mínimo` | Campo histórico no usado por el dashboard | Definir una sola fuente con `alertaStockBajo` antes de usarlo. |
| `lowStockAlert` | `alertaStockBajo` | `Umbral de stock bajo` | Dashboard | Lectura dual antes de sustituir. |
| `reorderPoint` | `puntoPedido` | `Punto de pedido` | Catálogo | Añadir campo nuevo si se utiliza. |
| `location` | `ubicacion` | `Ubicación` | Catálogo | Añadir campo nuevo; no confundir con `locationCode` de la cola. |
| `wixProductId` | `idProductoWix` | `ID de producto Wix` | Conciliación y pedido online | Lectura dual; no convertir ni fabricar IDs nativos. |
| `wixVariantId` | `idVarianteWix` | `ID de variante Wix` | Conciliación | Lectura dual. |
| `needsWixReconciliation` | `requiereConciliacionWix` | `Requiere conciliación con Wix` | Estado de inventario | Lectura dual. |
| `active` | `activo` | `Activo` | Catálogo | Lectura dual cuando se active la nueva clave. |
| `createdAt` | `fechaCreacion` | `Fecha de creación funcional` | Auditoría de catálogo | Lectura dual; no sustituye `_createdDate`. |
| `updatedAt` | `fechaActualizacion` | `Fecha de actualización funcional` | Auditoría de catálogo | Lectura dual; no sustituye `_updatedDate`. |
| `lastInventoryMovementId` | `idUltimoMovimientoInventario` | `ID del último movimiento de inventario` | Trazabilidad | Lectura dual. |
| `lastInventoryMovementAt` | `fechaUltimoMovimientoInventario` | `Fecha del último movimiento de inventario` | Trazabilidad | Lectura dual. |

## 5. Matriz de campos: movimientos y conciliación de inventario

| Campo actual | Clave objetivo futura | Nombre visible objetivo | Observación de código |
|---|---|---|---|
| `movementToken` | `tokenMovimiento` | `Token de movimiento` | Identificador idempotente; preservar su valor. |
| `movementType` | `tipoMovimiento` | `Tipo de movimiento` | Mantener enum actual. |
| `quantity` | `cantidad` | `Cantidad` | El código puede almacenar signo; documentarlo por tipo de movimiento. |
| `quantityDelta` | `variacionCantidad` | `Variación de cantidad` | Campo canónico para variación neta. |
| `stockBefore` | `stockAnterior` | `Stock anterior` | Trazabilidad de movimiento. |
| `stockAfter` | `stockPosterior` | `Stock posterior` | Trazabilidad de movimiento. |
| `stockExpected` | `stockEsperado` | `Stock esperado` | Debe mantener la misma semántica que el maestro. |
| `referenceId` | `idReferencia` | `ID de referencia` | Pedido, recepción o referencia externa. |
| `reason` | `motivo` | `Motivo` | Descripción breve controlada. |
| `actorEmail` | `correoActor` | `Correo del actor` | Mantener acceso restringido. |
| `actorMemberId` | `idMiembroActor` | `ID del miembro actor` | ID interno Wix; no exponer al cliente. |
| `requiresWixReconciliation` | `requiereConciliacionWix` | `Requiere conciliación con Wix` | Estado técnico. |
| `nativeCommercialMovement` | `movimientoComercialNativo` | `Movimiento comercial nativo` | Diferencia origen Wix frente a consumo/recepción. |
| `wixProductId` | `idProductoWix` | `ID de producto Wix` | No crear IDs ficticios. |
| `wixVariantId` | `idVarianteWix` | `ID de variante Wix` | No crear IDs ficticios. |
| `traceId` | `idTraza` | `ID de traza` | Mantener correlación técnica. |
| `createdAt` | `fechaCreacion` | `Fecha de creación funcional` | No sustituye el campo Wix `_createdDate`. |
| `appliedAt` | `fechaAplicacion` | `Fecha de aplicación` | Solo en cola de conciliación. |
| `appliedByNote` | `notaAplicacion` | `Nota de aplicación` | Solo en cola de conciliación. |

## 6. Correcciones obligatorias antes de cambiar claves CMS

| Prioridad | Corrección | Archivo afectado | Criterio de aceptación |
|---|---|---|---|
| Alta | Completar el contrato real de `InventarioProductos` y `movimientoInventario`. | `tests/cms-schema-canonical.json` | Todos los campos reales usados por el catálogo y el backend quedan declarados con su tipo. |
| Alta | Declarar nombres visibles objetivo y claves objetivo sin alterar las claves vigentes. | Esta matriz y la Biblia operativa | La documentación separa inequívocamente ID, `displayName`, key actual y key futura. |
| Alta | Mantener `COLLECTIONS` con IDs técnicos actuales. | `src/backend/internalConfig.js` | Ninguna consulta deja de localizar su colección tras el cambio visual. |
| Alta | Añadir una capa de lectura dual antes de escribir claves nuevas. | `src/backend/inventario.web.js` | El backend funciona con registros legacy y registros migrados. |
| Media | Crear campos camelCase españoles, migrar registros y validar lectura dual en QA. | CMS QA + script de migración controlada | Conteos, SKU, stock y referencias coinciden antes y después. |
| Media | Cambiar el backend a escritura exclusiva de las claves españolas. | `src/backend/inventario.web.js` | Pruebas estáticas y flujos de consumo/recepción pasan en QA. |
| Baja | Retirar campos legacy vacíos tras backup y evidencia de no uso. | CMS QA primero | Sin lecturas legacy, sin datos pendientes y aprobación explícita. |

## 7. Secuencia de despliegue seguro

Primero se exportan esquema y datos; después se actualizan exclusivamente nombres visibles de colecciones y de campos existentes. El siguiente paso es crear los campos españoles en QA, copiar los datos con un proceso idempotente y comprobar que todos los SKU, importes y referencias han quedado preservados. Solo entonces se despliega la lectura dual, se realizan pruebas de inventario y se habilita la escritura de las claves nuevas. La retirada de las claves legacy se realiza en un cambio posterior y exclusivamente después de una copia de seguridad y de una confirmación específica para el entorno correspondiente.

Para colecciones de caja, registro horario, auditoría, compensación o cierres, la normalización actual se limita a `displayName`. No se migran claves ni se reescriben documentos financieros/laborales durante esta iniciativa. La normativa SIF requiere trazabilidad e inalterabilidad de los registros de facturación; una modificación masiva no planificada de esos documentos sería incompatible con ese objetivo. [1] [2]

## Referencias

[1] [AEAT: Cuestiones generales sobre Sistemas Informáticos de Facturación y VERI*FACTU](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales.html)

[2] [BOE: Orden HAC/1177/2024, especificaciones técnicas y de contenido de los registros de facturación](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-22138)

[3] [Wix CMS: Patch Data Collection Field](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/patch-data-collection-field)

[4] [Wix CMS: Patch Data Collection](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/patch-data-collection)
