# Endurecimiento de concurrencia, privacidad y escalabilidad

**Fecha:** 27 de agosto de 2026.
**Alcance:** revisión del diagnóstico técnico adjunto y corrección de hallazgos confirmados contra la versión actual del repositorio.

> Las correcciones de esta entrega refuerzan el comportamiento operativo del código. No certifican cumplimiento fiscal, laboral o de protección de datos, y no activan ningún tráfico hacia Microsoft 365 ni servicios de correo.

## Hallazgos verificados y correcciones

| Hallazgo contrastado | Riesgo observado | Corrección aplicada | Garantía añadida |
| --- | --- | --- | --- |
| Nombres del equipo codificados | Nuevos registros válidos de `MapaStaff` podían recibir una etiqueta genérica. | `staff.js` usa `nombreVisible` validado de la colección privada como fuente de verdad. | El alta de un profesional no requiere editar código. |
| Cuota de disponibilidad por recurso | Clientes diferentes podían compartir la misma cuota; la rotación de fecha y servicio reducía el efecto del límite. | Se combinan cuota por solicitante efímero de navegador y cuota global por superficie, con valores centralizados. | Las consultas normales de personas distintas no comparten el mismo contador de recurso; una ráfaga global sigue acotada. |
| Lock caducado dependiente del cron horario | Un lock huérfano podía conservar un hueco bloqueado hasta el ciclo de limpieza. | La adquisición revalida y reclama un lock que siga caducado; un propietario no puede renovarlo después de caducar. | La recuperación se produce bajo demanda y la carrera se devuelve como reintento controlado. |
| Redacción de PII por clave exacta | Variantes como `clienteEmail` o `guestPhone` podían llegar a detalles de error. | La redacción reconoce claves normalizadas y sufijos comunes de correo, teléfono, identidad, dirección y nombre. | Los detalles registrados sustituyen esos valores por `[REDACTED]`. |
| Exportación externa del ledger completo | Una integración autorizada obtenía hashes, firmas, trazas y líneas internas innecesarias. | `get_getMovements` proyecta solo identidad documental, fecha, naturaleza, impuesto, pago, importes y referencia rectificativa. | Material criptográfico, trazas, datos de cliente y líneas internas permanecen en Wix. |
| Excepción de migración genérica | Los hooks inmutables admitían una vía local basada en un contexto administrativo no utilizado. | Se eliminó la excepción de `cajaActual`, `movimientoCaja`, jornada, asientos y eventos de facturación. | Toda actualización o borrado directo de esas colecciones queda rechazado por el hook. |
| Reintento de operaciones con timeout | Un timeout deja pendiente la promesa Wix; reintentarlo sin conocer el resultado puede duplicar una escritura. | Los reintentos de resultado incierto requieren ahora la opción explícita `retryUncertainOutcome: true`. | La única activación incorporada es la lectura de disponibilidad del calendario, que no modifica datos. |

## Controles que permanecen deliberadamente

| Tema | Decisión | Motivo |
| --- | --- | --- |
| Mutex global del ledger | Se mantiene `LEDGER_GLOBAL_WRITE`. | La cadena hash contable requiere orden total para preservar su integridad a la escala actual de un establecimiento. Una partición por sede exige rediseño y pruebas propias. |
| Cancelación real de promesas Wix | No se simula cancelación. | Las promesas del SDK no disponen de cancelación en este código; la mitigación es no repetir automáticamente operaciones de resultado incierto. |
| Refactorización extensa de reservas, ledger y utilidades | Se mantiene aplazada. | Los módulos están cubiertos por contratos de producción; una extracción transversal sin pruebas de integración adicionales añadiría más riesgo que valor en esta entrega. |
| Sincronización M365 y correo | Continúa desactivada. | La Fase 2 requiere autorización y configuración independiente. La proyección minimizada queda preparada sin habilitar consumidores externos. |

## Validación

La batería incluye `tests/verify-diagnostic-hardening.mjs`, integrado en `npm test`. Este contrato protege los ocho puntos corregidos: nombres de personal, cuotas de disponibilidad, recuperación de locks, PII, proyección externa, inmutabilidad, reintentos y separación de roles.

La versión se validó con sincronización de tipos Wix, sanitización, contratos del núcleo, simulaciones de reserva, integración, administración, documentos, automatización, monitor de producción, análisis estático, formato y equivalencia de manifiestos de Jobs.
