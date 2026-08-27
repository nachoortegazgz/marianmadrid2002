# Evidencia de esquema: `movimientoCaja`

**Fecha:** 27 de agosto de 2026.  
**Alcance:** ampliación del esquema de la colección privada de ledger.  
**Método:** lectura previa completa, creación idempotente de campos y lectura posterior; no se modificó, eliminó ni recreó ningún movimiento histórico.

La colección productiva `movimientoCaja` se comprobó antes del cambio. Su revisión era `12`, tenía permisos de lectura, inserción, actualización y eliminación restringidos a administradores, y no incluía campos de naturaleza de operación, tratamiento IVA, referencia rectificativa, detalle de líneas ni versión de la carga de integridad.

Se añadieron cinco campos nuevos mediante la operación de creación de campo de Wix. La operación devolvió revisiones consecutivas `13` a `17` y la lectura posterior confirmó los cinco campos, todos marcados inmutables. El cambio no altera la cadena ni los datos de movimientos históricos; el verificador conserva compatibilidad de lectura con los movimientos previos y exige la versión reforzada para los registros nuevos.

| Campo técnico | Tipo verificado | Requerido | Inmutable | Finalidad |
| --- | --- | --- | --- | --- |
| `naturalezaOperacion` | `TEXT` | Sí | Sí | Distingue venta, devolución, propina y ajuste. |
| `tratamientoIva` | `TEXT` | Sí | Sí | Declara el tratamiento operativo aplicado o pendiente de validación. |
| `referenciaRectificativa` | `TEXT` | No | Sí | Vincula una devolución con su referencia rectificativa. |
| `detalleLineas` | `ARRAY` de objetos | Sí | Sí | Conserva el detalle de líneas sellado en la carga de integridad. |
| `integrityPayloadVersion` | `TEXT` | Sí | Sí | Identifica la versión del formato firmado (`LEDGER_V2`). |

> El esquema aporta controles técnicos de trazabilidad y no constituye por sí mismo certificación de un sistema informático de facturación, factura válida ni autoliquidación. La configuración final debe ser revisada por la gestoría conforme a la situación fiscal real del titular.

## Fuente técnica

[1] [Wix — Create Data Collection Field](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/create-data-collection-field)  
[2] [Wix — Data types in Wix Data](https://dev.wix.com/docs/rest/business-solutions/cms/data-types-in-wix-data)
