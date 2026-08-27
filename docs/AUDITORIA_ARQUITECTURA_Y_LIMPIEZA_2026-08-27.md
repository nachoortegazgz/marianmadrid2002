# Auditoría de arquitectura y limpieza del ecosistema Wix/Velo

**Fecha:** 27 de agosto de 2026.  
**Ámbito:** arquitectura de archivos, límites de módulos, dependencias, duplicación y mantenibilidad del repositorio `marianmadrid2002`.  
**Criterio de intervención:** no eliminar rutas, colecciones, servicios ni ficheros vinculados a Wix por inferencia. Las modificaciones de esta revisión se limitaron a consolidaciones internas verificables y correcciones de documentación técnica.

## Conclusión ejecutiva

La arquitectura es **robusta en los controles transaccionales**, pero concentra demasiadas responsabilidades en unos pocos módulos. La base ya cuenta con una clara fuente de verdad para catálogo, reservas, caja, configuración y permisos. El mayor beneficio de una siguiente iteración no está en añadir funciones, sino en **reducir acoplamiento**, eliminar lógica repetida y separar utilidades compartidas de la capa pública.

Se han aplicado dos limpiezas estructurales de bajo riesgo en caja: el cierre Z administrativo y el job nocturno utilizan desde ahora la misma implementación interna firmada, y la consulta de estado de caja reutiliza la proyección única de saldos. Con ello se evita que los dos caminos puedan producir totales o campos de cierre diferentes con el tiempo.

| Aspecto | Evaluación | Implicación |
| --- | --- | --- |
| Núcleo de reservas | Fuerte y especializado. | Mantener estable; refactorizar por extracción, no por reescritura. |
| Caja y ledger | Seguro, pero demasiado concentrado. | Es el principal candidato para separar lectura, escritura, cierres y recuperación. |
| Configuración | Centralizada correctamente, aunque extensa. | Dividir por dominio sin perder el punto único de importación. |
| Utilidades compartidas | Útiles, pero alojadas en `public/` y usadas por backend. | Separar utilidades puras de configuración de interfaz. |
| Páginas Wix duplicadas | No concluyente; parecen resultado de sincronización. | No borrar ni renombrar fuera del Editor Wix. |
| Integraciones externas | Aisladas y pausadas. | Conservar sin activar; mover a Fase 2 solo con autorización. |

## Mapa actual de módulos

El proyecto contiene aproximadamente **13.127 líneas JavaScript** en fuentes. El tamaño no es por sí mismo un defecto, pero los módulos de mayor peso concentran reglas de negocio, adaptadores Wix, persistencia y presentación de respuestas.

| Dominio | Módulos principales | Responsabilidad actual | Diagnóstico |
| --- | --- | --- | --- |
| Reservas | `reservas.web.js`, `booking/bookingSaga.js`, `booking/bookingCore.js`, `citasManager.web.js` | Catálogo, disponibilidad, fases duales, locks, saga, persistencia, pago y reprogramación. | La separación saga/núcleo/fachada es acertada; `reservas.web.js` sigue siendo demasiado amplio. |
| Caja y fiscalidad | `cajas.web.js`, `fiscalAggregator.web.js`, `fiscalDocuments.web.js`, `contabilidad.js` | Ledger, cierre, arqueo, recuperación, informes, documentos y partida doble. | Controles sólidos; existen cálculos y consultas de ledger repetidos entre módulos de lectura. |
| Inventario | `inventario.web.js`, `events.js` | Consumo interno, recepciones, eventos de venta/devolución y conciliación. | Dos flujos de mutación muy similares y mezcla de panel, dominio y webhooks. |
| Seguridad | `security.js`, `security.web.js`, `securityEngine.js`, `mmSecrets.js` | Roles, listas de acceso, rate limit, HMAC/JWT y nombres de secretos. | Cohesión buena; hay patrones repetidos de autorización que pueden abstraerse con prudencia. |
| Operación | `crons.js`, `bookingsServiceSync.js`, `m365GraphSync.js` | Limpiezas, recuperación, salud, proyección a Bookings e integración externa futura. | `crons.js` es un orquestador amplio pero razonable; M365 queda protegido por bandera. |
| Interfaz | `marianAdministrationController.js`, `widgetBridge.js`, `mmUtils.js`, páginas | Panel privado, comunicación iframe, utilidades y rutas Wix. | El puente del widget está bien aislado; `mmUtils.js` mezcla interfaz y núcleo común. |

## Hallazgos técnicos

### 1. Consolidación de cierre Z y estado de caja — aplicada

Antes de esta revisión había dos implementaciones distintas para crear el cierre Z. El job nocturno llamaba a `_registerZClosingInternal()`, que genera el resumen `Z_V2`, verifica integridad y firma el resultado. El método administrativo repetía una versión más corta de los cálculos. Esa duplicidad podía derivar en cierres con niveles de detalle diferentes según el origen.

La ruta administrativa delega ahora en `_registerZClosingInternal()` después de aplicar la autorización y el rate limit. Además, `getCashierState()` reutiliza `_buildCashierProjection()`, que ya es la fuente única de saldos por forma de pago. El contrato automatizado exige que esta delegación se mantenga.

| Mejora aplicada | Efecto |
| --- | --- |
| Una única creación de cierre Z | El cierre manual y el programado producen el mismo formato firmado y el mismo resumen fiscal. |
| Una única proyección de caja | Los saldos de efectivo, tarjeta, Bizum, online y total se calculan de la misma manera en todos los caminos. |
| Contrato de regresión añadido | Una modificación futura no podrá reintroducir una segunda ruta sin romper las pruebas. |

### 2. Módulo de reservas amplio, pero con núcleo reutilizable

`reservas.web.js` concentra lectura de `Import2`, normalización de catálogo, addons, cachés de servicio y disponibilidad, selección de personal, cálculo de huecos duales y métodos públicos. Su tamaño se explica por reglas de alto riesgo, especialmente la revalidación exacta y la asignación del mismo profesional en fases duales. No debe simplificarse mediante una reescritura general.

La arquitectura ya dispone de los límites adecuados en `bookingCore.js` y `bookingSaga.js`: locks, persistencia de transacciones, proyección de slots y compensación están separados. La optimización recomendada es extraer de `reservas.web.js` dos módulos puros y probables: `catalogService` para lectura/mapeo de `Import2` y `availabilityService` para slots, caches y ranking. La fachada web debería conservar solo autorización, rate limit y contratos de entrada/salida.

### 3. Frontera pública/backend en `mmUtils.js`

`public/mmUtils.js` es importado por código de frontend y backend. Contiene constantes de interfaz, rutas, parámetros del widget y utilidades genéricas de fecha, tiempo, reintentos, identificadores y saneamiento. Funciona, pero convierte el directorio `public/` en una dependencia transversal del servidor.

La mejora adecuada es dividirlo en dos piezas: una utilidad pura y sin datos de interfaz, compartida entre backend y frontend, y una configuración específica de interfaz que solo consuman páginas, controladores y widgets. Este cambio debe hacerse de forma incremental, manteniendo una capa de compatibilidad temporal, porque actualmente existen numerosos consumidores.

> Se detectó además un riesgo latente: el valor por defecto de `withTimeout()` referencia `SDK_CONFIG.TIMEOUTS.API_MS`, mientras que el `SDK_CONFIG` público contiene solo la zona horaria. Las llamadas revisadas suministran timeout explícito, por lo que no se ha observado un fallo activo. Al separar utilidades, este valor por defecto debe convertirse en una constante local segura.

### 4. Caja, informes y documentos repiten lecturas del ledger

`cajas.web.js` incluye la escritura inmutable, la proyección de caja, integridad, recuperación fiscal y cierres. `fiscalAggregator.web.js` y `fiscalDocuments.web.js` vuelven a consultar y clasificar movimientos trimestrales para fabricar resúmenes, libros y paquetes. La duplicación es comprensible por la evolución del sistema, pero aumenta el coste de cambiar campos como `naturalezaOperacion`, `tratamientoIva`, propinas o devoluciones.

La siguiente limpieza debería extraer un **lector de ledger de solo lectura** que reciba periodo, filtros y límite, y devuelva movimientos ya normalizados. Encima de ese lector, cada módulo conservaría sus vistas: caja diaria, borrador fiscal y paquete documental. Es importante que el lector no escriba ni firme registros para no mezclar lectura con reglas del ledger.

### 5. Inventario combina tres preocupaciones

`inventario.web.js` mezcla métodos del panel, consumo interno, recepción de proveedor, creación de movimientos, actualización de stock esperado, alta de cola de conciliación y trazabilidad de webhooks eCommerce. `registerInternalInventoryUse()` y `registerInventoryReceipt()` repiten la misma secuencia: localizar SKU, calcular delta, insertar movimiento, actualizar producto y encolar conciliación.

La oportunidad es extraer un escritor interno parametrizado por delta, tipo, origen y autorización ya comprobada. La refactorización debe incorporar pruebas de concurrencia y compensación antes de tocar producción, porque dos usos simultáneos del mismo SKU podrían competir por `stockExpected`.

### 6. `internalConfig.js` es un SSOT valioso, pero demasiado general

La configuración central evita literales dispersos y mantiene la pausa de M365, los límites de jobs y las colecciones protegidas. La presencia de aliases de compatibilidad, como `ADDONS_CATALOGO` e `INVENTARIO_PRODUCTOS`, es aceptable mientras haya consumidores antiguos, pero debe tener fecha de retirada y prueba de ausencia de uso.

La evolución recomendada es separar exports por dominio —catálogo, operación, caja/fiscal, seguridad, integraciones— y reexportarlos desde `internalConfig.js` durante una transición. Así no se fuerza un cambio de importación masivo ni se debilita el punto único de acceso.

### 7. Ficheros de página con nombres duplicados: no limpiar todavía

Existen pares byte a byte idénticos como `ADMINISTRACION.mvf3f.js` / `administracion.js`, `ONLY STAFF.mvf3f.js` / `only-staff.js` y `Calendario de reservas 2.q39h6.js` / `calendario-2.js`. La propia documentación de Wix indica que los nombres de página contienen una etiqueta y un identificador interno, y advierte que no se deben renombrar desde el IDE.

Por tanto, estos archivos son **candidatos de inspección en Editor**, no candidatos de borrado. Suprimir uno localmente podría romper la asociación de página o producir una eliminación no deseada al sincronizar.

## Limpieza aplicada en esta revisión

Además de la consolidación de caja, se corrigieron dos encabezados técnicos que afirmaban cumplimiento o generación oficial de obligaciones fiscales. Ahora describen correctamente un ledger y borradores de apoyo sujetos a revisión profesional. Es una limpieza de precisión documental que evita inducir a error sin modificar lógica ni datos.

La sanitización se ejecutó después de cada edición de código. La regresión final completó correctamente las 7 comprobaciones de sanitización, 19 contratos, la verificación de widget, 6 simulaciones críticas, 6 integraciones realistas, 2 simulaciones administrativas, 5 simulaciones documentales, 3 controles de automatización y el análisis estático.

## Hoja de ruta de optimización priorizada

| Prioridad | Cambio propuesto | Beneficio | Salvaguarda obligatoria |
| --- | --- | --- | --- |
| Alta | Extraer lector y clasificador de ledger de solo lectura. | Elimina divergencia entre caja, fiscalidad y documentos. | Fixtures de venta, devolución parcial, propina, ajuste y múltiples IVA. |
| Alta | Dividir `reservas.web.js` en catálogo y disponibilidad, preservando web methods. | Reduce complejidad y acelera mantenimiento de reservas duales. | Mantener contratos públicos y repetir simulaciones de simple, dual y gap. |
| Alta | Corregir el fallback de timeout en utilidades compartidas. | Elimina un fallo latente si una llamada omite timeout. | Prueba unitaria del valor por defecto; sin cambiar plazos explícitos. |
| Media | Extraer escritor común de inventario. | Reduce duplicación de consumo y recepción. | Pruebas de concurrencia, fallos intermedios y cola de conciliación. |
| Media | Separar utilidades puras de configuración UI en `mmUtils`. | Aclara la frontera frontend/backend. | Migración por fases, alias temporal y búsqueda de importadores. |
| Media | Modularizar configuración por dominio con reexports. | Facilita leer y mantener el SSOT. | No cambiar valores, IDs ni nombres de colección. |
| Diferida | Revisar pares de páginas Wix y sincronizar el widget HTML vivo. | Elimina posibles residuos del Editor y completa el panel. | Hacerlo exclusivamente desde una sesión estable del Editor, preservando diseño reciente. |
| Diferida | Activar cualquier integración externa. | Habilita automatizaciones de Fase 2. | Requiere autorización expresa, secretos en Wix y validación independiente. |

## Decisión de publicación

Las mejoras aplicadas han superado todas las validaciones locales. Esta auditoría se versiona en GitHub, pero no ejecuta por sí sola una nueva publicación. No se han modificado colecciones, servicios, reservas ni configuraciones productivas. Cualquier publicación posterior debe usar la vista previa de Wix y respetar las salvaguardas de diseño existentes.

## Conclusión

El ecosistema no necesita una reescritura: necesita una **evolución por extracciones pequeñas y verificadas**. Las reservas, caja y seguridad ya disponen de defensas valiosas; la prioridad debe ser mantener esos contratos y disminuir las rutas paralelas. La limpieza aplicada reduce inmediatamente el riesgo de divergencia en cierres de caja. Las siguientes mejoras de mayor retorno son un lector común de ledger, una separación progresiva de utilidades compartidas y la división de la fachada de reservas sin cambiar su comportamiento público.
