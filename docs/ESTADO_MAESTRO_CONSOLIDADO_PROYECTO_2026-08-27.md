# Estado maestro consolidado del proyecto Marian Madrid

**Fecha de consolidación:** 27 de agosto de 2026.
**Repositorio:** `nachoortegazgz/marianmadrid2002`.
**Rama de referencia:** `main`.
**Versión técnica más avanzada identificada:** `03ce7d1ddc61eb80710fc5a0dbca9e0c34eea6b4` (`feat: prepare manager PDFs on schedule`).
**Cambios posteriores relevantes:** `55dade6` incorpora el monitor de disponibilidad postdespliegue y `03ce7d1` añade la preparación mensual/trimestral de PDF para gestoría sin envío automático.
**Estado de validación de esta versión:** batería completa local, análisis estático, sanitización y sincronización de tipos Wix correctos; validación continua de GitHub correcta en la ejecución `33114654808`.

## Propósito de este documento

Este documento sustituye la dispersión operativa de los chats por una **única fuente de continuidad**. Resume la versión funcional más avanzada del ecosistema Wix/Velo, las decisiones que no se deben revertir, las salvaguardas activas, el estado de publicación y los próximos pasos con sus condiciones previas.

> El objetivo de la Fase 1 es una operación Wix nativa fiable y de bajo mantenimiento para reservas, ventas, caja, devoluciones, propinas, inventario, documentación de apoyo y control de acceso. No es una certificación fiscal, laboral, contable o de protección de datos.

## Estado de plataforma y publicación

| Elemento | Estado consolidado | Evidencia o criterio |
| --- | --- | --- |
| Sitio público | `https://www.marianmadrid.es/` tiene publicado el código de preparación documental. | Wix confirmó la publicación sobre la interfaz `14544`; la evidencia de rutas públicas consta en el repositorio. |
| Repositorio | `main` está actualizado en GitHub hasta `126e075`. | Monitor postdespliegue en `55dade6` y preparación documental PDF en `03ce7d1`. |
| Validación continua | Activa y correcta para `126e075`. | La ejecución `33114654808` validó formato, análisis estático y batería de Fase 1. |
| Monitor de producción | Incorporado en GitHub. | Comprueba inicio, reserva online y privacidad cuando exista un despliegue automatizado compatible o se ejecute manualmente. |
| Despliegue automático | Solicitado, todavía no configurado. | Pendiente de seleccionar el modo de liberación a producción. |
| Diseño del Editor Wix | Debe preservarse. | Wix informó que el Editor contenía cambios de diseño más recientes que una sincronización de código anterior. |

La última modificación de privacidad está **versionada y validada en GitHub**. No se debe afirmar que ya está publicada visualmente en Wix sin ejecutar el flujo de vista previa y publicación correspondiente.

## Decisiones de alcance que permanecen vigentes

| Decisión | Regla operativa |
| --- | --- |
| Fase 1 | Se mantiene como prioridad: Wix Bookings, eCommerce, caja, inventario, documentos internos y seguridad. |
| Fase 2 / Microsoft 365 | Aplazada y técnicamente pausada. No habilitar Entra, SharePoint, OneDrive, Power Automate, Excel, Copilot ni Graph sin autorización expresa posterior. |
| Correos a gestoría | La preparación de PDF es automática y local; el envío sigue siendo manual, confirmado por Marian y bloqueado sin dominio autenticado, remitente válido y secretos Wix de correo. |
| Datos productivos | No borrar, renombrar ni migrar servicios, complementos, colecciones o registros por inferencia. Usar una QA aislada y evidencia previa. |
| Credenciales | No reutilizar credenciales ni tokens compartidos en conversaciones. Deben rotarse o revocarse si fueron expuestos. |
| Cumplimiento | Los controles técnicos son evidencia de apoyo; la gestoría y los responsables competentes validan el uso fiscal, contable, laboral y de datos real. |

## Arquitectura funcional consolidada

El sistema usa una arquitectura de proyecciones y fuentes de verdad separadas. `Import2` gobierna el catálogo comercial de citas; Wix Bookings gobierna agenda y disponibilidad nativas; `CitasF2` conserva una proyección durable; `BookingTransactions` aporta idempotencia; `movimientoCaja` es el ledger inmutable; y las colecciones de caja, cierres, inventario y contabilidad derivan de esos datos sin sustituirlos.

| Dominio | Fuente o módulo principal | Capacidades actuales |
| --- | --- | --- |
| Catálogo | `Import2` / `SERVICIOS_CITA` | Servicios activos, moneda EUR, duración, categoría, coherencia para servicios simples y fases duales. |
| Complementos | `AddonsCatalogo` / nombre visible `EXTRAS_CATALOGO` | Catálogo lógico consolidado; se preservan datos nativos existentes sin borrados inferidos. |
| Personal | `MapaStaff` y `backend/staff.js` | Colección privada como fuente de asignación de personal; no se usa un secreto `MAPA_STAFF`. |
| Agenda | `reservas.web.js`, `bookingCore.js`, `bookingSaga.js` | Disponibilidad, revalidación exacta, locks, reservas simples, duales y liberación controlada del hueco de exposición. |
| Citas | `CitasF2`, `citasManager.web.js`, `events.js` | Proyección de reservas, estado de pago, confirmación tras pedido pagado, reprogramación y compensación. |
| Caja | `cajas.web.js` | Ledger inmutable, cadena de hashes, pagos online/presenciales, arqueo X, cierre Z y recuperación de errores. |
| Fiscalidad de apoyo | `fiscalAggregator.web.js`, `fiscalDocuments.web.js` | Borradores de IVA, libro de apoyo y paquetes PDF mensuales/trimestrales versionados para gestoría; no genera declaraciones oficiales. |
| Inventario | `inventario.web.js`, `events.js` | Consumo interno, recepción, movimientos online y trazabilidad de devoluciones con reabastecimiento confirmado. |
| Laboral | `horario.web.js`, `REGISTRO_HORARIO` | Registro de jornada vinculado al actor de la sesión. |
| Administración | `ADMINISTRACION.mvf3f.js`, `marianAdministrationController.js` | Superficie exclusiva de Marian para caja, fiscalidad de apoyo, inventario, documentos y gestoría. |
| Personal | `ONLY STAFF.mvf3f.js` | Superficie canónica Wix del equipo: jornada, historial y horas, caja según rol e inventario; no expone documentos ni gestoría. |
| Seguridad | `security.js`, `securityEngine.js`, `mmSecrets.js` | RBAC, allowlists en secretos, rate limiting, HMAC y límites de datos sensibles. |
| Operación | `crons.js`, `jobs.config`, `.github/` | Limpieza, recuperación, salud, preparación de PDF el día 5, monitor postdespliegue, CI y actualización conservadora de dependencias. |

## Funcionalidades verificadas en Fase 1

Las pruebas del repositorio cubren controles estáticos, simulaciones deterministas y contratos de integración. Constituyen evidencia técnica, pero no sustituyen pruebas QA con una ventana aislada ni revisión profesional de obligaciones externas.

| Flujo | Estado técnico | Salvaguarda principal |
| --- | --- | --- |
| Reserva simple | Validado por simulación. | Revalidación de disponibilidad, rate limit, idempotencia y persistencia durable. |
| Reserva dual | Validado por simulación. | Saga, locks por fase, duración y gap derivados de catálogo, compensación ante fallo. |
| Servicio simple dentro del hueco dual | Validado por simulación. | El hueco de exposición no bloquea artificialmente al profesional. |
| Cobro online | Validado por simulación e integración. | Pedido Wix pagado antes de confirmar estado y registrar ledger. |
| Devolución total y parcial | Validado por simulación e integración. | Identificador de devolución estable, idempotencia y referencia de rectificación. |
| Venta presencial | Validado por contrato y simulación administrativa. | Tipo de movimiento coherente con efectivo, tarjeta o Bizum. |
| Propina | Validada como flujo separado. | Excluida de IVA y proyección contable automática hasta validación profesional. |
| Cierre X/Z | Validado por simulación administrativa. | Cadena de integridad, resumen firmado y una única ruta de creación de cierre Z. |
| Documento para gestoría | Validado por simulación. | Marian-only, versión, PDF con doble huella, preparación mensual/trimestral idempotente y envío exclusivamente manual. |
| Integración M365 | Pausada deliberadamente. | Bandera `SDK_CONFIG.M365.ENABLED = false`, sin cron ni encolado activo. |

## Controles y mejoras incorporadas

### Reservas y disponibilidad

La reserva no confía en datos de slot emitidos por la interfaz: revalida duración, recurso y disponibilidad frente al motor de Bookings antes de crear una cita. Las reservas duales se procesan mediante una saga compensable; si una fase falla, se revierte la creada previamente y se conserva la trazabilidad de la operación. La idempotencia se controla por token y huella de payload para evitar dobles reservas o reutilización con otro contenido.

### Caja, cierre y trazabilidad

Cada movimiento de `movimientoCaja` tiene secuencia, tipo, forma de pago, importes, IVA, referencias de pedido/devolución, hash previo, cadena y firma. Los campos nuevos de naturaleza, tratamiento IVA, líneas y referencia rectificativa se sellan en el movimiento. Las propinas se separan de ventas e IVA mientras no exista decisión profesional de tratamiento.

El cierre Z manual y el job de cierre usan la misma implementación `_registerZClosingInternal()`. Se evita así la divergencia de totales y metadatos entre cierres por interfaz y cierres programados. El estado de caja reutiliza la misma proyección de saldos por forma de pago.

### Documentación y gestoría

El servicio `fiscalDocuments.web.js` permite preparar vista previa, crear una versión de paquete, descargarla en PDF, consultar historial y preparar un envío controlado. Cada día 5, la tarea `prepareManagerPackagesJob` crea el PDF del mes anterior y, cuando corresponde, el del trimestre terminado; nunca envía correo ni consulta secretos de correo. Todo el flujo de consulta, descarga y remisión exige administrador y verificación de correspondencia con el recurso de Marian. El destinatario por defecto es `gestion@marianmadrid.es`, editable antes de cualquier envío y auditable en la operación.

El envío permanece deshabilitado mientras no exista una configuración de proveedor segura. Incluso cuando se configure, será una acción manual con confirmación explícita. La arquitectura usa un proveedor transaccional con adjuntos, secreto Wix, dominio autenticado, remitente verificado y clave de idempotencia. El procedimiento completo está en `docs/PREPARACION_DOCUMENTAL_PDF_PROGRAMADA.md`.

### Seguridad, mantenimiento y dependencias

Los secretos permanecen en Wix Secrets Manager, las colecciones sensibles son privadas y las respuestas públicas no deben filtrar detalles de errores ni datos personales. La validación de sanitización detecta credenciales con formato real, ejecución dinámica, filtrado de errores, exposición de catálogo y errores de la integración M365.

Dependabot propone semanalmente solo actualizaciones de parches y menores. La CI opera con permisos de lectura, sin auto-merge ni publicación automática. Los cambios de dependencias requieren la batería completa antes de integrarse.

## Estado de la arquitectura y limpieza

La arquitectura se ha revisado y la mejora estructural más reciente quedó integrada en los commits `4aeb43a` y `b14731a`. La auditoría de duplicados y nombres canónicos Wix queda en `docs/AUDITORIA_DUPLICADOS_Y_NOMBRES_WIX_2026-08-27.md`; la limpieza elimina solo tres alias exactos y conserva los identificadores del Editor. La matriz `docs/MATRIZ_ALINEACION_CODIGO_GITHUB_WIX_2026-08-27.md` confirma que la instantánea desarrollada no supera al código actual salvo por los flujos de ONLY STAFF, que se han restaurado de forma compatible con los controles actuales.

| Nivel | Acción | Estado |
| --- | --- | --- |
| Aplicado | Consolidar en una ruta el cierre Z manual y programado. | Validado localmente y en CI. |
| Aplicado | Reutilizar la proyección de caja para el estado diario. | Validado localmente y en CI. |
| Aplicado | Corregir descripciones que podían sugerir certificación fiscal. | Validado localmente y en CI. |
| Alta | Extraer lector y clasificador de ledger de solo lectura para fiscalidad/documentos. | Diferido; requiere fixtures de movimientos completos. |
| Alta | Separar `reservas.web.js` en lectura de catálogo y disponibilidad. | Diferido; requiere conservar contratos públicos. |
| Alta | Corregir fallback de `withTimeout()` en utilidades comunes. | Diferido; requiere prueba unitaria específica. |
| Media | Extraer escritor común para consumo y recepción de inventario. | Diferido; requiere pruebas de concurrencia. |
| Media | Dividir utilidades puras de configuración de UI en `mmUtils.js`. | Diferido; migración por fases con compatibilidad. |
| Aplicado | Retirar tres alias exactos de páginas Wix y conservar sus nombres canónicos con identificador interno. | Comparativa byte a byte, rastreo de referencias y sanitización correctos; ver auditoría de duplicados. |
| Diferido | Inspeccionar visualmente el mapeo de páginas restantes de Wix. | Solo desde el Editor; no borrar ficheros con identificadores distintos por similitud de plantilla. |

## Puntos pendientes y condiciones previas

| Pendiente | Condición necesaria antes de actuar |
| --- | --- |
| Sincronizar el widget de documentos en el HTML Component vivo `#htmlAdministracion` | Editor Wix estable y revisión previa de cambios de diseño recientes. |
| Corregir el bloque de inicio «Nada que reservar ahora» | Edición visual cuidadosa en Wix y comprobación posterior de inicio y `/reserva-online`. |
| QA real de reservas | Servicio, recurso y ventana de QA aislados; ningún cliente ni cargo real. |
| Sincronizar la lista visual de PDF preparados | Editor Wix estable y revisión previa de cambios de diseño recientes; el HTML canónico ya está actualizado. |
| Configurar el email de gestoría | Dominio y remitente autenticados, secretos Wix, prueba sin datos reales y confirmación manual de cada envío. |
| Activar M365 | Cierre formal de Fase 1 y autorización expresa del usuario. |
| Despliegue automatizado de producción | Elegir entre publicación automática al superar CI o aprobación manual en entorno de producción después de CI. |

## Procedimiento mínimo de continuación

1. Actualizar siempre las referencias de GitHub antes de editar: `git fetch origin --prune` y revisar si `origin/main` contiene una versión posterior.
2. No modificar colecciones ni datos productivos sin evidencia, contrato CMS y prueba aislada.
3. Después de cada edición de código, ejecutar de inmediato `npm run test:sanitization`.
4. Antes de integrar cambios, ejecutar `npm test`, `npm run lint` y `git diff --check`; usar `npm run sync:types` cuando cambien imports o contratos Wix.
5. Hacer commit con alcance reducido, subirlo a `main` y esperar la validación continua correcta.
6. Para una publicación Wix, crear una vista previa remota, comprobar las rutas afectadas y publicar solo con la autorización o el mecanismo de liberación configurado.
7. Actualizar este documento cuando cambie una decisión, una capacidad o un estado de publicación.

## Referencias internas clave

| Documento | Uso |
| --- | --- |
| `docs/INFORME_RESUMIDO_CAPACIDADES_ECOSISTEMA_2026-08-27.md` | Resumen ejecutivo de capacidades y beneficios. |
| `docs/AUDITORIA_TECNICA_FASE_1_CICLO_RESERVAS_CAJA_Y_ADMINISTRACION.md` | Auditoría de reservas, caja y ADMINISTRACIÓN. |
| `docs/MATRIZ_REQUISITOS_FASE_1_OPERACION_Y_CUMPLIMIENTO.md` | Alcance, requisitos y límites de cumplimiento. |
| `docs/HOJA_RUTA_FASE_2_M365_PREPARADA.md` | Secuencia de Fase 2, deliberadamente bloqueada. |
| `docs/AUTOMATIZACION_SEGURA_DEPENDENCIAS.md` | Política de Dependabot y CI. |
| `docs/AUDITORIA_ARQUITECTURA_Y_LIMPIEZA_2026-08-27.md` | Hallazgos de arquitectura y optimizaciones diferidas. |
| `docs/EVIDENCIA_PANEL_WIX_CONFIGURACION_2026-08-27.md` | Evidencia de configuraciones observadas en Wix. |
| `docs/EVIDENCIA_ESQUEMA_LEDGER_2026-08-27.md` | Evidencia del esquema ampliado de `movimientoCaja`. |
| `docs/PREPARACION_DOCUMENTAL_PDF_PROGRAMADA.md` | Cadencia, límites, controles y procedimiento de revisión manual de los paquetes PDF. |
| `docs/EVIDENCIA_PUBLICACION_PREPARACION_PDF_2026-08-27.md` | Evidencia de publicación Wix y comprobación de rutas públicas asociada a esta mejora. |
| `docs/AUDITORIA_DUPLICADOS_Y_NOMBRES_WIX_2026-08-27.md` | Comparativa de duplicados, alias retirados y nombres canónicos conservados. |
| `docs/EVIDENCIA_AUDITORIA_PUBLICACION_2026-08-27.md` | Estado local/remoto, nombres canónicos y comprobación de publicación y rutas públicas. |
| `docs/MATRIZ_ALINEACION_CODIGO_GITHUB_WIX_2026-08-27.md` | Comparativa de la instantánea desarrollada, GitHub y Wix; criterio de consolidación de la versión avanzada. |

## Declaración final de continuidad

La versión funcional de referencia para continuar el proyecto es **`03ce7d1`**, documentada y validada en GitHub hasta `126e075`; incorpora el monitor postdespliegue previamente integrado en `55dade6` y la preparación automática de PDF sin envío automático. El código correspondiente está publicado en Wix. La Fase 1 queda técnicamente madura en sus controles, con pendientes explícitos de QA visual/aislada y de sincronización del widget vivo. La Fase 2 permanece bloqueada. Toda comunicación externa de documentación continúa siendo una acción manual y confirmada. Cualquier nueva conversación debe usar este documento como punto de partida y conservar sus límites de seguridad.
