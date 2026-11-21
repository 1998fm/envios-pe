# Facturación Mercado Pago

## Reglas

- Nuevas contrataciones: Plus mensual S/49.90 o trimestral S/129.90, PEN. La referencia usa el dueño autenticado; los miembros no contratan ni cancelan para el negocio.
- Una preapproval autorizada no acredita dinero. El servidor obtiene la factura y su pago desde Mercado Pago, comprueba sus IDs, referencia, pagador, importe, moneda, frecuencia y aprobación.
- Los eventos aceptados son `subscription_preapproval`, `preapproval` (compatibilidad), `subscription_authorized_payment` y `payment`. Firma obligatoria con ID canónico único. `body.id` es el ID de notificación, no del recurso.
- Los períodos provienen de `debit_date` de la factura y meses del contrato. Se suman meses de calendario, no 30/90 días. `next_payment_date` nunca acredita un período pagado.
- Cobros pendientes/rechazados no conceden acceso. Reembolso total/contracargo retira la cobertura de ese cobro; un reembolso parcial conserva la cobertura y aparece como tal. Si existe otro período válido, prueba vigente o extensión manual, se conserva.
- Pro anterior válido se reconoce con sus precios anteriores y concede Plus. No se crean nuevos contratos Pro. Los contratos históricos con el defecto exacto descrito abajo se cancelan durante la conciliación para detener cargos incorrectos.

## Persistencia e idempotencia

El bucket privado `tori-billing` se crea automáticamente al necesitarlo, con la service-role existente. No requiere una migración SQL nueva. Cada cuenta conserva versiones inmutables `accounts/{owner}/{revision}.json`. Crear sin upsert la siguiente revisión serializa los cambios entre instancias. El contenido no incluye tarjetas, tokens ni claves de Mercado Pago.

El registro incluye cada transacción y su último estado verificado; los estados anteriores permanecen en las versiones. La tabla `pagos` conserva las filas históricas y añade **una fila por pago** con clave `preapproval_id = mp-payment:{paymentId}`. El nombre de la columna se conserva por compatibilidad con la instalación existente; el ID real de suscripción y el estado están en los metadatos JSON de `origen`. El superadmin adapta estos metadatos a texto y fechas legibles.

No se concede acceso si falla el comprobante. Se devuelve 503 para reintentar. Las proyecciones hacia comprobantes/perfil son reintentables, comparan la versión previa y leen el registro más reciente; no suman días al recibir otra vez el mismo evento.

Los vencimientos existentes se conservan como cobertura histórica al inicializar una cuenta. No se pretende reclasificar automáticamente todos los accesos concedidos antes de esta corrección como cobros verificados. Los ajustes manuales de acceso del superadmin se anotan en el registro: repetir un webhook previo no revierte una baja manual. Una nueva aprobación posterior sí puede conceder un nuevo período; bloquear toda la cuenta sigue siendo una acción independiente.

## Contratación, cambios y cancelación

Se pagina la búsqueda oficial y se comprueban las referencias exactamente en el servidor, además de los IDs conocidos de la cuenta; no se depende de filtros no documentados por Mercado Pago. Un checkout pendiente del mismo período se reutiliza; uno activo/pausado impide crear otro. El registro serializa operaciones y usa una clave de idempotencia adicional al consultar Mercado Pago. Una respuesta de red/servidor ambigua bloquea otro contrato hasta verificar la primera operación. Una negativa HTTP definitiva permite reintentar.

Para cambiar de período: cancelar la renovación actual y contratar el nuevo. Si existe prueba/acceso vigente, el nuevo contrato programa `auto_recurring.start_date` al finalizarlo. Autorizar ese contrato no activa por sí mismo un período adicional.

El titular gestiona su contrato en **Ver planes → Mi suscripción y cobros**. El superadmin lo gestiona en **Centro de soporte → empresa → Acceso**; cancelar exige motivo y auditoría previa. La cancelación se confirma contra Mercado Pago y conserva el período pagado. Cambiar solo el acceso a Básico no cancela cobros: la interfaz mantiene ambas acciones separadas y explícitas.

Si una creación queda en estado ambiguo sin contrato localizable, no se desbloquea mediante un temporizador ni se crea otro a ciegas. Soporte debe revisar la cuenta de Mercado Pago antes de resolver esa operación. La consulta de estado recupera las operaciones cuyo contrato/cancelación ya confirma Mercado Pago.

## Conciliación y configuración

La conciliación pagina contratos y facturas, incluidas suscripciones canceladas que pudieran recibir reembolsos. Los errores se informan (HTTP503); el cron sigue comprobando vencimientos y no responde éxito falso. Cron y sincronización administrativa admiten hasta 300 segundos. Una ejecución interrumpida puede repetirse sin duplicar cobros ni períodos.

Variables privadas: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `CRON_SECRET`. Configurar en Mercado Pago los tópicos de suscripción, cobro recurrente y pagos hacia `/api/webhooks/mercadopago`. El retorno usa el dominio HTTPS configurado; el fallback es `https://hey-tori.vercel.app/dashboard` y se descarta el antiguo dominio Firebase. La presencia de una variable no certifica su valor ni la configuración externa: una prueba con las credenciales de Mercado Pago sigue siendo necesaria para confirmar el recorrido externo.

## Pruebas

El stack local implementa `/mp-api` y fixtures accesibles solo con service-role. El reemplazo de API solo funciona con token de prueba local y URL de base local; producción usa `https://api.mercadopago.com`. No requiere cargos reales.

`e2e/billing.spec.ts` verifica aprobación, rechazo, reembolso, firmas/IDs, importe/moneda/pagador, concurrencia, historial, fallos recuperables, titularidad, cancelación desde el panel, cancelación administrativa auditada, Pro histórico y conciliación más allá de 100 contratos. Ejecutar también security, no-leaks, core-flows, planes y pruebas administrativas.


## Reparación de trimestrales históricos (noviembre de 2026)

El código previo al 10/11/2026 21:36:58 UTC enviaba `frequency: 1` incluso al cobrar S/129.90 (Plus trimestral) o S/79.90 (Pro trimestral). Cambiar el código de nuevas altas no modifica esos contratos ya existentes.

La conciliación global, por negocio y las notificaciones firmadas identifican únicamente contratos con referencia histórica exacta `UUID__business_plus` o `UUID__pro`, fecha de creación anterior a la corrección, moneda PEN, frecuencia de un mes e importe trimestral exacto. Se verifica que el perfil exista y se relee el contrato. Se registra la incidencia en el registro privado de facturación antes de solicitar la cancelación. Se verifica con GET que Mercado Pago realmente confirme `cancelled`. Nunca se da por corregido un fallo de cancelación. La acción no cobra ni devuelve dinero y no crea contratos de reemplazo.

Los pagos de esos contratos se validan con los mismos controles de factura/pagador/importe y se reconocen como tres meses de calendario. Los trimestres de varios pagos retenidos del mismo contrato se acumulan sin solaparse, usando las fechas originales; los reintentos no suman otra vez. Un pago devuelto totalmente o con contracargo no concede acceso y la distribución se recalcula. Se conserva la cobertura de otros pagos y las extensiones manuales previas. Las fechas se muestran en America/Lima. Si faltan datos o no coincide el patrón histórico, no se adivina el plan ni se cancela automáticamente: se informa el error para revisión.

En Superadmin → Centro de soporte → negocio → Acceso Plus, «Sincronizar pagos y corregir contratos históricos» ejecuta la corrección de esa cuenta. Muestra también contratos cancelados, ID del contrato y próxima fecha de cobro (nula si cancelado). El historial contiene una fila por transacción, estado, devolución y cobertura. La sincronización global está en Pagos y suscripciones; incluye resultados parciales y los IDs con errores. Los comprobantes generales tienen paginación de 100 filas y no silencian errores de base de datos como si fueran historiales vacíos.

El cron diario ejecuta la misma reparación. Publicar el código no certifica que una cuenta real ya haya sido conciliada: comprobar el resultado de la sincronización y el estado cancelado. Para volver a renovar después, el cliente debe autorizar una nueva contratación correcta; no se reactiva ni se cobra automáticamente.


### Diagnóstico de sincronizaciones parciales

Las lecturas a Mercado Pago usan páginas de 20 resultados, respetan el tamaño efectivo informado por `paging.limit` y avanzan hasta agotar todas las páginas. No se considera que un HTTP404 sea una lista de facturas vacía. Las consultas GET reintentan una vez ante red/timeout, HTTP429 o HTTP5xx, con espera limitada; POST y PUT nunca se reenvían automáticamente.

Los errores identifican la operación (buscar contratos/facturas, consultar pago o actualizar contrato), HTTP y código del proveedor cuando es válido. El panel presenta los contratos fallidos por separado. Los cuerpos de error del proveedor no se publican ni registran, porque pueden contener datos privados; los logs `[mp-api]` solo incluyen operación, HTTP y código. Un HTTP401/403 exige comprobar autorización/configuración de la cuenta; no se soluciona omitiendo validaciones o acreditando pagos sin verificar. Publicar estos ajustes no demuestra que el incidente real haya desaparecido: se debe volver a sincronizar y comprobar el resultado real.


### Búsqueda alternativa cuando MP rechaza el filtro de contrato (HTTP400)

Los registros reales del 16/11 mostraron HTTP400 en «Buscar facturas» y HTTP429 en consultas de contratos. Ante un HTTP400 de la búsqueda de facturas por `preapproval_id`, la conciliación consulta `/v1/payments/search` por la referencia externa exacta y obtiene las facturas por `payment_id`. Cada resultado debe coincidir con referencia, ID de pago y contrato; después pasa por los controles originales de factura, pagador, moneda, importe y aprobación. No se acreditan pagos solo por coincidir el nombre o monto. Una respuesta sin facturas para un pago encontrado es un error, no un historial vacío. Si el contrato no es pendiente ni informa explícitamente cero cargos y no se logra vincular ningún pago, se informa revisión pendiente.

La búsqueda de pagos por referencia se basa en la documentación oficial: https://www.mercadopago.com.pe/developers/en/docs/subscriptions/additional-content/payment-management . La búsqueda de facturas por pago figura en https://www.mercadopago.com.pe/developers/en/reference/online-payments/subscriptions/authorized-payment-search/get .

Las lecturas se espacian 250ms para reducir ráfagas. El resumen y los errores de sincronización general se muestran junto a los controles superiores; la alerta incluye el primer diagnóstico para que no se pierda al desplazarse. Una reparación solo se da por ejecutada después de una sincronización real exitosa, no por haber publicado el código o pasado las pruebas locales.

## Recepción durable y recuperación general (21/11/2026)

Se verifica HMAC sobre el timestamp original y después se comprueba su antigüedad normalizando segundos o milisegundos. No se acepta una firma incorrecta, una fecha futura/pasada de más de diez minutos ni un formato ambiguo. Los rechazos se registran con un motivo acotado en logs del servidor, sin firma ni secreto. No se escribe en la base por peticiones sin autenticar.

Cada entrega válida se guarda primero en `mp_eventos` (tabla privada con RLS, acceso solo del servidor). Se identifica por un hash del tipo, recurso y entrega. Una nueva notificación de devolución se procesa de nuevo; un reintento de la misma entrega no duplica períodos. Un RPC con bloqueo por fila toma cada trabajo una sola vez; la reserva vence tras seis minutos para recuperar ejecuciones interrumpidas. La escritura del resultado exige el token de esa reserva.

Si aún no aparece la factura de un pago, la respuesta es HTTP503 y la entrega permanece como error reintentable. Nunca se acredita usando únicamente nombre, correo, captura o importe. El comprobante y el perfil siguen proyectándose desde las transacciones verificadas; conservar el vencimiento manual usa el máximo de la cobertura, sin sumar un período adicional por recuperar un recibo.

El cron diario existente y la sincronización global del superadmin buscan pagos de los últimos 30 días con referencias Tori exactas, los incorporan a la cola y reintentan hasta diez pendientes por ejecución (con presupuesto de tiempo y espera creciente). También conservan la conciliación histórica completa por contratos, incluidas devoluciones de pagos anteriores. Los contratos siguen pasando por la corrección trimestral histórica existente. No se genera ningún nuevo cargo al reintentar.

`mp_conciliaciones` conserva inicio, finalización, origen y resultado de cada conciliación global. En **Superadmin → Pagos y suscripciones → Activación de pagos y recuperación** se muestran configuración presente (sin secretos), últimas cinco ejecuciones y hasta cincuenta pendientes/incidencias. Una ejecución sin finalización no se presenta como exitosa. Se advierte si no existe un cron exitoso confirmado en 36 horas; configurar variables no prueba su ejecución. Puede verificarse y recuperarse una operación por su número, con autorización superadmin y auditoría.

No hay polling del diagnóstico ni limpieza/borrado de registros. Los eventos ya completados no se descargan al abrir el panel. La migración `mp-eventos.sql` añade tablas e índices privados y un RPC exclusivo de service_role; no altera datos existentes de negocios.

Pruebas: `e2e/billing-recovery.spec.ts` cubre ambos formatos de fecha, firmas incorrectas/antiguas, duplicados, factura demorada, fallo de comprobante, acceso manual, devolución posterior, recuperación sin webhook, persistencia del cron, permisos, concurrencia y recuperación de reservas vencidas. Complementar con `billing.spec.ts`, seguridad y acceso administrativo. Las pruebas usan un simulador local y no certifican la respuesta de una operación real de Mercado Pago.

Validación de esta entrega: compilación de producción y TypeScript completados; 101 casos de la regresión general pasaron inicialmente, y los cinco casos fallidos/pendientes se verificaron después de corregir la conservación del diagnóstico y actualizar la expectativa de un pago inexistente (debe responder 503). Pasaron además los seis casos nuevos de recuperación, incluida la interfaz. La migración fue aplicada en producción y se verificaron RLS y permisos del RPC. La operación 189467368619 se incorporó como pendiente para verificación con el proveedor; esto no equivale a un comprobante recuperado ni a una activación adicional. La ejecución real del cron posterior al despliegue debe comprobarse en el nuevo diagnóstico.
