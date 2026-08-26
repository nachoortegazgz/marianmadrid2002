# Catálogo de Procesos y Registro de Movimientos de Caja

## Alcance

Este catálogo enumera los procesos que el runtime actual puede registrar en `movimientoCaja`, los procesos de recuperación que pueden crear el mismo asiento posteriormente y los controles que documentan caja sin generar un nuevo ingreso o gasto. Su objetivo es que cada operación tenga una referencia de negocio, una referencia Wix cuando exista, una firma de integridad y una evidencia de estado.

> `movimientoCaja` es el ledger inmutable y la fuente de verdad contable del runtime. `cajaActual`, los conteos X y los cierres Z son proyecciones o evidencias derivadas; no sustituyen ni corrigen directamente un asiento de ledger.

## Campos comunes obligatorios en todo asiento

| Grupo | Field ID | Registro requerido |
|---|---|---|
| Identidad técnica | `_id`, `seqGlobal`, `transactionId`, `traceId` | ID determinista del asiento, secuencia global, identificador idempotente de la transacción y traza transversal. |
| Proceso | `tipoMovimiento`, `concepto`, `origen` | Tipo de negocio, descripción legible y ruta que originó el asiento. |
| Importe | `importeTotal`, `signo`, `importeContable`, `baseImponible`, `cuotaIva`, `tasaIva` | Importe absoluto, dirección, importe firmado y desglose calculado por servidor. |
| Integridad | `numTicketFactura`, `prevHash`, `hashCadena`, `firmaDigital` | Ticket, eslabón previo, hash del asiento y firma de la cadena. |
| Medio y período | `formaPago`, `diaKey`, `mesKey`, `fechaCreacion` | Efectivo, tarjeta, Bizum u online; período Madrid y fecha de creación. |
| Relación | `reservaIdVinculada`, `orderId`, `refundId`, `resourceId` | Booking o bookings vinculados, pedido Wix, devolución Wix y recurso/canal responsable. |

`orderId` es obligatorio cuando el proceso nace de eCommerce. `refundId` es obligatorio cuando el evento nativo identifica una devolución. `reservaIdVinculada` puede contener una lista de bookings separada por comas si una orden incluye varias reservas. Los campos no aplicables se persisten como `null`, no se inventan identificadores.

## Procesos que crean movimientos de caja

| Nº | Proceso | Disparador y validación | Tipo y origen | Detalles adicionales a registrar |
|---:|---|---|---|---|
| 1 | Pago online de reserva simple | Evento Wix eCommerce con pedido en estado pagado; la línea pertenece a Wix Bookings. | `VENTA_ONLINE`; `WIX_ECOM_PAYMENT_WEBHOOK`. | `orderId`, `transactionId=ORDER-{orderId}`, `reservaIdVinculada`, importe final del pedido, líneas de reserva detectadas, estado `PENDING_LEDGER` y posterior `PAID` en `CitasF2`. |
| 2 | Pago online de reserva dual | Mismo evento pagado, con dos bookings F1/F2 enlazados. | `VENTA_ONLINE`; `WIX_ECOM_PAYMENT_WEBHOOK`. | IDs de ambas fases en `reservaIdVinculada`, `pairToken` y estados de ambas `CitasF2` dentro de las proyecciones; un solo asiento para la orden. |
| 3 | Venta online de producto Wix Stores | Evento Wix eCommerce con pedido pagado y líneas sin Bookings. | `VENTA_ONLINE`; `WIX_ECOM_PAYMENT_WEBHOOK`. | `orderId`, `transactionId`, total de pedido o suma de líneas si Wix no aporta total, canal `online`; inventario espejo por SKU, producto, cantidad y referencia de pedido en `movimientoInventario`. |
| 4 | Pedido online mixto | Evento Wix eCommerce pagado con reservas y productos. | `VENTA_ONLINE`; `WIX_ECOM_PAYMENT_WEBHOOK`. | Total único de pedido, IDs de bookings vinculados, `orderId`, líneas detectadas y movimientos de inventario de las líneas de producto. No se crea un segundo asiento por el mismo pedido. |
| 5 | Confirmación administrativa de pago de reserva | Método `confirmPayment` de administración; valida que la orden Wix existe, está pagada y coincide con reservas e importe. | `VENTA_ONLINE`; `ADMIN_ORDER_CONFIRMATION`. | `orderId`, bookings verificados, importe validado por servidor, `transactionId=ORDER-{orderId}`, resultado idempotente y transición `PENDING_LEDGER -> PAID` en `CitasF2`. |
| 6 | Venta presencial o ajuste autorizado | Método `registerManualTransaction`, con permiso de cajero y confirmación en interfaz. | `VENTA_EFECTIVO`, `VENTA_TARJETA`, `VENTA_BIZUM`, `REEMBOLSO` o `AJUSTE`; `ONLY_STAFF_MANUAL`. | Concepto específico, importe, forma de pago, tipo de movimiento, recurso/TPV responsable, `traceId` y una `transactionId` manual única. Para ajustes, el concepto debe expresar el motivo operativo. |
| 7 | Devolución online total o parcial | Evento Wix eCommerce de devolución con importe positivo y `refundId` estable. | `REEMBOLSO`; `WIX_ECOM_REFUND_WEBHOOK`. | `orderId`, `refundId`, `transactionId=REFUND-{orderId}-{refundId}`, importe negativo contable, asiento original consultado, bookings asociados y estado `REFUNDED` o `PARTIALLY_REFUNDED` según total devuelto. |
| 8 | Recuperación de pago cuyo ledger falló | Tras un evento pagado o confirmación validada, la escritura del ledger falla. | Tipo original; `FISCAL_RECOVERY` o el origen original conservado. | Documento `PendingCompensations` con `kind`, `status`, `attempts`, importes, método, pedido, devolución si aplica, bookings, concepto, origen, error, fase y fechas de reintento. El job crea el asiento con la misma `transactionId`. |
| 9 | Recuperación de devolución anterior al asiento de venta | Llega el evento de reembolso sin que exista todavía `ORDER-{orderId}` en el ledger. | `REEMBOLSO`; `WIX_ECOM_REFUND_WEBHOOK` y fase `WAIT_FOR_ORIGINAL_ORDER_LEDGER`. | `orderId`, `refundId`, importe negativo, error `ORIGINAL_ORDER_LEDGER_MISSING`, referencia al asiento original esperado y reintento diferido. No se emite el reembolso en ledger hasta encontrar la venta original. |

## Procesos de control que no crean un movimiento nuevo

| Proceso | Colección de evidencia | Detalles que deben registrarse | Relación con caja |
|---|---|---|---|
| Proyección de caja diaria | `cajaActual` | `diaKey`, saldos por medio de pago, saldo total, número de operaciones, estado, apertura/cierre y última actualización. | Se recalcula desde `movimientoCaja` después de un asiento o cierre. |
| Conteo X | `RESUMEN_CONTEO_X` | Día, efectivo contado, efectivo teórico, descuadre, estado de cuadre, fechas y `traceId`. | Evidencia de arqueo; no modifica el ledger. |
| Cierre Z | `HISTORICO_CIERRES_Z` | Día, totales por medio de pago, total general, operaciones, estado cerrado, fecha y `traceId`. | Snapshot idempotente del ledger; no crea una venta o ajuste independiente. |
| Verificación de integridad | `MM_AUDIT_LOG` cuando hay incidencia | Día, número de asientos, inconsistencias, trazas y resultado. | Comprueba secuencia, hash previo y firma; no modifica el ledger válido. |
| Cancelación de pedido sin devolución | Auditoría y estados de entidad Wix | Pedido, estado, motivo y traza disponibles en el evento. | No genera asiento de caja por sí sola. Solo una devolución confirmada genera `REEMBOLSO`. |
| Cancelación de reserva sin devolución | Wix Bookings y `CitasF2` | Booking, revisión, estado, motivo, fecha y traza. | No genera asiento hasta que exista una devolución o ajuste económico confirmado. |

## Estados y garantías de recuperación

| Fase | Evidencia | Resultado esperado |
|---|---|---|
| Confirmación nativa | Pedido Wix en `PAID`/equivalente o devolución con ID estable. | Se procesa una vez por `transactionId`. |
| Escritura de ledger | `movimientoCaja` con firma y cadena válidas. | Idempotencia por `_id` y `transactionId`; no hay duplicado por reintento de webhook. |
| Fallo transitorio | `PendingCompensations` y `MM_AUDIT_LOG`. | Se conserva el detalle completo y se reintenta por Job UTC. |
| Recuperación completada | Estado `COMPLETED`, intentos y fecha. | Se crea el mismo asiento lógico; las reservas pasan a `PAID` cuando corresponde. |
| Fallo terminal | Estado `FAILED`, `alertRequired`, `failedAt`, `lastError`. | Revisión administrativa sin editar ni borrar el ledger existente. |

## Exclusiones deliberadas

El catálogo no trata una reserva creada con pago presencial como ingreso de caja hasta que una persona autorizada registre la venta presencial o exista una señal de pago confirmada. Tampoco registra como movimiento un simple cambio de estado de agenda, inventario o consulta del asistente IA. Estos procesos pueden dejar auditoría o proyecciones, pero no sustituyen una operación económica verificable.

## Referencias

[1] [Wix: Working with Payments, Transactions, and Orders](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/payments/working-with-payments-transactions-and-orders)

[2] [Wix: Create Checkout](https://dev.wix.com/docs/velo/apis/wix-ecom-backend/checkout/create-checkout)
