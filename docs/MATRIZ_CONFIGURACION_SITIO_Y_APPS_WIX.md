# Matriz de configuracion del sitio y aplicaciones Wix

**Sitio de referencia:** `188bed94-177c-4bc9-a9f0-35080d874f3e`  
**Dominio operativo:** `www.marianmadrid.es`  
**Rama de codigo:** `qa/wix-engine-hardening-20260825`  
**Objetivo:** configurar el sitio y sus aplicaciones Wix sin contradecir los contratos de codigo, los IDs CMS ni las fuentes de verdad del ecosistema.

> Esta matriz separa el **estado objetivo** del **estado confirmado**. La sesion actual no dispone de lectura autenticada del dashboard Wix: el conector devolvio `403 permission_denied` y el panel solicito inicio de sesion. Por tanto, los elementos marcados como pendientes deben comprobarse en el dashboard antes de modificarse.

## 1. Configuracion global del sitio

| Area | Configuracion objetivo alineada | Evidencia en codigo | Estado de lectura |
|---|---|---|---|
| Sitio conectado | Site ID `188bed94-177c-4bc9-a9f0-35080d874f3e`, UI version `14544`. | `wix.config.json`. | Confirmado desde repositorio; no confirma QA aislado. |
| Zona horaria | `Europe/Madrid`. | `SDK_CONFIG.TZ`; cierres y claves de fecha aplican Madrid. | Debe confirmar en configuracion regional. |
| Idioma y pais | Espanol y Espana. | Contratos, textos de interfaz, moneda y documentacion. | Debe confirmar en configuracion regional. |
| Moneda | EUR. | Formateo de importes y flujos de caja. | Debe confirmar en configuracion de negocio y pago. |
| Dominio permitido para API | `https://www.marianmadrid.es` y `https://marianmadrid.es`. | `SDK_CONFIG.EXTERNAL_HTTP.CORS_ALLOWED_ORIGINS`. | Confirmado en codigo. No agregar wildcard. |
| Velo y backend | Velo habilitado, archivos backend, web modules y jobs publicados con el sitio. | `src/backend`, `src/pages`, `jobs.config`. | Requiere confirmacion en Editor. |

No se deben cambiar el `siteId`, la zona horaria, la moneda ni los origenes CORS para resolver errores superficiales. Cualquier variacion rompe el calculo de dia contable, la disponibilidad, el formato de importes o las llamadas HTTP firmadas.

## 2. Aplicaciones Wix y responsabilidad unica

| Aplicacion | Estado objetivo | Integracion de codigo y CMS | Ajuste que debe confirmarse |
|---|---|---|---|
| **Wix Bookings** | Instalada y propietaria de servicios, recursos, slots y reservas nativas. | `reservas.web.js`, `bookingSaga.js`, `events.js`; `Import2`, `CitasF2`, `DualSlotCache`, `MM_LOCKS`. | Servicios y recursos activos; asignacion de personal; calendario habilitado; ubicacion operativa coherente con `LOCATION_ID`. |
| **Wix Stores catalogo V1** | Instalada y propietaria de productos, variantes, pedidos y stock comercial nativo. | `events.js`, `inventario.web.js`; `InventarioProductos`, `movimientoInventario`, `ConciliacionStockWix`. | Cada articulo controlado debe conservar `sku`, `wixProductId` y, si aplica, `wixVariantId`. No migrar a Catalog V3 sin proyecto separado. |
| **Wix eCommerce y Payments** | Checkout y eventos nativos de pedido, pago y reembolso; sandbox en QA. | `events.js`, `cajas.web.js`, `PendingCompensations`, `movimientoCaja`. | Metodos de pago, impuestos, politicas de reembolso y entorno sandbox. No generar cobros de produccion para probar. |
| **Wix Members Area** | Sesion y roles de colaboradores/miembros. | `security.js`, `security.web.js`, `staff.js`, colección privada `MAPA_STAFF`. | Marian y personal deben aceptar invitaciones y conservar el correo/miembro alineado con su registro CMS privado. |
| **Wix CMS** | Colecciones custom, indices y permisos restringidos. | `tests/cms-schema-canonical.json`, `internalConfig.js`, `data.js`. | IDs tecnicos, campos e indices conforme al contrato; no renombrar IDs ni borrar colecciones. |
| **Wix Forms** | Captura de datos no transaccionales cuando corresponda. | No es fuente de pagos ni ledger. | Formularios no deben insertar directamente en ledger, citas ni movimientos de inventario. |
| **Wix Invoices** | Aplicacion separada de factura. | El backend actual no escribe en ella. | No conectar automatismos de facturacion sin modelo fiscal, series y revision de gestoria. |
| **Gift Cards, Blog y Promote SEO** | Instaladas sin intervenir en el motor transaccional. | No hay modulo propietario de integracion. | Mantener separadas de caja e inventario hasta definir flujo aprobado. |

## 3. Wix Bookings: configuracion de servicios, agenda y personal

La agenda nativa de Wix Bookings es la fuente de verdad para disponibilidad y reservas. La coleccion `Import2` es una configuracion editorial y de emparejamiento dual, no un sustituto de servicios nativos.

| Configuracion de Bookings | Regla de alineacion |
|---|---|
| Recursos / personal | El recurso de Marian debe coincidir con `STAFF_ACCESS.MARIAN_RESOURCE_ID` y el tipo de recurso con `API.STAFF_RESOURCE_TYPE_ID`. La colección privada `MAPA_STAFF` es la fuente de correspondencia del backend y la selección `Import2.personalDisponible` determina qué recursos se habilitan para cada servicio. |
| Servicio simple | `Import2.serviceId` debe ser el ID del servicio nativo de Bookings; `tiempoFase1` debe reflejar la duracion funcional. |
| Servicio dual | Servicio F1 con `permitirCombinar=true` y `linkFases` apuntando al `serviceId` nativo de F2. La F2 editorial se marca `oculto=true` y no se oferta como flujo independiente si asi lo define la experiencia de reservas. |
| Gap de exposicion | `tiempoExposicion` es ventana libre entre F1 y F2. La disponibilidad se valida en Bookings antes de crear ambas fases. |
| Complementos | Las referencias multiples de `Import2.addonsOptions` apuntan a `AddonsCatalogo`. Cada complemento activo requiere `bookingsAddonId`, `bookingsAddonGroupId`, `precioAddon` y `cantidadMaximaAddon`. |
| Horarios | Los horarios base y particulares del personal deben gestionarse en Bookings, no en `Import2.staffDisponible`. |
| Ubicacion | El negocio/servicios de Bookings deben usar la ubicacion que corresponde al `LOCATION_ID` configurado. |

Wix permite asignar roles Bookings y limitar colaboradores por ubicacion. Para personal que gestione su propia agenda, el rol de Bookings Staff Member se concede despues de que acepte la invitacion; para administracion completa de agenda se aplica Bookings Manager o Bookings Admin conforme a funciones reales.[1][2]

## 4. Roles, permisos y acceso interno

El backend nunca confia exclusivamente en la interfaz. `security.js` combina rol Wix y allowlists declaradas como secretos, y `requireMarianManager()` exige ademas que la persona corresponda con el recurso de Marian.

| Perfil | Roles Wix minimos recomendados | Regla de codigo |
|---|---|---|
| Marian | Propietaria del sitio o combinacion necesaria de Website Manager, Bookings Admin, CMS Admin y permisos de pago solo si realmente gestiona pagos. | Debe resolver como administradora y como recurso `MARIAN_RESOURCE_ID` en `MAPA_STAFF`. |
| Gestora de agenda | Bookings Manager o Bookings Admin, limitado a ubicacion cuando sea posible. | No obtiene privilegios de ledger por el rol de Bookings. |
| Estilista | Bookings Staff Member y, si corresponde, rol personalizado de horario propio. | Puede operar solo las acciones que el backend permita a colaborador/personal. |
| Caja / TPV | Cashier o Store Manager segun el canal operativo; nunca otorgar acceso global por comodidad. | `requireCajero()` controla las rutas internas de inventario y caja permitidas. |
| Asesoria | Acceso de lectura/exportacion estrictamente necesario. | No debe obtener secreto fiscal, permisos de pago ni modificacion de ledger. |

Los roles de Wix ofrecen permisos separados para CMS, Stores, Bookings y pagos; Wix recomienda otorgar el rol que corresponde a la funcion concreta y restringir las ubicaciones cuando la aplicacion lo admite.[1]

## 5. CMS: IDs, permisos e integridad

Los IDs tecnicos de las colecciones son contratos de ejecucion. El nombre visible puede normalizarse, pero no se debe renombrar el ID, eliminar una clave o recrear una coleccion como remedio rapido.

| Grupo CMS | Colecciones principales | Permiso objetivo |
|---|---|---|
| Reservas | `Import2`, `AddonsCatalogo`, `CitasF2`, `DualSlotCache`, `BookingTransactions`, `MM_LOCKS`, `PendingCompensations`. | Escritura backend; administracion de configuracion solo a roles autorizados. |
| Caja y fiscal | `movimientoCaja`, `cajaActual`, `HISTORICO_CIERRES_Z`, `RESUMEN_CONTEO_X`, `SecuenciaTickets`, libros de apoyo. | Administracion estricta; ledger y cierres inmutables tras insercion. |
| Inventario | `InventarioProductos` (nombre visible `PRODUCTOS_VENTA`), `movimientoInventario`, `ConciliacionStockWix`. | Administracion y backend; no editar movimientos historicos. |
| Personal | `MapaStaff`, `REGISTRO_HORARIO`. | `MapaStaff` privada para administracion y backend; registro horario append-only salvo migracion administrativa controlada. |
| Tecnicas | `AvailabilityDaysCache`, `AvailabilitySlotsCache`, `MM_AUDIT_LOG`, `m365SyncLog`. | Backend y administracion tecnica. |

El contrato exacto de campos, tipos, indices y notas de compatibilidad se mantiene en `tests/cms-schema-canonical.json`. Antes de modificar el CMS se exporta el esquema, se contrasta el indice y se aplica una migracion compatible, nunca un borrado inferido.

## 6. Secretos y parametros de backend

Los valores secretos se gestionan solo desde Wix Secrets Manager. El repositorio declara nombres, no valores. La correspondencia de personal no es un secreto: se gestiona como datos privados en `MapaStaff`.

| Secreto o parametro | Uso | Regla |
|---|---|---|
| `ADMIN_EMAILS`, `CAJERO_EMAILS` | Allowlists de recuperacion mientras propagan roles Wix. | Mantener minimo privilegio y retirar personal que deje de operar. |
| `SECRET_FISCALKEY` | Firma de integridad del ledger y cierres. | Solo en Secrets Manager; no rotar sin estrategia de verificacion de historico. |
| `FISCAL_NIF_EMISOR` | Identidad del emisor para metadatos/QR fiscal. | Debe configurarse antes de generar informacion fiscal completa; no usar ejemplo. |
| `MARIAN_ASSISTANT_OPENAI_KEY` | Asistente privado del panel. | Habilitarlo solo si el secreto existe y Marian autoriza su uso. |
| `APP_KEY`, `BOOKINGS_API_TOKEN`, `SECRET_AUTH_JWT_KEY`, `POWER_AUTOMATE_TOKEN`, `SENDGRID_API_KEY` | Integraciones limitadas del runtime. | Revisar necesidad, rotacion y permisos sin revelar valores. |

## 7. Jobs, eventos y webhooks

Los Jobs se publican desde `src/backend/jobs.config` y se interpretan en UTC. No se deben sustituir por frecuencias subhorarias no admitidas.

| Funcion | Programacion UTC | Colecciones o dominios |
|---|---|---|
| `cleanExpiredLocks` | Minuto 15 de cada hora | `MM_LOCKS` |
| `cleanupExpiredDualCache` | Minuto 20 de cada hora | `DualSlotCache` |
| `runPendingCompensationsJob` | Minuto 30 de cada hora | Reservas y ledger pendientes |
| `cleanExpiredDaysCache` | 01:00 diaria | `AvailabilityDaysCache` |
| `cleanExpiredSlotsCache` | 01:10 diaria | `AvailabilitySlotsCache` |
| `verifyNightlyZClosing` | 01:20 diaria | Ledger, caja y cierres Z |
| `cleanAuditLogs` | Domingo 02:00 | `MM_AUDIT_LOG` |
| `systemHealthCheck` | 07:00 diaria | Colecciones, secretos, locks y salud |

Los eventos de Bookings/eCommerce se procesan exclusivamente en `events.js`. El dashboard debe mantener los eventos nativos de Bookings, pedidos, pagos y devoluciones habilitados para el sitio; no crear automatizaciones paralelas que escriban directamente en `movimientoCaja` o `movimientoInventario`.

## 8. Componentes que deben existir en Wix Editor

| Pagina | Componente requerido | Funcion |
|---|---|---|
| `ONLY STAFF` | `#htmlOnlyStaff` | Panel compartido de personal y administracion. |
| `ADMINISTRACION` | `#htmlAdministracion` | Panel exclusivo de Marian. El codigo existe, pero el componente fisico debe confirmarse en Editor. |
| `Pagina de servicio 2` | `#htmlWidgetCustomService` | Widget de servicio/reserva personalizada. |
| `Calendario de reservas 2` | `#errorText` | Mensajes de validacion de reserva. |
| `Pagina de servicio 2` | Uno de `#errorBanner`, `#errorBox`, `#textError` o `#errorText` | Presentacion de errores de carga del servicio. |

Una pagina o componente no se considera habilitado porque exista el archivo Velo: debe estar insertado, conservar el ID exacto, recibir el codigo actualizado y publicarse despues de validacion QA.

## 9. Secuencia de aplicacion en el dashboard

1. Revisar configuracion regional, dominio, Apps instaladas y Velo activo.
2. Verificar Bookings: ubicacion, Marian, servicios F1/F2, horarios, permisos y complementos nativos.
3. Verificar Stores V1: productos, SKUs, variantes y vinculos de inventario.
4. Verificar Members y Roles: Marian, personal, cashiers, ubicaciones y colaboradores retirados.
5. Contrastar CMS contra el JSON canónico, sin cambios destructivos.
6. Comprobar Secret Manager solo por presencia de nombres y vigencia de acceso, sin mostrar valores.
7. Verificar Jobs, eventos y webhooks publicados.
8. Insertar y verificar los componentes HTML de las paginas internas.
9. Ejecutar `npm run validate`, preview QA y una prueba aislada de reserva/checkout sandbox antes de publicar.

## 10. Estado pendiente de comprobacion en sitio

| Item | Motivo |
|---|---|
| Apps y versiones instaladas | El dashboard Wix requiere sesion autenticada. |
| Zona horaria, idioma, pais y moneda efectivos | Solo visibles en configuracion del sitio. |
| Servicios, recurso Marian, horarios y ubicacion Bookings | Deben contrastarse contra IDs nativos reales. |
| Roles, colaboradores y restricciones por ubicacion | Deben verificarse sin divulgar informacion personal. |
| Colecciones, indices y permisos de produccion | El contrato local existe, pero requiere lectura CMS autenticada. |
| Existencia de secretos y publicacion de Jobs | Se comprueba en dashboard sin revelar valores. |
| Componentes HTML y pagina ADMINISTRACION publicada | El codigo exige IDs concretos; el Editor debe confirmarlos. |

## Referencias

[1] [Wix: Roles and Permissions Overview](https://support.wix.com/en/article/roles-permissions-overview)

[2] [Wix: Adding Staff Permissions in Wix Bookings](https://support.wix.com/en/article/adding-staff-permissions-in-wix-bookings)

[3] [Wix: About Bookings Staff Members](https://support.wix.com/en/article/about-staff-members-in-wix-bookings-7354860)

[4] [Wix: Schedule Jobs](https://dev.wix.com/docs/velo/articles/getting-started/schedule-jobs)

[5] [Wix: Patch Data Collection](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/patch-data-collection)
