# Matriz de Trazabilidad Contable, Fiscal, Laboral e Inventario

**Estado:** Auditoría técnica del runtime versionado.  
**Alcance:** Flujos backend, contratos CMS, hooks, agregadores e informes disponibles.  
**Límite:** Este documento no certifica cumplimiento fiscal, laboral, contable ni de protección de datos. Es una matriz técnica para que gestoría, asesoría laboral y responsable de protección de datos validen la configuración, los datos empresariales y el uso real antes de presentar o conservar documentación oficial.

## Criterio de revisión

La matriz diferencia entre tres estados: **registrado y verificable**, cuando el campo se escribe desde backend y tiene contrato o hook; **derivable**, cuando el informe se calcula desde el ledger o una fuente nativa Wix; y **pendiente de configuración o validación**, cuando depende de identidad fiscal, política empresarial, relación contractual, factura o datos que el código no debe inventar.

## 1. Ventas, pagos, devoluciones y caja

| Flujo | Fuente y colección de evidencia | Detalles registrados y verificables | Informes o documentación que soporta | Estado técnico |
|---|---|---|---|---|
| Pedido Wix pagado: reserva, producto o mixto | Evento eCommerce -> `movimientoCaja`; reservas relacionadas en `CitasF2`; productos en `movimientoInventario`. | `transactionId=ORDER-{orderId}`, `orderId`, `tipoMovimiento`, `concepto`, `origen`, importe total, importe contable, método de pago, IVA, ticket, día/mes Madrid, bookings vinculados, recurso, traza, hash, firma y secuencia. | Libro de operaciones interno, resumen trimestral, desglose por método de pago, vínculo a pedido Wix e inventario. | Registrado y verificable. |
| Confirmación administrativa de pago | `citasManager.confirmPayment` valida orden pagada antes de escribir `movimientoCaja`. | Booking IDs, importe validado por servidor, pedido, concepto, origen `ADMIN_ORDER_CONFIRMATION`, asiento idempotente y estado de pago de `CitasF2`. | Evidencia de confirmación y conciliación reserva-pedido-ledger. | Registrado y verificable. |
| Venta presencial, tarjeta, Bizum, reembolso o ajuste manual | `registerManualTransaction` -> `movimientoCaja`. | Importe, forma de pago, tipo, concepto, recurso, origen `ONLY_STAFF_MANUAL`, ticket, traza, hash, firma, período y `transactionId` único. | Caja diaria, arqueo X, cierre Z, resumen por medio de cobro. | Registrado y verificable; el concepto debe seguir una política interna sin datos personales innecesarios. |
| Devolución online total o parcial | Evento eCommerce de devolución -> `movimientoCaja` o `PendingCompensations`. | `orderId`, `refundId`, `transactionId=REFUND-{orderId}-{refundId}`, importe negativo, origen de webhook, referencia a venta original, bookings vinculados y estado total/parcial de las citas. | Rectificación interna, libro de operaciones, neto trimestral y conciliación pedido-devolución. | Registrado y verificable. |
| Fallo de escritura o reembolso adelantado | `PendingCompensations`, `MM_AUDIT_LOG`, Job de recuperación y ledger final. | Tipo, importe, método, pedido, devolución, bookings, concepto, origen, fase, intentos, error, estado, traza y marcas de tiempo. | Lista de incidencias y evidencia de recuperación idempotente. | Registrado y verificable. |
| Conteo X y cierre Z | `RESUMEN_CONTEO_X`, `HISTORICO_CIERRES_Z`, `cajaActual`, derivados de `movimientoCaja`. | Saldo teórico, efectivo contado, descuadre, estado de cuadre, totales por medio de pago, operaciones, día, fechas y traza. | Arqueo de caja, cierre diario e investigación de descuadres. | Derivable y verificable. |

Los hooks de `data.js` rechazan inserciones del ledger sin hash, hash previo, firma y ticket, y bloquean update/delete salvo migración administrativa autorizada. Por tanto, los informes se basan en asientos append-only, no en una caja editable.

## 2. Registro e informes fiscales

| Resultado técnico disponible | Datos utilizados | Limitación que debe resolverse antes de declarar cumplimiento fiscal |
|---|---|---|
| Resumen trimestral | Base imponible, cuota, total neto, ventas, devoluciones, método, mes y ahora desglose por `tasaIva`. | El objeto `modelo303` es un **indicador interno** de ventas devengadas. No calcula IVA soportado, compensaciones, regímenes especiales, prorrata ni otras casillas de una autoliquidación. |
| Libro de facturas expedidas interno | Ticket, fecha, tipo inferido, movimiento, forma de pago, base, tasa, cuota, total, concepto, origen, pedido, devolución, fecha-hora de registro, hashes, reservas y transacción. | Es una exportación técnica del ledger, no una factura completa ni un registro SIF/VERI*FACTU certificado. |
| Cadena de integridad | `seqGlobal`, `prevHash`, `hashCadena`, `firmaDigital`, ticket y fecha de creación. | La cadena técnica no sustituye por sí sola los campos de identidad, serie, factura rectificativa, sistema productor ni modalidad de cumplimiento exigibles según el caso. |

La AEAT enumera para un registro de alta, entre otros, identidad de emisor y destinatario cuando proceda, número/serie, fechas de factura y operación, tipo de factura, rectificaciones, descripción, importe, régimen, tratamiento IVA, referencia del registro previo, identificación del sistema y productor, fecha-hora-segundo y circunstancias adicionales.[1] El runtime actual ya conserva importes, IVA, descripción, ticket, timestamp, hash previo, hash, firma, operación y referencias Wix; quedan **pendientes de configurar o modelar** los siguientes datos, que no se deben inventar en código:

| Bloque pendiente | Decisión necesaria |
|---|---|
| Identidad del emisor y productor del sistema | NIF, razón social, domicilio fiscal, identificador del sistema y datos de productor aprobados por negocio/asesoría. |
| Facturación formal | Serie y número de factura, clase exacta de factura, fecha de operación distinta, destinatario cuando proceda, tercero expedidor y referencias de sustitución. |
| Rectificativas y régimen | Factura original rectificada, causa, régimen IVA, inversión del sujeto pasivo, recargo de equivalencia, exención/no sujeción y tasas múltiples si aplican. |
| Presentación y modalidad | Decisión de cumplimiento, certificado, envío y validación de los requisitos vigentes. El backend no transmite registros a la AEAT. |

Los datos de cliente no deben copiarse por defecto al ledger. Deben permanecer en la fuente Wix o en una colección de facturación con acceso restringido, enlazada mediante `orderId` o una referencia de factura, para aplicar minimización y accesibilidad mínima.[2]

## 3. Registro laboral

| Flujo | Colección y campos verificados | Capacidad de informe | Estado técnico |
|---|---|---|---|
| Entrada, salida, inicio y fin de pausa | `REGISTRO_HORARIO`: `resourceId`, `resourceName`, `tipoFichaje`, `fechaHora`, `diaKey`, `mesKey`, `hora`, IP enmascarada, actor, ID de miembro actor y creación. | Historial por trabajador, estado de jornada y cálculo de horas/pausas basado en máquina de estados. | Registrado y verificable. |
| Ajuste laboral | Misma colección con `tipoFichaje=AJUSTE`, `motivoAjuste` obligatorio, actor `ADMIN` derivado de sesión y miembro administrador. | Evidencia de modificación operativa sin editar el fichaje original. | Registrado y verificable. |
| Inmutabilidad | Hooks `beforeUpdate` y `beforeRemove` bloquean cambios y borrado no migratorios. | Conserva la secuencia original de eventos. | Registrado y verificable. |

El registro de jornada requiere el horario concreto de inicio y finalización por persona trabajadora; el runtime guarda instantes, segundos, zona operativa Madrid y los eventos necesarios para reconstruirlos.[3] Antes de afirmar cumplimiento se deben validar con asesoría laboral: período de conservación, disponibilidad para persona trabajadora/representación/Inspección, centro de trabajo, convenio, reglas de pausas y el procedimiento documentado de rectificación. El código no sustituye esas políticas empresariales.

## 4. Inventario y conciliación comercial

| Flujo | Colección y detalles registrados | Uso de informe | Límite técnico |
|---|---|---|---|
| Venta online | `movimientoInventario`: SKU, producto, cantidad/delta, tipo, referencia `orderId`, producto Wix, traza, fecha y origen comercial nativo. | Salida comercial, conciliación con pedido y alerta de inventario. | Es un movimiento operativo de stock; no crea por sí mismo un gasto fiscal. |
| Consumo profesional | SKU, producto, stock antes/después, delta, motivo, referencia, actor, IDs Wix, traza, fecha y cola de conciliación. | Consumo interno y desviación de stock. | La nota libre debe evitar datos personales innecesarios. |
| Recepción de proveedor | SKU, producto, stock antes/después, cantidad, referencia de albarán/factura si se aporta, actor, motivo, fecha y cola de conciliación. | Recepciones y reconciliación de stock. | No guarda proveedor formal, número de factura de compra, coste unitario, base/IVA soportado ni vencimiento; no permite generar libro de facturas recibidas ni gasto contable sin un módulo de compras aprobado. |

## 5. Matriz final de aptitud para informes

| Informe o documento | Aptitud técnica actual | Fuente | Revisión externa necesaria |
|---|---|---|---|
| Caja diaria, arqueo X y cierre Z | Sí | Ledger inmutable y proyecciones | Procedimiento de arqueo y custodia. |
| Ventas, devoluciones y cobros por canal | Sí | `movimientoCaja`, pedidos Wix y devoluciones | Conciliación con pasarela/banco. |
| Libro interno de operaciones expedidas | Sí, como exportación técnica | `fiscalAggregator.web.js` | Formato fiscal definitivo y campos de factura. |
| Indicador trimestral de IVA devengado | Sí, como indicador | Ledger por base/cuota/tasa | Cálculo completo y presentación por gestoría. |
| Registro de jornada e informe de horas | Sí | `REGISTRO_HORARIO` y cálculo de horas | Conservación, acceso y convenio aplicable. |
| Inventario, consumo y reconciliación | Sí, operativo | Colecciones de inventario y Wix Stores | Valoración de existencias y compras contables. |
| Facturas completas, rectificativas y libro de recibidas | No, todavía | Requiere módulo de facturación/compras | Diseño fiscal, identidad empresarial y validación profesional. |

## Correcciones aplicadas durante esta auditoría

Se añadió `concepto`, `origen`, `orderId` y `refundId` al ledger y a la recuperación fiscal cuando aplican. Los informes fiscales ahora exportan esas referencias, conservan la fecha-hora del registro y generan desglose por tasa de IVA almacenada en vez de informar siempre un 21% fijo. El registro laboral ya no acepta `registradoPor` desde el navegador: deriva el rol y el identificador del actor desde la sesión Wix autorizada.

## Referencias

[1] [AEAT: Contenido del Registro de facturación de alta](https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales/contenido-registro-facturacion-alta_.html)

[2] [AEPD: Protección de datos por defecto](https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/proteccion-de-datos-por-defecto)

[3] [BOE: Estatuto de los Trabajadores](https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430)
