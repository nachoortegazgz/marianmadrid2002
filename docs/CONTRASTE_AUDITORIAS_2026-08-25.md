# Contraste de auditorías — 25 de agosto de 2026

**Objeto.** Este documento contrasta `auditoria2408.txt` y `auditoriagrok.txt` contra la rama actual, el contrato CMS, el esquema CMS obtenido por API y el contenido público disponible. El adjunto se trata como evidencia de partida, no como una instrucción para reemplazar código o datos.

> **Resultado ejecutivo.** La auditoría técnica `auditoria2408.txt` describe una versión anterior o una transcripción degradada: los supuestos fallos de sintaxis, secretos con espacios, CORS abierto y expresiones rotas no existen en la rama validada. La auditoría pública `auditoriagrok.txt` sí identifica incidencias actuales de contenido, conversión y legal que requieren ajustes en Wix Editor.

## 1. Disposición de `auditoria2408.txt`

| Grupo | Veredicto | Evidencia vigente | Decisión |
|---|---|---|---|
| ERR-01 a ERR-05: espacios en configuración, secretos, TZ, NIF y CORS | **Descartado / obsoleto** | `internalConfig.js` declara claves sin espacios, TZ válida y CORS limitado a los dos orígenes HTTPS; `mmSecrets.js` conserva IDs de secretos exactos; no hay NIF ficticio en la configuración. `npm run lint` y comprobación de sintaxis completan correctamente. | No aplicar los fragmentos adjuntos: reabrirían CORS y un NIF de ejemplo. |
| ERR-06: Base64URL/JWT roto | **Descartado** | `securityEngine.js` usa `_base64UrlEncode` y `_base64UrlDecode` coherentes, con sustituciones `+/-` y `/_` válidas. | Sin cambio. |
| ERR-07 y ERR-08: DST y enmascaramiento PII rotos | **Descartado** | `mmUtils.js` contiene funciones flecha válidas, claves de `roundTrip` sin espacios y enmascaramiento de correo/IP correcto. | Sin cambio. |
| ERR-09 a ERR-14: trazas, selectores y `package.json` con espacios | **Descartado / obsoleto** | Lint limpio; `package.json` válido; `servicio-2.js` no existe bajo ese nombre en la rama actual. | No introducir una copia de página o correcciones sobre rutas históricas. |
| ERR-15: campo corrupto de `MAPA_STAFF` | **Descartado** | La API CMS no devuelve el campo citado en `MapaStaff`. | No borrar por inferencia. |
| ERR-16: `bookingIdf1` en `DualSlotCache` | **Descartado** | La API no devuelve `bookingIdf1` ni `bookingIdF1`; el contrato actual usa `pairToken`, `slotF1` y `slotF2`. | Sin cambio. |
| ERR-17: legacy en `REGISTRO_HORARIO` | **Parcialmente confirmado** | Persisten `empleada`, `empleadaNombre`, `tipo`, `ip` y `firma`; el `displayField` ya es `resourceName` y se añadió `registradoPorMemberId`. | Mantener los campos hasta una migración con inventario, dependencias de datasets y copia de seguridad. |
| ERR-18: `Owner` en caché de días | **Descartado para la colección citada** | `AvailabilityDaysCache` no contiene un campo de negocio `Owner`. Campos legacy `Owner` aparecen en otras colecciones y no se borran sin análisis de dependencias. | Sin cambio destructivo. |
| ERR-19: cachés sin expiración | **Resuelto** | Las colecciones incluyen `expiresAt`; el runtime invalida caches tras `Import2_afterUpdate` y los Jobs limpian/monitorizan caducidad. | Cobertura estructural vigente. |

## 2. Disposición de `auditoriagrok.txt`

| Hallazgo | Veredicto actual | Evidencia pública | Acción priorizada |
|---|---|---|---|
| Servicio destacado sin disponibilidad | **Confirmado** | La home muestra literalmente «Nada que reservar ahora. Vuelve a intentarlo pronto». [1] | Configurar disponibilidad real del servicio destacado o retirar/ocultar el bloque hasta que la agenda publique slots. |
| Errores de copy y enlaces inseguros | **Confirmado** | Se leen «Confirmación al instant e», «Asesoramiento IA.», enlace HTTP y un enlace envuelto por Google. [1] | Corregir directamente en Wix Editor; forzar enlaces internos HTTPS y URLs directas. |
| Promesa de IA no demostrada | **Confirmado** | La home promete asesoramiento IA, pero el contenido público no expone el asistente. [1] | Publicar el componente funcional o retirar la promesa hasta que esté visible. |
| Galería vacía | **Parcialmente confirmado** | La home expone el encabezado `GALERÍA` sin contenido de imagen recuperable por el extractor. [1] | Revisar el componente Pro Gallery en Editor y añadir activos reales o retirar el bloque. |
| Colaboradores vacío | **Descartado / desactualizado** | El contenido actual enumera logos de L'Oréal, Schwarzkopf y Jorge de la Garza. [1] | Mantener y revisar enlaces/alt-text visualmente. |
| Contacto poco fiable | **No verificable end-to-end** | El formulario y los datos de contacto son visibles; no se envió ningún formulario real. [1] | Probar en dispositivo real con un correo de QA y confirmar recepción/consentimiento. |
| Widget de calendario | **No verificable end-to-end** | Esta sesión no consiguió renderizado estable de navegación interactiva; la página de catálogo sí contiene enlaces al calendario. [2] | Hacer reserva manual de QA de bajo riesgo en dispositivo real y comprobar confirmación, recordatorio y cancelación. |
| Cookies, NIF y términos incompletos | **Confirmado** | La política conserva ejemplos de cookies, NIF/CIF en placeholder, correo sin completar y enlaces `.com` desde `.es`. [3] | Completar únicamente datos reales aprobados por titular/gestoría; revisar el texto legal antes de publicar. |
| Catálogo sin taxonomía | **Parcialmente resuelto** | El catálogo publica categorías de servicio, pero sigue mostrando una lista inicial extensa y una página adicional. [2] | Verificar filtros y diseño móvil en Editor; priorizar categorías y servicios de alta conversión. |
| Boutique vacía | **Desactualizado** | El sitemap de tienda incluye productos de retail y merchandising, aunque también aparecen elementos de plantilla (`shoes`, `t-shirt`). [4] | Ocultar o corregir productos de plantilla y verificar origen, fotos, precios, stock, IVA y derechos de distribución. |
| Páginas de estado/placeholder indexadas | **Confirmado** | El sitemap incluye `/muy-pronto` y `/blank`. [5] | Despublicar, redirigir o marcar `noindex` las rutas que no aporten valor. |

## 3. CMS y contrato canónico

La API CMS devuelve **53 colecciones**, de las cuales las **31 colecciones canónicas** están presentes. Tras lectura con token acotado al sitio, se añadieron de forma compatible y sin registros previos:

| Colección | Campo añadido | Tipo | Motivo |
|---|---|---|---|
| `PendingCompensations` | `refundId` | `TEXT` opcional | Vincular compensaciones de reembolso. |
| `PendingCompensations` | `origin` | `TEXT` obligatorio | Preservar origen de la compensación exigido por runtime. |
| `REGISTRO_HORARIO` | `registradoPorMemberId` | `TEXT` opcional | Trazabilidad del miembro que registra la acción. |

El contrato `tests/cms-schema-canonical.json` y el esquema legible se ajustaron a los tipos realmente desplegados y compatibles: `descripcionLarga=TEXT`, `staffDisponible=OBJECT`, `candidateResourceIds=ARRAY_STRING` y `AvailabilityDaysCache.days=OBJECT`. El contraste posterior devuelve **0 colecciones faltantes, 0 campos faltantes y 0 incompatibilidades de tipo** para las 31 colecciones canónicas.

> No se han eliminado campos legacy, no se han renombrado IDs técnicos y no se ha creado ningún asiento fiscal, reserva, cobro o reembolso ficticio.

## 4. Prioridad de ejecución

La prioridad de impacto es completar en Editor los ajustes públicos confirmados: disponibilidad del servicio destacado, texto/enlaces, legal/cookies con datos reales, páginas placeholder y productos plantilla. En paralelo deben ejecutarse pruebas manuales aisladas del calendario, contacto, checkout y recordatorios antes de cualquier publicación comercial.

La configuración del sistema fiscal, especialmente el NIF del emisor y el mapa de cuentas, requiere datos reales validados por la persona titular y revisión de gestoría. Esta revisión técnica no certifica cumplimiento legal, fiscal ni de protección de datos.

## Referencias

[1]: https://www.marianmadrid.es/ "Página principal de Marian Madrid"
[2]: https://www.marianmadrid.es/reserva-online "Catálogo de servicios y enlaces de reserva"
[3]: https://www.marianmadrid.es/politica-privacidad-texto "Política de privacidad, cookies y términos"
[4]: https://www.marianmadrid.es/store-products-sitemap.xml "Sitemap de productos"
[5]: https://www.marianmadrid.es/pages-sitemap.xml "Sitemap de páginas"

## 5. Disposición de `pasted_content_14.txt`

El informe reutiliza varios hallazgos de una copia anterior del código. Su resultado global de 81,6 % no es reproducible contra la rama actual: la batería vigente ejecuta 16 comprobaciones estructurales, 6 simulaciones críticas, 5 integradas y 2 administrativas, todas correctas.

| Hallazgo del informe | Disposición | Evidencia actual |
|---|---|---|
| P0 de sintaxis en `internalConfig.js`, `mmUtils.js`, `http-functions.js`, páginas y controlador | **Descartado / obsoleto** | Lint y comprobación de sintaxis correctos; las constantes, `_safeTrim`, las funciones de fecha y los imports actuales tienen sintaxis válida. |
| P0 de `requireMarianManager` e `isMarianManager` inexistentes | **Descartado** | `security.js` exporta `requireMarianManager`; `security.web.js` devuelve `isMarianManager`; el controlador lo exige antes de abrir administración. |
| `_normalizeIdPart` no importado | **Descartado** | `cajas.web.js` declara y usa su helper privado `_normalizeIdPart` de forma consistente. |
| CORS comodín y secreto IA ausente | **Descartado** | CORS se limita a ambos dominios HTTPS y `MARIAN_ASSISTANT_OPENAI_KEY` está declarado. |
| `gpt-5-mini` inválido | **Descartado para el proveedor configurado** | El catálogo activo del proveedor en esta sesión devuelve `gpt-5-mini`. No se sustituye por un modelo no validado. |
| Pago por citas con N+1 | **Resuelto** | `events.js` usa una sola consulta `.in('bookingId', ids)` y conserva actualizaciones idempotentes. |
| Invalidación incompleta al editar servicios | **Resuelto** | El hook invalida `DualSlotCache`, `AvailabilityDaysCache` y `AvailabilitySlotsCache` con claves existentes; la cobertura estructural lo verifica. |
| Pre-carga global de F2 para duales | **Pendiente de benchmark, no aplicar aún** | Es una posible optimización, no un defecto reproducido. Cambiarla sin medición puede elevar llamadas, memoria y complejidad de revalidación. |
| `hasSome` para rangos fiscales | **Pendiente de revisión de semántica** | No cambiar por `ge`/`le` sin confirmar si el periodo fiscal solicitado es contiguo y cómo se comportan los periodos especiales. |
| Versiones de comentarios heterogéneas | **Bajo impacto** | No afecta el runtime; se normalizará solo si se edita cada módulo por un cambio funcional. |

> Los bloques de código propuestos por el informe para sustituir módulos completos no deben pegarse: reintroducen constantes obsoletas, CORS permisivo y un NIF ficticio. El criterio aplicado es conservar la implementación validada y corregir solo divergencias demostradas.


## 6. Evidencia pública adicional de rutas indexadas

La comprobación textual posterior confirma que `/muy-pronto` sirve el mismo contenido de la home, por lo que es una ruta duplicada sin propósito independiente. `promociones` existe y enlaza a una categoría de verano/tienda, pero no ofrece una promoción concreta en el contenido recuperado. `gift-card` sí presenta importes seleccionables y compra, por lo que no debe clasificarse como vacía sin una prueba manual del pago.

El producto público `/product-page/shoes` es un elemento de plantilla confirmado: conserva nombre, SKU `K300`, descripción genérica en inglés, política de devolución genérica y precio de 35,95 €. Debe ocultarse o retirarse de la tienda antes de cualquier recorrido comercial. Esta verificación fortalece la prioridad de limpieza de catálogo sobre la carga de productos no validados.

Fuentes adicionales: [página muy pronto](https://www.marianmadrid.es/muy-pronto), [promociones](https://www.marianmadrid.es/promociones), [tarjeta regalo](https://www.marianmadrid.es/gift-card) y [producto de plantilla](https://www.marianmadrid.es/product-page/shoes).
