# Auditoría contrastada del ecosistema Wix

**Fecha:** 25 de agosto de 2026
**Alcance:** contraste técnico de `pasted_content_11.txt` y `pasted_content_12.txt` frente a la rama `qa/wix-engine-hardening-20260825`, el contrato CMS canónico y las pruebas del repositorio.
**Criterio de intervención:** solo se corrige código cuya discrepancia está demostrada por el runtime, los contratos o el flujo de datos actual. No se aceptan snippets del adjunto que sustituyan identificadores confirmados, abran CORS, inventen datos fiscales o eliminen estructuras CMS.

> Esta revisión es técnica. No certifica cumplimiento fiscal, contable, laboral ni de protección de datos; cualquier uso regulado requiere validación de la asesoría o profesional competente.

## Resultado ejecutivo

La auditoría nueva contiene varios hallazgos útiles, pero también reutiliza observaciones correspondientes a versiones anteriores del código. No existe evidencia de los fallos de sintaxis atribuidos a `internalConfig.js` y `mmUtils.js`, del error de `_safeTrim`, de CORS abierto ni del bloqueo de `isMarianManager`. Las comprobaciones de sintaxis G10, ESLint y los contratos ejecutables los desmienten.

| Clasificación | Resultado | Disposición |
|---|---:|---|
| Confirmado y corregido | 5 | Invalidación de cachés al actualizar servicios, timeout RBAC, rechazo de slot pasado, identificación obligatoria de cita y lectura de pagos por lote. |
| Confirmado, ya corregido antes de este contraste | 4 | `precioAddon`, CORS restringido, `_safeTrim` y `isMarianManager`. |
| Confirmado, pendiente de decisión de producto | 2 | Idempotencia de consumo manual de inventario y política explícita de stock negativo. |
| No aplicable o desactualizado | 9 | Sintaxis espuria, NIF ficticio, wildcard CORS, ausencia de RBAC Marian y otros puntos ya superados. |
| Requiere diseño o medición adicional | 8 | Timeout global cancelable de saga, rendimiento dual, procedencia de mensajes Wix, refactors DRY y mejoras puramente UX. |

## Hallazgos críticos

| Hallazgo del adjunto | Veredicto | Evidencia y disposición |
|---|---|---|
| C-01: `internalConfig.js` no compila por espacios y usa colecciones con espacios | **Falso / desactualizado** | El archivo se analiza correctamente; las fuentes pasan `node --check`, ESLint y la prueba G10. Las constantes vigentes están congeladas y los IDs de colección no llevan espacios. No se aplicó la sustitución propuesta. |
| C-02: `_safeTraceId` llama a `safeTrim` inexistente | **Falso / desactualizado** | `http-functions.js` importa y usa `_safeTrim` de forma consistente. |
| C-03: `security.web.js` no devuelve `isMarianManager` | **Falso / desactualizado** | El método calcula y devuelve `isAdmin`, `isCajero` e `isMarianManager`; el backend además exige la correspondencia de Marian en `MAPA_STAFF`. |
| C-04: `mmUtils.js` tiene operadores y cadenas sintácticamente rotos | **Falso / desactualizado** | La comprobación sintáctica y G10 de todas las fuentes JavaScript pasa. |
| C-05: `Import2_afterUpdate` no invalida días ni slots | **Confirmado y corregido** | El hook ahora invalida de forma acotada `DualSlotCache`, `AvailabilityDaysCache` por `serviceId` y `AvailabilitySlotsCache` por `phaseOneServiceId`, para el servicio editado y su fase enlazada. |
| C-06: falta un timeout global de Saga | **Parcial; no se aplica wrapper genérico** | Las llamadas externas de la saga ya se ejecutan con timeout. Envolver toda la saga sin cancelación cooperativa puede devolver timeout mientras las operaciones subyacentes continúan, complicando locks y compensación. Se conserva el patrón actual y cualquier presupuesto global debe diseñarse junto con cancelación y compensación explícitas. |
| C-07: no se rechaza un slot pasado | **Confirmado y corregido** | Antes de resolver recursos y crear reservas, la saga devuelve `SLOT_IN_PAST` si la Fase 1 ya ha comenzado. La revalidación nativa exacta continúa como segunda defensa. |

## Seguridad e integridad

| Hallazgo del adjunto | Veredicto | Disposición |
|---|---|---|
| A-01: CORS abierto | **Falso / desactualizado** | La lista autorizada es `https://www.marianmadrid.es` y `https://marianmadrid.es`; no se reintroduce wildcard. |
| A-02: lectura RBAC sin timeout | **Confirmado y corregido** | `_getMemberFull()` se limita mediante `withTimeout()` y el timeout API configurado; ante error o espera excesiva devuelve el flujo de denegación existente. |
| A-03: token no determinista de consumo manual | **Confirmado, pendiente de contrato** | El flujo manual no recibe aún una clave de idempotencia estable desde la interfaz. No se ha inventado una clave a partir de fecha, usuario o contenido, porque podría fusionar dos consumos legítimos. La mejora requiere añadir `operationId` persistente al payload y a su UI. |
| A-04: posible stock negativo | **Confirmado, pendiente de política** | El consumo puede llevar `stockExpected` a negativo. Bloquearlo es una decisión de operación: debe aclararse si se permite venta/consumo bajo pedido o se exige inventario físico previo. No se altera el comportamiento sin esa regla empresarial. |
| A-05: consultas de pago N+1 | **Confirmado y corregido** | `_markCitasPaidByBookingIds()` consulta las citas solicitadas con una operación `.in('bookingId', ids)` y conserva actualizaciones idempotentes por cita. |
| A-06: mutex global de ledger | **Diseño aceptado** | La serialización es deliberada para preservar el orden único de la cadena de hashes del libro. Sigue siendo un límite de capacidad conocido, no un bug que deba paralelizarse sin versionar el modelo de integridad. |
| A-07: `event.origin` en bridge | **Pendiente de contrato Wix** | El bridge recibe eventos de un componente HTML Wix, cuyo formato no equivale necesariamente a `window.postMessage`. No se añadió una validación de origen que pueda bloquear mensajes legítimos sin confirmar el contrato del componente. |
| A-08: cita sin `bookingId` | **Confirmado y corregido** | `CitasF2_beforeInsert` normaliza y exige `bookingId`, excepto en migraciones que usan el bypass ya controlado. |
| A-09: falta indicador de carga | **Mejora UX, diferida** | No es un fallo de autorización ni de persistencia. Se tratará como mejora de interfaz al confirmar el widget físico de ADMINISTRACION en el Editor. |

## Rendimiento, mantenimiento y observaciones menores

| Grupo | Veredicto | Decisión |
|---|---|---|
| Búsqueda dual F1/F2 y `skipCache` (M-01/M-02) | Riesgo de rendimiento plausible | La revalidación exacta prioriza consistencia frente a caché. Antes de rediseñarla se requieren métricas de slots, recursos y latencia real; precargar indiscriminadamente puede aumentar carga y devolver disponibilidad obsoleta. |
| Recalcular integridad de un día (M-03) | Propio de una verificación de ledger | No se sacrifica la verificación íntegra por una optimización sin estrategia de checkpoints firmados. |
| Dashboard limitado a 100 elementos (M-06) | Limitación de presentación | El panel actual no es fuente de verdad. Una futura paginación deberá incluir totales y bandera de más resultados. |
| Duplicidades de helpers (M-07/M-08) | Mejora de mantenimiento | No se extraen durante una corrección funcional porque implicaría mover utilidades transversales y aumentar el riesgo de importaciones circulares. |
| Limpieza O(n) del rate limiter (M-09) | Acotado | El caché tiene límite de 5.000 entradas y TTL; no se observó un fallo funcional. |
| Check frontend de administrador (M-10) | Defensa UX redundante | La autorización backend permanece obligatoria; no se considera vulnerabilidad. |
| `inflightRequests` sin limpieza (M-11) | Falso | La implementación usa `finally` y elimina la entrada tras éxito o error. |
| Rate limit de asistente IA (M-12) | Falso / incompleto | La fachada backend limita la superficie del asistente y exige a Marian; no se delega seguridad al frontend. |
| `destroy()` y destinos de navegación (B-01/B-02) | Mejora menor | No bloquean los flujos críticos; se mantienen para una iteración de UI. |
| Import al final, helper de uso único y spread en slots (B-04/B-05/B-07) | Estilo / microoptimización | Sin impacto funcional demostrado; no se cambia código estable por estética. |

## Cambios incorporados en esta etapa

| Archivo | Cambio verificado |
|---|---|
| `src/backend/data.js` | Invalida todas las cachés persistentes correctas al editar un servicio y exige `bookingId` en nuevas `CitasF2`. |
| `src/backend/reservas.web.js` | Lee el precio canónico `precioAddon` y conserva `cantidadMaximaAddon` como metadato, sin enviar una cantidad no definida a Wix Bookings. |
| `src/backend/booking/bookingSaga.js` | Rechaza Fase 1 iniciada y deja la cantidad nativa de complemento en su valor por defecto, ya que el UI solo selecciona IDs. |
| `src/backend/security.js` | Protege la obtención de miembro completo con timeout. |
| `src/backend/events.js` | Agrupa la lectura de citas al marcar pagos recibidos. |
| `tests/verify-core.mjs` | Aumenta de 14 a 16 controles estructurales, cubriendo cachés, complementos y defensas runtime. |

## Validación ejecutada

La batería local ejecutada tras los cambios completó correctamente ESLint, sincronización de tipos Wix, 16 verificaciones estructurales, 6 simulaciones críticas de reservas/pagos/devoluciones, 2 simulaciones de ADMINISTRACION y cierre X/Z, el contrato de libros electrónicos, el parseo JSON de contratos y `git diff --check`.

## Pendientes operativos explícitos

| Pendiente | Responsable / condición |
|---|---|
| Definir si el consumo manual puede dejar stock negativo | Marian y responsable de operación/inventario. |
| Diseñar `operationId` persistente para consumo y recepción manual de inventario | Requiere cambio coordinado de payload UI, backend y pruebas. |
| Configurar `FISCAL_NIF_EMISOR` en Wix Secrets Manager | Administración del sitio; no se debe sustituir por un NIF de ejemplo. |
| Aprobar `PLAN_CUENTAS_CONTABLES` | Gestoría; activa únicamente entonces la proyección contable. |
| Confirmar y publicar el componente `#htmlAdministracion` en Wix Editor | Marian / Editor Wix; el código de página existe, pero no se declara publicación sin confirmación de la CLI. |

## Referencias internas

- `src/backend/data.js`
- `src/backend/reservas.web.js`
- `src/backend/booking/bookingSaga.js`
- `src/backend/security.js`
- `src/backend/security.web.js`
- `src/backend/events.js`
- `src/backend/internalConfig.js`
- `tests/cms-schema-canonical.json`
- `tests/verify-core.mjs`
- `pasted_content_11.txt` y `pasted_content_12.txt`
