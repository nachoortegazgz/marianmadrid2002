# Pruebas de integración realistas: reservas, agenda y checkout

**Fecha:** 25 de agosto de 2026  
**Objetivo:** ejercitar los flujos críticos con la mayor fidelidad posible sin crear citas que bloqueen la agenda pública ni ejecutar pagos reales.

> Las pruebas ejecutadas son deterministas y aisladas. No crean datos en Wix, no marcan citas reales en agenda, no generan checkout de producción y no cobran importes. Los resultados prueban los contratos y reglas de los flujos; no equivalen a una certificación del despliegue publicado.

## Capacidad de prueba del entorno

| Vía verificada | Resultado | Consecuencia |
|---|---|---|
| Conector Wix | No disponible: respuesta `403 permission_denied` al cargar configuración y enumerar herramientas. | No se puede acceder a CMS, agenda o checkout de Wix desde esta sesión. |
| Ruta pública `/reserva-online` | Abierta sin autenticación, sin envío de formularios; permaneció visualmente vacía y sin elementos interactivos tras dos comprobaciones. | No fue posible recorrer la interfaz ni crear una reserva de prueba sin riesgo. |
| Simulador local del repositorio | Disponible y ampliado. | Permite probar reglas de agenda, pagos, devoluciones, idempotencia, ledger e inventario sin efectos externos. |

## Escenarios ejecutados

| Área | Escenario | Resultado |
|---|---|---|
| Reserva simple | Alta de una reserva y reintento con el mismo token. | Correcto; un solo efecto y respuesta idempotente. |
| Reserva dual | Fase 1, ventana de exposición y Fase 2 para la misma profesional. | Correcto; se escriben dos fases de agenda. |
| Gap dual | Servicio simple dentro de la ventana de exposición de la reserva dual. | Correcto; la ventana permanece disponible y no se solapa con fases ocupadas. |
| Conflictos | Solape y fallo de segunda fase o persistencia. | Correcto; se rechaza el solape y se compensa cualquier fase creada. |
| Horario pasado | Reserva con inicio igual o anterior al reloj del servidor. | Correcto; rechazada con `SLOT_IN_PAST`. |
| Checkout simulado | Reserva + producto, checkout pendiente y webhook de pago. | Correcto; la cita pasa a `PENDING_PAYMENT` y después a `PAID`; se genera un único asiento. |
| Producto puro y pedido mixto | Registro de pago con y sin referencias de reserva. | Correcto en el simulador crítico; ambas variantes conservan su trazabilidad. |
| Devolución | Reembolso del pedido y reposición solo cuando la prueba aporta líneas con reposición confirmada. | Correcto; sin líneas confirmadas no se devuelve stock; el reintento no duplica efectos. |
| Ledger y cierre | Cadena de pago/devolución y validación de cierre. | Correcto; hash final válido, operaciones secuenciales y total neto coherente. |
| Administración | Sesión ajena a Marian y cierre X/Z administrativo. | Correcto; acceso ajeno bloqueado y cierre simulado idempotente con evidencia de integridad. |

## Cobertura y estabilidad

La batería estándar incluye ahora `test:integration`, que ejecuta `tests/simulate-realistic-wix-flow.mjs`. Esta simulación integra en una secuencia única agenda, proyección de citas, checkout, webhook de pago, movimiento de inventario, reembolso, idempotencia y cadena del ledger.

| Comprobación | Resultado |
|---|---:|
| ESLint | Correcto |
| Sincronización de tipos Wix | Correcta |
| Verificaciones estructurales | 16 de 16 superadas |
| Simulaciones críticas existentes | 6 de 6 superadas |
| Nueva simulación integrada realista | 5 de 5 superadas |
| Simulaciones administrativas | 2 de 2 superadas |
| Repetición de escenarios críticos, integración y administración | 3 iteraciones consecutivas, 39 de 39 escenarios superados |
| `git diff --check` | Correcto |

## Correcciones y decisiones de esta iteración

No se encontró un defecto reproducible en la nueva batería. Se añadió cobertura de integración al comando estándar de pruebas para prevenir regresiones en los flujos combinados. La ruta pública no se modificó porque su estado vacío no permite atribuir el origen al código de reservas: puede corresponder a publicación, ruta, permiso, dominio o carga de Wix.

## Siguiente paso para prueba end-to-end real aislada

Para marcar una cita de prueba en la agenda y obtener un checkout real de sandbox hacen falta simultáneamente una sesión Wix autenticada con permisos de QA y un entorno o servicio de prueba sin clientes. La prueba debe usar una profesional, servicio, contacto y producto de ensayo identificables, y debe eliminar o compensar las reservas de prueba al finalizar. No se debe emplear la agenda ni el checkout de producción de clientes para este fin.

## Archivos relevantes

- `tests/simulate-critical-flows.mjs`
- `tests/simulate-realistic-wix-flow.mjs`
- `tests/simulate-administration-closing.mjs`
- `package.json`
- `docs/RESULTADO_PRUEBA_PUBLICA_WIX_2026-08-25.md`
