# Esquema Contable de HISTORICO_CIERRES_Z

## Finalidad

`HISTORICO_CIERRES_Z` conserva un cierre diario **derivado** del ledger `movimientoCaja`. No reemplaza registros de factura, no corrige asientos individuales y no debe usarse para insertar ventas o devoluciones. Su función es fijar un resumen verificable de la actividad del día Madrid, permitir arqueos e informes y dejar evidencia del estado de la cadena de integridad al cerrar.

## Campos canónicos

| Grupo | Field ID | Tipo | Uso |
|---|---|---|---|
| Versión y período | `version`, `diaKey`, `timezone`, `source` | Texto | Versión de resumen, fecha de negocio, zona y origen `CRON` o `ADMIN`. |
| Rango de cadena | `seqInicio`, `seqFin`, `hashInicio`, `hashFin`, `ticketInicio`, `ticketFin` | Número / texto | Delimita exactamente los asientos de `movimientoCaja` incluidos. |
| Cobros | `totalEfectivo`, `totalTarjeta`, `totalBizum`, `totalOnline`, `totalGeneral` | Número | Totales firmados por forma de cobro y total diario. |
| Operaciones | `totalVentas`, `totalReembolsos`, `totalAjustes`, `numOperaciones` | Número | Totales netos por clase de operación y número de asientos. |
| Fiscal | `baseImponibleNeta`, `cuotaIvaNeta`, `resumenTiposMovimiento`, `resumenTipoIva` | Número / objeto | Base y cuota netas, agrupación por tipo de movimiento y tasa de IVA efectivamente almacenada. |
| Integridad | `integridadVerificada`, `totalRegistrosVerificados`, `hashCierre`, `firmaCierre`, `fechaVerificacion` | Booleano / número / texto / fecha | Resultado de verificación, tamaño del tramo y sello del resumen. |
| Auditoría | `estado`, `fechaCierre`, `traceId` | Texto / fecha | Estado cerrado, instante de cierre y trazabilidad técnica. |

El `_id` canónico es `Z_{diaKey}`. El índice único de `diaKey` mantiene la idempotencia de un cierre por día. Los índices no únicos de `seqInicio`, `seqFin` y `hashFin` sirven a inspección técnica y no sustituyen las consultas del ledger.

## Construcción del cierre

El backend realiza, en orden, la verificación de cadena diaria; la lectura de todos los movimientos ordenados por `seqGlobal`; el cálculo de totales por pago, tipo y tasa; y la creación de un payload estable `Z_V2`. A ese payload se le aplica `hashCierre`, encadenado desde `hashFin`, y `firmaCierre`, mediante la clave fiscal residente en Wix Secrets Manager. Si no se supera la verificación de integridad, el cierre no se inserta.

> El sello de cierre demuestra la coherencia del resumen respecto al tramo de ledger utilizado. No convierte el resumen en un registro individual de facturación ni acredita por sí solo la modalidad de cumplimiento fiscal elegida.

## Alineación con registros de facturación

La AEAT describe para los registros de alta información individual de emisor/destinatario cuando corresponda, número y serie, fechas, tipo de factura, rectificaciones, descripción, importes, régimen, IVA, referencia de registro previo, sistema/productor y fecha-hora-segundo.[1] Parte de esa información pertenece al ledger individual o a un futuro módulo formal de facturación, no al cierre diario agregado.

| En cierre Z | En ledger o módulo de facturación | Pendiente de configuración empresarial |
|---|---|---|
| Tramo, hashes, tickets límite, totales, IVA neto, estado y firma del resumen. | Ticket, concepto, origen, pedido, devolución, importes, método, hash, firma y timestamp del asiento. | Identidad fiscal, series de factura, destinatario cuando proceda, rectificativas, regímenes especiales, identificación de sistema/productor y envío/presentación. |

## Aplicación en QA sin pérdida de información

La migración se ejecuta primero en QA. Se exportan los documentos existentes; se añaden los nuevos campos con tipos compatibles; se crean los índices no únicos; se despliega el backend; y se genera un cierre de prueba sobre datos QA. Los cierres históricos anteriores se conservan con su versión original; no se actualizan ni se les inventa firma retrospectiva. Para completar un histórico se recomienda crear una proyección de auditoría separada, con origen y fecha de migración, aprobada por responsable fiscal.

No se deben eliminar ni renombrar campos existentes, ni crear índices únicos sobre datos ya existentes sin revisar duplicados. La aplicación en producción requiere un plan de cambio independiente, backup y confirmación explícita.

## Referencia

[1] [AEAT: Contenido del Registro de facturación de alta](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales/contenido-registro-facturacion-alta_.html)
