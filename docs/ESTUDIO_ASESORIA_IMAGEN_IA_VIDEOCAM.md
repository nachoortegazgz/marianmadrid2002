# Estudio de integracion: asesoria de imagen con videocamara

**Fecha de consulta:** 26 de agosto de 2026.
**Alcance:** herramienta de asesoría estética para corte y color, con captura voluntaria de cámara y privacidad por defecto. No es un dispositivo ni un servicio de diagnóstico médico.

> Una cámara web convencional puede servir para guía de encuadre, visualización de color y recomendaciones de estilo. No aporta la resolución, iluminación ni validación clínica necesarias para diagnosticar el cuero cabelludo o indicar tratamientos.

## Conclusión ejecutiva

La integración recomendable se divide en dos experiencias separadas. La primera es un **espejo virtual local**, inmediato y sin persistencia de vídeo: solicita la cámara desde un componente HTML de Wix, ejecuta detección de un único rostro y una máscara de cabello en el dispositivo, y aplica colores o siluetas de referencia. La segunda, opcional, es una **simulación fotográfica generativa**: solo tras una aceptación explícita, toma una fotografía fija, permite elegir un estilo de un catálogo y la procesa en una infraestructura propia con GPU. No se recomienda intentar transferencia generativa de peinado en tiempo real dentro del runtime Wix.

| Capacidad | Primera version recomendada | Alternativa avanzada | Decisión |
|---|---|---|---|
| Activar cámara | `getUserMedia()` dentro de HtmlComponent con permiso `camera` | Aplicación externa aislada | Empezar dentro de HtmlComponent. |
| Encuadre y postura | MediaPipe Face Landmarker en navegador | Ninguna necesaria | Procesar localmente. |
| Máscara de cabello | ONNX de segmentación cabello/piel/ropa o face parsing, ejecutado localmente tras prueba de rendimiento | Servicio GPU para máscaras de mayor calidad | Probar primero el ONNX ligero. |
| Color virtual | Composición Canvas/WebGL sobre máscara capilar | Generación fotográfica controlada | Incluir en MVP, identificándolo como visualización. |
| Corte virtual | Siluetas 2D sobre rostro correctamente encuadrado | HairFastGAN o Stable-Hair sobre fotografía fija | MVP con siluetas; generación solo en fase posterior. |
| Diagnóstico capilar | Cuestionario de necesidades y aviso de derivación | Flujo clínico con tricoscopio, validación profesional y gobernanza sanitaria | No presentar diagnóstico desde webcam. |

## Compatibilidad Wix

Wix documenta que un `HtmlComponent` vive en un entorno aislado tipo iframe y que la comunicación con el código de página se realiza mediante `postMessage()` y `onMessage()`.[1] [2] Para mensajes salientes desde el iframe, Wix indica especificar el `targetOrigin` del sitio en vez de usar `"*"`, porque un comodín puede permitir intercepción.[2]

El componente debe configurarse con permiso de cámara en el editor, solicitar la cámara únicamente después de un gesto de la persona usuaria y detener todas las pistas de `MediaStream` al cerrar el probador o cambiar de página. El vídeo no debe enviarse a Velo, colecciones CMS, logs ni servicios de IA durante el modo espejo.

```mermaid
flowchart LR
    U[Cliente] --> C[Consentimiento y permiso de camara]
    C --> H[HtmlComponent aislado]
    H --> L[Procesamiento local: rostro y mascara]
    L --> V[Canvas: color o silueta]
    V --> R[Resultado efimero]
    R -->|Solo con accion guardar| P[Foto opt-in]
    P --> G[Servicio propio con GPU]
    G --> S[Simulacion fotografica]
    S --> B[Reserva Wix Bookings]
```

## Componentes open source evaluados

| Proyecto | Licencia y capacidad declarada | Adecuación | Limitación relevante |
|---|---|---|---|
| [MediaPipe](https://developers.google.com/edge/mediapipe/solutions/guide) | Código de ejemplo Apache-2.0; tareas web para detección facial, landmarks e image segmentation.[3] | Base del espejo local y control de encuadre. | La antigua Hair Segmentation fue sustituida por Image Segmenter; se requiere validar el modelo elegido.[3] [4] |
| [Skin-Clothes-Hair-Segmentation-using-SMP](https://github.com/Kazuhito00/Skin-Clothes-Hair-Segmentation-using-SMP) | MIT; modelos ONNX de tres clases: piel, ropa y cabello.[5] | Candidato ligero para máscara y recoloración en una prueba de concepto. | Proyecto experimental; advierte caídas de reconocimiento según fondo, ropa y tono de piel, y se entrenó con 452 imágenes.[5] |
| [face-parsing](https://github.com/yakhyo/face-parsing) | MIT; segmenta componentes faciales, incluido cabello, y publica pesos ONNX.[6] | Candidato de mayor precisión para foto fija o equipos potentes. | Sus modelos ONNX declarados pesan aproximadamente 43 MB y 82 MB; exige estrategia de descarga diferida y prueba en móvil.[6] |
| [HairFastGAN](https://github.com/AIRI-Institute/HairFastGAN) | MIT; transferencia de forma y color del cabello basada en imagen de referencia.[7] | Mejor opción de código abierto para simulación fotográfica de alta calidad. | Requiere Linux, GPU NVIDIA con CUDA y PyTorch; la inferencia publicada se referencia en V100, no en Wix.[7] |
| [Stable-Hair](https://github.com/Xiaojiu-z/Stable-Hair) | Apache-2.0; transferencia mediante difusión, con demo Gradio.[8] | Alternativa para laboratorio de calidad y posterior despliegue GPU. | Descarga modelos preentrenados y señala dependencia de fotos faciales recortadas y alineadas.[8] |

## Flujo recomendado de producto

La página debe llamarse **Asesor de Imagen** o **Probador virtual**, no "diagnóstico". Antes de abrir cámara, se muestran una explicación breve, la finalidad estética, el hecho de que el vídeo se procesa localmente en el modo espejo, una política de no conservación por defecto y un enlace a privacidad.

El componente muestra una guía de encuadre: una sola persona, rostro centrado, luz frontal uniforme, cabello visible y fondo simple. Con landmarks se mide únicamente la calidad de captura (orientación aproximada, presencia de rostro y estabilidad), sin inferir identidad, edad, género, etnia, emoción ni atributos sensibles. Tras una máscara de cabello de confianza suficiente, el cliente elige tono, intensidad y estilo. El resultado debe llevar la etiqueta "visualización orientativa; el resultado real depende de la base, historial y evaluación profesional" y un CTA de reserva que transmite solo la preferencia estética elegida.

Para corte, el MVP usa una biblioteca propia y licenciada de siluetas o referencias editoriales. La simulación generativa se presenta como opción de foto fija y procesa únicamente una imagen que el cliente decide enviar. Se descarta automáticamente tras la entrega salvo consentimiento separado para guardarla en una galería privada.

## Límite de salud capilar

La investigación clínica sobre IA capilar se apoya en tricoscopia, imágenes microscópicas o equipos de iluminación controlada; por ejemplo, una revisión describe información microestructural que aporta la tricoscopia y la necesidad de métodos complementarios para una evaluación completa.[9] Un estudio de descamación utilizó una cámara específica de 3840 x 2160, iluminación difusa, cruzada y UVA, junto a miles de imágenes anotadas por expertos.[10] Por ello, una webcam no debe diagnosticar alopecia, dermatitis, infección, caspa ni daño; la función responsable es reconocer señales de alerta declaradas por el cliente y recomendar consulta con dermatología cuando corresponda.

## Arquitectura técnica propuesta

| Capa | Responsabilidad | Datos tratados | Persistencia |
|---|---|---|---|
| Página Wix | Botón, consentimiento, CTA de reserva y manejo de mensajes | Preferencias de estilo, nunca vídeo | Solo preferencias con consentimiento. |
| HtmlComponent `#htmlImageAdvisor` | Cámara, canvas, MediaPipe, ONNX y renderizado local | Fotogramas y máscara efímeros en memoria | Ninguna. |
| Catálogo editorial | Tonos, cortes de referencia, advertencias y rutas de reserva | Metadatos no biométricos | CMS existente o archivo estático. |
| Servicio GPU opcional | Transferencia generativa sobre foto aceptada | Una imagen con token de corta duración | Borrado automático y sin entrenamiento. |
| Wix Bookings | Reserva posterior | Servicio elegido y nota voluntaria | Según contrato actual. |

La parte de GPU debe ser un servicio independiente y autoalojado; los modelos generativos evaluados requieren entornos Linux y GPU NVIDIA, mientras que el runtime Wix se usa para la interfaz, consentimiento y reserva. Esta separación conserva el motor de reservas existente, evita exponer secretos y permite que la primera experiencia funcione aun cuando el servicio generativo no esté disponible.

## Controles obligatorios

| Riesgo | Control de diseño |
|---|---|
| Activación accidental de cámara | Acción explícita `Activar cámara`; sin autoplay de captura. |
| Fuga de vídeo o foto | Procesamiento local por defecto; no enviar frames ni registrar base64. |
| Mensajería iframe insegura | Validar formato, tipo de mensaje y `targetOrigin` exacto; nunca `"*"`. |
| Suplantación de identidad | No generar ni almacenar descriptores faciales; limitar a una cara en encuadre. |
| Resultado cosmético engañoso | Etiqueta persistente de visualización orientativa; mostrar consulta profesional previa a coloración. |
| Reclamación de salud | Prohibir términos como diagnóstico, detección de enfermedad o prescripción en UI y marketing. |
| Sesgo de segmentación | Pruebas por tonos de piel, texturas, largos, colores, condiciones de luz y dispositivos. |
| Sobrecarga móvil | Cargar modelo bajo demanda, resolución adaptativa, límite de FPS y fallback a foto fija. |

## Hoja de ruta de cuatro semanas

| Semana | Entregable | Puerta de aceptación |
|---:|---|---|
| 1 | Prototipo HtmlComponent: permiso de cámara, Face Landmarker, guía de encuadre y cancelación segura. | Cámara se libera al cerrar; ningún frame sale del navegador. |
| 2 | Prueba de máscara ONNX y recoloración Canvas con cinco tonos. | Rendimiento y calidad aceptables en móvil y escritorio definidos por ensayo QA. |
| 3 | Catálogo de estilos, consentimiento, CTA de reserva y pruebas de accesibilidad. | Mensajería con origen fijado y sin PII en logs. |
| 4 | Piloto con clientes consentidos y matriz de fallos. | Aprobación de Marian; sin alegaciones médicas; registro de feedback. |

La simulación generativa debe empezar únicamente tras superar el piloto local y disponer de una infraestructura GPU, política de borrado, presupuesto de operación y una biblioteca de estilos con licencia confirmada.

## Referencias

[1] [Wix: Introducción al componente HTML](https://dev.wix.com/docs/velo/velo-only-apis/$w/html-component/introduction)
[2] [Wix: Mensajería entre página y elemento HTML](https://dev.wix.com/docs/velo/velo-only-apis/$w/html-component/messaging-between-a-site-page-and-an-html-element)
[3] [Google AI Edge: MediaPipe Solutions guide](https://developers.google.com/edge/mediapipe/solutions/guide)
[4] [MediaPipe: Hair Segmentation](https://github.com/google/mediapipe/blob/master/docs/solutions/hair_segmentation.md)
[5] [Kazuhito00: Skin-Clothes-Hair-Segmentation-using-SMP](https://github.com/Kazuhito00/Skin-Clothes-Hair-Segmentation-using-SMP)
[6] [yakhyo: face-parsing](https://github.com/yakhyo/face-parsing)
[7] [AIRI Institute: HairFastGAN](https://github.com/AIRI-Institute/HairFastGAN)
[8] [Xiaojiu-z: Stable-Hair](https://github.com/Xiaojiu-z/Stable-Hair)
[9] [Du et al., 2025: Non-invasive detection in scalp and hair diseases](https://pmc.ncbi.nlm.nih.gov/articles/PMC12050651/)
[10] [Flament et al., 2025: AI-based grading of scalp exfoliation from video imaging](https://pmc.ncbi.nlm.nih.gov/articles/PMC11975186/)
