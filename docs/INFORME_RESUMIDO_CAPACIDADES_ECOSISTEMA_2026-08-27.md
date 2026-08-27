# Informe resumido de capacidades del ecosistema Marian Madrid

**Fecha de referencia:** 27 de agosto de 2026.  
**Entorno:** sitio Wix/Velo `marianmadrid.es`, Wix Bookings, eCommerce y CMS.  
**Estado:** el código de Fase 1 se ha validado, versionado y publicado. Microsoft 365 y los envíos de documentos al exterior permanecen deliberadamente desactivados.

## Visión ejecutiva

El ecosistema transforma el sitio desde una página de reservas aislada en una **operación digital conectada**: el catálogo comercial, la agenda, los cobros, la caja, las devoluciones, la documentación de revisión y los controles internos quedan relacionados mediante identificadores, trazas y reglas de acceso. El objetivo es reducir fricción para clientes y equipo, evitar duplicados y disponer de evidencia operativa para una revisión posterior por gestoría.

> El sistema incorpora controles técnicos y documentos de apoyo. No sustituye la validación de una asesoría ni declara certificación fiscal, laboral o de protección de datos.

| Resultado de negocio | Cómo se consigue |
| --- | --- |
| Más reservas aprovechables | La agenda soporta reservas simples y duales sin bloquear indebidamente el tiempo de exposición. |
| Menos incidencias de operación | Idempotencia, bloqueos y compensación impiden duplicados y dejan una salida segura ante fallos parciales. |
| Mejor control de ingresos | Cada cobro, devolución, propina y ajuste queda diferenciado, encadenado y trazable. |
| Administración más rápida | El área exclusiva de Marian centraliza caja, cierres, borradores de revisión y documentación versionada. |
| Menor riesgo técnico | Roles estrictos, CMS privado, sanitización, pruebas automáticas y actualizaciones controladas. |

## Capacidades desarrolladas

| Capacidad | Qué hace | Cómo potencia el sitio y el negocio |
| --- | --- | --- |
| **Reservas simples y duales** | Orquesta la reserva de servicios de una o dos fases mediante Wix Bookings. | Permite modelar servicios complejos sin obligar al cliente a realizar varias reservas manuales. |
| **Aprovechamiento del hueco de exposición** | Mantiene disponible el intervalo en el que el profesional no presta servicio directo durante una cita dual. | Aumenta la utilización de agenda y permite vender una cita simple compatible en ese hueco. |
| **Saga de reserva y compensación** | Si una fase falla, compensa la fase creada; protege el flujo con bloqueo e idempotencia. | Evita citas partidas, sobreventa de disponibilidad y duplicados tras reintentos de cliente o red. |
| **Catálogo comercial centralizado** | `SERVICIOS_CITA` / `Import2` es la fuente comercial, con validación de precio, duración, estado, categoría y moneda. | Facilita que el catálogo público sea coherente y reduce el mantenimiento duplicado. |
| **Sincronización recuperable a Bookings** | Una cola privada proyecta cambios permitidos del catálogo hacia servicios de Wix Bookings con control de revisión e idempotencia. | Reduce errores manuales y permite recuperar una sincronización fallida sin modificar datos productivos por inferencia. |
| **Personal privado y seleccionable** | `MapaStaff` mantiene la correspondencia entre personal y recursos de agenda sin exponerla públicamente. | Ayuda a asignar la disponibilidad correcta manteniendo separados los datos internos. |
| **Extras de catálogo normalizados** | El nombre visible `EXTRAS_CATALOGO` se alinea con la operación sin cambiar el ID técnico `AddonsCatalogo`. | Mejora claridad para administración sin riesgo de romper enlaces o datos ya existentes. |
| **Cobros online y ventas presenciales** | Registra eventos de pedido pagado y altas manuales autorizadas, diferenciando efectivo, tarjeta y Bizum. | Une venta, pedido, reserva y forma de cobro para facilitar conciliación y atención al cliente. |
| **Devoluciones idempotentes** | Relaciona el reembolso con la operación original y evita registrarlo más de una vez. | Protege caja, inventario y estados de reserva ante notificaciones repetidas de plataformas. |
| **Propinas separadas** | Usa un movimiento explícito `PROPINA`, separado de ventas, IVA y asiento automático hasta validar su tratamiento. | Da visibilidad real de la caja sin atribuir un tratamiento fiscal o laboral no confirmado. |
| **Ledger inmutable V2** | `movimientoCaja` conserva secuencia global, hashes encadenados, firma, origen, IVA, naturaleza, referencia rectificativa, líneas y versión del payload. | Proporciona una pista de auditoría técnica desde la operación hasta la conciliación, sin reescribir movimientos históricos. |
| **Cierres X y Z** | Genera resúmenes de caja, diferencias y cierres diarios vinculados al ledger. | Facilita el arqueo, detecta inconsistencias y mejora la disciplina de cierre de negocio. |
| **Proyección contable controlada** | Prepara partida doble solo con configuración y mapeo de cuentas validados. | Evita contabilizar automáticamente con criterios no aprobados y deja la base para integración con gestoría. |
| **Borradores fiscales de revisión** | Genera resúmenes y libros de apoyo desde el ledger, separando ventas, devoluciones, propinas y ajustes. | Acelera la revisión trimestral sin presentar el resultado como una declaración o factura oficial. |
| **Paquete versionado para gestoría** | Marian puede previsualizar, crear versiones, descargar y preparar un paquete CSV trazable con hash. | Reduce trabajo de recopilación y permite saber qué versión se revisó, cuándo y con qué datos. |
| **Entrega documental preparada y protegida** | El destinatario por defecto es editable, se exige confirmación, se valida formato e idempotencia y se audita el resultado. | Deja preparado un envío profesional sin habilitarlo hasta contar con dominio verificado y secretos del proveedor. |
| **Panel exclusivo de Marian** | El backend exige permisos administrativos y la comprobación específica de responsable; el frontend utiliza mensajes permitidos. | Centraliza operaciones sensibles sin convertirlas en funciones públicas ni disponibles para personal no autorizado. |
| **Registro de jornada** | Conserva actor de sesión, inicio, fin, pausas y correcciones trazables en una colección protegida. | Aporta una base técnica para el control interno de jornada, manteniendo los datos laborales restringidos. |
| **Protección de datos por diseño** | Minimiza la exposición pública, restringe colecciones sensibles, sanea errores y evita secretos en código o registros. | Reduce superficie de riesgo y ayuda a separar datos de reserva, caja, clientes y personal. |
| **Pausa segura de Microsoft 365** | El adaptador y la cola futura existen, pero una bandera central bloquea encolado, procesamiento y cron. | Mantiene preparado el siguiente paso sin generar tráfico externo, datos duplicados ni dependencia prematura. |
| **Calidad y mantenimiento continuo** | Hay sanitización, contratos, simulaciones, análisis estático, comprobación de diferencias, CI y Dependabot conservador. | Reduce regresiones, detecta errores antes de publicar y facilita un mantenimiento sostenible. |

## Controles de fiabilidad aplicados

La fiabilidad se construye mediante defensas complementarias. Las reservas usan bloqueo, idempotencia, trazabilidad y compensación; los cobros y reembolsos se correlacionan; el ledger no se actualiza ni elimina por las rutas ordinarias; y el acceso administrativo se comprueba tanto en interfaz como en backend. Las colas privadas permiten reintentos controlados en las integraciones internas, sin convertir un fallo puntual en pérdida silenciosa de información.

| Control | Beneficio operativo |
| --- | --- |
| Idempotencia | Un reintento no debe crear una segunda reserva, cobro, devolución o envío documental. |
| `traceId` y correlación | Facilita investigar incidencias sin exponer detalles internos a usuarios públicos. |
| Hash y secuencia | Permite detectar incoherencias técnicas en la cadena del ledger. |
| Roles y comprobación de Marian | Evita que las herramientas de caja, documentación y configuración sensible se conviertan en funciones generales. |
| Colas con estado e índices | Permite observar, reintentar y recuperar sincronizaciones internas de forma ordenada. |
| Pruebas automatizadas y CI | Previene que un cambio de código o formato llegue al sitio sin superar controles definidos. |

## Alcance, límites y siguientes controles

El ecosistema **no genera facturas definitivas ni modelos tributarios**, no afirma cumplimiento completo de SIF/VERI*FACTU y no habilita por defecto la remisión de documentos por correo. La AEAT sitúa los plazos de adaptación de los sistemas informáticos de facturación antes del 1 de enero de 2027 para entidades que presenten Impuesto sobre Sociedades y antes del 1 de julio de 2027 para el resto de obligados; la aplicación concreta depende del titular, régimen y configuración fiscal real. [1]

Asimismo, se mantienen tres acciones operativas de mejora: efectuar una QA real aislada de reserva simple, dual y hueco de exposición sin afectar clientes ni realizar cargos; sincronizar visualmente el widget vivo `#htmlAdministracion` desde una sesión estable del Editor, preservando el diseño más reciente; y corregir el bloque de Inicio que comunica «Nada que reservar ahora» pese a que el catálogo de reservas está disponible.

| Elemento deliberadamente no activado | Motivo de control |
| --- | --- |
| Microsoft 365, SharePoint, Power Automate, OneDrive, Excel y Copilot | Se reserva para la Fase 2 y exige autorización expresa, tenant, aplicación, permisos y modelo de datos aprobados. |
| Envío real con Resend | Requiere dominio remitente verificado, secretos guardados en Wix y confirmación de Marian por cada envío. |
| Facturación oficial y declaraciones | Requiere datos fiscales reales, series, régimen, tipos, criterios de descuentos/anticipos y revisión profesional. |
| Normalización masiva de extras o servicios nativos | Se evita modificar precios, asignaciones o datos productivos sin una QA aislada y evidencia suficiente. |

## Conclusión

La Fase 1 deja una base operativa **más robusta, medible y mantenible**. El cliente encuentra un flujo de reserva preparado para escenarios sencillos y complejos; el negocio gana trazabilidad desde la agenda hasta la caja; y Marian dispone de un perímetro administrativo protegido para revisar operaciones y preparar documentación. La arquitectura queda deliberadamente preparada para crecer, sin comprometer la seguridad ni activar integraciones externas antes de tiempo.

## Referencias

[1]: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html "AEAT — Nota informativa sobre la ampliación del plazo de adaptación de los SIF"
