# Configuracion del Panel de Gestion Marian

## Alcance

El panel reemplaza el contenido del componente HTML con ID **`#htmlOnlyStaff`** de la pagina **Only Staff**. Mantiene el estilo visual del panel interno existente y centraliza consulta de caja, preparacion fiscal, libro registro, inventario y una conversacion privada con asistente IA.

> El panel no publica el sitio, no envia documentos a gestoría y no presenta declaraciones. Los procesos que crean registros de caja conservan la confirmacion explicita del formulario.

| Recurso | Ubicacion en el repositorio | Uso |
|---|---|---|
| Widget HTML completo | `docs/WIDGET_PANEL_GESTION_MARIAN.html` | Copiar integramente en el componente HTML `#htmlOnlyStaff` o `#htmlAdministracion`. |
| Controlador compartido | `src/public/marianAdministrationController.js` | Autorizacion de Marian y operaciones del panel, sin duplicar logica. |
| Frontend Velo legacy | `src/pages/ONLY STAFF.mvf3f.js` | Mantiene la pagina Only Staff con `#htmlOnlyStaff`. |
| Frontend Velo principal | `src/pages/ADMINISTRACION.mvf3f.js` | Nueva pagina ADMINISTRACION con `#htmlAdministracion`. |
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
2. En la pagina ADMINISTRACION, inserta un componente HTML con ID `#htmlAdministracion` y copia en el su contenido completo de `WIDGET_PANEL_GESTION_MARIAN.html`. La pagina Only Staff puede conservar el componente legacy `#htmlOnlyStaff`.
3. Configura `MARIAN_ASSISTANT_OPENAI_KEY` en Wix Secrets Manager.
4. Abre Local Editor y prueba consultas no destructivas: "actualiza la caja", "prepara el resumen fiscal" y "carga el libro registro".
5. Revisa el resultado con gestoría antes de usar un informe para una declaracion o presentacion.

## Seguridad y privacidad

La autorizacion del chat se verifica en backend con `requireMarianManager`, no solo en la interfaz. El endpoint no acepta acciones de escritura, no conserva el historial en CMS y elimina de la respuesta las etiquetas internas de accion antes de mostrarlas a Marian.
