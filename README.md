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
| Panel Marian | `src/pages/ADMINISTRACION.mvf3f.js`, `src/public/marianAdministrationController.js`, `docs/WIDGET_PANEL_GESTION_MARIAN.html` | Acceso verificado en backend. El widget usa handshake, lista cerrada de mensajes y confirmación visible en operaciones sensibles. |
| Paquetes para gestoria | `fiscalDocuments.web.js`, `MM_AUDIT_LOG` | Previsualizacion, versionado, descarga y entrega manual confirmada; no crea declaraciones ni facturas oficiales. |
| M365 (Fase 2) | `m365GraphSync.js` y `M365GraphSyncQueue` | Infraestructura conservada pero desactivada por `SDK_CONFIG.M365.ENABLED = false`; no hay cron ni trafico externo en Fase 1. |
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

El codigo de la pagina esta versionado en `src/pages/ADMINISTRACION.mvf3f.js`. El contenido completo del componente HTML se mantiene en `docs/WIDGET_PANEL_GESTION_MARIAN.html` y debe sincronizarse con el componente Wix existente con ID `#htmlAdministracion`; no debe crearse una pagina paralela.

El flujo documental muestra por defecto `gestion@marianmadrid.es`, permite a Marian editarlo para cada envio y exige una confirmacion visible. La entrega permanece bloqueada hasta que se configuren unicamente en Wix Secrets Manager `RESEND_API_KEY` y `RESEND_FROM_EMAIL`, con el dominio remitente verificado. Nunca se guardan esos valores en codigo, CMS, archivos ni Git.

El asistente requiere configurar este secreto en Wix Secrets Manager, sin incluirlo en código ni CMS:

```text
MARIAN_ASSISTANT_OPENAI_KEY
```

La configuración de la interfaz, el secreto y las garantías de seguridad están documentadas en `docs/CONFIGURACION_PANEL_GESTION_MARIAN.md`.

## Límites de operación

Los comandos de desarrollo, las pruebas estáticas y el Local Editor no realizan por sí mismos operaciones económicas. No ejecutar ni publicar cargos, reembolsos, asientos manuales, conteos X, cierres Z, envíos externos o declaraciones sin el alcance y la confirmación operativa correspondientes.

## Evidencia mínima antes de producción

Antes de una publicacion deben pasar la validacion local, la sincronizacion de tipos, Local Editor sin errores y las pruebas controladas en entorno adecuado para reservas, pagos, eCommerce, compensaciones y colecciones CMS. El Editor debe revisarse antes de sincronizar el componente HTML si Wix advierte que contiene cambios de diseno mas recientes.
