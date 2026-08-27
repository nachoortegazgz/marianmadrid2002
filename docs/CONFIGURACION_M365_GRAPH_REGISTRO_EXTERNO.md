# Configuración de registro externo en Microsoft 365

**Finalidad:** proyectar los movimientos contables ya confirmados en Wix hacia una **lista privada de SharePoint**, sin detener reservas, pagos, cierres internos ni atención al cliente.

> La lista externa es una copia operativa para consulta y conciliación. El libro mayor de Wix sigue siendo la fuente de verdad financiera.

## Decisión de arquitectura

El adaptador `backend/m365GraphSync.js` usa Microsoft Graph para insertar registros en SharePoint mediante una cola recuperable. Esta elección separa el registro de datos de las capacidades de IA: Microsoft indica que Graph se utiliza para operaciones CRUD sobre datos y está disponible bajo los términos de la suscripción Microsoft 365, mientras que las API de Copilot requieren licencia Microsoft 365 Copilot.[1]

| Alternativa | Resultado | Adecuación al objetivo |
| --- | --- | --- |
| **Microsoft Graph + lista SharePoint** | El sitio escribe una proyección mínima desde una cola horaria. | **Recomendada:** ligera, directa, idempotente y sin dependencia de automatizaciones premium. |
| Power Automate sobre los endpoints existentes | Un flujo consulta endpoints protegidos de Wix y escribe en Microsoft 365. | Útil si se prefiere administración visual, pero se debe confirmar la disponibilidad de conectores HTTP en el tenant. |
| Conector de Copilot | Indexa o consulta contenido externo desde experiencias Copilot. | No es necesario para registrar operaciones; añade requisitos de licencia y gobierno. |

## 1. Crear la lista privada de SharePoint

Crea una lista privada, por ejemplo **Registro Operativo Wix**, accesible solo al equipo administrativo. Agrega las siguientes columnas con los nombres internos indicados. `Title` es la columna predeterminada y no debe eliminarse.

| Nombre mostrado | Nombre interno requerido | Tipo | Regla |
| --- | --- | --- | --- |
| Título | `Title` | Una línea de texto | Obligatorio; formato `TIPO REFERENCIA`. |
| Correlación | `CorrelationId` | Una línea de texto | Índice recomendado; conserva el `traceId` saneado. |
| Tipo de evento | `EventType` | Una línea de texto | Valores esperados: `LEDGER_MOVEMENT`. |
| Momento | `OccurredAt` | Fecha y hora | Se escribe como ISO 8601 UTC. |
| Referencia de reserva | `BookingReference` | Una línea de texto | No contiene ficha de cliente. |
| Identificador de transacción | `TransactionId` | Una línea de texto | Índice recomendado. |
| Importe | `Amount` | Número, dos decimales | Puede ser negativo en devoluciones. |
| Moneda | `Currency` | Una línea de texto | Valor actual: `EUR`. |
| Huella de integridad | `IntegrityHash` | Una línea de texto | **Índice único obligatorio**; permite tratar una respuesta HTTP 409 como duplicado ya registrado. |

No se deben crear columnas para correo electrónico, teléfono, dirección, notas de cliente, descripciones de servicios ni datos de tarjeta. El adaptador no envía esos campos.

## 2. Registrar la aplicación en Microsoft Entra

Un administrador de Microsoft 365 debe registrar una aplicación de tipo confidencial en Microsoft Entra ID. Para un proceso servidor a servidor se usa el flujo de credenciales de aplicación, que opera con la identidad de la aplicación y exige consentimiento de administrador.[2]

| Ajuste | Valor requerido |
| --- | --- |
| Nombre sugerido | `Marian Madrid Wix Registry` |
| Tipo de cuenta | Solo cuentas del directorio de la organización. |
| Plataforma / URI de redirección | No es necesario para el flujo estrictamente servidor a servidor. |
| Credencial | Se recomienda certificado o, para el despliegue inicial, un secreto de cliente con caducidad limitada y rotación documentada. |
| Permiso de aplicación | `Lists.SelectedOperations.Selected`. |
| Asignación posterior | Rol `write` exclusivamente sobre la lista anterior. |

El consentimiento de `Lists.SelectedOperations.Selected` por sí solo no concede acceso. Después del consentimiento, el administrador debe otorgar explícitamente a la aplicación el rol `write` sobre **esa lista concreta**. Microsoft documenta que este modelo requiere consentimiento, asignación de recurso y token con el ámbito seleccionado; omitir cualquiera de los tres impide el acceso.[3]

## 3. Configurar secretos en Wix

En el gestor de secretos de Wix, crea los cinco valores siguientes. No los añadas al repositorio, al CMS ni a scripts de página.

| Nombre de secreto Wix | Procedencia |
| --- | --- |
| `M365_GRAPH_TENANT_ID` | ID de directorio o dominio verificado del tenant Microsoft 365. |
| `M365_GRAPH_CLIENT_ID` | Identificador de aplicación de Microsoft Entra. |
| `M365_GRAPH_CLIENT_SECRET` | Credencial de cliente vigente de Microsoft Entra. |
| `M365_GRAPH_SITE_ID` | Identificador del sitio SharePoint que contiene la lista. |
| `M365_GRAPH_LIST_ID` | Identificador de la lista **Registro Operativo Wix**. |

Al no existir estos secretos, el código no altera reservas ni movimientos: la cola queda en estado `BLOCKED` y la comprobación de salud lo señala para revisión. Nunca se debe introducir una clave en el código, en un mensaje o en una colección pública.

## 4. Crear y asegurar la colección Wix

Crea en CMS la colección privada **`M365GraphSyncQueue`** con el esquema contenido en `tests/cms-schema-canonical.json`. Debe tener permisos exclusivos para administradores y los siguientes índices:

| Índice | Motivo |
| --- | --- |
| `status + nextAttemptAt` | Recupera únicamente el lote pendiente y vencido. |
| `payloadHash` único | Impide duplicar la misma proyección de un movimiento. |
| `traceId` | Facilita conciliación y soporte técnico sin mostrar PII. |

El trabajo `processM365GraphSyncJob` está declarado a los **50 minutos de cada hora UTC**, después de la recuperación fiscal y de la sincronización de servicios. Procesa un máximo de 20 registros por ejecución, con tres intentos y retroceso exponencial. Su fallo nunca revierte una reserva ni un movimiento interno.

## 5. Validación de activación

Una vez configurado en un entorno de prueba, registra un pago de prueba y comprueba lo siguiente:

| Paso | Resultado esperado |
| --- | --- |
| Movimiento interno | Se inserta en `movimientoCaja` con su `transactionId`, hash y `traceId`. |
| Cola local | Se crea un elemento `PENDING` en `M365GraphSyncQueue`. |
| Trabajo programado | El elemento pasa a `COMPLETED` y conserva el identificador externo. |
| SharePoint | Aparece una sola fila con la misma `IntegrityHash`. |
| Reintento | La misma transacción no genera una segunda fila; se registra como `DUPLICATE` si procede. |
| Error de permisos | La cola marca `M365_GRAPH_PERMISSION_DENIED`; Wix conserva la operación original sin cambios. |

## Operación mínima

El mantenimiento se limita a revisar semanalmente `m365SyncLog` y la alerta de salud cuando exista una cola bloqueada, fallida o retrasada. Rota la credencial de cliente antes de su fecha de expiración, reemplazándola únicamente en el gestor de secretos de Wix. Un administrador puede revocar el acceso externo sin tocar reservas eliminando el permiso de la lista o el consentimiento de la aplicación.

## Referencias

[1]: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-apis-overview "Microsoft 365 Copilot APIs overview"
[2]: https://learn.microsoft.com/en-us/graph/auth-v2-service "Get access without a user - Microsoft Graph"
[3]: https://learn.microsoft.com/en-us/graph/permissions-selected-overview "Overview of Selected permissions in OneDrive and SharePoint"
