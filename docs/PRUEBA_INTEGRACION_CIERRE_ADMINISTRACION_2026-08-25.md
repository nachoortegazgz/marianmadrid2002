# Prueba de Integración: Cierre Diario desde ADMINISTRACION

**Fecha:** 25 de agosto de 2026  
**Modalidad:** simulación determinista aislada  
**Impacto sobre producción:** ninguno

> La prueba no invoca Wix Payments, Wix Bookings, CMS ni el botón real de cierre. No genera cobros, movimientos de caja, conteos X ni cierres Z en el sitio publicado. Verifica que el contrato funcional de la página `ADMINISTRACION` y el cierre Z del backend conservan los controles y la evidencia esperada.

## Escenario ejecutado

| Paso | Datos simulados | Resultado esperado | Resultado |
|---|---|---|---|
| Control de acceso | Sesión sin rol de Marian | Bloqueo antes de consultar caja o escribir datos | Superado: `ACCESS_DENIED`; 0 movimientos y 0 cierres. |
| Carga del panel | Sesión autorizada de Marian | Contexto de caja, inventario y cola disponible | Superado. |
| Venta TPV en efectivo | 41.50 EUR | Asiento con secuencia, IVA, ticket, hash previo, hash de cadena, firma y traza | Superado. |
| Venta TPV con tarjeta | 25.00 EUR | Segundo asiento encadenado al hash de efectivo | Superado. |
| Venta TPV con Bizum | 10.00 EUR | Tercer asiento encadenado al hash de tarjeta | Superado. |
| Arqueo X | 41.50 EUR en efectivo contado | Efectivo teórico 41.50 EUR, descuadre 0, estado `CUADRADO` | Superado. |
| Cierre Z desde ADMINISTRACION | Día `2026-08-25` | Cierre `Z_V2`, fuente `ADMIN`, 3 operaciones, integridad y firma | Superado. |
| Reintento del cierre | Mismo día | No se duplica el cierre | Superado: resultado idempotente. |

## Evidencia validada

| Control | Resultado |
|---|---|
| Encadenamiento de hashes | El segundo movimiento parte del hash del primero y el tercero del hash del segundo. |
| Integridad del ledger | `integridadVerificada = true` y `totalRegistrosVerificados = 3`. |
| Secuencias y tickets | Inicio `1`, fin `3`, tickets `SIM-20260825-0001` a `SIM-20260825-0003`. |
| Totales por pago | Efectivo `41.50`, tarjeta `25.00`, Bizum `10.00`, online `0.00` EUR. |
| Total diario | `76.50` EUR; coincide con ventas y con la suma de formas de pago. |
| IVA | El resumen de IVA registra tres operaciones al 21 por ciento, con bases y cuotas calculadas por asiento. |
| Cierre sellado | `hashCierre` y `firmaCierre` son hashes HMAC SHA-256 de 64 caracteres hexadecimales. |
| Idempotencia | Un segundo cierre para el mismo día devuelve el cierre existente sin crear otro documento. |

## Baterías ejecutadas

| Batería | Resultado |
|---|---:|
| Simulación específica de ADMINISTRACION | 2/2 superadas |
| Verificación estructural del proyecto | 13/13 superadas |
| Simulaciones críticas previas | 6/6 superadas |
| Revisión de espacios y formato | Sin errores en `git diff --check` |

## Límites de la prueba

La simulación confirma el contrato lógico y de trazabilidad; no prueba una sesión real de Marian en el navegador ni persiste asientos en el CMS. Antes de usar el cierre real, la página debe existir en el Editor con el componente HTML `#htmlAdministracion`, la cuenta de Marian debe estar autorizada por `MAPA_STAFF` y el secreto fiscal debe estar configurado. El primer cierre operativo debe revisarse con su `traceId`, secuencias, hashes y documento `HISTORICO_CIERRES_Z` resultante.
