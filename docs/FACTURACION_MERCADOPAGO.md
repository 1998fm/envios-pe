# Facturación Mercado Pago

## Reglas

- Nuevas contrataciones: Plus mensual S/49.90 o trimestral S/129.90, PEN. La referencia usa el dueño autenticado; los miembros no contratan ni cancelan para el negocio.
- Una preapproval autorizada no acredita dinero. El servidor obtiene la factura y su pago desde Mercado Pago, comprueba sus IDs, referencia, pagador, importe, moneda, frecuencia y aprobación.
- Los eventos aceptados son `subscription_preapproval`, `preapproval` (compatibilidad), `subscription_authorized_payment` y `payment`. Firma obligatoria con ID canónico único. `body.id` es el ID de notificación, no del recurso.
- Los períodos provienen de `debit_date` de la factura y meses del contrato. Se suman meses de calendario, no 30/90 días. `next_payment_date` nunca acredita un período pagado.
- Cobros pendientes/rechazados no conceden acceso. Reembolso total/contracargo retira la cobertura de ese cobro; un reembolso parcial conserva la cobertura y aparece como tal. Si existe otro período válido, prueba vigente o extensión manual, se conserva.
- Pro anterior válido se reconoce con sus precios anteriores y concede Plus. No se crean nuevos contratos Pro ni se cambian automáticamente contratos históricos de Mercado Pago.

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
