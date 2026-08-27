# Evidencia de prueba QA real controlada

**Fecha de ejecución:** 27 de agosto de 2026 (UTC).  
**Entorno:** sitio Wix publicado `marianmadrid.es`.  
**Identificador de trazabilidad:** `QA-REAL-20260827T230205Z`.  
**Autor:** Manus AI.

## Propósito y límites

Esta prueba verificó en datos reales de Wix Bookings la disponibilidad de citas futuras, la creación de anotaciones de agenda para un servicio dual y servicios simples, la elección explícita o ausencia de elección de profesional, el estado nativo de pago pendiente presencial y la cancelación reversible. El participante fue estrictamente técnico, con correo bajo el dominio reservado `.invalid`, sin teléfono, sin SMS y con las notificaciones de participantes desactivadas.

> La prueba no realizó cobro, checkout, pedido eCommerce, factura, devolución, movimiento de inventario ni movimiento de caja. `NOT_PAID` expresa una reserva pendiente de pago presencial; no equivale a un cobro en efectivo, tarjeta o Bizum.

La ejecución se hizo mediante las API nativas de Wix Bookings. Por esta razón, comprueba la capa real de agenda y disponibilidad, pero **no invoca la fachada Velo `processDualBooking`**. En consecuencia, no constituye una prueba directa de la saga, los locks, la idempotencia, `CitasF2`, `BookingTransactions` o la auditoría propia. Esa parte conserva las pruebas deterministas existentes y requiere una ejecución posterior a través del flujo Velo publicado o de su interfaz, actualmente no observable desde el navegador de sandbox.

## Preparación y selección de slots

Se consultó `Import2` en modo de solo lectura y se obtuvo desde Wix Bookings una ventana real de disponibilidad entre el 7 y el 13 de septiembre de 2026. La selección se construyó exclusivamente con slots devueltos por Wix y conservó la validación de disponibilidad; no se forzaron huecos, recursos ni políticas.

| Caso | Servicio y horario local | Selección de recurso | Resultado de disponibilidad previo |
|---|---|---|---|
| Dual, fase 1 | Balayage Signature, 07-09-2026 09:00–09:40 | Específica | Disponible para el recurso técnico seleccionado. |
| Simple dentro del hueco | Retoque de Flequillo Express, 07-09-2026 09:40–09:55 | Específica, mismo recurso | Disponible íntegramente dentro de la exposición. |
| Dual, fase 2 | Fase 2 de Balayage Signature, 07-09-2026 10:20–11:10 | Específica, mismo recurso | Disponible tras un hueco de **40 minutos**. |
| Simple con profesional | Corte de Autor + Styling, 08-09-2026 09:00–10:00 | Específica | Disponible para un recurso distinto, elegido expresamente. |
| Simple sin selección | Corte de Autor + Styling, 08-09-2026 10:00–11:00 | Sin recurso al crear | Disponible sin elección de profesional. |

La prueba del hueco es satisfactoria en la capa nativa: un servicio simple de 15 minutos se creó y confirmó entre la fase 1, que terminaba a las 09:40, y la fase 2, que comenzaba a las 10:20. Por tanto, el hueco de exposición no bloqueó artificialmente al recurso en la agenda nativa.

## Resultado de creación, confirmación y selección

Las cinco anotaciones nativas se crearon inicialmente con estado `CREATED`, se confirmaron con `paymentStatus: NOT_PAID` y se solicitaron sin recordatorio SMS, sin avisos a participantes y sin `selectedPaymentOption` de checkout. La primera y segunda filas componen un único escenario funcional dual.

| Escenario | ID de reserva enmascarado | Creación | Confirmación | Selección observada |
|---|---|---|---|---|
| Dual, fase 1 | `248c93e7-…-0edec50e0f65` | `CREATED`, revisión 1 | `CONFIRMED`, `NOT_PAID`, revisión 2 | `SPECIFIC_RESOURCE` |
| Dual, fase 2 | `25e11434-…-1f86b405f33a` | `CREATED`, revisión 1 | `CONFIRMED`, `NOT_PAID`, revisión 2 | `SPECIFIC_RESOURCE` |
| Simple dentro del hueco | `bd88b1bf-…-3417610f7b1d` | `CREATED`, revisión 1 | `CONFIRMED`, `NOT_PAID`, revisión 2 | `SPECIFIC_RESOURCE` |
| Simple con profesional | `1fd00832-…-fc5f637b737e` | `CREATED`, revisión 1 | `CONFIRMED`, `NOT_PAID`, revisión 2 | `SPECIFIC_RESOURCE` |
| Simple sin selección | `23762fd2-…-17b5d27b12dd` | `CREATED`, revisión 1 | `CONFIRMED`, `NOT_PAID`, revisión 2 | `NO_SELECTION` |

La cita sin selección devolvió correctamente `NO_SELECTION` y no recibió `resourceId` en la respuesta nativa. Wix documenta que, si se omite el recurso al crear, la asignación y la validación se realizan en la confirmación.[1] En este caso, la respuesta continuó sin recurso asignado; el comportamiento demuestra la ausencia de selección, pero no permite afirmar que la lógica Velo propia de selección automática haya sido ejecutada.

## Limpieza, concurrencia y verificación final

La quinta reserva se canceló durante la misma ejecución inicial. Las cuatro restantes recibieron una actualización asíncrona de revisión después de confirmarse, de modo que la primera cancelación con revisión 2 devolvió `INVALID_REVISION`. No se repitió ninguna creación. Se recuperó el estado actual de cada reserva mediante `Query Extended Bookings` y, con la revisión 3 devuelta por Wix, se ejecutó inmediatamente la cancelación silenciosa.

| Verificación final | Resultado |
|---|---|
| Reservas QA creadas | Cinco anotaciones nativas para cuatro escenarios funcionales. |
| Estado final de las cinco reservas | `CANCELED`. |
| Revisión final | Cuatro reservas en revisión 4; una en revisión 4 tras la comprobación independiente. |
| Estado de pago final | `NOT_PAID` en las cinco reservas. |
| Orden eCommerce asociada | Ninguna. |
| Checkout o cargo real | Ninguno. |
| Cancelación de participantes | Silenciosa (`notifyParticipants:false`). |
| Caja `movimientoCaja` vinculada | Cero registros. |
| `CitasF2` vinculadas | Cero registros. |
| `BookingTransactions` con la traza QA | Cero registros. |
| `MM_AUDIT_LOG` con la traza QA | Cero registros. |

La comprobación independiente final devolvió `allCanceled: true` y `hasAnyEcomOrder: false`. La cancelación de una cita actualiza la reserva a `CANCELED` y elimina el evento correspondiente del calendario de Bookings.[2] Las colecciones propias no registraron elementos porque la prueba REST nativa no atravesó la saga Velo; esto es una limitación de cobertura, no una pérdida de trazabilidad del método empleado.

## Hallazgos y acción posterior recomendada

La reserva dual nativa, la ocupación de un hueco de exposición con un simple, la reserva con profesional elegido, la reserva sin selección y la cancelación sin cobro se comportaron de acuerdo con los estados y controles esperados. La recuperación por revisión confirmó que Wix aplica control de concurrencia y que el procedimiento seguro consiste en releer la revisión vigente antes de cancelar si se produce una actualización asíncrona.

El siguiente paso de mayor valor es una única QA adicional del flujo publicado `processDualBooking`, con una herramienta interna autenticada o una interfaz de calendario accesible. Esa prueba debe mantener este mismo alcance no financiero, crear y cancelar de forma compensable, y comprobar que se generan y actualizan `CitasF2`, `BookingTransactions` y `MM_AUDIT_LOG`. No debe introducirse un pago real ni modificarse el catálogo para conseguirlo.

## Referencias

[1]: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-writer-v2/create-booking "Wix Bookings — Create Booking"
[2]: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-writer-v2/cancel-booking "Wix Bookings — Cancel Booking"
[3]: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-writer-v2/confirm-or-decline-booking "Wix Bookings — Confirm Or Decline Booking"
[4]: https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings/bookings-reader-v2/query-extended-bookings "Wix Bookings — Query Extended Bookings"
[5]: https://dev.wix.com/docs/api-reference/business-solutions/bookings/time-slots/time-slots-v2/list-availability-time-slots "Wix Bookings — List Availability Time Slots"
