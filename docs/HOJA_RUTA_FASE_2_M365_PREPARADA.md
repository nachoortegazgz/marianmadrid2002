# Hoja de ruta de Fase 2: registro externo institucional

**Estado:** planificado y bloqueado hasta la finalización formal de la Fase 1 y la autorización expresa del propietario.  
**Ámbito previsto:** cuenta institucional indicada por el propietario para Microsoft 365.  
**Principio rector:** Wix conserva la fuente de verdad de reservas, cobros y libro mayor. Microsoft 365 recibe una proyección mínima para consulta y conciliación, nunca autoriza pagos, modifica reservas ni reemplaza registros internos.

> No se iniciará sesión, no se creará ninguna aplicación, no se almacenarán secretos y no se escribirá ningún dato externo hasta recibir el cierre de Fase 1 y el mandato expreso de iniciar Fase 2.

## Condiciones de inicio

La Fase 2 empieza únicamente después de confirmar los siguientes criterios de salida de la Fase 1. Esta separación evita que un sistema externo añada complejidad antes de que la operación nativa de Wix esté estable.

| Criterio de salida de Fase 1 | Evidencia requerida |
| --- | --- |
| Reservas simples, duales y hueco de exposición | Pruebas simuladas superadas y QA real aislada sin clientes ni cobros reales. |
| Transacciones y devoluciones | Idempotencia, compensación y trazas verificadas en el ledger interno. |
| Cumplimiento técnico-fiscal | Cadena de integridad, numeración, IVA, registro de eventos y exportación revisados frente a la configuración fiscal aplicable. |
| Catálogo y personal | Servicios activos sincronizables, fases `F2-` no reservables por separado y `MAPA_STAFF` privado validado. |
| Calidad de despliegue | Pruebas, sanitización, lint, revisión de tipos y publicación de la versión final superados. |
| Aprobación | Mensaje expreso del propietario: **«Iniciar Fase 2»**. |

## Objetivo y datos permitidos

El alcance inicial será una lista privada de SharePoint denominada **Registro Operativo Wix**. Contendrá solo una proyección de movimientos ya confirmados: ninguna ficha de cliente, información de contacto, nota, descripción de servicio, dato de tarjeta o dato biométrico.

| Campo externo | Origen Wix | Uso | Restricción |
| --- | --- | --- | --- |
| `Title` | Tipo de evento y referencia | Lectura administrativa. | Sin datos personales. |
| `CorrelationId` | `traceId` saneado | Reconciliación. | Índice recomendado. |
| `EventType` | Tipo de evento controlado | Clasificación. | Lista cerrada de valores. |
| `OccurredAt` | Momento de confirmación | Auditoría temporal. | UTC, ISO 8601. |
| `BookingReference` | Referencia técnica de reserva | Conciliación. | Sin ficha de cliente. |
| `TransactionId` | Identificador interno | Idempotencia y conciliación. | Índice recomendado. |
| `Amount` y `Currency` | Ledger confirmado | Control financiero. | Solo movimientos definitivos en EUR. |
| `IntegrityHash` | Huella estable de los campos anteriores | Evitar duplicados y detectar alteraciones. | Índice único obligatorio. |

## Alternativas de arquitectura para decidir al inicio

| Enfoque | Funcionamiento | Ventajas | Coste y complejidad |
| --- | --- | --- | --- |
| **A. Microsoft Graph → SharePoint** | Wix obtiene un token de aplicación y proyecta la cola directamente en la lista privada. | Menor número de componentes, idempotencia en origen, mínimo privilegio por lista y sin depender de Copilot. | Bajo coste operativo; requiere una aplicación de Microsoft Entra y cinco secretos gestionados. |
| **B. Webhook autenticado → Power Automate → SharePoint** | Wix llama a un endpoint protegido; un flujo escribe la lista y, opcionalmente, actualiza un libro Excel. | Administración visual y transformaciones sencillas para el equipo. | Complejidad media; debe comprobarse la licencia del conector HTTP y el gobierno de flujos del tenant. |
| **C. SharePoint como registro y Power Automate/Excel como capa de informes** | La proyección entra por A; flujos posteriores agregan informes en Excel y archivado en OneDrive. | Mantiene el registro transaccional separado de los informes y reduce el riesgo de conflictos en Excel. | Media; es la extensión recomendable solo cuando el registro base esté estable. |

La decisión se tomará al iniciar la Fase 2. La arquitectura preparada actualmente corresponde a la opción **A**, porque reduce mantenimiento y mantiene el registro externo desacoplado de la reserva. La opción **C** podrá añadirse después sin cambiar el origen ni la trazabilidad.

## Ejecución de Fase 2

### 1. Confirmación de tenant, identidad y gobierno

Se confirmará la cuenta institucional exacta designada por el propietario, el tenant correcto y el rol administrativo disponible. La autenticación multifactor se completará solo en la sesión autorizada. Las contraseñas, códigos temporales, secretos y tokens no se copiarán en el repositorio, CMS, documentación ni mensajes de trabajo.

Antes de conceder permisos, se identificará el propietario de la lista, la política de retención, el grupo administrativo autorizado y el procedimiento de revocación. Esta validación evita que una cuenta personal, un tenant erróneo o una lista compartida se conviertan en destino del registro financiero.

### 2. Crear y proteger la lista de SharePoint

Se creará la lista **Registro Operativo Wix** en un sitio privado, restringida al equipo administrativo. Se configurarán exactamente los campos indicados arriba y un índice único sobre `IntegrityHash`. No se habilitarán vínculos públicos, invitaciones anónimas, sincronización indiscriminada ni columnas de identidad de clientes.

Se realizará una exportación administrativa de la estructura, no de datos de clientes, y se anotará el identificador técnico del sitio y de la lista para su almacenamiento exclusivo en el gestor de secretos de Wix.

### 3. Registrar una aplicación de Microsoft Entra de mínimo privilegio

Se creará una aplicación confidencial de un único tenant, sin URI de redirección porque el flujo es servidor a servidor. Su identidad se limitará al permiso de aplicación `Lists.SelectedOperations.Selected`. Este permiso requiere consentimiento administrativo y, además, asignación explícita sobre el recurso seleccionado; no da acceso a todas las listas por sí solo.[1] [2]

Después se concederá el rol `write` solo a la lista **Registro Operativo Wix**. Se elegirá un certificado cuando la administración del tenant lo permita; de forma transitoria, puede emplearse un secreto de cliente de duración limitada, con responsable de rotación y fecha de expiración registrada.

### 4. Configurar secretos y reactivar la proyección

Solo tras terminar los pasos anteriores se configurarán en el gestor de secretos de Wix los cinco identificadores: tenant, aplicación, credencial, sitio y lista. El código ya preparado consulta estos valores exclusivamente desde el gestor de secretos; no se deberán trasladar a código, colecciones CMS ni interfaz pública.

Se revisará la activación de la cola `M365GraphSyncQueue`, el trabajo programado, los límites de lote y los reintentos. La cola mantendrá el patrón de escritura primero en el ledger de Wix y proyección posterior recuperable: un fallo externo no debe cancelar ni alterar una reserva o un cobro interno.

### 5. Prueba controlada y aceptación

La prueba usará una reserva y un pago de QA, sin cliente real ni cargo real. Se verificará una sola fila externa, la coincidencia de `TransactionId`, `CorrelationId` e `IntegrityHash`, y que un reintento no cree un duplicado. Después se revocará temporalmente el permiso de lista para confirmar que el fallo externo queda contenido en la cola y no afecta al ledger interno; el permiso se restaurará una vez documentado el resultado.

| Prueba | Resultado de aceptación |
| --- | --- |
| Movimiento interno confirmado | El ledger de Wix se inserta antes de cualquier operación externa. |
| Primera proyección | Una fila SharePoint con los campos mínimos e `IntegrityHash` único. |
| Reintento idempotente | No aparece una segunda fila. |
| Permiso retirado | Se registra un error saneado y la operación interna permanece intacta. |
| Secreto inválido o vencido | La cola queda recuperable; no expone credenciales ni detalles de cliente. |
| Revocación total | El acceso externo se retira sin tocar reservas, pagos ni libro mayor Wix. |

### 6. Extensiones posteriores y operación mínima

Solo tras superar la aceptación se valorará Power Automate para alertas de cola fallida, un Excel de conciliación en SharePoint o OneDrive y cuadros de mando. Excel no será el primer destino de cada transacción: se usará como informe o exportación derivada para no introducir conflictos de escritura ni romper la idempotencia.

La operación recurrente deberá limitarse a revisar fallos de cola, rotar la credencial antes de su caducidad, confirmar los permisos de una única lista y revisar el acceso administrativo. Copilot podrá consultarse como interfaz adicional solo si el tenant dispone de licencia y un caso de uso concreto; no es requisito técnico para el registro mediante Microsoft Graph.[3]

## Límites de cumplimiento y seguridad

Los registros externos no sustituyen la documentación fiscal legal, las facturas, los libros registro exigibles ni la conservación aplicable. El diseño propuesto protege la minimización de datos y la separación entre operativa de cliente, registro interno y copia administrativa; la configuración efectiva deberá ser revisada por la asesoría contable-fiscal y el responsable de protección de datos antes de activar datos reales.

## Referencias

[1]: https://learn.microsoft.com/en-us/graph/auth-v2-service "Get access without a user - Microsoft Graph"
[2]: https://learn.microsoft.com/en-us/graph/permissions-selected-overview "Overview of Selected permissions in OneDrive and SharePoint"
[3]: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-apis-overview "Microsoft 365 Copilot APIs overview"
