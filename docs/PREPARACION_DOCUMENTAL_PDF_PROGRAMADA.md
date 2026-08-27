# Preparación programada de documentación PDF para gestoría

**Estado:** implementada en código y pendiente de publicación Wix.  
**Ámbito:** Fase 1; documentación interna de apoyo.  
**Destinatario predeterminado para una eventual entrega manual:** `gestion@marianmadrid.es`.

> Los paquetes generados son documentación de revisión interna. **No** son facturas, libros oficiales completos, autoliquidaciones, modelos tributarios ni prueba de cumplimiento. La gestoría debe contrastar el contenido con las fuentes contables y fiscales aplicables antes de cualquier presentación.

## Finalidad y cadencia

La tarea programada `prepareManagerPackagesJob` se ejecuta el **día 5 de cada mes a las 03:00 UTC**. La hora corresponde a las 04:00 en horario peninsular estándar y a las 05:00 durante el horario de verano. El margen está diseñado para que la documentación del periodo cerrado esté disponible con antelación para revisión profesional, sin asumir qué modelos presenta el negocio ni sustituir el calendario efectivo de la Agencia Tributaria.

| Momento de preparación | Paquete creado | Ejemplos |
| --- | --- | --- |
| Día 5 de todos los meses | PDF del mes natural anterior | 5 de septiembre: agosto; 5 de enero: diciembre del ejercicio anterior. |
| Día 5 de enero, abril, julio y octubre | PDF trimestral adicional del trimestre natural anterior | 5 de abril: T1; 5 de julio: T2; 5 de octubre: T3; 5 de enero: T4. |

Cada ejecución crea una versión solo si todavía no consta una versión originada por esa misma tarea para el periodo. Una repetición del job devuelve un resultado idempotente y no multiplica documentos.

## Contenido, integridad y límites

Los paquetes se generan desde `movimientoCaja`, que es el ledger operativo inmutable. Incluyen resumen de ventas, devoluciones, base imponible, cuota de IVA registrada, importes por forma de pago, propinas separadas y detalle de movimientos con referencias y huellas técnicas disponibles. Las propinas y los ajustes se mantienen fuera del borrador de IVA hasta validación profesional.

| Control | Implementación |
| --- | --- |
| Acceso | Todas las operaciones de consulta, descarga y envío exigen permisos administrativos y la validación específica de Marian. |
| Formato | Se produce un PDF descargable con nombre de periodo y versión, por ejemplo `paquete-gestoria-2026-T3-v1.pdf`. |
| Consistencia | La descarga vuelve a construir el paquete con su fecha de generación sellada y compara la huella de origen y la huella del PDF con las registradas. Si los movimientos cambian, bloquea la descarga. |
| Tamaño | La preparación está acotada a 1.200 movimientos y 100 páginas por PDF; además, el correo manual solo acepta adjuntos de hasta 3 MiB. |
| Auditoría | La creación, cualquier intento fallido y toda entrega aceptada por el proveedor se anotan en `MM_AUDIT_LOG`. |
| No automatización del correo | La tarea programada devuelve explícitamente `emailSent: false`; no consulta secretos de correo ni realiza peticiones externas. |

## Revisión y entrega manual

Una vez publicado el cambio, Marian puede entrar en **ADMINISTRACIÓN → Documentos y gestoría**, abrir **«Ver PDF preparados»**, seleccionar un paquete, descargarlo y revisarlo. Solo tras esa revisión puede pulsar **«Enviar a gestoría»** y confirmar el destinatario. El destinatario aparece inicialmente como `gestion@marianmadrid.es`, pero sigue siendo editable en cada envío.

El mecanismo de entrega manual conserva la confirmación explícita, el remitente autenticado, la validación del destinatario y la idempotencia por documento, destinatario y huellas. Si no existen `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en Wix Secrets Manager, el envío falla de forma segura y no se registra una entrega.

> El componente visual canónico está en `docs/WIDGET_PANEL_GESTION_MARIAN.html`. Su sincronización con el HTML Component vivo `#htmlAdministracion` debe hacerse únicamente desde un Editor Wix estable, después de revisar los cambios visuales que el Editor indicó como más recientes. No se debe crear otra página ni sobrescribir el diseño por inferencia.

## Operación y revisión profesional

La gestoría debe definir qué obligaciones, gastos, retenciones, nóminas, facturas recibidas, criterios de caja y particularidades fiscales aplican realmente al negocio. Este sistema prepara las operaciones originadas en Wix y caja; no inventa ni completa datos que no estén registrados.

| Situación | Acción recomendada |
| --- | --- |
| Se necesita revisar un periodo antes del día 5 | Crear manualmente una versión desde ADMINISTRACIÓN y descargar el PDF. |
| El PDF preparado no coincide con la fuente actual | No enviarlo. El control de huella bloqueará la descarga y deberá crearse una nueva versión tras revisar los movimientos. |
| Hay más de 1.200 movimientos o el PDF supera el límite | Dividir el periodo con una revisión técnica controlada; no aumentar límites a ciegas. |
| Se va a enviar un PDF | Revisar contenido, confirmar destinatario y comprobar que el remitente de correo está autenticado. |
| Se va a presentar una obligación | Confirmar modelo, plazo, datos y resultado con la gestoría conforme al calendario oficial vigente de la Agencia Tributaria.[1] |

## Referencias

[1] [Agencia Tributaria — Calendario del contribuyente](https://sede.agenciatributaria.gob.es/Sede/calendario-contribuyente.html)
