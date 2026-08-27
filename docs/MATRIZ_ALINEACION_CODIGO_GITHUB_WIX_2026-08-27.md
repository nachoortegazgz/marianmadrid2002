# Matriz de alineación de código — GitHub, desarrollo y Wix

**Fecha de análisis:** 27 de agosto de 2026.
**Sitio Wix:** Marian Madrid Peluquería y Estética (`188bed94-177c-4bc9-a9f0-35080d874f3e`).
**Objetivo:** determinar la versión funcional más avanzada sin confundir contenido de código con cambios visuales y datos administrados por Wix.

> La versión que se consolida debe conservar los identificadores internos que Wix usa para asociar el código a sus páginas. Un cambio de nombre no es una actualización funcional y puede desconectar el fichero de la página correspondiente.[1]

## Fuentes contrastadas

| Fuente | Estado observado | Decisión |
| --- | --- | --- |
| Repositorio local y GitHub `main` | Alineados inicialmente en `2d8d063`, sin cambios locales, sin stashes ni PR abiertos. | Base de código de referencia. |
| Rama `origin/qa/wix-engine-v19.8.0-excellence-consolidated` | Está 31 commits por detrás de `main` y no contiene commits exclusivos. | No aporta una versión más nueva. |
| Instantánea compartida de 25 de agosto | Contiene el motor previo y evidencia de QA; 29 módulos comparables, de los cuales 7 ya eran idénticos y el resto ha recibido endurecimientos posteriores en `main`. | Fuente histórica para detectar funciones no incorporadas. |
| Wix | El sitio está publicado, tiene Velo activo y usa Editor Wix. El código local declara interfaz `14544`. | Se conserva el mapeo por identificador; la publicación final se realiza desde la fuente consolidada. |

## Resultado por familias funcionales

| Familia | Comparación con instantánea de desarrollo | Versión conservada |
| --- | --- | --- |
| Reservas, saga y Bookings | `main` añade controles de catálogo, revalidación, cachés e idempotencia posteriores. | `main`. |
| Caja, devoluciones, propinas y cierre Z | `main` amplía 870 a 1.110 líneas e incorpora proyección común, detalle de líneas, naturaleza, tratamiento IVA y cierres consolidados. | `main`. |
| CMS, catálogo y personal | `main` amplía validaciones de 183 a 506 líneas y añade invalidación de cachés y controles de `MapaStaff`. | `main`. |
| Inventario y conciliación | `main` añade devolución online con reabastecimiento confirmado y preserva los controles de colaborador/cajero. | `main`. |
| Documentos para gestoría | Capacidad posterior de `main`: PDF versionado, huellas, preparación mensual/trimestral y envío manual confirmado. | `main`. |
| Seguridad y QR | `main` suprime un NIF de ejemplo y bloquea la generación de URL si faltan datos fiscales reales, evitando una apariencia de cumplimiento. | `main`. |
| Página `ADMINISTRACION.mvf3f.js` | Coincide byte a byte con la instantánea desarrollada y mantiene el controlador Marian-only. | `main`. |
| Página `Calendario de reservas 2.q39h6.js` | Coincide byte a byte con la instantánea desarrollada. | `main`. |
| Página `ONLY STAFF.mvf3f.js` | La instantánea incluía un flujo completo de fichaje, caja e inventario para personal; el envoltorio simplificado de `main` lo había reemplazado por el panel de Marian. | Se restaura el flujo completo en el nombre canónico del Editor y se aplican los controles RBAC actuales. |

## Corrección aplicada a ONLY STAFF

La versión consolidada de `src/pages/ONLY STAFF.mvf3f.js` retiene el nombre con identificador interno `mvf3f`, conserva el componente `#htmlOnlyStaff` y recupera las operaciones de personal contenidas en la instantánea: fichaje, consulta de jornada e historial, cálculo de horas, ajuste administrativo, TPV, arqueo X, cierre Z, consumo y recepción de inventario, y conciliación.

La recuperación no copia ciegamente el código histórico. Se adapta al backend actual: las acciones de caja y conciliación requieren rol de cajero o administrador; el cierre Z y los ajustes requieren administrador; el fichaje se vincula al recurso de la sesión autenticada; y los datos de documentos y gestoría continúan exclusivamente en `ADMINISTRACION` para Marian.

## Límite de paridad visual

La comprobación confirma que la fuente local utiliza nombres canónicos, que GitHub comparte la misma base y que Wix puede publicar el código resultante. Wix advirtió que el Editor contiene cambios de diseño posteriores a la interfaz local `14544`. Este análisis no sobrescribe esos cambios visuales por inferencia; su revisión debe hacerse desde un Editor Wix estable. La publicación final distribuye el código consolidado y no borra datos ni modifica colecciones.

## Referencias

[1] [Wix — Working with the Velo sidebar](https://support.wix.com/en/article/velo-working-with-the-velo-sidebar)
