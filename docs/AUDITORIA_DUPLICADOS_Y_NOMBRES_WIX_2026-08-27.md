# Auditoría de duplicados y nombres canónicos Wix

**Fecha:** 27 de agosto de 2026.  
**Repositorio:** `nachoortegazgz/marianmadrid2002`, rama `main`.  
**Método:** inventario de 148 archivos versionados, comparación SHA-256, comparación normalizada de texto, rastreo de referencias, revisión de historial Git y comprobación de contratos existentes.

## Criterio aplicado

Wix utiliza el nombre de la página y un identificador interno separado por puntos para asociar cada fichero de código con la página correspondiente. La documentación de estructura del repositorio indica que esos nombres no deben renombrarse porque Wix podría ignorar el código y crear otro fichero asociado.[1]

Por ello, se ha aplicado una regla conservadora: **se elimina un alias solo cuando es idéntico byte a byte al fichero que conserva el nombre canónico del Editor Wix y no es necesario para un manifiesto, una prueba o una ruta técnica**. Los ficheros con nombres diferentes pero identificadores internos distintos se conservan aunque actualmente contengan el mismo código de plantilla, porque pueden corresponder a páginas Wix distintas.

## Alias eliminados

| Alias retirado | Nombre canónico conservado | SHA-256 común | Comparativa funcional |
| --- | --- | --- | --- |
| `src/pages/administracion.js` | `src/pages/ADMINISTRACION.mvf3f.js` | `758e5311...c6831e6f` | 643 bytes idénticos; mismo código de inicialización de `#htmlAdministracion`. |
| `src/pages/calendario-2.js` | `src/pages/Calendario de reservas 2.q39h6.js` | `b27f1db7...08072e8b` | 20.149 bytes idénticos; no hay pérdida de funciones. |
| `src/pages/only-staff.js` | `src/pages/ONLY STAFF.mvf3f.js` | `d669fc42...fcf4ec6` | 558 bytes idénticos; mismo acceso de personal. |

Los tres pares procedían del mismo commit histórico `995a308`, sin una variante posterior más completa. El nombre conservado es el que incorpora el identificador interno y coincide con la convención del Wix Editor.

## Ficheros conservados deliberadamente

| Grupo | Decisión | Motivo |
| --- | --- | --- |
| `jobs.config` y `src/backend/jobs.config` | Conservar ambos | Son manifiestos técnicos alineados byte a byte; las pruebas del proyecto verifican explícitamente su igualdad y ambos están documentados como ubicaciones activas. |
| Páginas con nombres distintos e identificadores Wix distintos, aunque compartan plantilla vacía | Conservar todas | Cada identificador puede representar una página, página dinámica, sistema o componente distinto en Wix. Retirarlas por similitud textual podría eliminar una superficie del Editor. |
| `README.md` en raíz, `src/backend`, `src/pages` y `src/public` | Conservar todos | Son documentos de alcance distinto por carpeta; no son copias funcionales de código. |

La comparación exacta y la comparación normalizada produjeron los mismos seis grupos: los tres alias retirados, el par de manifiestos y dos grupos de plantillas de páginas con identificadores diferentes. No se detectó otro grupo de código operativo con nombres alternativos cuya eliminación fuera segura.

## Verificaciones realizadas

Antes de retirar los alias se confirmó que los contenidos eran idénticos, que los ficheros canónicos permanecían versionados y que las referencias de código no dependían de los nombres alias. Después de la retirada, la sanitización obligatoria pasó correctamente: 7 de 7 controles. La batería completa, el lint, la comprobación de espacios finales, la comparación de manifiestos y la CI se ejecutarán antes del commit de limpieza.

> No se han renombrado ficheros canónicos ni se han modificado colecciones, servicios, reservas, datos productivos o diseño del Editor Wix.

## Referencias

[1] [Wix — Working with the Velo sidebar and page-code file naming](https://support.wix.com/en/article/velo-working-with-the-velo-sidebar)
