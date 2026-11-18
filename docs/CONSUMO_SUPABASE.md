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

## Segunda corrección: 18 de noviembre de 2026

El diagnóstico detallado está en `AUDITORIA_EGRESS_2026-11-18.md`. La búsqueda de Envíos seguía transfiriendo todos los candidatos antes de paginar: 3.834.496 filas en 6.053 búsquedas durante la ventana de 24 horas, el 94,9 % de las filas completas de Envíos devueltas. El primer cambio de intervalos no resolvía el contenido de cada consulta.

### Revisión por sección

| Sección | Patrón revisado | Mitigación / resultado |
| --- | --- | --- |
| Envíos | Búsqueda de hasta 10.000 filas completas y refresco periódico | Búsqueda/relevancia/paginación en PostgreSQL; detalles solo de la página. Comprobación pequeña de cambios antes de repetir la descarga. |
| Ventas | Resumen de hasta 5.000 ventas e ítems cada 30 segundos; búsquedas con detalles completos | Resumen agregado en PostgreSQL, sin truncar a 5.000. Candidatos de búsqueda con campos necesarios, detalles solo de la página. Búsqueda de ítems acotada al negocio. Refresco condicional que incluye cambios en ítems/costos. |
| Productos | Búsqueda descargaba catálogo completo | Búsqueda y paginación en PostgreSQL. Los detalles de variantes siguen en sus rutas existentes. |
| Nueva venta | Selector de hasta 1.000 productos cada 30 segundos | Mantiene selector ligero; evita descargarlo de nuevo si no cambió el catálogo. |
| Compras | Lista paginada; al abrir nueva compra descargaba productos activos y archivados completos | Selector de compra solo con id, nombre, SKU, descripción, costo, stock y unidad. Mantiene ambos estados para reponer productos archivados. No hay temporizador de recarga de la lista. |
| Gastos | Página y otra lista para calcular el total (la API limitaba esa lista a 200) | Una petición de pantalla: página y suma agregada. Total completo con filtro de categoría, sin descargar otra lista. |
| Clientes | Agrupación en memoria de identidades, ventas y envíos al abrir/buscar explícitamente | Revisado; sin temporizador. Conserva deduplicación existente. Sigue siendo candidato a agregación si crece el histórico; no se presenta como paginación en base de datos. |
| Resumen y reportes | Consultas de columnas concretas al abrir; históricos agregados en la aplicación | Revisados; sin temporizador periódico. Quedan oportunidades de agregación, pero no fueron el flujo dominante observado. |
| Superadmin | Consultas al cambiar pestaña, filtros, selección o acción; resumen histórico de empresa | Lista de empresas usa columnas explícitas. No se identificó bucle periódico. Los históricos de diagnóstico siguen consultándose al abrir. |
| Suscripciones | Lecturas privadas de conciliación y tarea diaria | Sin lecturas de pagos/journal en la ventana posterior analizada; no se modifica la lógica financiera ni se borra el registro. Su validación financiera real sigue siendo independiente. |
| Configuración/formulario/logística | Lecturas por apertura/acción; consultas acotadas al negocio | Se conservan validaciones frescas de cobertura, cupos y plan. No se cachean permisos ni disponibilidad. |
| Landing/agencias | Catálogos públicos repetidos | Se conserva la caché compartida e invalidación de la primera corrección. |
| Imágenes | Mayormente HIT de caché en la ventana observada | Sin modificación de archivos existentes. Los bytes con caché y sin caché se contabilizan aparte. |

### Concurrencia y frescura

`usePolling` espera la promesa de la consulta antes de permitir otro refresco periódico de la misma instancia. Dashboard y Ventas devuelven esa promesa. Se mantienen las actualizaciones tras guardar y al volver a la pestaña visible; Ventas refresca la página actual.

La señal condicional es una huella del contenido del negocio calculada en PostgreSQL, no una fecha de última alta. Incluye altas, ediciones y eliminaciones; Ventas incluye sus ítems. Solo viaja un hash. La API combina la huella con filtros, negocio y permisos; la comprobación de acceso/plan se ejecuta antes en cada petición. El control del cliente pertenece a cada componente y URL; no existe una caché global de datos privados. Esta estrategia reduce bytes, pero sigue haciendo una lectura interna en la base; se debe vigilar CPU a medida que crezcan los históricos.

Funciones nuevas: `rpc-lecturas-eficientes.sql`, todas `SECURITY INVOKER`, `search_path` explícito y ejecución exclusivamente para `service_role`. No se cambia información existente. El SQL de instalación completa incorpora estas funciones.

### Mediciones locales reproducibles

`e2e/egress-deep.spec.ts` mide los bytes efectivos de PostgREST en el gateway efímero, contando también las consultas de autorización. No apunta al proyecto real.

- Búsqueda de 900 pedidos, página de cinco: 1.130.288 bytes antes frente a 6.552 después (~99,4 % menos en ese caso).
- Resumen de 300 ventas con anulaciones, pagos parciales, sobrepagos y costos congelados: 30.783 bytes frente a 917 para página de una venta + agregado + autorización (~97 % menos).
- Envíos sin cambios: unos 90 bytes por refresco desde Supabase, incluida autorización, en el caso local.
- Pruebas de filtros, tildes, AND por palabras, relevancia y fallback; aislamiento; ejecución RPC denegada a clientes; borrados/ediciones sin depender de updated_at; cambios en costos y stock; cuenta bloqueada con revisión previamente válida.

Los porcentajes anteriores pertenecen a casos de prueba concretos. No son una predicción del porcentaje de ahorro de la factura completa. Las pestañas abiertas antes del despliegue deben recargarse para usar el control condicional; las mejoras de consultas del servidor también benefician a clientes antiguos. La cuota acumulada del ciclo no se reduce al desplegar.

Validación de esta entrega: 126 casos únicos comprobados entre regresión y comprobaciones finales; TypeScript sin errores y sin nuevos avisos de lint frente al estado anterior. Se aislaron las IP de los recorridos locales para que repetir suites no agotase el límite de login de otros casos; no se cambia la protección de producción. Las comprobaciones iniciales interrumpidas por falta de espacio del entorno de pruebas se repitieron tras limpiar cachés generadas.

El SQL se aplicó a producción mediante `lecturas_eficientes_y_refresco_condicional`. Se comprobaron los permisos de las seis funciones: ninguna es SECURITY DEFINER y ni anon ni authenticated pueden ejecutarlas. El asesor de seguridad no menciona las funciones nuevas. Una consulta real encontró 27 coincidencias y devolvió cinco ids (222 bytes). La revisión de Envíos tardó ~38 ms en la medición real inicial, sin lecturas físicas adicionales de bloques; es una muestra, no un percentil de rendimiento ni una medición de factura. Estas verificaciones no modificaron registros del negocio.
