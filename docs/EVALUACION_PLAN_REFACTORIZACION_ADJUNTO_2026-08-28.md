# Evaluación profesional del plan de refactorización adjunto

**Fecha de corte:** 28 de agosto de 2026.

**Objeto:** Contrastar `pasted_content_3.txt` con el código y la configuración actuales de `main`, y aplicar solo mejoras seguras para la Fase 1.

## Dictamen ejecutivo

El adjunto mezcla hallazgos históricos, propuestas de arquitectura y afirmaciones que ya fueron corregidas en iteraciones anteriores. No se ha aplicado una migración masiva de 32 a 20 archivos, la fusión de `bookingCore.js` con `bookingSaga.js`, la eliminación de cachés CMS ni la limpieza destructiva de campos o colecciones. Esas acciones tienen riesgo de romper contratos Wix, Jobs, web modules, hooks y datos productivos.

Se ha aplicado una mejora de alto valor y bajo riesgo: **la proyección contable queda cortocircuitada cuando `SDK_CONFIG.ACCOUNTING.ENABLED` es `false`**, antes de consultar `PLAN_CUENTAS_CONTABLES`. Esto conserva la preparación de contabilidad, evita una consulta repetida en cada cobro y mantiene la activación como una decisión explícita posterior a la validación de la gestoría.

| Hallazgo del adjunto | Estado tras contraste | Acción profesional |
|---|---|---|
| Liquidación de pedidos de tienda pura | **Corregido previamente.** `events.js` calcula `ORDER-{orderId}` para todo pedido pagado, incluso sin líneas de Bookings, registra inventario y omite la reserva cuando no existe. | No duplicar ni reescribir el webhook. Mantener pruebas de pedido puro, mixto y reembolso. |
| Campo corrupto en `MapaStaff` | **Detectado como artefacto de esquema/snapshot, no como dato de negocio.** | No borrar desde API por inferencia. Requiere revisión visual del CMS y confirmación de que no es un campo utilizado; la eliminación de esquema es una operación destructiva fuera de esta tanda. |
| Duraciones comerciales discordantes | **No probado de forma exhaustiva en esta ejecución.** | Pendiente de informe de catálogo que compare `descripcionLarga` con `tiempoFase1 + tiempoExposicion + tiempoFase2` y `duracionTotal`, sin editar servicios automáticamente. |
| Jobs con frecuencia inferior a una hora | **Resuelto.** `jobs.config` usa cadencias horarias o diarias y expresa UTC. | Mantener el manifiesto idéntico en raíz y backend. |
| Portada “Nada que reservar” | **No confirmado en código fuente actual.** La página pública requiere revisión del Editor/UI, que conserva cambios visuales no representados en el repositorio. | No editar dataset ni diseño por inferencia; ejecutar una smoke visual específica antes de tocarlo. |
| Heartbeat de locks serverless | **Diseño defensivo intencionado.** Existe renovación cada 15 s, TTL de 120 s, relectura y aborto seguro si se pierde el lease. | Mantenerlo; eliminarlo reduciría seguridad de concurrencia. Medir latencia real antes de rediseñar. |
| PDF construido a bajo nivel | **Riesgo técnico plausible, no fallo confirmado.** | No sustituir el generador sin pruebas de caracteres, saltos de página, huellas y descarga en ADMINISTRACIÓN. |
| Borrado individual de Jobs | **Debe conservarse acotado y trazable.** Los Jobs están programados y sujetos a límites de página/batch del sistema. | No convertirlo en borrado masivo sin confirmar la API soportada, cuota y recuperación. |
| Consulta contable repetida | **Confirmado como oportunidad.** La llamada se hacía aunque la contabilidad no estuviera aprobada. | Aplicado `ACCOUNTING.ENABLED=false` y retorno `ACCOUNTING_DISABLED` antes de lecturas contables. |
| N+1 de addons | **Mitigado parcialmente.** La implementación actual usa `Promise.all` y caché RAM acotada; no es un bucle secuencial. | No sustituir por `hasSome` sin probar referencias embebidas, permisos, orden y límites; candidato posterior de bajo riesgo con benchmark. |
| Helpers duplicados | **Duplicidad real en algunos helpers, pero no todos son equivalentes.** | No hacer extracción masiva: algunos sanitizan distinto, tienen mensajes públicos distintos o pertenecen a frontend/backend. |
| M365 “en caliente” | **No confirmado como tráfico activo.** El módulo comprueba `M365.ENABLED === true` y la configuración actual es `false`. | Mantener el módulo preparado y la feature flag desactivada; no refactorizarlo hacia producción de Fase 1. |
| Colecciones “fantasma” | **Son contratos previstos, libros y colas preparadas, no evidencia suficiente para borrado.** | Mantener IDs y esquemas; auditar uso y retención antes de retirar una colección. |

## Cambios aplicados

En `src/backend/internalConfig.js` se añadió:

```text
SDK_CONFIG.ACCOUNTING.ENABLED = false
```

En `src/backend/contabilidad.js`, `projectLedgerMovementToAccounting()` devuelve `SKIPPED / ACCOUNTING_DISABLED` antes de construir asientos, leer el asiento existente o consultar el mapa de cuentas. Cuando la bandera se active tras aprobación profesional, se conserva el flujo de idempotencia, partida doble, hash y firma existente.

En `tests/verify-core.mjs` se añadió una aserción del contrato para impedir que la contabilidad quede activada accidentalmente. Después de cada modificación de código se ejecutó la sanitización: **7/7 controles aprobados**.

## Duplicidades que no se consolidan automáticamente

Los nombres repetidos de `_toPublicError`, `_cleanText`, `_stableSerialize`, `_roundMoney`, `_postError`, `_readPositiveAmount`, `_normalizeSlotShape`, `_sumAddons` y `_showError` no bastan para afirmar igualdad funcional. Debe compararse el cuerpo, contrato de salida, dominio de ejecución, límite de entrada y exposición de PII. Una extracción indiscriminada hacia `public/mmUtils.js` podría exponer lógica backend, cambiar mensajes o mezclar sanitización de UI con sanitización de respuestas públicas.

Las funciones `prepareScheduledManagerPackages()` y `prepareManagerPackagesJob()` se conservan porque la primera implementa la preparación documental y la segunda es la entrada declarada en Wix Jobs. Asimismo, `bookingCore.js` y `bookingSaga.js` se mantienen separados porque el núcleo de persistencia/locks y el orquestador de compensación son fronteras de responsabilidad distintas.

## Resultado de validación

La regresión focalizada y completa se ejecutó después de los cambios: sanitización, validación de contratos, endurecimiento diagnóstico, widgets, reservas simples/duales/gap, idempotencia, compensación, caja, inventario, devoluciones, administración, documentos, Jobs, automatización y monitor. El resultado local fue correcto: **20/20 contratos core, 7/7 hardening, 6/6 simulación crítica, 6/6 integración realista, 2/2 administración, 7/7 documentos, 3/3 automatización y 3/3 monitor**; lint y manifiestos también correctos.

No se modificó el CMS vivo, no se borró ningún campo/colección, no se publicó en Wix y no se activó M365, Resend ni contabilidad. La validación local completa terminó correctamente; el commit y la validación CI quedan registrados en el cierre documental del repositorio.

## Plan posterior recomendado

La siguiente mejora con mejor relación beneficio/riesgo es un benchmark de addons y consultas de catálogo con datos no personales, seguido de una extracción incremental de un único helper cuyo contrato sea idéntico. Después debe realizarse una prueba visual del Editor para portada, calendario y ADMINISTRACIÓN. La sustitución del PDF, la retirada de cachés CMS, la fusión del motor de reservas y el saneamiento de campos CMS deben permanecer fuera de la Fase 1 hasta disponer de pruebas de compatibilidad y recuperación.

## Referencias

[1]: https://dev.wix.com/docs/develop-websites/articles/workspace-tools/velo-workspace/about-velo "Wix Velo — documentación general"
[2]: https://dev.wix.com/docs/velo/api-reference/wix-data "Wix Data API — referencia"
