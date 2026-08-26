# Notas verificadas: Wix Bookings Services V2

**Consulta:** 26 de agosto de 2026.

| Aspecto | Hallazgo verificado | Implicación para SERVICIOS_CITA |
|---|---|---|
| Servicios V2 | La API crea, administra y consulta servicios de cita, clase y curso; el servicio cubre precio, duración, personal, lugar y políticas. | `SERVICIOS_CITA` necesita un mapeo explícito por ámbito, no un objeto genérico. |
| Actualización | `Update Service` exige la `revision` actual y la incrementa al actualizar. | La sincronización debe leer antes de escribir, comparar hash de proyección y abortar en conflicto de revisión. |
| Duraciones | `sessionDurations` solo se incluye para citas sin precio variable por duración cuando se pretende modificar esa propiedad. | El proyector debe omitirlo por defecto y asignarlo según el tipo de servicio. |
| Ubicaciones | Wix requiere `Set Service Locations`; no se modifican con `Update Service`. | Las ubicaciones se sincronizan en un paso dedicado e idempotente. |
| Extras | Los grupos de extras tienen operaciones dedicadas para propiedades y orden. | `EXTRAS_CATALOGO` se sincroniza por grupos/operaciones dedicadas, no como campos de servicio. |

## Fuentes

1. [About the Services V2 API](https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/introduction)
2. [Update Service](https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/update-service)

## Modelo y creación de servicio

| Campo o regla | Hallazgo verificado | Decisión de mapeo |
|---|---|---|
| Visibilidad | El servicio necesita `category.id`; sin categoría no es visible en el sitio. | `SERVICIOS_CITA` debe contener una referencia Wix `bookingsCategoryId` o una tabla controlada de categoría comercial a ID Wix. |
| Identidad y texto | `name` admite hasta 400 caracteres, `description` hasta 7000 y `tagLine` hasta 6000. | Mapear `tituloServicio`, `descripcionLarga` y `resumenCorto` con límites previos y fallback explícito. |
| Tipo y capacidad | La creación exige `type`, `defaultCapacity`, `onlineBooking` y `payment`; en citas la capacidad debe ser 1. | Fijar `bookingsTipo=APPOINTMENT` y `capacidad=1` para la operación de Marian; no crear clases o cursos accidentalmente. |
| Cobro | `payment` requiere un `rateType` y al menos un canal de pago; online exige tarifa FIXED o VARIED. | Mapear `precio`, `moneda`, `pagoOnline` y `pagoPresencial`; rechazar combinaciones incompatibles. |
| Personal | Las citas requieren al menos un `staffMemberIds`, que son IDs de recurso y no IDs de miembro. | Usar `SERVICIOS_CITA.personalDisponible` como selección múltiple de `MapaStaff`; el backend resuelve y valida los recursos. |
| Duración | Una cita sin precio por duración requiere una duración de sesión; las variantes requieren valores específicos. | Proyectar `duracionTotal` únicamente cuando aplique y no mezclarlo con la fase interna dual. |
| Medios | El objeto acepta imagen principal, cubierta e ítems con ID, dimensiones y texto alternativo opcional. | Añadir campos de media Wix o un adaptador que resuelva el archivo de `imagenPrincipal` a un media ID antes de sincronizar. |
| Ámbitos dedicados | Ubicaciones, grupos de extras, slug y políticas tienen APIs especializadas. | Ejecutar sincronizadores especializados y no sobrescribirlos con un `Update Service` genérico. |

3. [Service Object](https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/service-object)
4. [Create Service](https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/create-service)

## Ejecución dentro de Wix y ubicaciones

| Aspecto | Hallazgo verificado | Implicación de implementación |
|---|---|---|
| SDK Velo | `updateService()` se importa desde `wix-bookings.v2`, soporta actualización parcial y solo se ejecuta en backend o dashboard con permiso `MANAGE BOOKINGS`. La API permanece en Developer Preview. | El sincronizador reside exclusivamente en backend y se encapsula detrás de un interruptor de QA, una cola y un contrato de campos soportados. |
| Concurrencia | La API exige la revisión existente para evitar sobreescrituras no intencionadas. | Cada trabajo lee el servicio nativo, calcula una proyección y reintenta solo ante conflicto de revisión tras una nueva lectura. |
| Ubicaciones | `Set Service Locations` reemplaza la lista; retirar ubicaciones obliga a indicar la acción sobre sesiones futuras. | La automatización no elimina ni altera ubicaciones existentes por defecto. La sincronización de ubicaciones se bloquea hasta que el registro CMS declare una acción de sesiones explícita y aprobada. |
| Historial | Las sesiones pasadas no se cambian al reemplazar ubicaciones. | Los cambios de localización se auditan como operaciones separadas y nunca son parte de una actualización estándar del catálogo. |

5. [Velo: updateService()](https://dev.wix.com/docs/velo/apis/wix-bookings-v2/services/update-service)
6. [Set Service Locations](https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/set-service-locations)

## Formularios y pagos

| Aspecto | Hallazgo verificado | Regla para el catálogo maestro |
|---|---|---|
| Formularios de reserva | La integración con Wix Forms desde 31-01-2025 hace que campos de formulario de servicios nuevos no se rellenen y que servicios antiguos pierdan esos datos al actualizarse. | `SERVICIOS_CITA` no puede ser fuente de verdad de formularios sin un mapeo separado de Wix Forms. El sincronizador bloquea cambios sobre servicios con formulario legacy hasta migrar y verificar su formulario. |
| Precio fijo | `FIXED` exige importe mayor que 0.00. | `precio > 0` produce pago fijo; no se envía tarifa fija cero. |
| Sin tarifa | Incluso un servicio gratuito exige permitir pago online o presencial. | Precio cero se convierte en `NO_FEE` y valida al menos un canal. |
| Precio personalizado | Requiere permitir pago presencial. | Solo se habilita cuando haya texto comercial explícito y un campo de activación. |
| Depósito y planes | Los depósitos requieren online y, si son parciales, presencial; los planes no se combinan con aprobación manual. | Se declaran como dominios avanzados opcionales y se rechaza su sincronización sin configuración completa. |

7. [Wix Bookings Services collection fields](https://dev.wix.com/docs/velo/apis/wix-bookings-v2/services-collection-fields)
8. [About Service Payments](https://dev.wix.com/docs/api-reference/business-solutions/bookings/services/services-v2/about-service-payments)
