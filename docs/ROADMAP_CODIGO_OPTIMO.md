# Hoja de ruta hacia codigo optimo

## Estado de partida

La rama `qa/wix-engine-hardening-20260825` supera los siete controles esenciales de estructura y los seis escenarios deterministas de reserva, exposicion, compensacion e idempotencia. El codigo usa ES Modules de forma consistente: no hay `require()`, `module.exports` ni `exports.` en `src`. Esta es la sintaxis correcta para las rutas `src/public`, `src/pages` y `src/backend` de un sitio Wix.[1]

El error `use_getMovimientos` no pertenece a la rama, a la copia auditada ni a las fuentes originales disponibles. Es una referencia de una copia no sincronizada del Editor Wix o de otro entorno de analisis; no debe inventarse esa exportacion en el repositorio hasta localizar su consumidor real.

## Ruta critica

| Prioridad | Entrega | Motivo de bloqueo | Criterio de salida |
|---|---|---|---|
| P0 | Sincronizar tipos con `wix sync-types` y validar los Web Methods Velo | El runtime del sitio genera tipos para `wix-web-module`; la variante `@wix/web-methods` no se resuelve en este proyecto Velo. | Los ocho archivos `.web.js` importan `wix-web-module`, los tipos se sincronizan y el Local Editor no muestra errores de modulo. |
| P0 | Unificar ledger de eCommerce | Un pedido Wix Stores sin linea Bookings registra inventario pero retorna antes de crear el movimiento de caja. | Pedido de producto, pedido de reserva y pedido mixto generan exactamente un asiento por `ORDER-{orderId}`; los refunds crean un asiento por `REFUND-{orderId}-{refundId}`. |
| P1 | Extender simulador esencial | La simulacion valida reservas y pagos genericos, pero no cubre pedido puro de productos, mixto y refund parcial. | Tres escenarios eCommerce y sus compensaciones pasan sin duplicar inventario ni caja. |
| P1 | Validar Local Editor | Las pruebas locales no ejecutan el runtime Velo ni permisos, widgets, CMS o eventos Wix. | Sin errores de importacion o permisos en Local Editor; contrato CMS y UI de reserva confirmados. |
| P2 | Validar sitio QA y sandbox | La pasarela real, los webhooks y Bookings no deben verificarse con operaciones de clientes. | Reserva simple, dual con servicio dentro del gap, pedido de producto, pedido mixto y refund sandbox trazados y compensados. |
| P3 | Revision de publicacion | Una vez cerrados los flujos y la configuracion operativa. | Checklist de produccion, secretos, permisos, cache, Jobs, panel administrativo, asistente IA y plan de rollback aprobados. |

## Principios de ejecucion

Cada P0 y P1 se entrega en un commit pequeno, con pruebas solo del flujo afectado y sincronizacion inmediata con GitHub. La base de trabajo consolidada se describe en `README.md`; el panel usa `ONLY STAFF.mvf3f.js`, el widget documentado y los web methods existentes, sin introducir un backend administrativo paralelo. No se convertira el proyecto a CommonJS: Wix indica expresamente el uso de `import` y `export` para archivos compartidos y modulos del sitio. En este runtime Velo, los Web Methods se definen en archivos `.web.js` mediante `wix-web-module`, que es el contrato presente en los tipos generados por Wix.[1] [2]

La validacion de preview no sustituye las pruebas de HTTP Functions ni las transacciones reales de Bookings. Las mutaciones controladas se realizaran despues en un sitio QA o en sandbox con datos de prueba y evidencia de compensacion.[3]

## Definicion de codigo optimo

El codigo se considerara optimo para este alcance cuando los P0-P3 esten completados, los contratos tengan una unica fuente de verdad, no haya APIs retiradas ni caminos duplicados, los fallos se compensen de forma idempotente y el sistema haya sido probado en runtime Wix con Bookings, eCommerce y pagos sandbox. El cumplimiento fiscal, laboral y de proteccion de datos exige ademas validacion de la configuracion operativa y revision profesional; no se certifica solo por codigo.

## Referencias

[1] [Wix: ubicacion de codigo y sintaxis ES Modules](https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/overview/where-do-i-put-my-code)

[2] [Wix: Web Modules API de Velo](https://dev.wix.com/docs/velo/apis/wix-web-module/introduction)

[3] [Wix: comandos CLI, preview y pruebas de HTTP Functions](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli-for-sites/wix-cli-for-sites-commands)
