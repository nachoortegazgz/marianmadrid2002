# Automatización segura de dependencias

**Ámbito:** repositorio `nachoortegazgz/marianmadrid2002`.
**Estado:** activación preparada en el repositorio; requiere que el cambio se integre en `main` para que GitHub empiece a aplicar la política.
**Principio:** las actualizaciones se proponen y validan automáticamente, pero nunca se fusionan, publican en Wix ni modifican el catálogo o datos productivos de forma automática.

## Política implantada

La configuración `.github/dependabot.yml` crea revisiones semanales, los lunes a las 06:00 y 06:10 en la zona `Europe/Madrid`, para dependencias de npm y de acciones de GitHub. Las actualizaciones de versión se agrupan y se limitan a cambios **menores** y de **parche**. Las versiones mayores se excluyen expresamente. La documentación oficial permite restringir los niveles SemVer con `allow.update-types` y excluir niveles mediante `ignore.update-types`; las actualizaciones de seguridad conservan su canal propio y requieren igualmente revisión humana. [1]

| Control | Configuración aplicada | Riesgo que reduce |
| --- | --- | --- |
| Frecuencia moderada | Revisión semanal en horario estable. | Evita acumulación de cambios y ruido operativo. |
| Alcance limitado | npm y acciones de GitHub. | Mantiene el mantenimiento en los componentes realmente versionados. |
| SemVer conservador | Solo `minor` y `patch`; `major` excluido. | Evita cambios incompatibles sin estudio previo. |
| Pocas propuestas abiertas | Máximo de tres PR de npm y dos de acciones. | Limita la carga de revisión y los cambios simultáneos. |
| Rebase automático | Solo de las propuestas abiertas. | Reduce conflictos sin conceder permisos de fusión. |
| Sin automatismos de entrega | No existe ningún paso de fusión, publicación Wix, despliegue ni `npm publish`. | Impide que una actualización llegue a producción sin revisión y aprobación. |

## Validación continua

El flujo `.github/workflows/validate.yml` se ejecuta en cada solicitud de incorporación hacia `main`, en cada incorporación a `main` y de forma manual. Opera con permiso de solo lectura sobre el contenido del repositorio y ejecuta las comprobaciones de formato de diferencias, análisis estático y la batería `npm test`.

La batería incluye sanitización, contratos de código, verificación del widget de ADMINISTRACIÓN, simulaciones de reservas y caja, documentos para gestoría y un contrato que verifica la propia automatización. El flujo no ejecuta `sync:types`, porque ese paso requiere autenticación del entorno Wix y debe mantenerse manual antes de publicar cambios de Velo.

> Toda actualización propuesta debe ser revisada y aceptada por una persona autorizada tras una ejecución correcta de la validación. Para paquetes Wix, cambios de versión mayor, modificaciones del `wix.lock`, dependencias que afecten a pagos, Bookings o Velo, la revisión debe incluir una comprobación funcional en un entorno QA aislado antes de cualquier publicación.

## Procedimiento de revisión

| Etapa | Responsable | Resultado exigido |
| --- | --- | --- |
| Propuesta semanal | Dependabot | Solicitud de incorporación limitada a parche o menor. |
| Validación | Flujo de CI | `git diff --check`, análisis estático y `npm test` correctos. |
| Revisión técnica | Responsable autorizado | Compatibilidad Wix, cambios de bloqueo y notas de versión evaluados. |
| Validación Wix | Responsable autorizado | `npm run sync:types` y, cuando proceda, pruebas QA ejecutadas manualmente. |
| Integración | Responsable autorizado | Fusión manual tras conformidad. |
| Publicación | Responsable autorizado | Previsualización y publicación separadas; nunca desencadenadas por Dependabot ni CI. |

## Límites conscientes

La automatización no sustituye la revisión de seguridad de dependencias indirectas, la compatibilidad de APIs Wix ni el control de cambios de diseño del Editor. Tampoco activa Microsoft 365, el envío de paquetes a gestoría ni ningún servicio externo. Esos flujos permanecen sujetos a su configuración, secreto y confirmación explícita independientes.

## Referencias

[1]: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/controlling-dependencies-updated "GitHub Docs — Controlling which dependencies are updated by Dependabot"
[2]: https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates "GitHub Docs — Optimizing the creation of pull requests for Dependabot version updates"
