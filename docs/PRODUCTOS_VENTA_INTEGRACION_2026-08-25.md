# Integración de PRODUCTOS_VENTA con InventarioProductos

**Fecha de verificación:** 25 de agosto de 2026.
**Colección técnica:** `InventarioProductos`.
**Nombre visible comercial:** `PRODUCTOS_VENTA`.

> `PRODUCTOS_VENTA` y `InventarioProductos` no son dos fuentes de verdad distintas. El primero es el nombre visible del catálogo comercial; el segundo es el ID técnico que Wix y el código ya utilizan. Crear una segunda colección duplicaría stock, SKU y enlaces con Wix Stores.

## Catálogo verificado

La lectura administrativa encontró **un producto** en el catálogo: `TAZA PERSONALIZABLE`. Está enlazado con un producto físico visible de Wix Stores V1 y con el stock interno esperado.

| Dato | Valor usado | Fuente verificada |
|---|---|---|
| ID Wix Stores | `68d28332-ec11-33cb-c36c-111cdb5d3542` | `wixProductId` en `InventarioProductos` y catálogo Wix Stores |
| Nombre | `TAZA PERSONALIZABLE` | CMS y Wix Stores |
| SKU para integración | `TAZA_PERSONALIZABLE` | `InventarioProductos` |
| Categoría de venta | `MERCHANDISING` | Clasificación comercial aplicada al producto taza |
| Precio con IVA | `14.95 EUR` | CMS y Wix Stores |
| Coste | `4.95 EUR` | `costRange` de Wix Stores |
| Stock | `5` unidades | CMS y Wix Stores |
| Peso | `0.25` kg | Wix Stores |
| Visibilidad | `TRUE` | Wix Stores |
| Imagen | Imagen principal Wix Stores | Wix Stores |
| Cinta | `Recien llegado` | Wix Stores |

La descripción, la marca, las opciones de producto y los campos de texto personalizados aparecen vacíos en el producto de Wix Stores. Por ello, el CSV los deja vacíos y no inventa contenido.

## Integración aplicada

| Capa | Integración |
|---|---|
| CMS visible | `PRODUCTOS_VENTA` se conserva como nombre visible de la colección. |
| CMS técnico | `InventarioProductos` permanece como ID físico estable. |
| Configuración backend | `COLLECTIONS.PRODUCTOS_VENTA` apunta a `InventarioProductos`; `COLLECTIONS.INVENTARIO_PRODUCTOS` se conserva como alias de compatibilidad. |
| Inventario | Las consultas, consumo y recepción usan el alias comercial canónico sin cambiar la colección física. |
| Wix Stores | El registro contiene `wixProductId`, precio, disponibilidad y stock asociados al producto nativo. |
| CSV | `exports/PRODUCTOS_VENTA_Wix_import.csv` conserva las 50 columnas de la plantilla Wix y contiene una fila de producto. |

## Limitación de cobertura

No hay productos reales en las categorías `PELUQUERIA` o `ESTETICA` dentro de `InventarioProductos` ni se encontró una colección técnica separada `PRODUCTOS_VENTA`. Por tanto, el CSV contiene únicamente el producto verificado. No se añadieron filas basadas en datos externos, precios supuestos, SKU inventados ni proveedores no presentes en el CMS.

## Referencias

[1] [Wix Stores V1: Get Product](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/get-product).

[2] [Wix CMS: Query Data Items](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/query-data-items).
