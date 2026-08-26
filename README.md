# Marian Madrid Booking Engine

Repositorio Wix Velo para reservas simples y duales, venta eCommerce, ledger de caja, inventario, informes internos y panel administrativo exclusivo de Marian.

> Esta rama es la base técnica de trabajo. Los cambios se validan localmente y en Local Editor antes de cualquier publicación. Un commit en GitHub no equivale a publicar el sitio público.

## Contratos canónicos

| Área | Fuente canónica | Regla de integración |
|---|---|---|
| Web Methods Velo | `src/backend/*.web.js` | ES Modules y `wix-web-module`. No usar `@wix/web-methods`, CommonJS ni instalaciones npm genéricas de módulos Velo. |
| Reservas | `booking/bookingSaga.js`, `booking/bookingCore.js`, `citasManager.web.js`, `reservas.web.js` | Saga, locks, idempotencia y compensación son obligatorios para cualquier reserva o reprogramación. |
| Ledger y caja | `cajas.web.js`, `events.js`, `data.js` | `movimientoCaja` es el registro fuente inmutable. `cajaActual` es una proyección derivada; nunca debe sustituir ni reescribir el ledger. |
| Fiscalidad | `fiscalAggregator.web.js` | Los resúmenes y libros se derivan del ledger y son documentación de trabajo para revisión profesional. |
| Inventario | `inventario.web.js`, `events.js` | Los movimientos y conciliaciones se registran mediante los flujos nativos y las recuperaciones pendientes. |
| Panel Marian | `src/pages/ONLY STAFF.mvf3f.js`, `docs/WIDGET_PANEL_GESTION_MARIAN.html` | Acceso verificado en backend. El widget usa handshake y origen controlado; las operaciones sensibles requieren confirmación visible. |
| Asistente IA | `marianAssistant.web.js` | Chat privado, historial acotado, `store: false` y solo acciones no destructivas sugeridas. |

## Flujo de trabajo confiable

El repositorio declara módulos nativos Velo que Wix resuelve en su propio runtime. Por ese motivo no se debe ejecutar `npm install` como mecanismo de resolución de dependencias locales. Usa los scripts definidos en `package.json`.

```bash
npm run sync:types
npm run test
npm run validate
npm run dev
```

`npm run validate` sincroniza los tipos Wix y ejecuta los controles estructurales y las simulaciones deterministas. La apertura de Local Editor con `npm run dev` permite probar el borrador, pero no publica producción.

## Panel administrativo de Marian

El código de la página está versionado en `src/pages/ONLY STAFF.mvf3f.js`. El contenido del componente HTML debe mantenerse desde el archivo completo `docs/WIDGET_PANEL_GESTION_MARIAN.html` en el componente Wix con ID `#htmlOnlyStaff`.

El asistente requiere configurar este secreto en Wix Secrets Manager, sin incluirlo en código ni CMS:

```text
MARIAN_ASSISTANT_OPENAI_KEY
```

La configuración de la interfaz, el secreto y las garantías de seguridad están documentadas en `docs/CONFIGURACION_PANEL_GESTION_MARIAN.md`.

## Límites de operación

Los comandos de desarrollo, las pruebas estáticas y el Local Editor no realizan por sí mismos operaciones económicas. No ejecutar ni publicar cargos, reembolsos, asientos manuales, conteos X, cierres Z, envíos externos o declaraciones sin el alcance y la confirmación operativa correspondientes.

## Evidencia mínima antes de producción

Antes de una publicación deben pasar la validación local, la sincronización de tipos, Local Editor sin errores y las pruebas controladas en entorno adecuado para reservas, pagos, eCommerce, compensaciones y colecciones CMS.
