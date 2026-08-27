# Informe ejecutivo del ecosistema Marian Madrid

**Fecha:** 27 de agosto de 2026
**Estado general:** operativo con controles reforzados; quedan validaciones de producción y ajustes de experiencia prioritarios.

## Resumen

El ecosistema de reservas se ha estabilizado sobre una arquitectura con separación clara de responsabilidades: Wix Bookings mantiene agenda, recursos y reservas nativas; `SERVICIOS_CITA` (`Import2`) gobierna el catálogo comercial; `CitasF2` y `BookingTransactions` aportan persistencia e idempotencia; y `movimientoCaja` conserva el registro económico interno como fuente de verdad. El código validado ya está publicado en el sitio desde la rama principal del repositorio.

La funcionalidad principal está cubierta por pruebas automatizadas de reserva simple, reserva dual, disponibilidad del hueco de exposición en un servicio dual, idempotencia, compensación ante error, pagos, devoluciones y encadenamiento del ledger. Aun así, la prueba controlada con una reserva real de QA sigue pendiente: no se han creado cargos reales, reservas de clientes ni proyecciones externas durante esta revisión.

| Área | Estado | Evidencia actual | Próximo control |
| --- | --- | --- | --- |
| Código y publicación | **Correcto** | `main` contiene `77f1ecf`; el sitio se publicó desde `origin/main`. | Mantener publicación solo desde cambios revisados. |
| Seguridad y calidad | **Correcto** | Sanitización, pruebas de contrato, simulaciones, lint y comprobación de diffs superados. | Repetir el conjunto antes de cada publicación. |
| Reservas simples, duales y hueco de exposición | **Validado en simulación** | Seis pruebas críticas y seis de integración superadas. | Ejecutar QA real aislada, sin clientes ni cobros reales. |
| Catálogo público | **Correcto** | `/reserva-online` presenta servicios, precios y enlaces de reserva. | Validar la sincronización de un servicio QA desde CMS. |
| Personal | **Estructura correcta** | `MAPA_STAFF` mantiene tres registros privados, coherentes en volumen con el personal activo. | Verificar individualmente el mapeo de cada recurso sin exponer datos personales. |
| Colas de sincronización | **Correcto** | Las colas CMS están vacías, privadas y con índices activos. | Monitorizar solo la cola interna de Bookings. |
| Microsoft 365 | **En pausa solicitada** | No se han configurado secretos, tenant ni escritura SharePoint durante la revisión. | Desactivar de forma explícita el trabajo programado y el encolado M365 en el siguiente cambio publicado. |
| Experiencia de inicio | **Pendiente** | El inicio muestra «Nada que reservar ahora», aunque la página de catálogo sí funciona. | Corregir o retirar ese bloque contradictorio sin cambiar la agenda. |

## Componentes ya consolidados

La rama principal contiene el endurecimiento del catálogo, la validación de campos comerciales, la resolución del personal desde `MAPA_STAFF` y la cola recuperable de sincronización hacia Wix Bookings. Los servicios de segunda fase (`F2-`) están ocultos en el catálogo CMS, por lo que no se presentan como reservas independientes y se conserva la operación dual desde el servicio principal.

La colección visible de complementos se renombró a **`EXTRAS_CATALOGO`** sin cambiar su identificador técnico `AddonsCatalogo` ni sus registros. Esta corrección alinea la terminología con la operación comercial sin introducir una migración de datos. La normalización de complementos nativos se ha pospuesto correctamente: existen duplicidades y precios anómalos que no deben tocarse hasta mapear sus asignaciones reales y pedidos asociados.

Se crearon y endurecieron dos colas CMS vacías. `BookingsServiceSyncQueue` dispone de sus doce campos de contrato, permisos `PRIVILEGED` y tres índices activos para consulta, trazabilidad e idempotencia. `M365GraphSyncQueue` dispone de trece campos, permisos administrativos y tres índices activos; se conservará vacía mientras la integración externa esté en pausa.

| Colección | Finalidad | Protección aplicada |
| --- | --- | --- |
| `Import2` | Fuente comercial de verdad del catálogo. | El catálogo público limita servicios no activos e internos. |
| `MapaStaff` | Correspondencia privada entre personal CMS y recursos Bookings. | Sin conexiones a páginas públicas. |
| `BookingsServiceSyncQueue` | Proyección recuperable desde catálogo hacia Bookings. | Sin ítems, permisos privilegiados e índices activos. |
| `M365GraphSyncQueue` | Proyección mínima futura del ledger a SharePoint. | Sin ítems, permisos administrativos e índices activos; integración pausada. |
| `AddonsCatalogo` / `EXTRAS_CATALOGO` | Catálogo canónico de extras. | ID técnico preservado y etiqueta visible corregida. |

## Validaciones superadas

La validación final previa a la publicación produjo **7 comprobaciones de sanitización**, **18 comprobaciones de contrato**, **6 simulaciones críticas**, **6 simulaciones de integración realista** y **2 comprobaciones administrativas**, todas satisfactorias. También se ejecutaron correctamente el análisis estático y la comprobación de espacios en los cambios. La sincronización de tipos con Wix terminó correctamente tras resolver una incidencia temporal de autenticación/red.

El recorrido público de `/reserva-online` responde y expone categorías, servicios y enlaces de reserva. En cambio, el bloque nativo de reservas incluido en la página de inicio no recupera opciones y comunica una indisponibilidad que contradice el catálogo. Es un problema de presentación y conversión, no una prueba de que Bookings esté vacío; debe corregirse antes de considerar la experiencia final óptima.

## Pausa de Microsoft 365

Se ha recibido la instrucción de pausar la integración con Microsoft 365. Durante esta tarea **no se han creado credenciales, secretos, aplicaciones de Microsoft Entra, listas SharePoint ni registros externos**. El adaptador y la cola permanecen como capacidad inactiva preparada para una eventual reanudación.

Para que la pausa sea explícita también en la operación futura, el siguiente cambio retirará la ejecución programada de Microsoft 365 y bloqueará el encolado desde el ledger mientras persista la pausa. Esta acción está pendiente únicamente porque la instrucción llegó después de la última publicación; no se debe interpretar la existencia del código preparado como una integración activa.

## Riesgos y prioridades inmediatas

| Prioridad | Acción | Motivo |
| --- | --- | --- |
| Alta | Aplicar y publicar la pausa técnica completa de Microsoft 365. | Evita ejecuciones programadas o encolado futuros mientras la integración está suspendida. |
| Alta | Resolver el bloque de inicio que indica ausencia de reservas. | Elimina una contradicción visible que reduce conversión y confianza. |
| Alta | Ejecutar QA real aislada de reserva simple, dual y hueco de exposición. | Convierte la cobertura simulada en evidencia operativa sin afectar a clientes. |
| Media | Validar un servicio QA completo de `Import2` hacia Bookings. | Confirma la sincronización asíncrona con revisión nativa. |
| Media | Auditar las tres correspondencias de `MAPA_STAFF`. | Comprueba que cada servicio elegible resuelve al recurso correcto. |
| Media | Normalizar complementos tras mapear asignaciones. | Reduce fricción y evita modificar precios o pedidos por inferencia. |
| Controlado | Revisar los cambios de diseño más recientes del editor Wix. | Wix avisó de cambios de interfaz más nuevos que la revisión publicada; no se deben sobrescribir sin revisión. |

## Conclusión

La base técnica y operativa está en un estado sólido: el sitio publicado sirve el catálogo de reservas, el código dispone de defensas transaccionales y trazabilidad, las colas internas son privadas e idempotentes, y las regresiones pasan de forma consistente. El objetivo de un ecosistema plenamente óptimo aún requiere cerrar tres asuntos: la pausa técnica completa de Microsoft 365, la corrección visual del inicio y la ejecución de pruebas reales controladas de reserva. Ninguno de estos puntos exige alterar datos de clientes ni realizar cobros reales.
