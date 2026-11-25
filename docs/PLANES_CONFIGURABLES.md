# Control de funciones por plan

Superadmin → Planes ofrece 61 permisos y siete límites para Básico y Plus. Las pruebas de Plus utilizan los mismos permisos de Plus; Pro histórico se interpreta como Plus. La migración conserva el comportamiento comercial inicial, con dos métodos y cero miembros en Básico, cuatro miembros en Plus y solicitudes ilimitadas en ambos. No modifica perfiles, registros de operación, comprobantes, importes, contratos MP, pruebas ni vigencias.

## Publicar

1. Busca una función o despliega su grupo. Activa primero la sección y después sus acciones. Un permiso marcado bajo una sección desactivada se conserva, pero no concede acceso; el editor explica esta dependencia.
2. Ajusta los límites. `Sin límite` almacena NULL; cero impide nuevas operaciones. Los límites reducidos no eliminan datos existentes ni retiran miembros. El límite de ventas es acumulado y el de productos considera activos; los de solicitudes y Shalom usan el mes calendario de Lima. El límite de métodos restringe guardar una configuración con más métodos, sin borrar métodos existentes.
3. Selecciona **Revisar cambios**, comprueba el detalle y **Publicar cambios para todos**. Hasta publicar solo existe un borrador local. Publicar afecta a usuarios actuales y futuros de esos planes.
4. Si otro administrador publicó antes, se rechaza el borrador por conflicto y no se sobrescribe su trabajo. Recargar descarta el borrador. Auditoría registra actor, valores anteriores y nuevos en la misma transacción.

Los permisos se comprueban en el servidor y en la interfaz, además del rol del miembro. El dueño tampoco puede saltar las restricciones del plan. Las acciones que funcionan enteramente en el navegador (copiar, imprimir, escanear) se restringen en sus controles; ningún sitio puede impedir que una persona copie manualmente un dato que puede leer.

Desactivar una función conserva sus registros y configuración, para recuperarlos al habilitarla. Desactivar `Formulario` cierra la página pública y la reserva de pedidos; `Envíos` controla la administración de esos pedidos por separado. Desactivar la sección de equipo suspende el acceso de los miembros a ese negocio, sin borrar membresías.

Los límites de altas de productos, ventas, miembros, solicitudes y exportaciones Shalom se comprueban bajo bloqueo del perfil en Postgres para serializar solicitudes concurrentes. Productos por lotes y variantes quedan bajo el mismo límite; un lote que excede el límite revierte completo. Las reglas logísticas consultan los tres permisos de forma independiente (anticipación, corte y cupo), manteniendo el soporte DATE/TIMESTAMPTZ.

## Aplicación y consumo

El catálogo comercial se guarda en `plan_features.permisos`, con `revision` para concurrencia. El servidor lo comparte durante 30 segundos y combina lecturas simultáneas. Publicar invalida la caché del proceso; otras instancias la renuevan en hasta 30 segundos. Una sesión abierta actualiza sus controles al recargar o recuperar el foco. No hay consultas periódicas nuevas ni lecturas del catálogo en la landing. La página pública recibe sus permisos desde el servidor.

Precios, cobros, períodos de facturación y duración de pruebas se administran por separado. Los textos personalizados del editor visual de la landing conservan su contenido; la comparación dentro de Planes del cliente usa las funciones publicadas.

## Instalación y validación

Aplicar `supabase/planes-control-total.sql` antes del código. Es transaccional e idempotente. Agrega dos columnas, funciones privadas del servidor y disparadores de límites; no borra tablas ni registros de usuarios. Las funciones son SECURITY INVOKER, con `search_path` explícito, ejecución solo para `service_role`; la publicación verifica además que el actor sea superadmin activo.

Pruebas locales (base efímera, sin producción):

- `node scripts/test-planes.mjs`: publicación atómica, conflictos, auditoría, conservación de vigencias, dependencias y límites concurrentes.
- `node scripts/test-logistica.mjs`: calendario y cupos con DATE/TIMESTAMPTZ.
- `e2e/planes-configurables.spec.ts`: publicación por API, restricciones reales, formulario, interfaz de Productos y editor en escritorio/celular.
- Suites de planes, configuración, onboarding, negocio, roles, aislamiento y suscripciones.
