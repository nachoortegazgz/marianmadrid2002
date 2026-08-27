# Evidencia de Editor: ADMINISTRACIÓN

**Fecha de observación:** 27 de agosto de 2026.
**Método:** sesión autenticada de solo lectura en el Editor Wix; no se guardaron ni publicaron cambios de diseño.

El sitio **Marian Madrid Peluquería y Estética** abrió correctamente en el Editor, con la página **Inicio** como superficie inicial. Se confirmó que la navegación contiene una entrada `ADMINISTRACION` y que el sitio sigue publicado, con Velo activado, zona horaria `Europe/Madrid` y moneda EUR.

La automatización visual del Editor sufrió tiempos de espera al intentar abrir los controles de páginas y capas. Como el Editor había advertido antes de la existencia de cambios de diseño potencialmente más recientes, no se ha sustituido el contenido vivo del componente `#htmlAdministracion` por inferencia ni se ha guardado ninguna versión visual.

| Elemento preparado | Estado | Salvaguarda |
| --- | --- | --- |
| Widget canónico | Versionado en `docs/WIDGET_PANEL_GESTION_MARIAN.html`. | La prueba `test:widget` valida su sintaxis y contratos de mensajes. |
| Página existente | `ADMINISTRACION` con componente `#htmlAdministracion`. | No se creó una página paralela. |
| Documentos y gestoría | Pestaña, vista previa, creación de versión, descarga e intento de envío confirmado preparados. | La entrega requiere secretos del proveedor y confirmación visible. |
| Correo M365 / SharePoint | Sin configurar y sin tráfico. | La bandera central mantiene M365 desactivado en Fase 1. |

> La sincronización del HTML vivo requiere una sesión estable del Editor. Debe realizarse después de validar el borrador y antes de publicar, preservando cualquier diseño más reciente ya guardado en Wix.


## Reintento posterior de inspección

Se intentó reabrir el Editor conectado para revisar el componente HTML existente de `ADMINISTRACION`. La pestaña no estaba activa y la navegación posterior devolvió un tiempo de espera `HTTP 504` del conector del navegador. No se guardó ni publicó ningún cambio visual. Por tanto, `docs/WIDGET_PANEL_GESTION_MARIAN.html` permanece como fuente canónica versionada de referencia y la sincronización con el HTML Component vivo sigue pendiente de una sesión del Editor disponible.
