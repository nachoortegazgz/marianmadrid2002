# Verificación de Cobertura Transaccional

**Fecha:** 25 de agosto de 2026  
**Sitio auditado:** `188bed94-177c-4bc9-a9f0-35080d874f3e` — `https://www.marianmadrid.es/`  
**Alcance:** revisión de código publicado, esquema CMS real, lecturas de colecciones y simulaciones deterministas. No se crearon cobros, pedidos, devoluciones ni asientos comerciales para esta auditoría.

> **Alcance fiscal.** Este es un dictamen técnico de trazabilidad, no una certificación fiscal, contable, SIF o VERI*FACTU. La activación de la contabilidad derivada, la configuración de cuentas, las series, el régimen tributario y cualquier presentación deben ser revisados por gestoría antes de utilizarse con ese fin.

## 1. Resultado ejecutivo

La arquitectura publicada **cubre los flujos transaccionales previstos** mediante un ledger de caja inmutable, proyecciones de caja y cierre, estado de reservas, inventario y colas de recuperación. La auditoría detectó dos brechas de esquema y una de trazabilidad de devolución de stock; fueron corregidas sin modificar registros existentes.

| Resultado | Evidencia |
|---|---|
| Pagos locales, online, producto puro y pedidos mixtos | `registerBookingPayment()` recibe importe, medio, concepto, origen, pedido, devolución, reservas, empleado, ID de transacción y traza; `wixEcom_onOrderPaymentStatusUpdated()` lo invoca para pedidos Wix pagados. |
| Reembolsos | El webhook comprueba el asiento original, registra un movimiento negativo identificable por `REFUND-{orderId}-{refundId}`, o lo envía a recuperación si la venta original aún no está disponible. |
| Inventario de venta y devolución | La venta online crea un movimiento nativo negativo. Desde esta revisión, una devolución crea un movimiento positivo idempotente **solo** cuando Wix confirma reposición de stock mediante `restockInfo`. |
| Persistencia de cierres Z | `HISTORICO_CIERRES_Z` tiene ahora los 31 campos que el cierre publicado genera: secuencias, hashes, firmas, totales, IVA, integridad y trazas. |
| Contabilidad derivada | Las colecciones y el proyector están publicados, pero no se generan asientos hasta que exista un mapa de cuentas activo y validado por gestoría. Este bloqueo es deliberado. |

## 2. Cobertura por tipo de transacción

| Flujo | Registro primario | Registros derivados o de apoyo | Enlaces persistidos | Estado de verificación |
|---|---|---|---|---|
| Reserva simple o dual | `CitasF2`, `BookingTransactions` | locks, cachés de disponibilidad y compensaciones | `bookingId`, `pairToken`, `serviceId`, `resourceId`, fechas, estado y `traceId` | Simulación determinista superada. |
| Pago presencial de servicio o producto | `movimientoCaja` | `cajaActual`, posibles `ASIENTOS_CONTABLES` y `LINEAS_ASIENTO_CONTABLE` | secuencia, ticket, importe, base, IVA, medio de pago, empleado, concepto, origen, transacción, hash y firma | Código y contrato verificados. |
| Pedido online de reserva | `movimientoCaja` | `CitasF2`, `movimientoInventario` cuando aplique, cola de recuperación | `orderId`, `transactionId`, reservas vinculadas, estado de pago y `traceId` | Simulación y escritura de webhook verificadas. |
| Producto online sin reserva | `movimientoCaja` | `movimientoInventario` | `orderId`, `transactionId`, SKU, producto, cantidad, `wixProductId` y traza | Simulación y escritura de webhook verificadas. |
| Pedido mixto de reservas y productos | `movimientoCaja` | `CitasF2`, `movimientoInventario` | Un pedido/ticket financiero y enlaces a reservas y productos | Simulación determinista superada. |
| Reembolso total o parcial | `movimientoCaja` negativo | `CitasF2`, `PendingCompensations`, `MM_AUDIT_LOG`; inventario si Wix confirma reposición | `orderId`, `refundId`, transacción de reembolso, referencia de asiento original y traza | Simulación superada; inventario reforzado en esta publicación. |
| Cancelación de reserva/pedido | Estado de `CitasF2` o pedido Wix | Auditoría cuando proceda | ID de reserva/pedido y traza | La cancelación no inventa un asiento financiero: el reembolso es un flujo separado. |
| Consumo profesional de stock | `movimientoInventario` | `InventarioProductos`, `ConciliacionStockWix` | SKU, antes/después, actor, motivo, referencia y traza | Código revisado. |
| Recepción de proveedor | `movimientoInventario` | `InventarioProductos`, `ConciliacionStockWix` | SKU, cantidad, proveedor/referencia operativa, actor y traza | Código revisado. |
| Arqueo X y cierre Z | `RESUMEN_CONTEO_X`, `HISTORICO_CIERRES_Z` | `cajaActual` | día, totales, descuadre, secuencias, hashes, firmas, IVA y traza | Esquema Z verificado contra código. |

## 3. Campos primarios del ledger financiero

La colección `movimientoCaja` es la fuente primaria de caja. Su esquema real conserva los siguientes datos mínimos: `seqGlobal`, `tipoMovimiento`, `concepto`, `origen`, `orderId`, `refundId`, `importeTotal`, `signo`, `importeContable`, `baseImponible`, `cuotaIva`, `tasaIva`, `numTicketFactura`, `prevHash`, `hashCadena`, `firmaDigital`, `formaPago`, `reservaIdVinculada`, `transactionId`, `resourceId`, `diaKey`, `mesKey`, `traceId` y `fechaCreacion`.

Estos valores permiten construir las proyecciones de caja, informes de IVA, reconstrucción temporal, referencias de pedido/reembolso, controles de idempotencia y el cierre Z. Los hooks de CMS bloquean actualización y eliminación directa del ledger, salvo migración administrativa autorizada.

## 4. Correcciones aplicadas durante la auditoría

| Corrección | Cambio aplicado | Efecto |
|---|---|---|
| Cierre Z incompleto en CMS | Se añadieron 21 campos no destructivos a `HISTORICO_CIERRES_Z`. | Los futuros cierres conservarán todos los detalles que `cajas.web.js` ya genera. |
| Devolución de inventario no explícita | Se publicó `recordOnlineInventoryRefundInternal()`. | Crea una entrada positiva idempotente si Wix confirma `ALL_ITEMS` o `SOME_ITEMS` en `restockInfo`. |
| Enlace de inventario a venta/reembolso | Se añadieron `orderId` y `refundId` a `movimientoInventario`. | Cada movimiento online puede vincularse directamente a su pedido y devolución Wix. |
| Protección contra falsos ajustes | No se genera devolución de stock si Wix no confirma reposición. | Evita aumentar inventario interno por una devolución financiera sin retorno físico. |

El evento oficial de reembolso puede informar las líneas y cantidades devueltas, así como los efectos laterales de reposición. El código publicado utiliza exclusivamente ese indicador para la entrada positiva de inventario, en lugar de asumir que todo reembolso devuelve mercancía al stock.[1]

## 5. Lectura real del CMS durante la auditoría

| Colección | Registros observados | Interpretación |
|---|---:|---|
| `CitasF2` | 0 | No había reservas durables para comprobar en el momento de la lectura. |
| `BookingTransactions` | 2 | Persisten pruebas de idempotencia/resultado de reservas. |
| `movimientoCaja` | 0 | No hay asientos comerciales reales que permitan comprobar una cadena histórica en producción. |
| `PendingCompensations` | 0 | No hay recuperaciones pendientes observadas. |
| `movimientoInventario` | 0 | No hay movimientos comerciales de stock observados. |
| `ConciliacionStockWix` | 0 | No hay conciliaciones pendientes observadas. |
| `HISTORICO_CIERRES_Z` | 10 | Existen cierres históricos; no se reescribieron para preservar su integridad. |
| `ASIENTOS_CONTABLES` y `LINEAS_ASIENTO_CONTABLE` | 0 | El mapa de cuentas está vacío/no validado, por lo que el proyector permanece intencionadamente inactivo. |
| Libros IVA, mayor y eventos del sistema | 0 | Estructura preparada; no se activan sin configuración contable y fiscal validada. |

Por ello, la verificación es **completa respecto al diseño, al código publicado, a los esquemas reales y a las simulaciones**, pero no sustituye una evidencia de producción de cada caso comercial. La primera operación real de cada tipo debe revisarse mediante sus identificadores (`transactionId`, `orderId`, `refundId`, `traceId`, `movementToken`) antes de considerar cerrada una validación operativa.

## 6. Pruebas ejecutadas

Las validaciones locales publicadas finalizaron correctamente:

| Batería | Resultado |
|---|---:|
| Verificación estructural y contractual | 12/12 superadas |
| Simulaciones críticas deterministas | 6/6 superadas |
| Sincronización de tipos Wix | Correcta |
| `git diff --check` | Sin errores |
| Esquema real de `HISTORICO_CIERRES_Z` | 31/31 campos requeridos; 0 ausentes |

## 7. Límites y siguiente evidencia necesaria

El sistema no debe declararse certificado al 100% por un análisis de código. Antes de que el proyector contable genere asientos, se debe cargar y validar en `PLAN_CUENTAS_CONTABLES` un mapa de cuentas por categoría de movimiento, con las cuentas Debe, Haber e IVA y el visto bueno de gestoría. También debe confirmarse si existen obligaciones particulares de SII, recargo de equivalencia, IRPF, facturas completas o simplificadas, bienes de inversión u operaciones intracomunitarias.

> La siguiente verificación operativa segura consiste en revisar, después de la primera venta y de la primera devolución reales, que el mismo `orderId` o `refundId` aparece de forma coherente en el pedido nativo Wix, `movimientoCaja`, `movimientoInventario`, la cola de recuperación —si se hubiera usado— y el cierre Z correspondiente.

## Referencias

[1] [Wix, *Order Transactions Refund Completed*](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/orders/order-transactions/order-transactions-refund-completed).

[2] [Wix, *Create Data Collection Field*](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/create-data-collection-field).

[3] [Wix, *Query Data Items*](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/query-data-items).
