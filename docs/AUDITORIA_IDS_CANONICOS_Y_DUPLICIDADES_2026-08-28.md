# Auditoría de IDs canónicos, aliases y funciones duplicadas

**Fecha:** 28 de agosto de 2026.  
**Alcance:** Código de `main`, configuración `internalConfig.js`, contrato CMS, utilidades de prueba y esquema CMS consultado desde Wix.  
**Criterio de decisión:** reducir solo las duplicidades con identidad semántica y física demostrada, sin renombrar IDs CMS, recursos de Bookings, páginas Wix con ID interno, datos productivos ni contratos públicos.

## Resultado ejecutivo

La auditoría confirma que el sistema utiliza **un ID físico por entidad de negocio** en runtime: una colección comercial `Import2`, una colección de addons `AddonsCatalogo`, una de inventario `InventarioProductos`, una de reservas internas `CitasF2` y un ledger `movimientoCaja`, entre otras. Se retiraron tres aliases de configuración sin consumidores o sustituibles y dos IDs de aplicaciones Wix sin uso en código. No se eliminaron colecciones, páginas, recursos, funciones de saga ni wrappers de Job que representan fronteras de integración necesarias.

| Categoría | Antes | Después | Decisión |
|---|---:|---:|---|
| Claves `COLLECTIONS` | 37 | **34** | Se eliminaron tres aliases; cada ID físico queda representado una sola vez. |
| IDs físicos CMS | 34 | **34** | Sin cambio; no se tocan datos ni colecciones Wix. |
| Claves `APP_IDS` | 3 | **1** | Solo permanece `BOOKINGS`, único app ID consumido por el runtime. |
| Referencias a aliases retirados | 1 activa + 2 inactivas | **0** | `reservas.web.js` usa `EXTRAS_CATALOGO` directamente. |
| GUID de sitio fuera de configuración | 1 en utilidad auxiliar | **0** | La utilidad toma `siteId` de `wix.config.json`. |
| Funciones exportadas con nombre repetido | 2 pares | 2 pares | Son funciones homónimas en módulos diferentes, con responsabilidades de fachada/Job; no son duplicación de lógica. |

## Consolidaciones aplicadas

| Elemento retirado | ID al que apuntaba | Consumidores encontrados antes | Sustitución | Motivo de seguridad |
|---|---|---:|---|---|
| `COLLECTIONS.ADDONS_CATALOGO` | `AddonsCatalogo` | 0 | `COLLECTIONS.EXTRAS_CATALOGO` | Alias sin consumidores; `EXTRAS_CATALOGO` es el nombre visible canónico. |
| `COLLECTIONS.SERVICIOS_OPCIONES_ADDON` | `AddonsCatalogo` | 1 | `COLLECTIONS.EXTRAS_CATALOGO` | Alias de la misma colección sin semántica de persistencia independiente. |
| `COLLECTIONS.INVENTARIO_PRODUCTOS` | `InventarioProductos` | 0 | `COLLECTIONS.PRODUCTOS_VENTA` | Alias declarado como compatibilidad sin consumidores. El nombre visible de la colección real es `PRODUCTOS_VENTA`. |
| `APP_IDS.STORES` | ID interno histórico distinto del contexto Wix | 0 | No necesario | Se elimina una fuente potencial de discrepancia; no hay llamadas que necesiten ese ID. |
| `APP_IDS.EVENTS` | `140603ad-af8d-84fb-9004-ee174e35054d` | 0 | No necesario | No hay consumidor runtime. Los eventos eCommerce se reciben por handlers Wix, no por este literal. |
| Site ID literal en test auxiliar | `188bed94-177c-4bc9-a9f0-35080d874f3e` | 1 | `wix.config.json.siteId` | Centraliza el único origen local del ID de sitio. |

La semántica de negocio se conserva. `PRODUCTOS_VENTA` es la clave canónica de código hacia el ID físico `InventarioProductos` porque coincide con el nombre visible que Wix devuelve. No representa una segunda colección. `EXTRAS_CATALOGO` es la clave canónica hacia `AddonsCatalogo`; no se cambia el ID físico, que Wix y las referencias de `Import2` siguen utilizando.

## Elementos revisados que se conservan intencionadamente

| Elemento | Razón para mantenerlo |
|---|---|
| `COLLECTIONS.SERVICIOS_CITA`, `CITAS`, `TRANSACTIONS`, `LOCKS`, `COMPENSATIONS` y colas | Son entidades físicas distintas y necesarias para catálogo, saga, idempotencia y recuperación. |
| `API.STAFF_RESOURCE_TYPE_ID`, `SDK_CONFIG.LOCATION_ID`, `STAFF_ACCESS.MARIAN_RESOURCE_ID` | Identificadores de dominios Wix diferentes; no son alias ni valores intercambiables. |
| `prepareScheduledManagerPackages()` | Implementación de preparación de documentos en `fiscalDocuments.web.js`. |
| `prepareManagerPackagesJob()` | Entrada de Wix Jobs en `crons.js`; llama al anterior con timeout y auditoría. La homonimia parcial es un adaptador requerido por el manifiesto `jobs.config`. |
| `wixBookingsV2_*` y `wixEcom_*` | Nombres de evento definidos por Wix; no se consolidan porque son contratos de webhook distintos. |
| Páginas con sufijo interno Wix | Conservan el vínculo entre archivos y componentes del Editor. No se renombran ni se deduplican sin equivalencia funcional y de mapeo demostrada. |
| Campos CMS de compatibilidad | Ejemplos: `staffMemberId`, `empleada`, `Owner`. Existen en datos/esquema vivo y no deben borrarse por deducción. |

## Controles de verificación aplicados

Después de cada modificación de código se ejecutó `npm run test:sanitization`: siete controles aprobados en cada ejecución. La comprobación estática final confirma que no quedan consumidores de `ADDONS_CATALOGO`, `SERVICIOS_OPCIONES_ADDON`, `INVENTARIO_PRODUCTOS`, el ID histórico de Stores ni el ID no usado de Events. También confirma que todas las claves `COLLECTIONS.*` usadas por código existen en `internalConfig.js`.

> La consolidación no altera el esquema CMS, reservas, ventas, agenda, permisos, datos productivos ni publicación Wix. Es un cambio de código y contrato interno que reduce ambigüedad de configuración.

## Próximo umbral de limpieza

No se recomienda eliminar más IDs o funciones sin una prueba de consumidores en Wix Editor y una revisión específica de compatibilidad. Las siguientes mejoras potenciales no pertenecen a esta consolidación automática: definir índices CMS basados en medición de consultas, normalizar estados históricos de cierres Z y crear un runner autenticado que pruebe la saga Velo end-to-end.

## Referencias

[1]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/list-data-collections "Wix CMS — List Data Collections"
