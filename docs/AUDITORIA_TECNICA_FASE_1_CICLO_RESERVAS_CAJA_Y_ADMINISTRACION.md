# Auditoría técnica de Fase 1: reservas, caja y ADMINISTRACIÓN

**Fecha:** 27 de agosto de 2026.
**Ámbito:** revisión estática del código publicado, de los contratos CMS y del componente administrativo de referencia.
**Resultado:** existe una base robusta de reservas y ledger, pero hacen falta correcciones de clasificación, detalle documental, propinas y flujo administrativo antes de declarar el ciclo integral cerrado.

## Controles ya presentes

| Dominio | Control observado | Valor operativo |
| --- | --- | --- |
| Reserva simple | Transacción idempotente, cita durable y `traceId`. | Evita duplicados ante reintentos. |
| Reserva dual | Saga con dos fases y compensación si falla la segunda. | Conserva consistencia en una operación compuesta. |
| Hueco de exposición | Pruebas específicas para una reserva simple dentro de un hueco no solapado. | Evita bloquear artificialmente al profesional. |
| Pago online | Webhook comprueba estado pagado y la cita no se marca como pagada hasta persistir el ledger. | Reduce el riesgo de marcar cobros no confirmados. |
| Devolución | Movimiento negativo asociado a pedido y devolución; cola de recuperación si aún no existe el cobro original. | Trata eventos fuera de orden sin perder trazabilidad. |
| Libro mayor | Hash encadenado, secuencia de tickets, firma de integridad y bloqueo de actualización/eliminación directa. | Aporta evidencia técnica de integridad e inmutabilidad. |
| Caja | Estado por forma de pago, conteo X y cierre Z idempotente. | Ofrece control diario de efectivo y conciliación. |
| Jornada | Registro de entrada, salida, pausas y ajustes motivados; los hooks bloquean ediciones directas. | Proporciona base para un control horario trazable. |
| Acceso ADMINISTRACIÓN | El controlador de página exige sesión y comprueba `isMarianManager`. | La superficie actual ya es adecuada como único punto de gestión. |

## Hallazgos que requieren corrección en Fase 1

| Prioridad | Hallazgo | Riesgo | Corrección propuesta |
| --- | --- | --- | --- |
| Crítica | La venta manual usa `VENTA_EFECTIVO` como tipo por defecto incluso cuando el método elegido es tarjeta o Bizum. | El tipo económico y la forma de pago pueden quedar incoherentes. | Derivar el tipo de movimiento de la forma de pago cuando se trata de una venta presencial ordinaria y rechazar combinaciones incompatibles. |
| Crítica | No existe un tipo explícito para propinas. | Una propina puede mezclarse con venta, IVA, caja o retribución sin política trazable. | Crear evento separado, con regla contable-fiscal configurable, referencia de empleado opcional y exclusión conservadora de resúmenes fiscales hasta validación profesional. |
| Alta | El evento de pago online agrupa el total del pedido en un único movimiento con concepto genérico. | No queda un desglose suficiente de líneas, descuentos, impuestos, bonos o productos para un documento detallado. | Persistir una instantánea limitada de líneas y tratamientos fiscales en un registro de documento, ligada a pedido, cita y ledger. |
| Alta | La agregación fiscal presupone IVA general y clasifica por signo, sin distinguir de forma explícita ventas, propinas, ajustes no fiscales o suplidos. | Los resúmenes pueden ser técnicamente coherentes pero no representar el tratamiento fiscal real. | Clasificar naturaleza fiscal, tipo de documento y tratamiento por cada movimiento; configurar tipos impositivos por catálogo. |
| Alta | El libro de facturas actual devuelve datos al panel, pero no genera un documento inmutable archivado ni una factura completa con destinatario cuando procede. | Falta un proceso documental reproducible y una evidencia de emisión/envío. | Crear paquete documental versionado y un registro de emisión, primero en modo vista previa y después mediante confirmación de Marian. |
| Alta | El panel descarga CSV localmente y declara que no envía a gestoría. | No cumple el nuevo requisito de envío desde ADMINISTRACIÓN. | Añadir generación de paquete, previsualización, confirmación y envío mediante correo transaccional configurado; registrar resultado y destinatario sin exponer el contenido. |
| Media | Los controles exclusivos de Marian se aplican en la página; varias operaciones de caja también admiten cajero por diseño. | Un endpoint documental futuro podría heredar un permiso demasiado amplio. | Crear métodos nuevos que exijan `requireMarianManager` en el backend, además de ocultarlos en interfaz. |
| Media | Existen controladores de página idénticos con identificadores diferentes. | Mantenerlos puede inducir cambios divergentes; borrarlos sin metadatos puede romper rutas Wix. | No eliminar todavía. Confirmar vínculo de cada página en Wix y, si procede, convertir a importación compartida o retirar solo la copia no enlazada. |
| Media | La cola M365 y su trabajo siguen presentes en código aunque la Fase 2 queda aplazada. | Actividad innecesaria y confusión operativa, aunque no hay secretos configurados. | Mantener el adaptador y la cola preparados; deshabilitar su ejecución y encolado en Fase 1 mediante una opción explícita y documentada. |

## Diseño del área ADMINISTRACIÓN

La página existente ya utiliza el componente `#htmlAdministracion` y el controlador `initMarianAdministration()`. El diseño debe extender ese mismo componente con una subsección **Documentos y gestoría**, no crear una nueva página. Los nuevos mensajes del widget deberán ser de lista cerrada y los métodos de backend deberán exigir `requireMarianManager()`.

| Acción visible para Marian | Acción backend | Salvaguarda necesaria |
| --- | --- | --- |
| Preparar documento | Calcular el libro/resumen para el período seleccionado y crear vista previa no persistente. | Validar período y que no haya truncado de resultados. |
| Crear documento | Registrar una versión inmutable, con hash del contenido, período y trazas de origen. | Confirmación explícita; nunca sobrescribir una versión previa. |
| Descargar | Entregar CSV/PDF generado desde la versión concreta. | Marcar documento como borrador o definitivo, sin emitir una factura ficticia. |
| Enviar a gestoría | Enviar solo una versión ya creada al contacto configurado. | Doble confirmación, lista de destinatarios permitida, auditoría del envío y política de reintentos. |
| Consultar historial | Devolver metadatos y resultado del envío. | Acceso exclusivo de Marian; evitar datos de cliente innecesarios. |

La función de correos transaccionales de Wix requiere una campaña configurada y un contacto destinatario; si el contacto está marcado como no suscrito, no se envía. [1] La implementación de Fase 1 utilizará una plantilla específica de gestoría, un contacto autorizado y variables mínimas. El documento no se expondrá mediante una URL pública sin control de acceso; mientras no exista un mecanismo seguro de adjunto o portal privado, el correo debe incorporar un aviso de disponibilidad o un enlace autenticado de duración limitada.

## Criterio de salida de esta auditoría

La auditoría se considerará cerrada cuando el código distinga correctamente venta, devolución, ajuste y propina; los movimientos soporten detalle documental suficiente; el panel ADMINISTRACIÓN disponga de controles exclusivos de Marian; y las regresiones comprueben tanto los recorridos de cliente como la conciliación de caja y documentos. La revisión de régimen fiscal, series, IVA, destinatario de factura completa y política de propinas debe ser confirmada por la asesoría antes de usar documentos con datos reales.

## Referencias

[1]: https://dev.wix.com/docs/velo/apis/wix-crm-backend/triggered-emails/email-contact "Wix Velo — emailContact"
[2]: https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/triggered-emails/set-up-a-triggered-email "Wix — Set Up a Triggered Email"
