# Directrices y Objetivos del Ecosistema Wix de Marian

## Propósito

El ecosistema debe proporcionar una operación digital integrada para **Marian Madrid Peluquería y Estética**. El resultado esperado es un sistema sencillo de usar, fiable en producción y coherente con las aplicaciones nativas de Wix, que permita gestionar reservas, ventas, caja, inventario, administración e informes sin rutas paralelas ni datos duplicados.

> El código debe reducir fricción operativa y preservar evidencia; no sustituye la revisión profesional necesaria para obligaciones fiscales, laborales, mercantiles o de protección de datos.

## Directrices de diseño

| Principio | Directriz operativa |
|---|---|
| Una fuente de verdad | Cada dominio tiene un propietario. Wix Bookings gobierna reservas nativas; Wix Stores gobierna catálogo, variantes y pedidos; las colecciones personalizadas registran proyecciones, trazabilidad, recuperación e informes. |
| Backend como autoridad | La interfaz solicita acciones; el backend valida identidad, permisos, importes, disponibilidad, idempotencia e integridad antes de persistir. |
| Simplicidad verificable | Se favorece código pequeño, contratos explícitos, nombres consistentes y módulos reutilizables frente a duplicación, lógica implícita o automatismos opacos. |
| SDK actual de Wix | Los módulos usan ES Modules, Web Modules `.web.js`, tipos sincronizados y las rutas vigentes de Wix. No se mezclan CommonJS, APIs obsoletas ni importaciones no soportadas. |
| Seguridad por defecto | Roles Wix, allowlists de secretos, permisos mínimos, rate limits, validación de payloads y secretos fuera del repositorio. La UI nunca concede privilegios por sí sola. |
| Datos inmutables donde importa | Los asientos de caja, cierres, auditoría, registros laborales y asientos contables se tratan como evidencia append-only; las correcciones se realizan mediante nuevos eventos trazables. |
| Idempotencia y recuperación | Pagos, pedidos, devoluciones, reservas duales, sincronizaciones y cierres deben poder reintentarse sin duplicar efectos. Los fallos recuperables se encolan y auditan. |
| QA antes de producción | Todo cambio se valida mediante tipos, lint, pruebas de contratos, simulaciones deterministas, revisión de esquema CMS y, cuando proceda, pruebas aisladas en QA. |

## Objetivos funcionales

| Área | Objetivo final |
|---|---|
| Reservas | Gestionar reservas simples y duales con gap, selección o asignación de profesional, prevención de solapes, compensación ante fallo y trazabilidad en `CitasF2`. |
| Venta y pagos | Registrar venta local, venta online de reserva, producto puro, pedidos mixtos y devoluciones solo desde eventos o verificaciones Wix confirmadas. |
| Caja | Mantener un ledger detallado de movimientos, arqueos X, cierre Z diario sellado, secuencias, hashes, firma, medios de pago, IVA, origen, pedido, devolución y traza. |
| Inventario | Mantener `PRODUCTOS_VENTA` como nombre comercial visible sobre `InventarioProductos`, con consumos, recepciones, ventas y devoluciones vinculadas a conciliación Wix cuando corresponda. |
| Libros de apoyo | Proyectar partida doble y libros electrónicos únicamente cuando el mapa de cuentas y la configuración contable hayan sido validados por gestoría. |
| Administración | Ofrecer una página `ADMINISTRACION` reservada a Marian, con un controlador compartido con `ONLY STAFF`, datos de caja, inventario, informes y asistente privado. |
| Informes | Generar resúmenes internos y exportables para gestión y asesoría a partir del ledger y de los registros primarios, sin presentar resultados truncados ni inventar datos faltantes. |
| Control horario | Registrar entrada, salida, pausas y ajustes con actor de sesión, marca temporal, motivo de ajuste y trazabilidad. |

## Requisitos de calidad obligatorios

El repositorio debe mantener `npm run lint`, `npm run sync:types` y `npm run test` en estado correcto. Las pruebas deben cubrir, como mínimo, reservas simples y duales, compensación, idempotencia, pagos locales y online, devoluciones, cierre administrativo y contratos CMS. Los cambios relevantes se documentan, se validan con `git diff --check` y se sincronizan en GitHub antes de desplegar.

Las colecciones CMS se modifican sin destrucción de datos. Un nuevo campo se añade de forma compatible, se contrasta con el contrato machine-readable y se documenta. Cambiar un ID técnico exige migración planificada; el nombre visible puede normalizarse sin romper las referencias de código.

## Objetivo de excelencia

El sistema se considera excelente cuando los flujos críticos son **predecibles, trazables, idempotentes, mínimos y auditables**; cuando una incidencia deja evidencia suficiente para reconstruirla; y cuando la complejidad necesaria está aislada en el backend, no repartida entre widgets, páginas y colecciones. La mejora continua se centra en eliminar duplicación, datos ficticios, permisos ambiguos, fallos silenciosos y dependencias no verificables.

## Límites y condiciones de operación

Antes de utilizar funciones fiscales en operación real debe configurarse el secreto `FISCAL_NIF_EMISOR`, validarse el mapa `PLAN_CUENTAS_CONTABLES` y revisarse el primer ciclo real de venta, devolución y cierre con sus `traceId`. El sistema no presenta declaraciones ni sustituye certificaciones o revisiones profesionales.
