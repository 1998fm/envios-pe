# Auditoría inicial de consumo de Supabase

La captura del usuario muestra 6.12/5 GB de Egress, 43/500 MB de base de datos, 0.02/1 GB de Storage y 1.10/1 GB de Log Ingestion. Egress es transferencia acumulada, no tamaño ocupado. Se confirmó la conexión al proyecto `envios-pe`, estado ACTIVE_HEALTHY. Se hicieron exclusivamente consultas de lectura en Supabase. Los registros permiten comprobar patrones reales, pero no sustituyen el desglose oficial de bytes facturados del ciclo: no se atribuyen los 6.12 GB exactos a un módulo.

## Evidencia real de Supabase

Ventana: 2026-11-17 00:18 UTC → 2026-11-18 00:18 UTC (24 horas).

- 83,503 solicitudes en los logs de API. Consultas: profiles 34,704; business_members 14,750; envios 12,891; ventas 3,571; productos 1,431; agencias Shalom 420 y Olva 418. Las consultas de datos registradas provienen de Node (servidor), no de acceso directo del navegador a las tablas.
- Auth: 10,483 renovaciones de sesión exitosas, 299 renovaciones limitadas por HTTP429 y solo 4 inicios de sesión con contraseña. El código de `getSessionUser` descartaba la escritura de cookies de la renovación (`setAll` vacío); una cookie vencida podía provocar un refresh repetido en cada API. Se corrige su persistencia, manteniendo HttpOnly/SameSite/Secure. El proxy también mantiene las mismas opciones al renovar.
- Storage: 79,885,138 bytes con Content-Length declarado, prácticamente todos imágenes. De ellos, 77,753,328 fueron HIT de caché, 2,120,198 MISS y 11,612 DYNAMIC. No se deben presentar todos estos bytes como egress sin caché. Muchas respuestas de Database/Auth no declaran Content-Length; su suma NO es el tráfico completo ni una comparación válida para atribuir la factura.
- El catálogo público activo contiene 426 agencias Olva (~128,126 bytes de JSON de filas) y 518 agencias Shalom (~32,139). Descargar las listas completas centenares de veces repite datos públicos que cambian poco. Ahora se cachean en servidor una hora y la sincronización invalida la caché.
- Las tablas siguen siendo pequeñas: envios ~4.1 MB, personas ~2 MB, productos ~592 kB (tamaños de relación, incluidos índices). El consumo no se explica por una base de 5 GB.
- Health Advisors no reportó alertas. Hay recomendaciones de índices/RLS y de permisos de funciones, independientes de los bytes de transferencia. No se modificaron políticas, índices, esquema ni historial en producción como parte de este diagnóstico. Referencias de los avisos: [índices de claves foráneas](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys) y [permisos de funciones](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Hallazgos en el código y primera reducción

- Dashboard: recargaba Envíos cada 10 segundos en cualquier sección. Ahora el refresco periódico solo funciona en Envíos y cada 30 segundos. Las acciones propias siguen actualizando la lista inmediatamente.
- Búsqueda de Envíos: cada tecla disparaba una consulta que podía traer hasta 10,000 candidatos. Ahora espera 300ms al escribir y descarta respuestas de filtros anteriores.
- Ventas: descargaba listado y resumen cada 10 segundos. Ahora cada 30 segundos. Guardar, anular y cobrar mantienen sus recargas inmediatas existentes.
- Nueva venta: descargaba hasta 1,000 productos completos cada 8 segundos. Ahora cada 30 segundos y solo las columnas utilizadas por el selector: id, nombre, sku, descripción, precio de venta, stock y unidad. El catálogo normal conserva sus datos completos.
- Landing pública: `React.cache` solo deduplicaba metadatos y render dentro de una petición; cada visita nueva listaba y descargaba Storage. Ahora la versión pública tiene caché compartida de Next de 5 minutos, invalidada inmediatamente al publicar. Borradores y control de versiones siguen leyéndose directamente. No se cachean permisos, cuentas ni suscripciones.

10→30 segundos reduce dos tercios de las recargas periódicas de ese flujo. 8→30 reduce aproximadamente 73%. Fuera de Envíos se eliminan sus recargas periódicas. No son porcentajes comprobados de ahorro sobre la factura completa.

## Evidencia y límites

Las pruebas locales cuentan las llamadas a Storage: después de calentar la landing, cuatro visitas adicionales no realizan más llamadas; una nueva publicación aparece inmediatamente. También comprueban el tamaño menor del selector y el calendario de refresco desde el navegador. Las pruebas de sesión vencida exigen que una API renueve solo una vez y persista la cookie HttpOnly: cuatro consultas posteriores no deben volver a renovar. Los catálogos públicos se calientan y cuatro consultas adicionales no deben tocar PostgREST. Las pruebas usan una base local efímera, no generan carga en el proyecto real.

Pendiente de conciliar con el contador oficial del ciclo: Database / Storage / Auth / otros en Usage → Egress; distribución por día, endpoints y consultas frecuentes; frecuencia de webhooks y conciliaciones; respuestas de imágenes y tráfico anónimo de formularios. Las cuatro cuentas activas no incluyen necesariamente visitantes de la landing, compradores del formulario, robots o tareas programadas.

El registro privado de facturación lista y descarga versiones inmutables varias veces por conciliación. Es un candidato a revisar, no una causa cuantificada; no se cambia su concurrencia ni se borra historial financiero sin evidencia. Las agencias públicas ya tienen caché de CDN, pero su efectividad y el tráfico de imágenes requieren medición real.

La cuota consumida no se restablece al desplegar. Hay que comparar el crecimiento diario posterior. Los logs de Supabase y los logs de Vercel son métricas diferentes: reducir `console.log` de Next no demuestra una reducción de Log Ingestion en Supabase.

Referencia de los servicios que cuentan como Egress: https://supabase.com/docs/guides/platform/manage-your-usage/egress
