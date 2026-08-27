# Matriz de requisitos de Fase 1: operación, registros y cumplimiento

**Fecha de referencia:** 27 de agosto de 2026.  
**Finalidad:** delimitar qué debe controlar el ecosistema Wix nativo para reservas, ventas, caja física, eventos derivados, gestión interna y documentación.  
**Límite profesional:** este documento es un análisis técnico-operativo y no sustituye la determinación del régimen tributario, la asesoría contable-fiscal, laboral o de protección de datos aplicable al titular del negocio.

## Principio de diseño

La Fase 1 mantendrá una única fuente de verdad para cada dominio: Wix Bookings para agenda y reservas nativas, `SERVICIOS_CITA` para catálogo comercial, `CitasF2` y `BookingTransactions` para trazabilidad de reservas, `movimientoCaja` para el libro mayor operativo e `REGISTRO_HORARIO` para el registro interno de jornada. Ninguna exportación, informe o futura integración externa podrá modificar estos registros fuente.

| Dominio | Registro fuente previsto | Estado técnico conocido | Criterio de Fase 1 |
| --- | --- | --- | --- |
| Reserva simple | Wix Bookings + `CitasF2` | Flujo y simulación existentes. | Una reserva, una trazabilidad y reintento idempotente. |
| Reserva dual con hueco de exposición | Wix Bookings + `CitasF2` + caché de slots | Saga, compensación y simulación existentes. | Dos fases enlazadas sin bloquear un hueco disponible para otra reserva. |
| Venta online | Pedido Wix eCommerce + `movimientoCaja` | Webhook y recuperación fiscal existentes. | Cobro confirmado antes de marcar la cita como pagada. |
| Venta presencial | `movimientoCaja` + caja actual | Alta manual protegida existente. | Tipo de cobro, usuario, referencia y secuencia trazables. |
| Devolución | Evento Wix eCommerce + `movimientoCaja` | Flujo de reembolso existente. | Movimiento negativo referenciado y sin doble registro. |
| Propina | `movimientoCaja` con tipo `PROPINA`, naturaleza y tratamiento IVA separados. | Implementado con importe, medio de cobro, traza, líneas y hash; no genera IVA ni asiento automático. | Mantener el tratamiento como pendiente de validación de gestoría antes de cualquier liquidación o imputación laboral. |
| Jornada | `REGISTRO_HORARIO` | Hooks anti-edición directa y módulo de fichaje existentes. | Inicio, fin, pausas y correcciones justificadas, accesibles para inspección. |

## Requisitos de facturación y registros económicos

La AEAT indica que el Reglamento de Sistemas Informáticos de Facturación exige integridad, conservación, accesibilidad, legibilidad, trazabilidad e inalterabilidad de los registros de facturación. En los registros se utiliza encadenamiento mediante hash; la modalidad no verificable añade firma electrónica y registro de eventos. [1] La nota informativa de la AEAT actualizada el 26 de marzo de 2026 sitúa la adaptación de los SIF antes del 1 de enero de 2027 para entidades sujetas a Impuesto sobre Sociedades y antes del 1 de julio de 2027 para el resto de obligados; también califica el periodo anterior como periodo de pruebas. [2]

| Requisito operativo | Evidencia exigida | Implementación actual observada | Acción de Fase 1 |
| --- | --- | --- | --- |
| Secuencia e integridad | Secuencia ininterrumpida, hash previo y huella del movimiento. | `movimientoCaja` incluye número de ticket, `prevHash`, `hashCadena`, firma y payload V2 que sella importes, IVA, naturaleza, referencia y líneas. | Probar continuidad, concurrencia y recuperación; no afirmar certificación SIF sin revisión especializada. |
| Inmutabilidad | No actualizar ni borrar una vez emitido; rectificar mediante nuevo evento. | Los hooks bloquean actualizaciones y eliminaciones directas. | Revisar los supuestos de migración autorizada, acceso y auditoría. |
| Cobro online | Confirmación de pedido pagado, importe validado y cita marcada solo tras persistir el ledger. | `citasManager` y eventos verifican el pedido y registran el movimiento. | Probar pago QA, reintento de webhook y degradación del ledger. |
| Devolución | Referencia al pedido/movimiento original, importe negativo y prevención de duplicado. | Existe ruta específica de evento de reembolso y `referenciaRectificativa` inmutable en el ledger. | Probar devolución total y parcial QA, incluyendo repetición de evento. |
| Caja física | Forma de pago, operador, apertura/cierre, arqueo, diferencias y soporte. | La venta manual deriva el tipo desde efectivo, tarjeta o Bizum; solo permite `PROPINA` como naturaleza diferenciada. | Verificar los controles de arqueo, propinas y ajustes en una ventana QA aislada. |
| Factura simplificada | Número/serie, fechas, emisor, servicio, tipo de IVA y total; requisitos adicionales cuando proceda. [3] | El ledger dispone de ticket, IVA, naturaleza y detalle de líneas, pero no acredita por sí solo una factura válida. | Configurar emisión documental solo cuando gestoría confirme serie, emisor, régimen y casos de factura completa. |
| Factura completa | Serie correlativa, emisor y destinatario, NIF, domicilios, descripción, base, IVA, cuota y fecha de operación si difiere. [3] | No se ha acreditado aún un generador documental completo. | Implementar solo tras confirmar el régimen y datos fiscales del negocio. |
| Libros y contabilidad | Libro Diario y de Inventarios/Cuentas Anuales en estimación directa normal mercantil; o libros registro según régimen. [4] | Existen libro diario, cuentas, IVA y agregador fiscal en el código. | Validar campos, periodificación, exportación y correspondencia con el régimen real. |

Las peluquerías e institutos de belleza figuran entre las actividades que pueden expedir factura simplificada hasta 3.000 euros IVA incluido, con los límites y excepciones definidos por la AEAT. [5] Esto no elimina la necesidad de una factura completa cuando las circunstancias de la operación lo exijan.

## Ciclo de eventos que debe superarse

| Evento | Disparador | Resultado interno obligatorio | Documento o salida de Fase 1 | Prueba de aceptación |
| --- | --- | --- | --- | --- |
| Reserva simple | Cliente selecciona servicio y slot. | Reserva nativa, `CitasF2`, transacción idempotente y `traceId`. | Confirmación de reserva. | Reintento con la misma clave no duplica. |
| Reserva dual | Servicio principal con F1, exposición y F2. | Dos reservas enlazadas o compensación total ante fallo. | Una confirmación clara para el cliente. | Una reserva simple ocupa el hueco de exposición no solapado. |
| Cobro online | Pedido Wix pagado. | Validación de pedido, ledger, asiento/proyección y cita pagada. | Justificante y factura/ticket conforme al tipo de operación. | Evento repetido no duplica el movimiento. |
| Venta presencial | Personal autorizado registra cobro. | Movimiento inmutable, forma de pago derivada, naturaleza, líneas y traza de operador. | Paquete de revisión para gestoría y ticket interno; no factura fiscal definitiva. | Importe, método, naturaleza y secuencia correctos. |
| Propina | Cliente abona un extra voluntario. | Evento separado del servicio y del IVA hasta confirmar el tratamiento aplicable. | Justificante interno y política operativa. | No altera indebidamente precio, IVA, salario ni caja. |
| Reembolso | Confirmación de devolución. | Movimiento negativo referenciado y estado de reserva coherente. | Rectificativa o documentación que corresponda. | Doble webhook no duplica devolución. |
| Cierre diario | Responsable cierra la jornada. | Arqueo, diferencia, resumen por forma de pago, integridad de cadena. | Informe de cierre Z y soporte de conciliación. | No cierra si detecta incoherencias críticas. |
| Fichaje | Personal inicia/finaliza o pausa. | Registro inmutable con corrección trazable. | Extracto individual/diario restringido. | Inicio, fin y pausas completos; acceso administrativo controlado. |

## Gestión laboral y protección de datos

El Ministerio de Trabajo recuerda que el registro diario debe contener la hora concreta de inicio y fin de cada persona trabajadora, estar disponible para Inspección, representación legal y la propia persona trabajadora, y debe ser fiable frente a modificaciones posteriores. Las pausas o descansos deben constar cuando sean necesarios para distinguirlos del tiempo efectivo. [6] La Fase 1 solo tratará datos laborales necesarios y con permisos administrativos.

La AEPD exige tratar únicamente datos precisos para cada finalidad, limitar acceso y conservación, y aplicar protección de datos por defecto desde el diseño. [7] [8] Por ello, el formulario de reserva debe limitar los campos obligatorios a contacto y datos estrictamente necesarios para prestar el servicio; los datos fiscales se solicitarán de forma separada solo si el cliente necesita una factura completa.

| Área | Control mínimo | Límite de diseño |
| --- | --- | --- |
| Formulario de reserva | Datos de contacto estrictamente necesarios, aviso de privacidad y finalidad clara. | No exigir dirección para un servicio en local ni solicitar datos fiscales por defecto. |
| Ficha de cliente | Acceso limitado por rol y conservación definida. | No mezclar con caja, facturación o registro horario sin necesidad. |
| Fichajes | Acceso individual y administrativo, correcciones justificadas. | No publicar horarios, identificadores ni datos laborales en páginas públicas. |
| Facturación | Separar destinatario fiscal de cliente de reserva. | Solicitar NIF/domicilio solo cuando corresponda una factura completa. |
| Auditoría | `traceId` y referencias técnicas saneadas. | No incluir en logs públicos datos de contacto ni credenciales. |

## Decisiones pendientes que requieren datos del titular

Antes de declarar un documento «normalizado y exigible» se debe confirmar con la asesoría del negocio la forma jurídica, el régimen de IRPF/Impuesto sobre Sociedades, IVA, series de facturación, actividad económica, titular fiscal, tratamiento de descuentos, anticipos, bonos, propinas, pagos mixtos, comisiones de pasarela, personal contratado/autónomo y convenio aplicable. Estas circunstancias determinan los libros, documentos y plazos exactos. [4]

Hasta esa confirmación, la Fase 1 puede y debe reforzar la evidencia técnica —inmutabilidad, trazabilidad, relación entre reserva, pedido y movimiento, control de accesos, hash y exportación—, pero no debe generar ni presentar documentos fiscales definitivos con datos inventados.

## Referencias

[1]: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales.html "AEAT — Sistemas Informáticos de Facturación y VERI*FACTU"
[2]: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html "AEAT — Nota informativa sobre la ampliación del plazo de adaptación de los SIF"
[3]: https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/facturacion-iva/contenido-facturas.html "AEAT — Contenido de las facturas"
[4]: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c06-rendimientos-actividades-economicas-cuestiones-generales/obligaciones-contables-registrales-contribuyentes-titulares.html "AEAT — Obligaciones contables y registrales de actividades económicas"
[5]: https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/facturacion-iva/tipos-factura.html "AEAT — Tipos de factura"
[6]: https://www.inclusion.gob.es/w/trabajo-editara-una-guia-practica-para-las-empresas-sobre-el-control-diario-de-jornada-laboral "Ministerio de Trabajo — Control diario de jornada"
[7]: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/principios "AEPD — Principios"
[8]: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/proteccion-de-datos-por-defecto "AEPD — Protección de datos por defecto"
