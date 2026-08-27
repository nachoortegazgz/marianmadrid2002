# Evidencia de auditoría completa y publicación Wix

**Fecha:** 27 de agosto de 2026.
**Repositorio verificado:** `nachoortegazgz/marianmadrid2002`.
**Commit comprobado:** `a5536d4c21b9ed263f15f45256992d4e6b398c70`.

## Estado de repositorio

La rama local `main` y `origin/main` estaban alineadas en `a5536d4`. El árbol de trabajo estaba limpio. Los alias `src/pages/administracion.js`, `src/pages/calendario-2.js` y `src/pages/only-staff.js` no están versionados; permanecen sus nombres canónicos con identificador interno Wix: `ADMINISTRACION.mvf3f.js`, `Calendario de reservas 2.q39h6.js` y `ONLY STAFF.mvf3f.js`.

Todos los ficheros JavaScript de página, salvo el especial `masterPage.js`, cumplen la convención de nombre con identificador interno. Las páginas con distintos identificadores que comparten código de plantilla se conservan porque no se puede demostrar que sean la misma página Wix.

## Publicación y disponibilidad

Wix confirmó una publicación correcta del código local sobre la versión de interfaz `14544`. La publicación mostró el aviso de que el Editor contiene cambios de diseño más recientes; por seguridad, la publicación se limitó al código y no se sobrescribió deliberadamente el diseño del Editor ni ningún dato productivo.

Las tres rutas públicas esenciales respondieron correctamente después de la publicación:

| Ruta | Resultado |
| --- | --- |
| `https://www.marianmadrid.es/` | Accesible; muestra el sitio y el enlace de reserva. |
| `https://www.marianmadrid.es/reserva-online` | Accesible; muestra catálogo y enlaces de reserva. |
| `https://www.marianmadrid.es/politica-privacidad-texto` | Accesible; muestra el contenido legal publicado. |

La comprobación pública confirma disponibilidad del contenido publicado, pero no sustituye la verificación visual dentro del Editor Wix. El aviso de versión de interfaz más reciente deja pendiente una revisión visual desde el Editor estable si se necesita demostrar paridad completa de diseño.
