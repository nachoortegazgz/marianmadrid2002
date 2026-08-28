# Anexo — identificadores y constantes canónicas

**Fuente:** `src/backend/internalConfig.js` tras la consolidación de IDs canónicos y contexto de sitio consultado en Wix el 28 de agosto de 2026. No contiene secretos, tokens, contraseñas ni datos de clientes.

## Contexto de sitio y aplicaciones

| Elemento | Identificador / valor | Definición |
|---|---|---|
| Sitio Wix | `188bed94-177c-4bc9-a9f0-35080d874f3e` | Instancia publicada de Marian Madrid Peluquería y Estética. |
| UI local Wix | `14544` | Versión de interfaz declarada en `wix.config.json`; no confirma paridad visual con cambios directos del Editor. |
| Ubicación Bookings | `7a12abfd-bf30-4847-bcdf-00dc573d4802` | Ubicación de negocio usada en slots y escrituras Bookings. |
| Tipo de recurso staff | `1cd44cf8-756f-41c3-bd90-3e2ffcaf1155` | Tipo de recurso que identifica profesionales asignables. |
| Recurso de gestión Marian | `e556070a-6d6a-402e-8422-11133033ea76` | Identificador de recurso usado como control de administración de Marian. |
| Wix Bookings | `13d21c63-b5ec-5912-8397-c3a5ddb27a97` | App instalada; coincide con `APP_IDS.BOOKINGS`. |
| Wix Stores instalado | `215238eb-22a5-4c36-9e7b-e7c08025e04e` | App observada en el contexto Wix; catálogo V1. |
| Wix Forms & Payments | `14ce1214-b278-a7e4-1373-00cebd1bef7c` | App instalada observada. |
| Wix Invoices | `13ee94c1-b635-8505-3391-97919052c16f` | App instalada observada. |
| Wix Members Area | `14cc59bc-f0b7-15b8-e1c7-89ce41d0e0c9` | App instalada observada. |
| Wix Gift Cards | `d80111c5-a0f4-47a8-b63a-65b54d774a27` | App instalada observada. |
| Wix Blog | `14bcded7-0066-7c35-14d7-466cb3f09103` | App instalada observada. |
| Promote SEO | `1480c568-5cbd-9392-5604-1148f5faffa0` | App instalada observada. |

## Mapa de constantes de colecciones

| Clave en código | ID físico CMS | Estado y definición |
|---|---|---|
| `SERVICIOS_CITA` | `Import2` | Fuente comercial de servicios y fases de cita. |
| `EXTRAS_CATALOGO` | `AddonsCatalogo` | Clave canónica del catálogo visible de addons. |
| `MAPA_STAFF` | `MapaStaff` | Directorio privado de personal y recursos Bookings. |
| `DUAL_CACHE` | `DualSlotCache` | Caché de parejas de slots duales certificadas. |
| `DAYS_CACHE` | `AvailabilityDaysCache` | Caché mensual de días disponibles. |
| `SLOTS_CACHE` | `AvailabilitySlotsCache` | Caché de slots de disponibilidad. |
| `CITAS` | `CitasF2` | Proyección durable de reservas creadas por la saga Velo. |
| `TRANSACTIONS` | `BookingTransactions` | Idempotencia y resultado por `pairToken`. |
| `LOCKS` | `MM_LOCKS` | Mutex distribuido temporal de slots y ledger. |
| `COMPENSATIONS` | `PendingCompensations` | Operaciones de recuperación pendientes. |
| `BOOKINGS_SERVICE_SYNC_QUEUE` | `BookingsServiceSyncQueue` | Cola de sincronización de servicio comercial hacia Bookings. |
| `M365_GRAPH_SYNC_QUEUE` | `M365GraphSyncQueue` | Cola preparada para Fase 2; no debe procesarse mientras M365 esté deshabilitado. |
| `MOVIMIENTOS_CAJA` | `movimientoCaja` | Ledger inmutable de caja y evidencia operativa. |
| `CAJA_ACTUAL` | `cajaActual` | Resumen operativo actual de caja. |
| `HISTORICO_CIERRES_Z` | `HISTORICO_CIERRES_Z` | Cierres diarios con hash, firma y totales. |
| `CONTEOS_X` | `RESUMEN_CONTEO_X` | Arqueos X y descuadres. |
| `CONTADORES_FISCALES` | `SecuenciaTickets` | Contadores de secuencia de tickets. |
| `REGISTRO_HORARIO` | `REGISTRO_HORARIO` | Fichajes, pausas y ajustes de jornada. |
| `PRODUCTOS_VENTA` | `InventarioProductos` | Clave canónica del inventario cuyo nombre visible es `PRODUCTOS_VENTA`. |
| `MOVIMIENTO_INVENTARIO` | `movimientoInventario` | Movimientos de stock, consumo, recepción y eventos online. |
| `CONCILIACION_STOCK_WIX` | `ConciliacionStockWix` | Cola/estado de conciliación con Wix Stores. |
| `AUDIT_LOG` | `MM_AUDIT_LOG` | Bitácora técnica y operativa. |
| `SYNC_LOG` | `m365SyncLog` | Log de integración externa, actualmente inactivo. |
| `CONFIGURACION_FISCAL` | `CONFIGURACION_FISCAL` | Parámetros de entidad emisora y régimen, solo administración. |
| `PLAN_CUENTAS_CONTABLES` | `PLAN_CUENTAS_CONTABLES` | Plan de cuentas y mapeos contables. |
| `ASIENTOS_CONTABLES` | `ASIENTOS_CONTABLES` | Cabecera de asiento interno trazable. |
| `LINEAS_ASIENTO_CONTABLE` | `LINEAS_ASIENTO_CONTABLE` | Líneas debe/haber de asiento. |
| `LIBRO_IVA_FACTURAS_EXPEDIDAS` | `LIBRO_IVA_FACTURAS_EXPEDIDAS` | Libro de apoyo de ventas/facturas emitidas. |
| `LIBRO_IVA_FACTURAS_RECIBIDAS` | `LIBRO_IVA_FACTURAS_RECIBIDAS` | Libro de apoyo de facturas recibidas. |
| `LIBRO_IVA_BIENES_INVERSION` | `LIBRO_IVA_BIENES_INVERSION` | Control de bienes de inversión. |
| `LIBRO_IVA_INTRACOMUNITARIO` | `LIBRO_IVA_INTRACOMUNITARIO` | Control de operaciones intracomunitarias. |
| `MAYOR_CONTABLE_SALDOS` | `MAYOR_CONTABLE_SALDOS` | Saldos de mayor calculados. |
| `LIBRO_INVENTARIO_CIERRE` | `LIBRO_INVENTARIO_CIERRE` | Existencias de cierre de ejercicio. |
| `EVENTOS_SISTEMA_FACTURACION` | `EVENTOS_SISTEMA_FACTURACION` | Evidencia de eventos técnicos del sistema de facturación. |

## Límites, caché, concurrencia y Jobs

| Grupo | Constante | Valor | Definición |
|---|---|---:|---|
| Catálogo | `CURRENCY` | `EUR` | Moneda comercial esperada. |
| Catálogo | `MAX_TITLE_LENGTH` / `MAX_SUMMARY_LENGTH` | 160 / 120 | Límites de título y resumen. |
| Catálogo | `MAX_DESCRIPTION_LENGTH` | 6.000 | Límite de descripción de servicio. |
| Catálogo | `MAX_DURATION_MINUTES` | 1.440 | Duración máxima por servicio. |
| API/CMS | `API_MS` / `CMS_MS` | 15.000 ms | Timeout de llamadas de negocio. |
| Jobs/webhooks | `WATCHDOG_MS` / `WEBHOOK_MS` | 30.000 ms | Límite de procesamiento de Job/evento. |
| Caché | Servicios / slots / dual / staff | 600.000 / 120.000 / 900.000 / 300.000 ms | TTL de respuesta y candidatos de disponibilidad. |
| Caché | `MAX_ENTRIES` | 100 | Límite de entradas de caché. |
| Rate limit público | General | 20 solicitudes / 5 s | Protección de fachada general. |
| Rate limit de reserva | Reserva | 5 solicitudes / 10 s | Reduce doble intento y abuso. |
| Disponibilidad | Solicitante / global | 12 / 120 solicitudes / 5 s | Cuota separada de disponibilidad. |
| Búsqueda de slots | `DIAS_LIMITE` / `TOLERANCE_MINUTES` | 14 / 10 | Horizonte y tolerancia de encaje. |
| Locks | `MUTEX_TTL_MS` / `HEARTBEAT_MS` | 120.000 / 15.000 ms | Reserva temporal de recursos y renovación. |
| Locks | `LOCK_CLEANUP_GRACE_MS` | 60.000 ms | Margen antes de limpiar locks vencidos. |
| Transacción | `TRANSACTION_POLL_BASE_MS` / máximo | 250 / 3.000 ms | Lectura breve tras conflicto de idempotencia. |
| Ledger | `LEDGER_MUTEX_TTL_MS` | 45.000 ms | Ordena escrituras de cadena de hash. |
| Compensación | `MAX_COMPENSATION_RETRIES` | 3 | Límite de recuperación automática. |
| Jobs | Retención de auditoría | 90 días | Horizonte técnico de limpieza de log. |
| Jobs | Lotes Bookings / M365 | 10 / 20 | Tamaño máximo de cada lote. |
| Jobs | Reintentos de colas | 3 | Máximo de intentos de sincronización. |
| Jobs | Backoff de colas | 300.000 ms | Espera entre reintentos de cola. |
| HTTP externo | Deriva máxima HMAC | 60 s | Tolerancia de reloj para firmas externas. |
| Documento | Adjunto máximo | 3 MiB | Límite de adjunto de correo de gestoría. |
| Documento | Intentos de envío | 3 | Máximo del envío manual idempotente. |
| M365 | `ENABLED` | `false` | Bloqueo explícito de Fase 2. |

## Estados, roles y clasificación

| Categoría | Valores |
|---|---|
| Estado de cita | `CONFIRMED`, `PENDING_PAYMENT`, `CANCELED`, `REFUNDED` |
| Estado de pago interno | `UNPAID`, `PENDING_PAYMENT`, `PENDING_LEDGER`, `PAID`, `REFUNDED`, `PARTIALLY_REFUNDED` |
| Tipo de movimiento | `VENTA_EFECTIVO`, `VENTA_TARJETA`, `VENTA_BIZUM`, `VENTA_ONLINE`, `PROPINA`, `REEMBOLSO`, `AJUSTE` |
| Forma de pago | `EFECTIVO`, `TARJETA`, `BIZUM`, `ONLINE` |
| Estado de caja | `ABIERTA`, `CERRADA` |
| Tipos de fichaje | `ENTRADA`, `SALIDA`, `PAUSA_INICIO`, `PAUSA_FIN`, `AJUSTE` |
| Roles colaboradores | `ADMIN`, `GESTION`, `ESTILISTA` |
| IVA técnico general | `0,21` |
| Singleton de caja | `CAJA_PRINCIPAL` |
| JWT | `HS256`, expiración 1.800.000 ms (30 min) |

## Dependencias y comandos

| Categoría | Elementos |
|---|---|
| Dependencias Wix | `@wix/bookings`, `wix-web-module`, `wix-data`, `wix-location`, `wix-http-functions`, `wix-ecom-backend`, `wix-members-backend`, `wix-auth`, `wix-members-frontend`, `wix-window-frontend`, `wix-secrets-backend`. |
| Desarrollo | `@wix/cli`, `eslint 8.57.1`, `react 16.14.0`. |
| Validación total | `npm run validate` ejecuta `sync:types` y toda la batería `npm test`. |
| Sanitización | `npm run test:sanitization`; obligatorio tras cualquier cambio de código. |
| Estilo | `npm run lint`. |
| Desarrollo Wix | `npm run dev`. |

## Referencia

[1]: https://dev.wix.com/docs/api-reference/business-solutions/cms/collection-management/data-collections/list-data-collections "Wix CMS — List Data Collections"
