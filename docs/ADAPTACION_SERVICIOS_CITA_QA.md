# Adaptacion de SERVICIOS_CITA para QA

**Estado:** Preparado para aplicacion supervisada en QA.  
**Contrato de codigo:** `2026-08-26-service-catalog-qa-v1`.  
**Coleccion de servicios:** `Import2` (nombre visible `SERVICIOS_CITA`).

## Objetivo

La adaptacion permite que Marian gestione el catalogo de servicios mediante etiquetas claras, opciones cerradas y validacion en backend. El cambio no renombra el ID tecnico `Import2`, no elimina campos existentes y no realiza mutaciones automáticas en el sitio publicado.

> La interfaz solo recoge la intencion. Los hooks de `src/backend/data.js` validan los valores, normalizan textos, limitan longitudes y calculan `duracionTotal` en el servidor.

| Elemento | Decisión de QA | Compatibilidad |
|---|---|---|
| `estado` | `SINGLE_REFERENCE` a `CatalogoEstadosServicio` | Nuevo campo no destructivo. |
| `categoria` | `SINGLE_REFERENCE` a `CatalogoCategoriasServicio` | Nuevo campo no destructivo. |
| `monedaCatalogo` | `SINGLE_REFERENCE` a `CatalogoMonedas` | Convive con `moneda` de texto durante la migracion. |
| `duracionTotal` | Calculado por hook | No se elimina el campo existente. |
| `AddonsCatalogo` | Nombre visible `EXTRAS_CATALOGO` | El ID tecnico no cambia. |
| `MapaStaff` | Colección privada activa con `resourceId`, `nombreVisible`, `memberId` o `email`, y `activo`. | Sustituye el secreto de correspondencia de personal. |
| `personalDisponible` | `MULTI_REFERENCE` desde `SERVICIOS_CITA` a `MapaStaff`. | Selección canónica que el backend convierte en recursos de Wix Bookings. |

## Catalogos iniciales

Los siguientes registros se crean manualmente en QA. El valor de `_id` se usa como referencia estable y no se modifica una vez creado.

### CatalogoEstadosServicio

| `_id` | Nombre visible | Descripcion | Orden |
|---|---|---|---:|
| `ACTIVO` | Activo | El servicio puede mostrarse y reservarse. | 1 |
| `INACTIVO` | Inactivo | El servicio no se muestra para reserva publica. | 2 |
| `BORRADOR` | Borrador | El servicio esta en preparacion y no se muestra para reserva publica. | 3 |

### CatalogoCategoriasServicio

| `_id` | Nombre visible | Descripcion | Orden |
|---|---|---|---:|
| `PELUQUERIA` | Peluqueria | Cortes, peinados, color y tratamientos capilares. | 1 |
| `ESTETICA` | Estetica | Depilacion, cejas, pestanas y tratamientos faciales. | 2 |
| `UNAS` | Unas | Manicura, pedicura y esmaltado. | 3 |
| `COMBINADO` | Combinado | Servicios con dos fases y tiempo de exposicion. | 4 |
| `PRODUCTO` | Producto | Producto fisico no reservable como servicio. | 5 |

### CatalogoMonedas

| `_id` | Nombre visible | Simbolo |
|---|---|---|
| `EUR` | Euro | EUR |

## Aplicacion secuencial en QA

| Fase | Accion | Evidencia requerida |
|---:|---|---|
| 1 | Exportar el esquema de `Import2` y sus registros actuales. | Copia fechada de esquema y datos. |
| 2 | Crear los tres catalogos y sus registros iniciales. | Consulta de solo lectura con todos los IDs anteriores. |
| 3 | Anadir `estado`, `categoria` y `monedaCatalogo` sin retirar campos. | Exportacion del esquema con coexistencia de campos. |
| 4 | Crear o completar `MapaStaff` con recursos Bookings reales, identificador de miembro o correo, nombre visible y estado activo. | Consulta privada sin duplicados de `resourceId`. |
| 5 | Añadir `personalDisponible`, `bookingsSyncEnabled` y los campos Bookings no destructivos a `Import2`. | Exportación de esquema con las nuevas claves y sin retirada de campos legacy. |
| 6 | Preparar un plan de asignación y revisar manualmente categorías y personal disponible. | Lista de servicios con referencias válidas a `MapaStaff`, sin escritura remota todavía. |
| 7 | Aplicar una escritura controlada en QA: estado `ACTIVO`, moneda `EUR`, categoría y personal revisados. | Consulta que confirme cobertura total de los registros seleccionados. |
| 8 | Activar `bookingsSyncEnabled` en un único servicio de prueba y ejecutar el job de cola. | Recursos seleccionados visibles como `staffMemberIds` en Wix Bookings, sin cambios de reservas. |
| 9 | Desplegar los hooks y realizar pruebas con servicios de prueba. | Resultado de las comprobaciones siguientes. |
| 10 | Actualizar etiquetas visibles y descripciones orientadas a Marian. | Revision visual en CMS por un usuario no tecnico. |
| 11 | Mantener `moneda` de texto al menos siete dias de operacion controlada antes de valorar su retirada. | Evidencia de lectura dual y aprobacion separada. |

## Reglas aplicadas por el backend

La validacion de `Import2` rechaza estados y categorias fuera de los catalogos cerrados, limita los textos comerciales, obliga a usar EUR, requiere una fase dos valida para servicios combinados y recalcula la duracion total. Los servicios con estado `INACTIVO` o `BORRADOR` no se exponen a la reserva publica. Los servicios sin estado conservan la compatibilidad de lectura durante la migracion y se tratan como disponibles hasta que QA complete el poblado.

| Verificacion | Criterio de exito |
|---|---|
| Estado invalido | El hook rechaza la escritura con `SERVICE_VALIDATION`. |
| Categoria invalida | El hook rechaza la escritura con `SERVICE_VALIDATION`. |
| Moneda distinta de EUR | El hook rechaza la escritura. |
| Servicio combinado sin fase dos valida | El hook rechaza la escritura. |
| Duracion total | El hook persiste el valor calculado. |
| Servicio no activo | La API publica no lo devuelve como reservable. |
| `EXTRAS_CATALOGO` | Conserva el ID tecnico `AddonsCatalogo`. |
| Personal disponible inválido | La cola marca el servicio como bloqueado y no actualiza Wix Bookings. |
| Personal disponible activo | La cola resuelve referencias de `MapaStaff` a recursos nativos y sincroniza `staffMemberIds`. |

## Salvaguardas y reversión

No se realiza ningun borrado desde este repositorio. Si una validacion bloquea una edicion legitimamente necesaria en QA, se conserva el registro, se captura el `traceId` y se revisa el valor contra el contrato antes de modificar el codigo. La retirada de `moneda` de texto y cualquier cambio de permisos o indices requieren una tarea independiente, una copia de seguridad y aprobacion explicita.

## Referencias internas

- [Contrato CMS canónico](./CMS_SCHEMA_CANONICO.md)
- [Esquema de colecciones CMS](./ESQUEMA_COLECCIONES_CMS_CANONICO.md)
- [Biblia operativa del ecosistema](./BIBLIA_ECOSISTEMA_WIX_V20.md)
- [Directrices y objetivos](./DIRECTRICES_Y_OBJETIVOS_RESUMIDOS.md)
