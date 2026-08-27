# Diseño de documentos y gestoría en ADMINISTRACIÓN

**Estado:** aprobado para Fase 1.
**Superficie:** componente `#htmlAdministracion` de la página existente **ADMINISTRACIÓN**.
**Acceso:** exclusivamente Marian, comprobado tanto en el controlador como en cada método backend con `requireMarianManager()`.

## Decisión de entrega

El flujo se activa manualmente por Marian y es determinista: no necesita una tarea periódica ni un proceso permanente. La generación y envío se ejecutan bajo demanda, conservando el ledger de Wix como fuente de verdad y un registro de auditoría separado.

| Alternativa evaluada | Resultado | Motivo |
| --- | --- | --- |
| Correo transaccional nativo de Wix | No seleccionada. | Ligero, pero la entrega depende de un contacto Wix y no está diseñada para adjuntar el paquete fiscal como archivo. |
| Proveedor transaccional con adjunto | **Seleccionada.** | Permite enviar un CSV normalizado y, más adelante, PDF a la gestoría; admite clave de idempotencia y etiquetas de auditoría. [1] |

El destinatario predeterminado será `gestion@marianmadrid.es`, visible y editable por Marian antes de cada envío. El sistema no enviará nada al cargar la página: el botón exige una confirmación explícita y el backend registra el destinatario efectivo, la versión, el hash del contenido, la hora y el identificador externo de entrega.

## Flujo funcional

| Paso | Acción de Marian | Resultado backend | Salvaguarda |
| --- | --- | --- | --- |
| 1. Preparar | Selecciona ejercicio y trimestre, y pulsa vista previa. | Obtiene resumen y libro desde el ledger inmutable. | Rechaza períodos inválidos y consultas truncadas. |
| 2. Crear | Confirma la creación del paquete. | Construye un CSV con versión, resumen y libro; calcula su hash. | No crea factura ni obligación fiscal ficticia. |
| 3. Revisar | Comprueba el resumen y el destinatario precargado. | Expone solo metadatos y un contenido descargable de la versión actual. | No muestra secretos ni datos innecesarios. |
| 4. Enviar | Puede editar la dirección y confirma. | Envía la versión ya creada como adjunto mediante el proveedor seleccionado. | Validación de correo, clave de idempotencia, límite de tamaño y auditoría. |
| 5. Reintentar | Solicita de nuevo un envío fallido. | Reutiliza la misma versión y evita duplicación durante la ventana del proveedor. | No regenera ni muta movimientos fuente. |

## Datos y documentación

El primer documento será un **paquete de revisión para gestoría**, no una factura individual ni una autoliquidación presentada. Incluye periodo, hora de generación, totales de base e IVA, desglose por forma de pago y las filas del libro registro con número, fecha, tipo de movimiento, importes y huella del ledger. Su contenido se deriva de `movimientoCaja` y no permite editar los movimientos.

El envío se registrará en `MM_AUDIT_LOG` inicialmente para evitar añadir una colección productiva sin necesidad. Una fase posterior podrá crear una colección documental inmutable si se requiere conservación de binarios, múltiples revisiones o firma electrónica específica.

| Configuración | Ubicación | Tratamiento |
| --- | --- | --- |
| Dirección predeterminada | Interfaz ADMINISTRACIÓN | Precargada, visible y editable por Marian. |
| Dirección efectiva | Registro de auditoría | Conservar para trazabilidad del envío. |
| Clave de API del proveedor | Gestor de secretos Wix: `RESEND_API_KEY`. | Nunca en código, CMS, logs ni frontend. |
| Remitente verificado | Gestor de secretos Wix: `RESEND_FROM_EMAIL`. | Debe pertenecer a un dominio autenticado. |
| Documento | Generado en memoria desde el ledger. | CSV UTF-8, límite conservador inferior a 40 MB. [1] |
| Idempotencia | Hash de paquete y destinatario. | Usa clave de solicitud del proveedor con vida limitada. [1] |

## Requisitos previos de activación

Antes de habilitar el botón final de envío se deberá crear y verificar la cuenta del proveedor, autenticar el dominio remitente de Marian Madrid y guardar exclusivamente los dos secretos requeridos. Hasta que existan ambos secretos, el panel permitirá preparar, revisar y descargar el paquete, pero devolverá una advertencia clara al intentar enviar.

La solución no activa Microsoft 365, SharePoint, OneDrive, Excel ni Copilot. Estos servicios permanecen en Fase 2.

## Referencias

[1]: https://resend.com/docs/api-reference/emails/send-email "Resend — Send Email"
[2]: https://resend.com/docs/dashboard/emails/attachments "Resend — Attachments"
