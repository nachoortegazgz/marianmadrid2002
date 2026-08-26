# Validacion en Local Editor y preview

La rama `qa/wix-engine-hardening-20260825` contiene cambios de codigo y pruebas locales. No debe publicarse directamente. Este procedimiento completa la validacion contra el sitio Wix sin alterar clientes, cobros ni datos operativos.

## Secuencia minima

| Paso | Comando o accion | Resultado esperado |
|---|---|---|
| 1 | `npm run test` | Ocho controles de contrato/codigo y seis casos simulados en verde. |
| 2 | `npm run sync:types` | Tipos del runtime Wix sincronizados, cuando la CLI tenga acceso al proyecto. |
| 3 | `npx --yes @wix/cli whoami` y, si corresponde, `npx --yes @wix/cli login` | CLI autenticada con una cuenta que tenga acceso al sitio. |
| 4 | `npm run dev` | Local Editor abierto y codigo de la rama disponible para prueba en tiempo real. No usar `--tunnel` salvo que la CLI instalada lo documente expresamente. |
| 5 | Probar UI de reserva y gestion | Consulta de disponibilidad, simple, dual F1-gap-F2, panel Only Staff y operaciones no destructivas. Sin pago real. |
| 6 | Revisar consola y Local Editor | Sin errores de imports, permisos, contratos de widget, Web Methods ni Jobs. |
| 7 | Preview desde el flujo disponible en Local Editor | Aceptacion funcional no productiva; no ejecutar `wix publish`. |
| 8 | Revision final | Confirmar que CMS, reservas, pagos, logs, cache y tareas programadas no presentan efectos no esperados. |

## Dependencias nativas del sitio

No se debe usar `npm install` como mecanismo de validacion del sitio. Los modulos de Velo, como `wix-auth`, `wix-data` y otros modulos nativos, se resuelven mediante la configuracion administrada de Wix reflejada en `wix.lock`, no desde el registro npm generico. La CLI de Wix es la ruta de sincronizacion y ejecucion del sitio. La dependencia publica `@wix/bookings` queda declarada en una version disponible del SDK; la CLI y `wix.lock` resuelven las dependencias nativas complementarias.

## Jobs programados

Los Jobs de Velo se interpretan en **UTC** y Wix ignora frecuencias menores de una hora. El archivo `src/backend/jobs.config` programa limpiezas, recuperaciones y cierre Z en horarios UTC compatibles. El cierre automático calcula el día anterior de `Europe/Madrid`, por lo que su ejecución a `01:20 UTC` ocurre después del cambio de día local tanto en horario estándar como de verano.[3]

## Controles de seguridad

La prueba no debe crear reservas de clientes ni procesar dinero. Las reservas de ensayo requieren una fecha de baja actividad, contacto de prueba, cancelacion compensatoria comprobada y notificaciones desactivadas cuando Wix lo permita. Los pagos y devoluciones requieren sandbox de pasarela y confirmacion operativa separada.

El Local Editor sincroniza codigo desde el IDE para probarlo antes de publicar. Los cambios de campos CMS realizados desde esa experiencia pueden reflejarse de inmediato en el sitio activo, por lo que el esquema y los datos de produccion quedan fuera de esta fase.[1] El comando `wix preview` se utiliza para crear una version de validacion antes de publicar; `wix publish` queda expresamente fuera de este runbook.[2]

## Criterio para proponer publicacion

La rama solo puede proponerse para fusion o publicacion si los controles locales estan en verde, Local Editor no muestra fallos, preview confirma el flujo esencial y se han revisado los efectos sobre Bookings, eCommerce, CMS y permisos. Las pruebas del simulador no sustituyen esa validacion: prueban contratos de dominio sin invocar Wix.

## Referencias

[1] [Wix: About the Local Editor](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli-for-sites/about-the-local-editor)

[2] [Wix: Wix CLI for Sites Commands](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli-for-sites/wix-cli-for-sites-commands)

[3] [Wix: Schedule Jobs](https://dev.wix.com/docs/velo/articles/getting-started/schedule-jobs)
