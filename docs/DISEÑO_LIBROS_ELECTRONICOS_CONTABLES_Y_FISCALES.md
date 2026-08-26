# Diseño de Libros Electrónicos Contables y Fiscales

**Estado:** esquema CMS creado en el sitio publicado el 25 de agosto de 2026; escritor contable y proyecciones aún pendientes de validación e integración.
**Fecha de análisis:** 25 de agosto de 2026.
**Fuente primaria actual auditada:** `movimientoCaja` — nombre visible `LIBRO DE ASIENTOS`.

> **Aviso de alcance.** Este diseño técnico no constituye certificación SIF, VERI*FACTU, fiscal, mercantil ni de legalización de libros. Un gestor o asesor fiscal debe confirmar la forma jurídica, régimen de IVA/IRPF, obligación SII, series documentales y cuadro de cuentas definitivo antes de activarlo o usarlo para una presentación. La normativa exige preservar integridad, conservación, accesibilidad, legibilidad, trazabilidad e inalterabilidad de los registros de facturación; la conformidad depende también de la operación real del sistema, su configuración, sus procedimientos y sus evidencias, no solo de los nombres de campos.[1] [2]

## 1. Diagnóstico del ledger actualmente publicado

La colección real `movimientoCaja` cuenta con **0 registros** en la lectura administrativa del 25 de agosto de 2026 y permite exclusivamente acceso administrativo. La colección sí incluye secuencia global, importes, IVA, ticket, forma de pago, referencia de reserva, transacción, hashes, firma y fecha de creación. Sin embargo, el backend `cajas.web.js` intenta persistir también `concepto`, `origen`, `orderId` y `refundId`, que no constaban como campos reales del CMS auditado. Esta discrepancia impide afirmar que la trazabilidad detallada prevista por el código esté efectivamente persistida.

| Área primaria | Estado del CMS real | Estado del backend | Decisión de diseño |
|---|---|---|---|
| Idempotencia, secuencia y ticket | `transactionId`, `seqGlobal`, `numTicketFactura` disponibles | Se generan bajo mutex global | Conservar y reforzar con número de asiento y versión de esquema. |
| Fecha y hora | `fechaCreacion` disponible | Se genera al registrar | Separar `fechaOperacion`, `fechaHoraRegistro`, `fechaExpedicion` y `fechaOperacionFiscal`. |
| Integridad | `prevHash`, `hashCadena`, `firmaDigital` disponibles | Se calculan sobre un payload reducido | Versionar algoritmo y ampliar el payload firmado tras QA. |
| Contexto comercial | Solo reserva, recurso y transacción | Código intenta escribir pedido, devolución, concepto y origen | Añadir campos explícitos y referencias de origen. |
| Contabilidad de partida doble | No disponible | Solo calcula efectivo/medios de cobro | Crear cabecera de asiento y líneas Debe/Haber. |
| IVA y factura | Base, tipo, cuota, total y ticket disponibles | Usa la tasa general por defecto | Crear desglose por tipo de IVA y campos de libro registro. |
| Responsable y control interno | No disponible | `resourceId` no equivale a actor autenticado | Persistir responsable de registro y responsable operativo a partir de sesión validada. |
| Categoría y cuenta contable | No disponible | No existe mapa contable | Añadir categoría, centro de coste y código de cuenta; el mapa lo valida gestoría. |

## 2. Fundamento de los libros propuestos

La AEAT recuerda que el Libro Diario registra día a día todas las operaciones de la actividad y que los libros de IVA deben permitir determinar con precisión el IVA repercutido y soportado.[3] Para facturas expedidas se requieren, como mínimo, número y serie, fecha de expedición, fecha de operación si difiere, identidad fiscal del destinatario, base imponible, tipo impositivo y cuota; las rectificativas se anotan separadamente.[4]

El diseño normalizado de la AEAT para hojas de cálculo de facturas expedidas incorpora además ejercicio, periodo, código y tipo de actividad, grupo o epígrafe IAE, tipo y concepto de ingreso, identificación de factura, identidad de destinatario, calificación de operación, total, base, tipo y cuota de IVA, cobros, retenciones y referencia externa.[5] Las plantillas contables profesionales revisadas también separan código de cuenta, cuenta, débitos, créditos y saldos, apoyando un modelo de líneas de asiento en lugar de un único movimiento de caja agregado.[6]

El Plan General de Contabilidad contiene un cuadro de cuentas codificado por grupos y sirve como guía de clasificación, pero la numeración y denominación de cuentas no son vinculantes salvo donde incorporen criterios de registro o valoración. Por tanto, el campo `codigoCuentaContable` debe quedar parametrizado y ser validado por la gestoría, no codificado de forma arbitraria en el frontend.[7]

## 3. Arquitectura de fuentes de verdad

| Capa | Colección propuesta | Rol | Quién escribe | Regla de inmutabilidad |
|---|---|---|---|---|
| Fuente comercial nativa | Wix Stores, Wix Bookings y Wix eCommerce | Pedido, reserva, cobro, devolución, artículos y cliente | Apps Wix | Nativa Wix; no se duplica como fuente primaria. |
| Fuente de caja actual | `movimientoCaja` | Movimiento de tesorería y trazabilidad técnica actual | `cajas.web.js` | Append-only; no se reescribe. |
| **Cabecera de diario** | `ASIENTOS_CONTABLES` | Hecho económico único, equilibrado e idempotente | Backend contable autorizado | Append-only; correcciones por asiento inverso o rectificativo. |
| **Líneas de diario** | `LINEAS_ASIENTO_CONTABLE` | Partida doble: Debe/Haber, cuenta, impuesto, categoría y dimensión analítica | Backend contable autorizado | Append-only; una línea no se modifica. |
| Libro IVA expedidas | `LIBRO_IVA_FACTURAS_EXPEDIDAS` | Proyección fiscal de facturas emitidas y rectificativas | Generador derivado | Inserción idempotente; rectificación por nuevo registro vinculado. |
| Libro IVA recibidas | `LIBRO_IVA_FACTURAS_RECIBIDAS` | Registro primario de facturas de proveedores | Flujo de recepción documentada | Append-only con rectificativa/abono separado. |
| Bienes de inversión | `LIBRO_IVA_BIENES_INVERSION` | Registro condicional de activos sujetos a ese libro | Módulo de inmovilizado | Solo se habilita si aplica. |
| Operaciones intracomunitarias | `LIBRO_IVA_INTRACOMUNITARIO` | Registro condicional | Módulo fiscal autorizado | Solo se habilita si aplica. |
| Mayor y balances | `MAYOR_CONTABLE_SALDOS` | Proyección reconstruible por cuenta y periodo | Agregador derivado | Nunca sustituye al diario. |
| Inventario/cierre | `LIBRO_INVENTARIO_CIERRE` | Snapshot de existencias y saldos a fecha de cierre | Job de cierre validado | Versionado e inmutable por cierre. |
| Eventos técnicos SIF | `EVENTOS_SISTEMA_FACTURACION` | Eventos de seguridad, configuración y excepciones | Backend técnico | Append-only, sin datos de factura redundantes. |

> `movimientoCaja` no debe convertirse retroactivamente y sin control en el Libro Diario formal. Es un ledger de tesorería útil, pero no contiene líneas Debe/Haber, contrapartidas, detalle fiscal suficiente ni las dimensiones necesarias para generar todas las salidas propuestas.

## 4. Contrato de datos primarios: cabecera de asiento

`ASIENTOS_CONTABLES` representa un hecho económico. Cada cabecera debe tener dos o más líneas en `LINEAS_ASIENTO_CONTABLE` y cumplir `totalDebe = totalHaber` antes de quedar confirmada.

| Clave técnica propuesta | Tipo Wix | Obligatorio | Nombre visible | Uso primario |
|---|---:|---:|---|---|
| `idAsiento` | TEXT | Sí | ID de asiento | Identidad estable e idempotencia de cabecera. |
| `numeroAsiento` | NUMBER | Sí | Número de asiento | Secuencia contable por ejercicio. |
| `ejercicioFiscal` | NUMBER | Sí | Ejercicio fiscal | Derivación de libros y cierres. |
| `periodoFiscal` | TEXT | Sí | Periodo fiscal | Mes/trimestre/periodo de liquidación. |
| `fechaOperacion` | DATETIME | Sí | Fecha de operación | Devengo económico-contable. |
| `fechaHoraRegistro` | DATETIME | Sí | Fecha y hora de registro | Evidencia temporal de generación. |
| `zonaHorariaOperacion` | TEXT | Sí | Zona horaria de operación | Interpretación local inequívoca. |
| `tipoAsiento` | TEXT | Sí | Tipo de asiento | Venta, cobro, devolución, compra, gasto, ajuste, cierre, rectificación. |
| `categoriaOperacion` | TEXT | Sí | Categoría de operación | Peluquería, estética, producto, regalo, gasto, inmovilizado, etc. |
| `subcategoriaOperacion` | TEXT | No | Subcategoría de operación | Analítica específica sin alterar el PGC. |
| `conceptoAsiento` | TEXT | Sí | Concepto del asiento | Explicación suficiente del hecho. |
| `origenRegistro` | TEXT | Sí | Origen del registro | Wix eCommerce, Wix Bookings, TPV, factura proveedor, ajuste autorizado. |
| `idOrigen` | TEXT | Sí | ID de origen | Identificador inmutable de la app o documento fuente. |
| `idTransaccion` | TEXT | Sí | ID de transacción | Idempotencia técnica transversal. |
| `idPedidoWix` | TEXT | No | ID de pedido Wix | Unión con eCommerce. |
| `idDevolucionWix` | TEXT | No | ID de devolución Wix | Unión con devolución. |
| `idReservaWix` | TEXT | No | ID de reserva Wix | Unión con Bookings. |
| `referenciaExterna` | TEXT | No | Referencia externa | Ticket, TPV, banco, factura proveedor o documento externo. |
| `serieFactura` | TEXT | No | Serie de factura | Identificación de factura emitida/recibida. |
| `numeroFactura` | TEXT | No | Número de factura | Identificación de factura emitida/recibida. |
| `fechaExpedicionFactura` | DATETIME | No | Fecha de expedición | Libro IVA de facturas expedidas/recibidas. |
| `fechaOperacionFiscal` | DATETIME | No | Fecha de operación fiscal | Obligatoria si difiere de expedición cuando aplique. |
| `tipoFactura` | TEXT | No | Tipo de factura | Completa, simplificada, rectificativa u otra clave validada. |
| `idAsientoRectificado` | TEXT | No | ID de asiento rectificado | Enlace a rectificación, sin sobrescribir el original. |
| `motivoRectificacion` | TEXT | No | Motivo de rectificación | Evidencia del ajuste. |
| `moneda` | TEXT | Sí | Moneda | ISO 4217; inicialmente EUR. |
| `totalDebe` | NUMBER | Sí | Total Debe | Control de equilibrio. |
| `totalHaber` | NUMBER | Sí | Total Haber | Control de equilibrio. |
| `importeTotalDocumento` | NUMBER | No | Importe total del documento | Total comercial/fiscal, no sustituto de Debe/Haber. |
| `medioPago` | TEXT | No | Medio de pago | Efectivo, tarjeta, Bizum, online, transferencia u otro controlado. |
| `estadoAsiento` | TEXT | Sí | Estado de asiento | BORRADOR, CONFIRMADO, RECTIFICADO, ANULADO_POR_ASIENTO_INVERSO. |
| `idResponsableOperativo` | TEXT | No | ID de responsable operativo | Profesional o área que presta/recibe el servicio. |
| `idMiembroRegistrador` | TEXT | Sí | ID del miembro registrador | Actor autenticado que confirmó el registro. |
| `nombreRegistrador` | TEXT | No | Nombre del registrador | Proyección legible; no sustituye el ID. |
| `idCentroCoste` | TEXT | No | ID de centro de coste | Dimensión analítica. |
| `codigoActividadIae` | TEXT | No | Código de actividad IAE | Parámetro fiscal según régimen aplicable. |
| `versionEsquema` | TEXT | Sí | Versión de esquema | Lectura histórica y migración. |
| `versionAlgoritmoIntegridad` | TEXT | Sí | Versión de integridad | Verificación reproducible. |
| `hashAnterior` | TEXT | Sí | Hash anterior | Encadenamiento. |
| `hashAsiento` | TEXT | Sí | Hash del asiento | Huella del payload canónico. |
| `firmaAsiento` | TEXT | Sí | Firma del asiento | Firma/HMAC según diseño validado. |
| `idTraza` | TEXT | Sí | ID de traza | Correlación técnica transversal. |

## 5. Contrato de datos primarios: líneas de asiento

| Clave técnica propuesta | Tipo Wix | Obligatorio | Nombre visible | Uso primario |
|---|---:|---:|---|---|
| `idLineaAsiento` | TEXT | Sí | ID de línea de asiento | Identidad estable de línea. |
| `idAsiento` | TEXT | Sí | ID de asiento | Relación con cabecera. |
| `numeroLinea` | NUMBER | Sí | Número de línea | Orden determinista dentro del asiento. |
| `fechaOperacion` | DATETIME | Sí | Fecha de operación | Consulta de diario y mayor. |
| `codigoCuentaContable` | TEXT | Sí | Código de cuenta contable | Cuenta parametrizada con el PGC validado. |
| `nombreCuentaContable` | TEXT | Sí | Nombre de cuenta contable | Snapshot legible de la cuenta aplicada. |
| `grupoCuentaContable` | TEXT | No | Grupo contable | Agrupación PGC/analítica. |
| `importeDebe` | NUMBER | Sí | Importe Debe | Valor positivo o cero. |
| `importeHaber` | NUMBER | Sí | Importe Haber | Valor positivo o cero. |
| `importeNeto` | NUMBER | Sí | Importe neto | Debe menos Haber, derivable pero materializado para consulta. |
| `categoriaOperacion` | TEXT | Sí | Categoría de operación | Análisis por actividad. |
| `idCentroCoste` | TEXT | No | ID de centro de coste | Análisis por área, salón, canal o profesional. |
| `idResponsableOperativo` | TEXT | No | ID de responsable operativo | Atribución operativa. |
| `codigoProductoServicio` | TEXT | No | Código de producto o servicio | SKU o servicio nativo. |
| `descripcionLinea` | TEXT | Sí | Descripción de línea | Evidencia del concepto aplicado. |
| `baseImponible` | NUMBER | No | Base imponible | Desglose fiscal por línea/tipo. |
| `tipoIva` | NUMBER | No | Tipo de IVA | Tipo impositivo aplicado. |
| `cuotaIva` | NUMBER | No | Cuota de IVA | Cuota repercutida o soportada. |
| `claveOperacionIva` | TEXT | No | Clave de operación IVA | Clasificación conforme al régimen aplicable. |
| `nifContraparte` | TEXT | No | NIF de contraparte | Obligatorio cuando aplique a la factura. |
| `nombreContraparte` | TEXT | No | Nombre o razón social de contraparte | Factura emitida/recibida, con control de acceso. |
| `referenciaExterna` | TEXT | No | Referencia externa | Factura, banco, TPV o documento fuente. |
| `idTraza` | TEXT | Sí | ID de traza | Correlación con cabecera y origen. |
| `hashLinea` | TEXT | Sí | Hash de línea | Integridad de detalle. |
| `fechaHoraRegistro` | DATETIME | Sí | Fecha y hora de registro | Evidencia temporal. |

La regla de validación de un asiento confirmado es: cada línea debe tener exactamente uno de `importeDebe` o `importeHaber` superior a cero, las líneas deben compartir `idAsiento`, el total de Debe debe igualar el total de Haber al céntimo y el hash de cabecera debe incorporar una representación canónica ordenada de las líneas.

## 6. Proyecciones fiscales y libros condicionales

| Colección | Naturaleza | Datos mínimos que materializa | Condición de activación |
|---|---|---|---|
| `LIBRO_IVA_FACTURAS_EXPEDIDAS` | Proyección fiscal | Ejercicio, periodo, actividad, tipo/concepto de ingreso, fechas, serie/número, destinatario, base, tipo/cuota IVA, total, cobro, retención y referencia externa. | Operaciones sujetas a IVA con facturas expedidas. |
| `LIBRO_IVA_FACTURAS_RECIBIDAS` | Registro documental de proveedores | Ejercicio, periodo, factura proveedor, fechas, proveedor/NIF, base, tipo/cuota soportada y deducible, pago, retención y referencia. | Compras o gastos con documentación recibida. |
| `LIBRO_IVA_BIENES_INVERSION` | Registro condicional | Identificación del bien, amortización, inicio de utilización, factura, proveedor, base y deducción. | Solo bienes de inversión cuando aplique. |
| `LIBRO_IVA_INTRACOMUNITARIO` | Registro condicional | Contraparte, bien/servicio, fechas, país y documentación. | Solo operaciones intracomunitarias cuando aplique. |
| `MAYOR_CONTABLE_SALDOS` | Proyección reconstruible | Cuenta, periodo, saldo inicial, movimientos Debe/Haber, saldo final. | Siempre derivado del diario, no editable. |
| `LIBRO_INVENTARIO_CIERRE` | Snapshot de cierre | Existencias, saldos de cuentas y versión del cierre. | Cierres periódicos autorizados. |
| `EVENTOS_SISTEMA_FACTURACION` | Evidencia técnica | Evento, actor, fecha/hora, versión de sistema, resultado, referencia y hash. | Siempre para eventos de configuración, integridad y errores relevantes. |

## 7. Migración e integración por fases

1. **No mutar el ledger actual.** Completar primero en QA los campos que el backend ya escribe y que faltan en el CMS real: `concepto`, `origen`, `orderId` y `refundId`. Su ausencia es un bloqueo de trazabilidad.
2. **Crear el contrato QA.** Crear las colecciones propuestas con permisos administrativos y campos en castellano normalizado; no reutilizar nombres de fuentes Wix nativas.
3. **Crear mapa contable parametrizado.** La gestoría valida cuentas, subcuentas, IVA, retenciones, categorías, series y centros de coste; el código no inventa códigos PGC.
4. **Implementar escritor dual.** Después de un insert confirmado en `movimientoCaja`, el backend construye una cabecera y sus líneas desde datos primarios ya verificados. Si falla la proyección, se encola una compensación sin borrar ni alterar el origen.
5. **Generar proyecciones.** Los libros IVA, mayor e inventario se construyen desde diario/documentos de proveedor, con tokens idempotentes y sin actualización destructiva.
6. **Probar en QA.** Venta local, pedido online, devolución parcial, factura rectificativa, compra de proveedor, gasto, cobro, cierre y verificación de balances Debe/Haber.
7. **Aprobar producción.** Tras backup de esquema/datos, dictamen de gestoría y confirmación explícita de sitio productivo.

## Referencias

[1] [AEAT: Cuestiones generales sobre Sistemas Informáticos de Facturación y VERI*FACTU](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales.html)

[2] [BOE: Orden HAC/1177/2024, especificaciones técnicas y de contenido de registros de facturación](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-22138)

[3] [AEAT: Obligaciones contables y registrales — Libros obligatorios](https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/gestion-impuesto-sobre-sociedades/obligaciones-contables-registrales/libros-obligatorios.html)

[4] [AEAT: Libro registro de facturas expedidas](https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/libros-registro-iva/libro-registro-facturas-expedidas.html)

[5] [AEAT: Diseños de registro normalizados para Libros Registro IVA e IRPF, XLSX](https://sede.agenciatributaria.gob.es/static_files/AEAT/LSI.xlsx)

[6] [Smartsheet: Plantilla de diario contable](https://es.smartsheet.com/top-excel-accounting-templates)

[7] [BOE: Real Decreto 1514/2007, Plan General de Contabilidad](https://www.boe.es/buscar/act.php?id=BOE-A-2007-19884)
