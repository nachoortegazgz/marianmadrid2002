# Resultado de comprobación pública Wix

**Fecha:** 25 de agosto de 2026.

Se abrió la ruta pública `https://www.marianmadrid.es/reserva-online` desde un navegador no autenticado, sin enviar formularios, crear reservas ni iniciar pagos. Tras dos comprobaciones de carga, la página permaneció visualmente vacía y no expuso elementos interactivos ni contenido extraíble.

El resultado no demuestra un fallo del código de reservas: puede deberse a una publicación pendiente, una ruta no activa, una carga bloqueada o una configuración de acceso del sitio. Sin acceso operativo al conector Wix —que devolvió `403 permission_denied`— no es posible marcar agenda ni ejecutar checkout aislado directamente en el entorno Wix durante esta iteración.

La validación de reservas, agenda, checkout, pagos, devoluciones, ledger, inventario y cierre se mantiene por tanto en el simulador determinista del repositorio hasta recuperar una vía de QA aislada y autenticada.
