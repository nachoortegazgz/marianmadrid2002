# Evidencia de configuración: panel Wix

**Fecha de revisión:** 27 de agosto de 2026
**Entorno:** panel administrativo del sitio Marian Madrid
**Método:** observación de solo lectura, sin modificación de configuración.

## Hallazgos iniciales

| Área | Estado observado | Implicación operativa |
| --- | --- | --- |
| Sitio y dominio | El dominio público `marianmadrid.es` está asociado al sitio. | Permite continuar la revisión del recorrido público y de las políticas de dominio. |
| Plan | El panel muestra plan Core. | Deben verificarse las capacidades necesarias de Bookings, pagos, CMS y trabajos programados antes de activar automatizaciones adicionales. |
| Correo empresarial | No se muestra correo empresarial conectado. | Es recomendable configurar un remitente profesional antes de activar notificaciones transaccionales de clientes. |
| Reservas | El panel registra actividad histórica de reservas y ocupación. | Se requiere comprobar los servicios, recursos, pagos y políticas de agenda en Wix Bookings. |
| Pagos y ventas recientes | El panel no muestra pagos ni ventas concluidos en el periodo visualizado. | Deben revisarse los métodos de pago, la conexión de proveedor y el flujo de pago de reserva. |
| Formularios y contacto | El sitio recibe actividad de formularios y clics de contacto. | Es necesario validar el destino de notificaciones y la experiencia de respuesta. |
| Aplicaciones disponibles | El panel expone Bookings, pagos, ventas, catálogo, aplicaciones, marketing, bandeja, clientes, analíticas y automatizaciones. | La auditoría se centrará en las superficies que afectan a reservas, cobro, atención y registros externos. |

## Siguiente validación administrativa

La revisión continuará, por este orden, en Wix Bookings, pagos, catálogo/servicios, automatizaciones, permisos de CMS y remite de comunicaciones. Cada ajuste se contrastará con el contrato versionado antes de modificarlo.

## Calendario de reservas

El calendario administrativo carga servicios de múltiples categorías, incluidas fases `F2` para servicios duales, y muestra asignaciones de personal. También presenta eventos de prueba o QA junto a actividad real, lo que confirma la necesidad de separar el catálogo operativo publicado de los datos de validación antes de hacer pruebas públicas.

| Verificación | Resultado observado | Acción de configuración |
| --- | --- | --- |
| Servicios base y fases F2 | Ambos aparecen en el selector del calendario. | Confirmar que las fases F2 no sean reservables como servicio independiente y que solo formen parte de una reserva dual. |
| Personal asignado | Hay recursos de personal asociados a eventos. | Contrastar cada recurso con la colección privada `MAPA_STAFF` y con `SERVICIOS_CITA.personalDisponible`. |
| Agenda | El calendario contiene actividad y bloqueos. | Conservar los bloqueos existentes; las pruebas funcionales deben usar un recurso, fecha y ventana de QA aislados. |
| Catálogo QA | Hay elementos identificados como QA. | Ocultarlos de la reserva pública y retirarlos al cerrar la validación, sin borrar registros transaccionales. |
| Recordatorios y conexión de calendarios | El panel ofrece estas capacidades, sin confirmar aún su activación. | Revisar políticas de aviso, consentimiento y calendarios externos en la configuración de Bookings. |

## Ajustes disponibles de Wix Bookings

El panel confirma que Bookings expone por separado horas predeterminadas, complementos, personal, recursos, ubicaciones, notificaciones, propinas, flujo online, formulario, políticas e integraciones. Esta separación es compatible con el principio de fuente de verdad: el CMS puede gobernar los campos comerciales sincronizables mientras que Bookings mantiene la agenda, recursos, políticas nativas, formularios y el historial de reservas.

| Ajuste de Bookings | Fuente o propietario recomendado | Criterio de verificación |
| --- | --- | --- |
| Datos comerciales y disponibilidad del servicio | `SERVICIOS_CITA`, con proyección controlada al servicio nativo. | Debe coincidir con el mapeo `MAPA_SERVICIOS_CITA_WIX_BOOKINGS.md`. |
| Complementos | `EXTRAS_CATALOGO`, si son compatibles con el catálogo nativo. | Solo complementos activos y comercializables se muestran online. |
| Personal y recursos | `MAPA_STAFF` y configuración nativa de horarios/recursos. | Cada referencia CMS resuelve un recurso nativo activo y con agenda. |
| Flujo, formulario y políticas | Wix Bookings. | Deben ser breves, coherentes y no duplicar formularios ni requisitos de pago. |
| Notificaciones | Wix Bookings. | Debe existir confirmación, recordatorio y aviso interno sin datos sensibles adicionales. |
| Pagos, propinas e integraciones | Aplicaciones nativas de Wix. | El pago final debe disparar un único movimiento interno idempotente. |

La página de ajustes confirma que los ámbitos críticos están disponibles de forma separada y navegable. Hasta este punto no se han guardado cambios en el panel; la siguiente inspección será estrictamente de lectura de las horas predeterminadas y, después, de personal, políticas y notificaciones.

## Disponibilidad predeterminada

La disponibilidad base de Bookings está configurada de lunes a viernes, de **09:00 a 20:00**, y sábado y domingo sin disponibilidad. Bookings declara que esta franja se aplica al personal y a los recursos salvo que tengan un horario propio.

| Aspecto | Estado observado | Decisión |
| --- | --- | --- |
| Lunes a viernes | Disponibles de 09:00 a 20:00. | Mantener sin cambios hasta contrastar los horarios particulares del personal y los horarios comerciales reales. |
| Sábado y domingo | No disponibles. | No habilitar sin una decisión de negocio explícita y capacidad de personal confirmada. |
| Horario particular | El panel permite personalizarlo por perfil. | Verificar que cada miembro de `MAPA_STAFF` tiene disponibilidad coherente antes de habilitar cualquier servicio. |

No se modificó ni guardó ningún horario durante la observación.

## Personal de Bookings

El panel contiene **tres miembros de personal activos**, todos con permisos de reservas. Los datos de contacto se observaron solo para la comprobación visual y no se incorporan a esta evidencia. Antes de publicar cambios de servicios, debe verificarse que cada miembro tenga un recurso Bookings, horario particular y correo de notificaciones propio y confirmado.

| Control | Estado | Riesgo que evita |
| --- | --- | --- |
| Miembros de Bookings | Tres activos con permisos de reservas. | Que un servicio apunte a un recurso inexistente. |
| `MAPA_STAFF` | Debe contener una correspondencia uno a uno solo con los recursos activos requeridos. | Mostrar personal no disponible u obsoleto al cliente. |
| Horarios por perfil | Aún no verificados en cada perfil. | Ofrecer citas fuera de la disponibilidad efectiva. |
| Datos de contacto | No consolidados en código ni documentación. | Exposición innecesaria de PII. |

## Perfil y asignaciones del recurso principal

El perfil del recurso principal de Bookings confirma permisos de reservas, posibilidad de sincronizar calendarios personales, configuración individual de videoconferencia, horario de trabajo propio y una lista amplia de servicios asignados. Esta amplitud exige que `SERVICIOS_CITA.personalDisponible` sea la selección de autoridad y que la proyección a Bookings no reintroduzca asignaciones manuales obsoletas.

| Control | Resultado observado | Medida |
| --- | --- | --- |
| Permiso de reservas | Concedido al recurso principal. | Mantener bajo la política de mínimo privilegio actual. |
| Agenda y disponibilidad | Existe un horario de trabajo específico configurable. | Confirmar sus franjas antes de habilitar cambios de disponibilidad global. |
| Servicios asignados | El recurso tiene numerosas asignaciones. | No editar masivamente desde el panel; usar la cola de sincronización y el mapeo CMS. |
| Calendario personal y videoconferencia | Configurables, no confirmados como activos. | Habilitarlos solo para servicios que los necesiten y con consentimiento del recurso. |

La ficha individual confirma que la configuración de horario de trabajo se gestiona desde un apartado distinto de los datos de contacto. La inspección de este perfil sigue siendo de solo lectura y no se ha modificado ni guardado ningún dato.

La ficha permaneció sin cambios tras confirmar que el recurso principal dispone de permiso de agenda y de un bloque específico para horario, ubicaciones y citas asignadas. La información de contacto que muestra el panel no se copia a esta evidencia; cualquier ajuste de personal seguirá dependiendo de la correspondencia mínima y privada en `MapaStaff`.

## Agenda efectiva por recurso

En la semana visible, los tres recursos de Bookings muestran la misma disponibilidad individual: de lunes a viernes, de **09:00 a 20:00**; el sábado, de **08:30 a 14:30**; y sin franja publicada el domingo. Esto prevalece sobre la disponibilidad predeterminada previamente observada, que no incluía fin de semana. No se ha modificado la agenda.

| Control | Resultado observado | Decisión de configuración |
| --- | --- | --- |
| Recursos activos | Tres filas de agenda, correspondientes a los tres miembros activos. | Mantener las tres correspondencias privadas en `MapaStaff`; no crear sustituciones implícitas. |
| Lunes a viernes | 09:00–20:00 para la semana visible. | Base compatible con reservas online, sujeta a capacidad real y bloqueos existentes. |
| Sábado | 08:30–14:30 para la semana visible. | Reconocerlo como disponibilidad efectiva al configurar servicios; no tratarlo como horario cerrado. |
| Domingo | Sin disponibilidad visible. | Conservar cierre hasta decisión expresa de negocio y personal confirmado. |
| Fuente de servicio | El calendario lista servicios, pero no prueba su publicación pública. | Aislar los servicios F2 y QA antes de realizar reservas de prueba. |

## Catálogo de servicios nativo

El catálogo nativo muestra **93** servicios de reserva. En la vista revisada, las fases `F2-` se muestran como citas gratuitas, tienen personal asignado y aparecen con el indicador visual de servicio oculto; los servicios comerciales homónimos tienen precio y no muestran dicho indicador. Esto es coherente con el diseño de reservas duales: la fase no puede ser un producto reservable autónomo.

| Control | Resultado observado | Decisión |
| --- | --- | --- |
| Volumen de catálogo | 93 servicios nativos. | No efectuar limpieza masiva ni borrados; cada cambio debe ser trazable y reversible. |
| Servicios comerciales | Disponibles con precio definido, ubicación y personal asociados. | Seguir sincronizándolos desde `SERVICIOS_CITA` mediante la cola idempotente. |
| Fases `F2-` | Gratuitas, con personal asignado y visualmente ocultas en la lista. | Mantenerlas ocultas y excluidas de enlaces de reserva individuales. |
| Campos extendidos | La tabla expone duración de fase e identificadores de correspondencia en parte del catálogo. | Conservar los identificadores actuales; no renombrar IDs técnicos. |
| Datos de prueba | La búsqueda `QA` no devuelve servicios por ese marcador en el catálogo nativo. | Continuar comprobando nombres alternativos de prueba, sin eliminar por inferencia. |

La búsqueda `Prueba` devuelve cuatro servicios comerciales de la categoría de bodas, incluidas pruebas nupciales y paquetes que las incluyen. No se clasifican como datos de QA y no deben ocultarse ni eliminarse. La búsqueda técnica alternativa `test` tampoco devuelve coincidencias. Con la evidencia disponible, no hay servicios con marcadores `QA` o `test` que exijan una limpieza de publicación.

## Cobertura de ajustes nativos de Bookings

La configuración de Bookings separa disponibilidad, complementos, personal, recursos, ubicaciones, notificaciones, propinas, flujo online, formulario, políticas e integraciones. Esta separación confirma que la sincronización desde CMS debe limitarse al catálogo y sus asignaciones, sin intentar sustituir controles nativos de agenda, consentimiento, comunicación o gestión de reservas.

| Área | Propietario recomendado | Estado de auditoría |
| --- | --- | --- |
| Disponibilidad, personal y recursos | Bookings, con referencias privadas de `MapaStaff`. | Disponibilidad individual revisada; el inventario de recursos y salas está vacío. |
| Complementos | `EXTRAS_CATALOGO` cuando corresponda y Bookings para su ejecución. | El catálogo nativo contiene 72 complementos y requiere normalización controlada. |
| Notificaciones y formulario | Bookings. | Existe un único formulario predeterminado, conectado al catálogo completo; campos pendientes de inspección antes de modificar. |
| Flujo y políticas de reserva | Bookings. | Pendiente comprobar anticipación, cancelación y reprogramación. |
| Pagos, propinas e integraciones | Wix Payments/Bookings; ledger interno como fuente de verdad. | Pendiente comprobar método, entorno de prueba e idempotencia. |

La navegación confirma que el flujo online, el formulario y las políticas son controles independientes del catálogo. La pantalla de resumen no ha modificado la configuración; la auditoría continuará por cada control individual, evitando cambios globales sin evidencia suficiente. La ruta directa tentativa de políticas vuelve al resumen, por lo que se identificará la ruta interna actual antes de inspeccionar o editar reglas; el resumen no expone todos sus elementos en el área visible.

## Criterios funcionales confirmados

La documentación de Wix confirma que los intervalos de reserva **basados en la duración del servicio** aprovechan mejor los huecos de agenda que los intervalos fijos, por lo que es el modo coherente con el requisito de aceptar un servicio simple en el hueco generado por una reserva dual. Wix también permite al cliente combinar hasta cinco servicios de cita en una reserva múltiple, pero sus restricciones y formularios deben evaluarse de forma explícita: el flujo usa la regla más restrictiva de los servicios elegidos y una reserva múltiple utiliza el formulario de cita predeterminado. Por ello, la política general y el formulario predeterminado deben mantenerse breves y sin campos no esenciales.

| Decisión | Fundamento | Salvaguarda |
| --- | --- | --- |
| Intervalos por duración | Wix informa de que maximizan las reservas y recuperan huecos disponibles. | Validar el hueco de exposición con un servicio QA aislado antes de aplicarlo a cambios de catálogo. |
| Flujo múltiple nativo | Wix admite varias citas en una sola reserva, con un máximo de cinco. | Mantener las fases F2 ocultas y aplicar la lógica dual propia sin vender la fase como producto independiente. |
| Política de reservas | La regla más restrictiva de los servicios elegidos se aplica al conjunto. | Evitar políticas contradictorias entre servicios que puedan combinarse. |
| Formulario predeterminado | Las reservas múltiples usan el formulario predeterminado, incluso si existen formularios por servicio. | Solicitar solo datos operativos imprescindibles y evitar campos sensibles innecesarios. |

**Fuentes:** [Políticas de reservas de Wix](https://support.wix.com/en/article/wix-bookings-setting-up-your-booking-policies), [intervalos de cita](https://support.wix.com/en/article/wix-bookings-changing-time-slots-for-appointments), [reservas con varios servicios](https://support.wix.com/en/article/wix-bookings-scheduling-and-managing-multi-service-appointments) y [formularios de reserva](https://support.wix.com/en/article/wix-bookings-creating-and-setting-up-your-booking-forms).

## Formulario predeterminado

La configuración real contiene **un único formulario predeterminado**, conectado a todos los servicios del catálogo. Esta estructura simplifica la experiencia, pero implica que cualquier campo añadido o editado puede afectar a todos los servicios y, según Wix, también a registros pasados que reutilizan el mismo campo. El menú del formulario confirma las acciones de editar campos, duplicar y administrar los servicios conectados.

La inspección del editor identifica nombre, apellido, correo, teléfono con prefijo y un campo abierto de notas, además del bloque de dirección del cliente. La configuración nativa aclara que este último bloque **solo se muestra online cuando el servicio está configurado con ubicación en el cliente** y no puede eliminarse. Por tanto, no añade fricción a las citas en el establecimiento y preserva la posibilidad de servicios a domicilio sin duplicar formularios. No se ha guardado ningún cambio en el formulario; la ruta de políticas será revisada como un control separado.

## Recursos y salas

El inventario nativo de recursos y salas no contiene grupos ni ítems. No se crearán recursos artificiales: para las citas actuales, la capacidad proviene del personal y de sus agendas. Si un servicio dual o futuro requiere una estación, sala o equipo exclusivo, deberá añadirse como recurso identificable y asignarse desde `SERVICIOS_CITA`; hasta entonces, mantener el inventario vacío reduce errores de bloqueo y mantenimiento. La auditoría de recursos y formularios ha concluido sin guardar cambios administrativos.

## Catálogo de servicios

La colección `SERVICIOS` corresponde al ID técnico `Import2` y contiene 93 ítems. La inspección de los campos visibles confirma la estructura comercial esperada (`slugUrl`, `oculto`, categoría, `tituloServicio`, `serviceId`, `permitirCombinar` y `linkFases`). Las fases técnicas con prefijo `F2-` que se observaron están marcadas como ocultas; esta configuración evita que se reserven de forma independiente y preserva la operación dual desde su servicio principal. El servicio de prueba nupcial hallado se presenta como oferta comercial, no como un artefacto de QA. No se modificó ningún servicio durante la lectura.

## Complementos

El catálogo nativo contiene **72 complementos**. La evidencia visual revela duplicidades semánticas y variantes de capitalización, así como precios muy pequeños (por ejemplo, `0,05 €`, `0,12 €` y `0,15 €`) junto a equivalentes con precios enteros o cero. También hay diferencias de duración entre variantes aparentemente equivalentes. Este patrón puede confundir al cliente, degradar la cesta y dificultar el mantenimiento de servicios duales.

No se eliminará ni modificará ningún complemento todavía. Primero se contrastará el inventario con `EXTRAS_CATALOGO`, las asignaciones efectivas a servicios y los pedidos existentes. Después se preparará una normalización reversible: conservar un único complemento canónico por concepto, desactivar o desconectar los duplicados, y corregir precios únicamente cuando su valor comercial esté documentado en CMS.

## Inventario CMS previo

La lista de CMS muestra **53 colecciones**. La colección visible de servicios tiene 93 ítems y la colección visible de complementos tiene 36 ítems, frente a los 72 complementos del catálogo nativo. Esto confirma que el CMS puede servir como inventario canónico, pero la normalización de complementos exige mapear las asignaciones nativas antes de tocar registros. La colección visible, publicada para mostrar contenido, se ha renombrado correctamente a `EXTRAS_CATALOGO`, conserva los 36 ítems y mantiene su ID técnico `AddonsCatalogo`. No se modificaron registros, permisos ni estados de publicación.

| Colección visible | Ítems | Permisos observados | Lectura operativa |
| --- | ---: | --- | --- |
| Servicios | 93 | Mostrar contenido | La colección técnica confirmada es `Import2`; está vinculada a una relación y es la fuente comercial de verdad. |
| EXTRAS_CATALOGO | 36 | Mostrar contenido | Nombre visible ya corregido; conserva el ID técnico `AddonsCatalogo`. |
| SYNC_M365 | 1 | Avanzados | Existe una colección de sincronización previa; se verificará su identidad y compatibilidad antes de crear otra cola. |
| BookingsServiceSyncQueue | Creada, sin ítems | Privado; índices activos | Doce campos de contrato y tres índices de consulta/idempotencia activos. |
| M365GraphSyncQueue | Creada, sin ítems | Solo administradores; índices activos | Trece campos de contrato y tres índices de consulta/idempotencia activos. |

La búsqueda CMS confirma `MAPA_STAFF` con **tres** registros y permisos avanzados. Es una correspondencia de volumen coherente con los tres miembros de Bookings activos; se preservará como colección privada. La comprobación de conexiones confirma que no está vinculada a ninguna página del sitio, lo que evita su exposición pública. Los ajustes confirman que el nombre visible es `MAPA_STAFF` y su ID técnico es `MapaStaff`, exactamente el que usa el adaptador backend. La política seleccionada es avanzada; la vista no muestra permisos concedidos a todos, miembros, creadores de ítems ni colaboradores. No se ha modificado ni guardado la política.

Las búsquedas iniciales de las colas `BookingsServiceSyncQueue` y `M365GraphSyncQueue` no devolvían colecciones. Se creó `BookingsServiceSyncQueue` como colección de varios ítems, vacía y con el ID técnico exacto que usa el backend. Sus doce campos de contrato (`serviceId`, `sourceItemId`, `desiredHash`, `status`, `attempts`, `nextAttemptAt`, `traceId`, `errorCode`, `createdAt`, `updatedAt`, `completedAt` y `failedAt`) quedaron creados; los índices `statusNextAttemptAt`, `serviceId` y `sourceItemIdUnique` están activos y sin fallos. Wix aceptó parte de las altas paralelas y devolvió un conflicto de versión para otras; estas se completaron después **secuencialmente**, sin repetir ni alterar los campos ya persistidos. Sus permisos se restringieron a `PRIVILEGED` para lectura, inserción, actualización y eliminación, compatible con el acceso backend elevado verificado. La vista CMS confirma visualmente los doce campos de contrato, sin ítems insertados.

También se creó `M365GraphSyncQueue`, vacía, con los trece campos de contrato para una proyección mínima del ledger y con permisos solo administrativos para las cuatro operaciones. Sus índices `statusNextAttemptAt`, `payloadHashUnique` y `traceId` se verificaron como activos y sin fallos. Los tres índices de `BookingsServiceSyncQueue` también están activos. Ninguna cola está conectada a páginas, contiene ítems, ni habilita acceso público.
| CITAS, MOVIMIENTOS_CAJA, bloqueos y compensaciones | 0 en la vista | Avanzados | Estructura disponible, sin datos visibles de producción en esta vista. |
| MAPA_STAFF | 3 | Avanzados | Existe con tres correspondencias privadas, alineadas en volumen con los tres recursos activos de Bookings. |

## Publicación y comprobación pública posterior

El commit `77f1ecf` se publicó en la rama principal y se desplegó desde la fuente remota en Wix. La sincronización de tipos del proyecto se completó tras una incidencia de red transitoria; el análisis estático, la revisión de sanitización y todas las simulaciones de reservas, pagos, devoluciones y administración terminaron correctamente antes de la publicación.

La ruta pública `/reserva-online` responde correctamente y muestra categorías, fichas de servicio, precios y enlaces de reserva para servicios operativos. Esto confirma que el catálogo de reservas es accesible al cliente. La página de inicio conserva un bloque nativo que muestra el mensaje «Nada que reservar ahora» pese a que la ruta de catálogo sí está operativa; queda identificado como una incidencia de presentación y conversión que se corregirá sin modificar la lógica transaccional ni los servicios activos.

| Verificación posterior | Resultado | Estado |
| --- | --- | --- |
| Publicación desde `origin/main` | Despliegue completado por Wix | Correcto |
| Catálogo de reserva público | Servicios y enlaces de reserva visibles en `/reserva-online` | Correcto |
| Bloque de reservas de la página de inicio | Muestra una indisponibilidad contradictoria | Pendiente de corrección de UX |
| Colas CMS privadas | Vacías, sin acceso público e indexadas | Correcto |
| Prueba real de reserva y proyección M365 | Requiere crear un servicio y franja aislados, y configurar los secretos externos | Pendiente de QA controlada |
