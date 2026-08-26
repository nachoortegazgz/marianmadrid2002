# Referencia operativa: API Wix CMS

Esta nota conserva los requisitos oficiales empleados en la alineación y validación del CMS.

| Operación | REST | Requisito principal |
|---|---|---|
| Listar colecciones | `GET https://www.wixapis.com/wix-data/v2/collections` | Scope `SCOPE.DC-DATA.DATA-COLLECTIONS-MANAGE`; usar token acotado al Site ID y cabecera `wix-site-id`. |
| Consultar colección | `GET https://www.wixapis.com/wix-data/v2/collections/{dataCollectionId}` | La identidad autenticada devuelve permisos, capacidades y revisión completos. |
| Consultar registros | `POST https://www.wixapis.com/wix-data/v2/items/query` | Scope `SCOPE.DC-DATA.READ`; usar `dataCollectionId`, `query.paging` y `consistentRead=true` cuando se revisa un cambio inmediato. |
| Insertar registro | `POST https://www.wixapis.com/wix-data/v2/items` | Scope `SCOPE.DC-DATA.WRITE`; la inserción con ID estable falla si ya existe, por lo que protege anotaciones idempotentes. |
| Actualizar colección completa | `PUT https://www.wixapis.com/wix-data/v2/collections` | Requiere ID, revisión vigente, permisos y campos. Wix advierte que se pierden propiedades no incluidas; no usar sin reconstruir el esquema actual. |
| Parchear colección | `PATCH https://www.wixapis.com/wix-data/v2/collections/{dataCollection.id}` | Solo permite `displayName`, `displayField` y permisos. No sirve para añadir campos. |
| Índices | API Indexes | Máximo 3 índices regulares de hasta 3 campos y 1 único de 1 campo; revisar duplicados antes de crear únicos. |

## Reglas aplicadas

1. Usar `npx @wix/cli token --site <siteId>`: el token no acotado devolvió `403`; el token acotado permitió lecturas CMS.
2. Nunca imprimir, versionar ni adjuntar tokens.
3. No renombrar IDs técnicos ni mutar tipos de campo en producción. Las incompatibilidades requieren migración.
4. Antes de agregar campos requeridos, consultar el total de registros de la colección y preservar su revisión, permisos, plugins y todos los campos existentes.
5. Las anotaciones de prueba se identifican explícitamente con prefijo `TEST_` y se registran en auditoría técnica, no en el ledger fiscal, salvo que se use un entorno de QA inequívocamente aislado.

## Fuentes oficiales

- [List Data Collections](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/list-data-collections)
- [Update Data Collection](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/update-data-collection)
- [Patch Data Collection](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/patch-data-collection)
- [Query Data Items](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/query-data-items)
- [Insert Data Item](https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/insert-data-item)
- [About the Indexes API](https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/indexes/introduction)
