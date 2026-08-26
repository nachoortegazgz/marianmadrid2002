# Directrices y objetivos del sistema Marian Madrid

**Estado:** Marco rector de desarrollo y validación

**Base canónica:** `biblia2000.txt` v19.6.16, código del repositorio sincronizado y documentación oficial vigente de Wix.

## Criterio de código óptimo

El código se considera **óptimo y final** solo si es funcional, fiable bajo concurrencia y fallos, mínimo en complejidad, sencillo de mantener y sin fricción con el sitio Wix ni con sus aplicaciones nativas. Debe usar exclusivamente APIs y SDK JavaScript vigentes, conservar pruebas reproducibles y no contener dependencias o patrones deprecados. La condición se demuestra con evidencia de pruebas locales, Local Editor, preview y, cuando corresponda, sandbox del proveedor de pagos; no se declara por documentación o revisión estática aislada.

| Dimensión | Criterio de aceptación |
|---|---|
| Funcionalidad | Los flujos esenciales finalizan con un resultado verificable, sin duplicados ni estados incongruentes. |
| Fiabilidad | Los errores parciales activan compensación, liberación de locks, persistencia coherente y respuestas seguras. |
| Simplicidad | Cada responsabilidad tiene un módulo propietario; no se duplican reglas, constantes, flujos de creación ni lógica de autorización. |
| Compatibilidad Wix | El código respeta contratos de Wix Bookings V2, Wix eCommerce, Wix Payments/Cashier, Wix Data, Wix Members, Wix Secrets y las aplicaciones nativas instaladas. |
| Evolución | Toda actualización del SDK se valida contra documentación oficial, contrato existente, pruebas y Local Editor antes de publicación. |

## Nomenclatura canónica v19.6

La nomenclatura siguiente sustituye expresamente la pauta anterior basada en `primaryServiceGuid` y `secondaryServiceGuid`. En el catálogo y payload de este proyecto, los nombres canónicos son **`serviceId`** y **`linkFases`**. `serviceId` no es ambiguo cuando se usa como GUID del servicio Bookings; debe reservarse para dicho significado.

| Dominio | Nombre canónico | Regla de uso | No usar como sustituto |
|---|---|---|---|
| Servicio principal | `serviceId` | GUID del servicio en `Import2`, widget, payload `MM_BOOK`, slots y APIs Wix. | `primaryServiceGuid`, `bookingsServiceId`, `resolvedServiceId`. |
| Servicio F2 | `linkFases` | GUID del servicio encadenado en `Import2` y payload. Solo aplica si `permitirCombinar` es verdadero. | `secondaryServiceGuid`, `f2ServiceId`, `F2ServiceId`. |
| Fases internas | `phaseOneServiceId`, `phaseTwoServiceId` | Variables internas de Saga, cache dual, core y persistencia de fases. | `serviceIdF1`, `serviceIdF2`. |
| Resolución de servicio | `resolveServiceId`, `_resolveServiceIdInternal` | Web Method y helper que resuelven el GUID de un servicio. | `resolvePrimaryServiceId`. |
| Profesional | `resourceId` | Identificador de personal en slots, `CitasF2`, `REGISTRO_HORARIO`, `MM_LOCKS` y `movimientoCaja`. | `staffId`, `empleada` como campo de persistencia. |
| Fichas de personal | `findStaff(identifier)` | Única vía de búsqueda de personal; permite resolver clave, email, nombre o recurso con índice O(1). | Mapas locales o búsquedas lineales nuevas. |
| Reserva dual | `pairToken` | Clave idempotente estable de la operación lógica. | UUID aleatorio por reintento. |
| Lock físico | `slotKey` | Clave determinista por servicio, recurso e intervalo; propietaria de `MM_LOCKS`. | Usar `pairToken` como lock. |
| Caché dual | `phaseOneServiceId`, `phaseTwoServiceId` | Campos de `DualSlotCache`. | `serviceId`, `f2ServiceId` como campos de caché. |

## Directrices de arquitectura y código

La interfaz y los widgets solo recogen intención y muestran resultados. El servidor valida, recalcula y decide. La disponibilidad vive en `reservas.web.js`; la orquestación en `citasManager.web.js`; la Saga en `bookingSaga.js`; y el acceso a Bookings, eCommerce, locks y CMS en `bookingCore.js`. Ningún módulo adicional debe crear reservas, checkouts, locks o escrituras transaccionales fuera de esa ruta.

Las funciones no exportadas comienzan por `_`. Los Web Methods aplican permisos y rate limiting en el borde; las funciones internas no reimplementan RBAC. Las constantes se importan de `public/mmUtils.js` y `backend/internalConfig.js`; los secretos se recuperan exclusivamente desde Wix Secrets. El código de producción cumple G10 ASCII: solo caracteres ASCII imprimibles en fuentes JavaScript, comentarios y logs.

Todas las fechas se calculan en `Europe/Madrid` mediante helpers seguros frente a DST. Las consultas CMS masivas llevan límites, paginación e índices. Las respuestas y logs enmascaran PII; los datos de cliente no se registran sin necesidad operacional.

## Objetivos finales verificables

| Objetivo | Resultado exigido | Evidencia mínima |
|---|---|---|
| Reservas simples | Consultar disponibilidad real, validar un slot y crear una sola reserva con recurso correcto y persistencia consistente. | Prueba de contrato, simulación y ensayo controlado en preview. |
| Reservas duales con exposición | Certificar F1, gap y F2; reservar ambas fases de forma idempotente y compensar F1 si F2 o la persistencia falla. | Pruebas de Saga para éxito, fallo F2, fallo de CMS, reintento y solape. |
| Liberación del profesional durante el gap | El recurso queda disponible entre F1 y F2 para un servicio simple compatible, sin permitir solapes con las fases ni bloquear artificialmente toda la duración dual. | Caso de integración F1 -> servicio simple dentro de exposición -> F2. |
| Concurrencia | Dos solicitudes iguales devuelven el mismo resultado; solicitudes incompatibles no sobre-reservan. | Pruebas de `pairToken`, `slotKey`, heartbeat, expiración y compensación. |
| Cobro de reservas | El checkout y el estado de pago se derivan de datos recalculados en servidor; la reserva y el registro solo se consolidan tras la señal de pago válida. | Sandbox de checkout, evento de pago idempotente y reconciliación booking-order-payment. |
| Venta online | Productos y variantes de Wix Stores usan el catálogo nativo y checkout eCommerce; stock, pedido, cobro, devolución y contabilidad quedan enlazados. | Ensayo sandbox de compra, cancelación, devolución y conciliación de inventario. |
| Caja y operaciones presenciales | Cobros, pagos, devoluciones, descuentos, cierres y ajustes generan movimientos trazables, autorizados e idempotentes. | Pruebas de caja, cadena de integridad, roles y doble devolución rechazada. |
| Trazabilidad transversal | Cada evento relevante relaciona `traceId`, entidad Wix, estado de negocio y registro de auditoría sin exponer PII. | Consulta de `BookingTransactions`, `CitasF2`, `movimientoCaja`, logs auditados y eventos. |
| Control laboral | Los fichajes se guardan como registros inmutables, con acceso limitado y minimización de datos. | Pruebas de hooks, roles, consulta autorizada y bloqueo de actualización/borrado. |

## Pagos, pedidos y eventos

Los pagos y los pedidos son conceptos relacionados pero no equivalentes. La capa de pagos debe persistir referencias separadas de checkout, pedido, transacción, devolución y reserva; procesar eventos de pago y de pedido de forma idempotente; y consultar la entidad específica antes de cambiar los estados de negocio. Wix recomienda el webhook Wix Cashier Payment Event cuando se requiere estado o método de pago, y los webhooks de pedidos cuando se requiere la información del pedido.[1]

La venta online utilizará el checkout nativo de Wix eCommerce, con al menos una línea de pedido y `channelType` definido.[2] Para reservas, productos, caja y devoluciones no se aceptará el estado local como prueba de cobro o reembolso: la fuente confirmatoria será el evento o la entidad nativa correspondiente de Wix, verificada en sandbox antes de producción.

## Cumplimiento: alcance técnico y validación externa

El sistema debe proporcionar controles técnicos de integridad, inmutabilidad, trazabilidad, control de acceso, minimización de PII, retención y evidencia auditable. En materia fiscal, el ledger y las facturas deberán ser contrastados con los requisitos reales aplicables de Sistemas Informáticos de Facturación y la modalidad que adopte el negocio; la AEAT especifica que la modalidad VERI*FACTU remite los registros de facturación a su sede electrónica.[3]

En materia de datos personales y jornada, el código implementará privacidad por diseño, roles, minimización y registros inmutables; la AEPD exige responsabilidad proactiva, es decir, medidas que permitan garantizar y demostrar el cumplimiento.[4] La conformidad legal completa depende también de configuración de Wix, contratos, políticas, procedimientos, facturación emitida, conservación de evidencias y revisión de asesoría fiscal, laboral y de protección de datos. Por ello, "100% cumplimiento" será una meta de validación externa documentada, no una afirmación que el código pueda autocertificar.

## Ciclo de entrega obligatorio

Cada cambio sigue la secuencia: rama aislada, análisis de impacto, modificación mínima, pruebas estáticas, regresiones, simulación determinista, Local Editor, preview y revisión de diferencias. Solo los cambios con evidencia completa podrán proponerse para publicación. La publicación, el despliegue de cambios que afecten datos reales y cualquier cobro o devolución real requieren una validación operativa independiente.

## Referencias

[1] [Wix: Working with Payments, Transactions, and Orders](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/payments/working-with-payments-transactions-and-orders)

[2] [Wix: Create Checkout](https://dev.wix.com/docs/velo/apis/wix-ecom-backend/checkout/create-checkout)

[3] [AEAT: Sistemas Informáticos de Facturación y VERI*FACTU](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html)

[4] [AEPD: Responsabilidad proactiva](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/4-los-principios-del-tratamiento/FAQ-0208-que-es-el-principio-de-responsabilidad-proactiva)
