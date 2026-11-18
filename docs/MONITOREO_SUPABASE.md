# Consumo Supabase en el superadmin

Entrar en `/admin` y abrir **Consumo Supabase**. El panel conserva el diseño del superadmin y se carga solo al entrar en esa pestaña.

## Dos fuentes distintas

**Cuotas oficiales registradas:** Egress, tamaño de base, MAU, archivos, ingesta y consultas de logs. El administrador copia los valores y límites de Usage con **Registrar lectura oficial**, indicando su ciclo y fecha de lectura en hora de Perú. Se admiten decimales con punto o coma; los números deben escribirse sin separadores de miles. El panel conserva el origen manual de estas lecturas; no afirma haberlas obtenido automáticamente del proveedor.

El endpoint `/v1/projects/{ref}/usage` propuesto en el documento adjunto no figura en la especificación pública consultada. Los endpoints públicos `usage.api-counts` y `usage.api-requests-count` informan actividad, no los seis acumulados de la captura. No se añadió una dependencia de endpoints internos del Dashboard ni se solicita/exhibe una clave administrativa en el navegador. Referencias: https://api.supabase.com/api/v1-json y https://supabase.com/docs/guides/platform/manage-your-usage/egress.

**Mediciones técnicas automáticas:** bytes de PostgreSQL, filas exactas y espacio con índices de diez tablas, todos los archivos/buckets según `storage.objects.metadata`, y contadores globales de transacciones de PostgreSQL. Un contador de filas/transacciones no es egress ni una medida exacta de llamadas HTTP. Los tamaños y el redondeo del proveedor pueden diferir. El monitor no descarga imágenes, pedidos ni consultas con datos personales.

## Historial y comparaciones

- Períodos de 24 horas, 7, 30 y 90 días, con gráficas y hora de Perú.
- Comparación de cuotas con la lectura anterior o con la base disponible del período, únicamente dentro del mismo ciclo.
- Ritmo observado de Egress en MB/h entre fechas reales de lectura; no es una predicción garantizada.
- Cambiar de ciclo no genera un porcentaje de ahorro ficticio. Un descenso en contadores acumulativos se señala para revisión; los niveles de almacenamiento sí pueden disminuir legítimamente.
- Diferencias de registros y tamaño respecto de la base técnica disponible. Los cambios de `stats_reset` o descensos del contador impiden calcular una diferencia de transacciones engañosa.
- CSV de las lecturas oficiales mostradas (hasta 200 por período), con unidades en las columnas y protección frente a fórmulas en texto.
- Sin historial anterior, se muestra esa ausencia; no se inventan puntos ni ceros. El tiempo exacto de cada lectura permanece visible.

## Costo del propio monitor

- Sin polling de la pestaña. Abrirla, cambiar período o pulsar Actualizar realiza una lectura acotada.
- Una sola captura técnica por 15 minutos para todo el proyecto, protegida con un bloqueo transaccional compartido entre instancias. Varias peticiones concurrentes reutilizan el mismo registro.
- La captura técnica usa un RPC, en vez de diez peticiones de conteo y dos listados parciales de Storage. Las carpetas no se cuentan como si fueran archivos; no hay un límite de 1.000 objetos.
- La tarea diaria existente de `/api/cron/downgrade-plans` recoge una medición en paralelo, sin añadir un cron más frecuente ni modificar la decisión de planes o los cobros. Fallar la medición no impide conciliar pagos.
- La vista técnica muestra 90 días. Se conserva el historial técnico y oficial; no se activó limpieza automática porque la migración inicial fue rechazada por Supabase sin informar el motivo. La instalación alternativa crea el monitor sin instrucciones de borrado. La serie técnica devuelve puntos compactos (fecha y tamaño), no todas las tablas por cada punto.
- No activa auditoría SQL por consulta ni ejecuta búsquedas de logs. Guardar una lectura oficial sí registra una acción en la auditoría administrativa existente.

## Seguridad

`/api/admin/consumo` valida en cada GET/POST una sesión de superadmin activo. Usuarios normales y anónimos no pueden acceder al panel, tabla ni RPC. Las funciones son `SECURITY INVOKER`, con `search_path` fijo y EXECUTE solo para `service_role`. La tabla tiene RLS y permisos explícitos del servidor. No se exponen claves, consultas, correos ni registros individuales.

El superadmin reutiliza el lector de sesión del servidor, con persistencia de cookies renovadas y verificación del usuario actual en Auth para las rutas administrativas. Mantiene su acceso exclusivamente por cookie; no se habilita la entrada administrativa por Bearer. La comprobación de rol/desactivación sigue consultándose en cada petición.

## Adaptación del plan adjunto

| Propuesta | Implementación |
| --- | --- |
| Recortar Resumen a 90 días y 2.000/500 filas | Agregar por día/estado/método en PostgreSQL; mantener todos los saldos y pendientes históricos. Las gráficas siguen mostrando 90 días. Evita falsear caja al excluir compras, gastos o deudas antiguas. |
| Bajar resumen de Ventas a 500 | Se conserva el resumen SQL completo ya publicado. Lista y detalle usan columnas explícitas, incluido el código que utiliza el sistema. |
| Bajar candidatos de Ventas a 400 | Se conserva el límite previo; no se ocultan resultados adicionales para justificar ahorro. La lectura de candidatos ya es ligera y los detalles se piden por página. |
| Búsqueda de Envíos de 10.000 a 1.000 | Se conserva la búsqueda/paginación SQL ya publicada, sin volver a descargar candidatos en memoria. |
| Deduplicación pública y perfil completos | Selecciones explícitas de la configuración necesaria y de id/fecha/identificadores en las consultas de deduplicación. |
| Quitar polling del modal de venta y bajar catálogo a 200 | Se elimina el polling; se carga al abrir y tras un conflicto de stock. Se mantiene el alcance existente del catálogo para que productos posteriores al número 200 sigan disponibles. El guardado valida stock real. |
| Recortar Clientes a 500 personas/1.000 movimientos | Se agregan ventas y envíos en SQL, conservando la agrupación de identidades, cantidades, importe y última actividad de todo el histórico. |
| Monitor con filas = riesgo de egress | Se muestran volumen, espacio y crecimiento sin atribuirles GB facturados. Las cuotas tienen su propia fuente oficial registrada. |
| Guardar al consultar GET y silenciar errores | GET solo lee. POST registra mediciones/lecturas; se notifican los errores y no se sustituyen por ceros. |

Prueba local con más de 1.000 ventas antiguas: 477.998 bytes de la lectura anterior (solo sus primeras 1.000 ventas) frente a 1.562 bytes de la lectura agregada y autorización, conservando el saldo completo, 1.001 cobros pendientes y 1.005 pedidos asociados al cliente. Es un caso de prueba, no una garantía de consumir menos de 1 GB mensual.

## Instalación y verificación

Scripts: `supabase/supabase-usage-snapshots.sql` y `supabase/rpc-resumenes-compactos.sql`; ambos incluidos en `instalacion-completa.sql`. Aplicarlos antes del código que los utiliza. No modifican registros de productos, ventas, compras, clientes, envíos o suscripciones.

Pruebas específicas: `e2e/consumo-admin.spec.ts`, con roles, RLS/RPC, concurrencia, cache de 15 minutos, lectura GET sin escrituras, cuotas y ciclos, conservación del historial, CSV, móvil, ausencia de consultas periódicas y saldos/clientes con más de mil registros y más de 90 días. Complementar con las regresiones de seguridad, acceso admin, formularios, Resumen, inventario y facturación.

La respuesta de Supabase para la primera migración fue `status: declined` / `Migration was declined`, sin motivo adicional. Las funciones de Resumen/Clientes sí se aplicaron. Se separó la limpieza del monitor para instalar una versión sin borrados ni sustitución de políticas existentes.
