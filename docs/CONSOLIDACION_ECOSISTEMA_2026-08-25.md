# Consolidacion Tecnica del Ecosistema

**Fecha de consolidacion:** 25 de agosto de 2026  
**Rama:** `qa/wix-engine-hardening-20260825`  
**Alcance:** reservas, eCommerce, caja, inventario, libros de apoyo, control horario, panel administrativo, contratos CMS, seguridad, pruebas y documentacion.

> Esta consolidacion es tecnica. El software aporta trazabilidad y controles de integridad, pero no certifica por si solo cumplimiento fiscal, laboral, mercantil o de proteccion de datos. Cualquier uso regulado debe validarse con la asesoria correspondiente antes de presentar, firmar o legalizar informacion.

## Arquitectura consolidada

| Dominio | Fuente de verdad | Componente responsable | Invariante operativo |
|---|---|---|---|
| Reservas simples y duales | Wix Bookings y `CitasF2` | `reservas.web.js`, `citasManager.web.js`, Saga | La fase uno se compensa si falla la fase dos o la persistencia. |
| Pagos, reembolsos y caja | Eventos eCommerce verificados y `movimientoCaja` | `events.js`, `cajas.web.js` | Un asiento es inmutable, idempotente, secuencial y enlazado por hash. |
| Cierres diarios | `movimientoCaja` y `HISTORICO_CIERRES_Z` | `cajas.web.js`, job diario | El cierre conserva secuencias, hashes, IVA, totales, firma e idempotencia por dia. |
| Inventario | `PRODUCTOS_VENTA` visible sobre `InventarioProductos` tecnico | `inventario.web.js`, `events.js` | Cada consumo, recepcion o reposicion confirmada deja un movimiento y conciliacion cuando corresponde. |
| Proyeccion contable | Ledger y mapa validado | `contabilidad.js` | Solo se proyecta partida doble si el mapa de cuentas esta activo y validado por gestoria. |
| Administracion de Marian | Roles Wix y allowlists de secretos | `security.js`, `security.web.js`, `marianAdministrationController.js` | El panel se bloquea sin miembro autorizado y no duplica logica entre `ONLY STAFF` y `ADMINISTRACION`. |

## Mejoras aplicadas en esta consolidacion

| Area | Mejora aplicada | Efecto verificable |
|---|---|---|
| Autorizacion | `isStaffCollaborator()` ahora reconoce las allowlists de administrador y cajero ademas de los roles Wix. | Una cuenta autorizada de Marian no queda bloqueada si existe retardo de propagacion de roles. |
| CORS externo | Se sustituyo el comodin por `https://www.marianmadrid.es` y `https://marianmadrid.es`. | Las funciones HTTP no reflejan origenes arbitrarios. |
| Emisor fiscal | Se elimino el NIF de ejemplo y se creo `nifEmisor` (`NIF_EMISOR`) en `movimientoCaja`. | Los nuevos asientos pueden conservar el emisor desde el secreto `FISCAL_NIF_EMISOR`; sin secreto, se registra nulo y se emite advertencia, nunca un dato ficticio. |
| QR y recibos | El helper solo forma URL cuando recibe NIF, ticket, fecha, importe y huella. | No se generan QR con datos fiscales de prueba y el IVA procede del asiento. |
| Agregados de caja y fiscalidad | Caja diaria y resumen trimestral abortan al alcanzar el limite de paginas. | Nunca se devuelve silenciosamente un cierre o informe basado en un conjunto truncado. |
| Calidad local | ESLint estandar reproducible, reglas ES Modules y limpieza de dependencias muertas. | `npm run lint` funciona sin instalar modulos Wix locales no publicos. |

## Contratos CMS relevantes

| Coleccion | Cambio consolidado | Naturaleza |
|---|---|---|
| `movimientoCaja` | Campo `nifEmisor` / visible `NIF_EMISOR`. | Adicion no destructiva; no modifica asientos existentes. |
| `HISTORICO_CIERRES_Z` | Campos completos del cierre `Z_V2`, creados durante la auditoria previa. | Contrato alineado con el escritor de caja. |
| `movimientoInventario` | Vínculos `orderId` y `refundId`. | Permite trazar venta online, devolucion y reposicion confirmada. |
| Libros de apoyo | Once colecciones de apoyo contable/fiscal y contratos en el repositorio. | Proyeccion desactivada hasta aprobar y cargar el mapa de cuentas. |

## Puesta en marcha pendiente

| Requisito | Responsable | Estado esperado antes del uso operativo |
|---|---|---|
| Configurar `FISCAL_NIF_EMISOR` en Wix Secrets Manager con el identificador emisor real. | Marian / asesoria | Obligatorio para que los nuevos recibos tengan emisor y QR completo. |
| Validar y cargar el mapa `PLAN_CUENTAS_CONTABLES`. | Gestoria | Obligatorio antes de habilitar proyeccion contable. |
| Crear la pagina fisica `ADMINISTRACION` en Wix Editor y asociar `#htmlAdministracion`. | Marian / Editor | Obligatorio para probar el panel real en navegador. |
| Revisar la primera venta, devolucion y cierre reales con su `traceId`. | Marian / asesoria | Recomendado para confirmar el ciclo con datos operativos. |

## Evidencia de calidad

| Control | Resultado |
|---|---:|
| ESLint estandar | Correcto |
| Sincronizacion de tipos Wix | Correcta |
| Verificacion estructural | 14/14 superadas |
| Simulaciones de reservas, pagos y devoluciones | 6/6 superadas |
| Simulacion de cierre desde ADMINISTRACION | 2/2 superadas |
| Revision de espacios y formato | `git diff --check` correcto |

## Limites tecnicos expresos

El sistema no presenta declaraciones, no firma ante administraciones, no sustituye una aplicacion certificada ni determina por si solo obligaciones del negocio. Los indicadores de IVA y los libros de apoyo se presentan como informacion interna derivada de los asientos; la asesoria debe validar el regimen, contrapartes, facturacion recibida, deducciones, prorrata, rectificaciones y toda presentacion oficial.
