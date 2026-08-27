# Informe ejecutivo del ecosistema Marian Madrid

**Fecha:** 27 de agosto de 2026
**Estado general:** base técnica de Fase 1 validada y versionada; queda pendiente la sincronización visual del componente ADMINISTRACIÓN y la QA real aislada antes de declarar el cierre operativo completo.

## Resumen

El ecosistema de reservas se ha estabilizado sobre una arquitectura con separación clara de responsabilidades: Wix Bookings mantiene agenda, recursos y reservas nativas; `SERVICIOS_CITA` (`Import2`) gobierna el catálogo comercial; `CitasF2` y `BookingTransactions` aportan persistencia e idempotencia; y `movimientoCaja` conserva el registro económico interno como fuente de verdad. El endurecimiento anterior está publicado en el sitio. El commit actual `56eb6f8` está versionado y validado en GitHub, pero todavía requiere el flujo de vista previa/publicación de Wix; un commit de GitHub no equivale a una publicación del sitio.

La funcionalidad principal está cubierta por pruebas automatizadas de reserva simple, reserva dual, disponibilidad del hueco de exposición en un servicio dual, idempotencia, compensación ante error, pagos, devoluciones y encadenamiento del ledger. Aun así, la prueba controlada con una reserva real de QA sigue pendiente: no se han creado cargos reales, reservas de clientes ni proyecciones externas durante esta revisión.

| Área | Estado | Evidencia actual | Próximo control |
| --- | --- | --- | --- |
| Código y publicación | **Versionado y validado; publicación pendiente** | `main` contiene `56eb6f8`; CI `Validate Fase 1` terminó correctamente. | Crear vista previa en Wix, revisar Editor y publicar solo tras preservar el diseño reciente. |
| Seguridad y calidad | **Correcto** | Sanitización, pruebas de contrato, simulaciones, lint y comprobación de diffs superados. | Repetir el conjunto antes de cada publicación. |
| Reservas simples, duales y hueco de exposición | **Validado en simulación** | Seis pruebas críticas y seis de integración superadas. | Ejecutar QA real aislada, sin clientes ni cobros reales. |
| Catálogo público | **Correcto** | `/reserva-online` presenta servicios, precios y enlaces de reserva. | Validar la sincronización de un servicio QA desde CMS. |
| Personal | **Estructura correcta** | `MAPA_STAFF` mantiene tres registros privados, coherentes en volumen con el personal activo. | Verificar individualmente el mapeo de cada recurso sin exponer datos personales. |
| Colas de sincronización | **Correcto** | Las colas CMS están vacías, privadas y con índices activos. | Monitorizar solo la cola interna de Bookings. |
| Microsoft 365 | **Pausa técnica activa** | Bandera SSOT desactivada, encolado bloqueado, job retirado y health marcado como pausado; no hay secretos, tenant ni escrituras externas. | Mantener bloqueado hasta cierre formal de Fase 1 y autorización expresa. |
| Experiencia de inicio | **Pendiente** | El inicio muestra «Nada que reservar ahora», aunque la página de catálogo sí funciona. | Corregir o retirar ese bloque contradictorio sin cambiar la agenda, usando el Editor estable. |

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

La validación final produjo **7 comprobaciones de sanitización**, **19 comprobaciones de contrato**, **1 comprobación del widget**, **6 simulaciones críticas**, **6 simulaciones de integración realista**, **2 comprobaciones administrativas**, **5 simulaciones documentales** y **3 comprobaciones de automatización**, todas satisfactorias. También se ejecutaron correctamente `npm run lint`, `git diff --check` y `npm run sync:types`. La validación continua de GitHub terminó correctamente para `56eb6f8`.

El recorrido público de `/reserva-online` responde y expone categorías, servicios y enlaces de reserva. En cambio, el bloque nativo de reservas incluido en la página de inicio no recupera opciones y comunica una indisponibilidad que contradice el catálogo. Es un problema de presentación y conversión, no una prueba de que Bookings esté vacío; debe corregirse antes de considerar la experiencia final óptima.

## Pausa de Microsoft 365

Se ha recibido la instrucción de pausar la integración con Microsoft 365. Durante esta tarea **no se han creado credenciales, secretos, aplicaciones de Microsoft Entra, listas SharePoint ni registros externos**. El adaptador y la cola permanecen como capacidad inactiva preparada para una eventual reanudación.

La pausa es explícita en la operación actual: se retiró la ejecución programada, el encolado desde el ledger está condicionado por la bandera desactivada y el adaptador no procesa mientras persista la pausa. La existencia del adaptador y la cola no implica integración activa.

## Riesgos y prioridades inmediatas

| Prioridad | Acción | Motivo |
| --- | --- | --- |
| Alta | Publicar el código que contiene la pausa técnica completa de Microsoft 365. | Hace efectiva en Wix la bandera, el bloqueo de encolado y la retirada del job. |
| Alta | Resolver el bloque de inicio que indica ausencia de reservas. | Elimina una contradicción visible que reduce conversión y confianza. |
| Alta | Ejecutar QA real aislada de reserva simple, dual y hueco de exposición. | Convierte la cobertura simulada en evidencia operativa sin afectar a clientes. |
| Media | Validar un servicio QA completo de `Import2` hacia Bookings. | Confirma la sincronización asíncrona con revisión nativa. |
| Media | Auditar las tres correspondencias de `MAPA_STAFF`. | Comprueba que cada servicio elegible resuelve al recurso correcto. |
| Media | Normalizar complementos tras mapear asignaciones. | Reduce fricción y evita modificar precios o pedidos por inferencia. |
| Controlado | Revisar los cambios de diseño más recientes del editor Wix. | Wix avisó de cambios de interfaz más nuevos que la revisión publicada; no se deben sobrescribir sin revisión. |

## Conclusión

La base técnica y operativa está en un estado sólido: el sitio publicado sirve el catálogo de reservas, el código dispone de defensas transaccionales y trazabilidad, las colas internas son privadas e idempotentes, el ledger V2 conserva naturaleza, IVA, rectificación y líneas, y las regresiones pasan de forma consistente. El cierre formal de Fase 1 aún requiere publicar el commit validado, sincronizar el widget vivo de `#htmlAdministracion`, corregir el bloque contradictorio del inicio y ejecutar QA real aislada de reservas sin clientes ni cobros reales. No se han configurado Resend ni M365, ni se ha enviado información externa.
