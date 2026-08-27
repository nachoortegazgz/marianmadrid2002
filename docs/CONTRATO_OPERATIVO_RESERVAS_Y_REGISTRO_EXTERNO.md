# Contrato operativo: reservas y registro externo

**Estado:** preparado para QA controlada
**Propietario funcional:** Marian Madrid
**Principio rector:** una reserva o un movimiento financiero no se considera correcto hasta que sea trazable, recuperable e idempotente.

## Alcance y fuente de verdad

El catálogo, la duración, el precio, el estado comercial y el personal elegible proceden de **SERVICIOS_CITA**. La asignación de profesionales procede de la colección privada **MAPA_STAFF**. Wix Bookings representa la agenda operativa y nunca debe convertirse en fuente alternativa de configuración del catálogo.

| Dominio | Fuente de verdad | Proyección controlada | Regla de integridad |
| --- | --- | --- | --- |
| Servicio comercial | `SERVICIOS_CITA` | Wix Bookings Services V2 | Solo se sincronizan servicios válidos y activos. |
| Personal elegible | `MAPA_STAFF` | Recursos de Wix Bookings | No se exponen detalles privados en respuestas públicas. |
| Reserva | Wix Bookings + `CitasF2` | `BookingTransactions` y libro mayor | Una misma clave de idempotencia no puede crear dos reservas. |
| Registro externo | Registros internos inmutables | Lista privada de SharePoint | El registro externo no autoriza ni modifica reservas. |

## Criterios de aceptación de reserva

| Flujo | Resultado exigido | Evidencia persistente | Recuperación ante fallo |
| --- | --- | --- | --- |
| Reserva simple | Una cita de agenda confirmada y una cita interna coherente. | `CitasF2`, `BookingTransactions`, movimiento de pago cuando corresponda y `traceId`. | Reintento con la misma clave devuelve el mismo resultado, sin duplicar. |
| Reserva dual | Dos fases de agenda enlazadas y una única operación de cliente. | Dos referencias de Bookings, vínculo de fases, transacción y trazas comunes. | Si una fase falla, la saga compensa la fase previamente creada. |
| Hueco de exposición dual | Una reserva simple puede ocupar el hueco definido como disponible entre fases duales. | Disponibilidad certificada, reserva simple y trazas asociadas. | El algoritmo no debe bloquear el hueco si no existe solapamiento efectivo. |
| Cobro y devolución | El libro mayor refleja únicamente eventos confirmados y cada devolución se aplica una sola vez. | Movimiento de caja, asiento y referencia de origen. | Los reintentos conservan el mismo identificador de operación. |

La suite automatizada debe conservar pruebas de los cuatro casos anteriores. La validación real en Wix se realizará solo en el entorno de prueba, usando recursos, servicios y franjas de prueba, nunca datos de clientes.

## Configuración versionada prioritaria

| Ajuste | Estado deseado | Criterio de aceptación |
| --- | --- | --- |
| Programación de trabajos | Un único `jobs.config` canónico, sin divergencias entre la raíz y `src/backend`. | Ambas ubicaciones contienen exactamente los mismos trabajos o se elimina la duplicidad no utilizada. |
| Cola de servicios | Procesamiento horario y acotado de `BookingsServiceSyncQueue`. | El trabajo está declarado en la configuración publicada y procesa como máximo el lote configurado. |
| Permisos de métodos web | Permisos declarativos mínimos y validación de rol en el backend. | Las operaciones administrativas siguen inaccesibles a visitantes incluso si una llamada llega al backend. |
| Cachés y bloqueos | TTL limitado, invalidación ante cambios y limpieza programada. | No persisten bloqueos ni disponibilidad obsoleta más allá de su vida útil. |
| Errores y auditoría | Errores públicos saneados y trazas internas asociadas a `traceId`. | No se devuelven secretos, datos internos ni pila de ejecución al cliente. |

## Registro externo en Microsoft 365

La opción recomendada para una instalación ligera es registrar una **proyección mínima y no sensible** en una lista privada de SharePoint mediante Microsoft Graph. No necesita utilizar capacidades de IA de Copilot: Microsoft diferencia Graph para operaciones CRUD sobre datos de las API de Copilot, que requieren una licencia Copilot específica.[1]

| Enfoque | Adecuación | Ventaja | Límite |
| --- | --- | --- | --- |
| Lista SharePoint mediante Microsoft Graph | **Recomendado** | Registro directo, controlado, sin flujo premium intermedio y compatible con un proceso de servidor a servidor. | Requiere registrar una aplicación de Microsoft Entra y consentimiento administrativo. |
| Endpoint autenticado consumido por Power Automate | Compatible con la capa existente | Configuración visual y bajo acoplamiento desde Wix. | La acción HTTP y ciertos conectores pueden requerir una licencia adicional; debe verificarse en el tenant. |
| Conector de Copilot | No es necesario para registro operativo | Permitirá consultar contenido desde Copilot si se dispone de licencia y caso de uso justificado. | Añade administración y requisitos de licencia sin mejorar el registro transaccional. |

El adaptador de Graph utilizará credenciales de aplicación almacenadas exclusivamente en el gestor de secretos de Wix, emitirá tokens de corta duración y escribirá solo en una lista explícitamente concedida. Microsoft documenta el flujo de credenciales de aplicación para procesos servidor a servidor y recomienda permisos mínimos.[2] Para limitar el alcance, el administrador debe conceder `Lists.SelectedOperations.Selected` y otorgar a la aplicación rol `write` únicamente sobre la lista de registros; el consentimiento del ámbito no concede acceso hasta completar la asignación a esa lista.[3]

### Campos permitidos en la lista externa

| Campo externo | Origen interno | Finalidad | Regla de minimización |
| --- | --- | --- | --- |
| `Title` | Tipo de evento + fecha | Identificación legible. | No incluye nombre, teléfono ni correo de cliente. |
| `CorrelationId` | `traceId` | Reconciliación e idempotencia. | Se limita a caracteres seguros y longitud acotada. |
| `EventType` | Tipo de reserva, pago o cierre | Clasificación operativa. | Enumeración cerrada. |
| `OccurredAt` | Fecha del evento | Auditoría temporal. | Fecha ISO 8601 en UTC. |
| `BookingReference` | Referencia interna o Wix | Conciliación técnica. | Nunca contiene una ficha completa de cliente. |
| `Amount` y `Currency` | Ledger confirmado | Conciliación financiera. | Solo eventos financieros definitivos. |
| `IntegrityHash` | Huella de los campos anteriores | Detección de repetición o alteración. | No contiene información personal. |

El adaptador debe rechazar datos que no cumplan el contrato, registrar resultados saneados en `m365SyncLog`, realizar reintentos limitados y no bloquear el recorrido de reserva. La operación principal de negocio confirma primero el registro interno; la proyección externa se procesa después de forma recuperable.

## Ajustes que exigen verificación administrativa

La configuración de código no sustituye los ajustes en el panel. Antes de publicar, un administrador debe confirmar que el dominio principal usa HTTPS, la zona horaria operativa es Europe/Madrid, los pagos y la política de reserva coinciden con el catálogo, los recursos de Bookings existen y están vinculados a los miembros correctos, y las colecciones sensibles tienen permisos privados. También deberá registrar y consentir la aplicación de Microsoft Entra si se activa la proyección SharePoint.

## Referencias

[1]: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/copilot-apis-overview "Microsoft 365 Copilot APIs overview"
[2]: https://learn.microsoft.com/en-us/graph/auth-v2-service "Get access without a user - Microsoft Graph"
[3]: https://learn.microsoft.com/en-us/graph/permissions-selected-overview "Overview of Selected permissions in OneDrive and SharePoint"
