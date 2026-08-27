# Configuracion del Panel de Gestion Marian

## Alcance

El panel administrativo de Marian utiliza el componente HTML con ID **`#htmlAdministracion`** de la pagina **ADMINISTRACION**. Mantiene el estilo visual del panel interno existente y centraliza consulta de caja, preparacion fiscal, libro registro, inventario, documentos de gestoría y una conversacion privada con asistente IA. La pagina **ONLY STAFF** conserva un componente separado `#htmlOnlyStaff` para jornada, caja e inventario del equipo conforme a su rol.

> El panel no publica el sitio, no envia documentos a gestoría y no presenta declaraciones. Los procesos que crean registros de caja conservan la confirmacion explicita del formulario.

| Recurso | Ubicacion en el repositorio | Uso |
|---|---|---|
| Widget HTML administrativo | `docs/WIDGET_PANEL_GESTION_MARIAN.html` | Copiar integramente solo en el componente HTML `#htmlAdministracion`. |
| Controlador administrativo | `src/public/marianAdministrationController.js` | Autorizacion exclusiva de Marian y operaciones de caja, fiscalidad, documentos e IA. |
| Frontend Velo de personal | `src/pages/ONLY STAFF.mvf3f.js` | Nombre canónico Wix para `#htmlOnlyStaff`; conserva fichaje, caja e inventario con RBAC. |
| Frontend Velo administrativo | `src/pages/ADMINISTRACION.mvf3f.js` | Nombre canónico Wix para `#htmlAdministracion`; carga el controlador Marian-only. |
| Web method de IA | `src/backend/marianAssistant.web.js` | Chat privado, historial acotado y acciones sugeridas no destructivas. |
| Control de acceso | `src/backend/security.js` y `src/backend/security.web.js` | Verifica rol administrador y recurso de personal de Marian. |

## Activacion del asistente IA

Para responder, el web method requiere un secreto de Wix Secrets Manager con este nombre exacto:

```text
MARIAN_ASSISTANT_OPENAI_KEY
```

El valor debe ser una clave de servidor de OpenAI. No debe copiarse nunca en el widget HTML, en el codigo de pagina ni en colecciones CMS. Si el secreto no existe, el chat devuelve el error controlado `AI_NOT_CONFIGURED` sin exponer datos.

El modelo configurado es `gpt-5-mini` y la conversacion se transmite con `store: false`. El historial vive solo en el navegador durante la sesion actual y cada mensaje esta limitado por longitud y frecuencia.

## Acciones que el chat puede activar

El asistente no puede ejecutar directamente operaciones economicas ni modificar agenda. Solo puede sugerir y lanzar estas acciones no destructivas del propio panel:

| Accion sugerida | Efecto |
|---|---|
| Actualizar caja | Consulta el estado de caja actual. |
| Actualizar inventario | Consulta inventario y conciliaciones pendientes. |
| Abrir control de caja | Lleva a la seccion de caja. |
| Abrir fiscal y gestoria | Lleva a la seccion fiscal. |
| Preparar resumen fiscal | Consulta el resumen trimestral seleccionado. |
| Cargar libro registro | Consulta el libro registro del periodo seleccionado. |
| Descargar CSV gestor | Descarga localmente un CSV ya preparado. |

Las ventas presenciales, conteos X y cierres Z siguen exigiendo datos en su formulario y una confirmacion visible de Marian. Las respuestas de IA no crean registros por si mismas.

## Verificacion previa a uso

1. Confirma que la cuenta de Marian esta vinculada en la colección privada `MAPA_STAFF` al recurso configurado y tiene rol de administracion.
2. En la pagina ADMINISTRACION, inserta un componente HTML con ID `#htmlAdministracion` y copia en el su contenido completo de `WIDGET_PANEL_GESTION_MARIAN.html`. La pagina ONLY STAFF debe mantener su componente específico `#htmlOnlyStaff`; no se debe sustituir por el panel de documentos y gestoría de Marian.
3. Configura `MARIAN_ASSISTANT_OPENAI_KEY` en Wix Secrets Manager.
4. Abre Local Editor y prueba consultas no destructivas: "actualiza la caja", "prepara el resumen fiscal" y "carga el libro registro".
5. Revisa el resultado con gestoría antes de usar un informe para una declaracion o presentacion.

## Seguridad y privacidad

La autorizacion del chat se verifica en backend con `requireMarianManager`, no solo en la interfaz. El endpoint no acepta acciones de escritura, no conserva el historial en CMS y elimina de la respuesta las etiquetas internas de accion antes de mostrarlas a Marian. La pagina ONLY STAFF utiliza comprobaciones separadas de colaborador, cajero y administrador antes de cada operación protegida.
