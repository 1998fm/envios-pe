# Logística: fechas y cupos

La fecha elegida en el formulario es una propuesta: el servidor verifica de nuevo las reglas y el cupo al guardar. La anticipación, los días de atención, la hora de corte y la capacidad se calculan en PostgreSQL con hora de Perú. El calendario visible y la reserva usan las mismas funciones.

## Corrección de la incompatibilidad de producción

`envios.fecha_programada` es DATE en producción y TIMESTAMPTZ en el stack local y algunas instalaciones anteriores. Los contadores previos enviaban dos extremos UTC del mismo día: con una columna DATE ambos se convertían al mismo día y el filtro `>= día AND < día` podía contar cero pedidos. `tori_dia_logistica` tiene sobrecargas para ambos tipos: conserva DATE y convierte TIMESTAMPTZ a día de Perú. El índice por negocio, día y método permite contar sin descargar pedidos. No se convierte la columna ni se reescriben fechas antiguas.

## Reglas y reserva

- Anticipación entre 1 y 365 días. La opción de días hábiles cuenta solo los días de atención cuando la anticipación es de dos días o más, como indica la configuración existente.
- La hora de corte añade un día al avance antes de buscar un día de atención disponible. El cálculo usa la fecha/hora de Perú, incluido el tramo nocturno en que UTC ya cambió de día.
- Dos grupos de capacidad: Motorizado y los métodos que usan la configuración de Agencias. Se conserva la asignación previa de calendario de los métodos no motorizados, incluido Recojo; sus reservas pertenecen al grupo no motorizado. Shalom y Olva comparten cupo, mientras Motorizado tiene el suyo.
- El cupo limita pedidos programados para la fecha, no solicitudes recibidas ese día. Todos los estados reservan capacidad; el borrado de un pedido libera el cupo. No se descuentan pedidos enviados automáticamente.
- Sin fecha elegida se asigna la primera disponible. Con fecha elegida se exige anticipación, día de atención y capacidad actual. Si no cumple, se devuelve HTTP409 con explicación y se ofrecen fechas actualizadas, conservando los datos del formulario. No se cambia la fecha elegida silenciosamente.
- El selector devuelve hasta tres alternativas y busca en un horizonte acotado de 730 días. Una configuración sin días o con límite activo y cupo cero produce un error visible, no un bucle ni disponibilidad ficticia.
- El servidor normaliza las fechas como días de Perú. El navegador envía AAAA-MM-DD, evitando que la zona horaria del cliente adelante o retrase el día.

`tori_crear_envio_logistico` bloquea la fila del negocio, comprueba idempotencia, calcula/valida la fecha y crea el pedido en la misma transacción. `tori_actualizar_envio_logistico` utiliza ese mismo bloqueo para reprogramar y excluye el propio pedido del conteo. Las fechas anteriores no se recalculan al cambiar la configuración o al editar estado/observaciones. No hay excepciones administrativas silenciosas: la reprogramación del superadmin también valida las reglas y mantiene la comparación del estado esperado y la auditoría existentes.

Los pasos posteriores de vinculación con clientes/ventas permanecen fuera de la reserva y conservan su tratamiento de errores no fatales. Los reintentos con la misma llave no reservan otro cupo. Las lecturas públicas de idempotencia se acotan también al negocio.

## Plan Básico y presentación

Básico conserva los días de atención, un día de anticipación y recepción sin cupo diario. El modal bloquea los controles exclusivos de Plus en vez de permitir marcarlos y descartar sus valores al guardar. El selector de fecha para el cliente sigue siendo de Plus. El guardado completo y el asistente rechazan anticipación inválida o límites activos sin cupo positivo.

## Seguridad e instalación

`supabase/logistica-reserva-atomica.sql` agrega funciones SECURITY INVOKER y un índice; no hace migraciones de registros ni borra datos. Se revoca EXECUTE a PUBLIC, anon y authenticated; solo service_role puede llamar los RPC. Las API del servidor resuelven el negocio autenticado en las reprogramaciones. Las funciones de actualización aceptan una lista cerrada de campos y conservan la comprobación optimista del soporte administrativo.

No hay polling adicional del formulario. La consulta del calendario usa un agregado acotado y responde con no-store. Los cálculos antiguos duplicados en JavaScript se retiraron para evitar que vuelvan a divergir de las reglas de reserva.

## Validación

`scripts/test-logistica.mjs` arranca una base efímera y verifica 40 resultados con ambas variantes de columna (TIMESTAMPTZ y DATE): hora de Perú, días corridos/hábiles, corte exacto, concurrencia, cupos independientes, reprogramación, idempotencia, planes y configuraciones inválidas. Se ejecuta con `LOCAL_DB_PORT` separado del servidor e2e.

`e2e/logistica.spec.ts` cubre ocho solicitudes simultáneas para el último cupo, asignación automática, cambio de reglas, aislamiento, conservación de pedidos históricos, permisos de los RPC, controles de Básico y un formulario abierto desde otra zona horaria cuyo cupo se llena antes del envío. Complementar con Configuración, onboarding, Envíos, seguridad y soporte administrativo.

Resultado de la entrega: 40 comprobaciones SQL y 122 pruebas e2e de Logística, Configuración, onboarding, pedidos, soporte, privacidad y clientes completadas. La migración se aplicó en producción; se verificaron las siete funciones con EXECUTE solo para service_role y una lectura real del calendario sobre la columna DATE devolvió tres alternativas. No se crearon pedidos de prueba en producción.
