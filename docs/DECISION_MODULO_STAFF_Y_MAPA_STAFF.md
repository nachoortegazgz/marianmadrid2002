# Decisión técnica: `staff.js` y `MAPA_STAFF`

**Fecha:** 26 de agosto de 2026
**Decisión:** se **mantiene** `src/backend/staff.js`, pero se transforma en un adaptador privado de la colección CMS `MAPA_STAFF` (`MapaStaff`). Se elimina su responsabilidad anterior de leer el secreto `MAPA_STAFF`.

> `staff.js` sigue siendo necesario como frontera de dominio. No debe contener datos estáticos, secretos ni lógica de interfaz; concentra las consultas privadas, la normalización, la caché limitada y la conversión entre una selección editorial y los recursos nativos de Wix Bookings.

## Motivo de la decisión

El módulo tiene cinco consumidores actuales: `security.js`, `horario.web.js`, `reservas.web.js`, `data.js` y el sincronizador de servicios. Eliminarlo obligaría a replicar consultas, reglas de normalización de nombre y protección de datos de personal en cada uno de ellos. Esto incrementaría el riesgo de divergencias entre permisos, fichajes y servicios reservables.

| Alternativa | Evaluación | Decisión |
|---|---|---|
| Eliminar `staff.js` y consultar CMS desde cada módulo | Duplica acceso a datos privados, caché y validaciones. | Rechazada. |
| Mantener `staff.js` leyendo el secreto | Impide la selección mantenible de personal desde CMS y requiere rotación de secreto para cambios operativos. | Retirada. |
| Mantener `staff.js` como adaptador de `MAPA_STAFF` | Unifica acceso, limita datos retornados y permite invalidar caché mediante hooks. | Adoptada. |

## Responsabilidades actuales de `staff.js`

| Responsabilidad | Comportamiento | Límite de seguridad |
|---|---|---|
| Catálogo privado | Lee solo `MapaStaff` en backend con un límite de 220 registros y caché temporal. | No hay métodos públicos que expongan el catálogo completo a visitantes. |
| Identidad de personal | Resuelve por ID CMS, recurso Bookings, miembro Wix o correo. | El correo y el ID de miembro no deben enviarse a widgets ni respuestas públicas. |
| Etiquetas de interfaz | Normaliza el nombre visible de personal. | Las etiquetas son el único dato de presentación reutilizable en reservas. |
| Selección de servicios | Convierte `SERVICIOS_CITA.personalDisponible` en `staffMemberIds` de recursos Bookings. | Solo admite registros activos y recursos con GUID válido. |
| Coherencia | Los hooks de `MapaStaff` limpian la caché después de inserciones, cambios o borrados. | Los cambios tienen efecto sin secretos ni reinicios manuales. |

## Contrato de la colección `MAPA_STAFF`

La colección es privada y debe tener permisos restringidos a administración y backend. El código requiere los siguientes campos.

| Campo técnico | Tipo | Finalidad | Exposición |
|---|---|---|---|
| `resourceId` | Texto GUID | Recurso nativo de Bookings empleado en disponibilidad y `staffMemberIds`. | Nunca al cliente salvo cuando una respuesta de reserva ya lo requiere de forma autorizada. |
| `memberId` | Texto | Identidad de Wix Members para autorizar fichajes y operaciones internas. | Privado. |
| `email` | Texto | Respaldo de resolución de colaborador y continuidad durante cambios de miembro. | Privado; no se registra en logs. |
| `scheduleId` | Texto | Identificador de agenda cuando exista. | Privado. |
| `nombreVisible` | Texto | Nombre de presentación controlado para administración y reservas. | Solo como etiqueta cuando esté autorizado. |
| `rol` | Texto | Rol operativo interno. | Privado. |
| `activo` | Booleano | Determina si la persona puede seguir seleccionándose y resolviéndose. | No expuesto. |

## Relación con `SERVICIOS_CITA`

`SERVICIOS_CITA.personalDisponible` es una selección múltiple de referencias a `MAPA_STAFF`. Cuando `bookingsSyncEnabled` está activado, el sincronizador resuelve esas referencias mediante `staff.js` y genera el array de recursos nativos que Wix Bookings espera. El campo técnico heredado `bookingsStaffResourceIds` se conserva solo como compatibilidad temporal para registros QA ya preparados; los nuevos servicios deben usar la selección `personalDisponible`.

El sistema no modifica la disponibilidad efectiva del personal. Wix Bookings sigue siendo el responsable de agendas, recursos, franjas y reservas; `MAPA_STAFF` solo establece qué profesionales están habilitados para prestar un servicio.

## Secreto retirado

La constante `SECRETS.MAPA_STAFF` ha sido retirada del código. La eliminación del valor real del gestor de secretos debe realizarse solo después de que QA haya verificado que todos los registros de `MAPA_STAFF` están completos y que el sincronizador procesa una selección de prueba. Esta última operación es administrativa y externa al repositorio.

## Validación de QA

| Paso | Evidencia esperada |
|---:|---|
| 1 | La colección `MapaStaff` existe con el esquema y permisos privados definidos. |
| 2 | Cada persona activa tiene `resourceId`, `nombreVisible` y al menos `memberId` o `email`. |
| 3 | Un servicio de prueba usa `personalDisponible` con una referencia válida. |
| 4 | La cola sincroniza el servicio con los `staffMemberIds` de recurso correspondientes. |
| 5 | Un fichaje y una consulta de seguridad resuelven al mismo miembro desde `MAPA_STAFF`. |
| 6 | Tras la evidencia anterior, se retira el valor residual del secreto `MAPA_STAFF` en QA. |
