-- Agregación sin recortar saldos históricos, pendientes ni clientes antiguos.
begin;
create or replace function public.tori_datos_dashboard(p_owner uuid,p_ahora timestamptz)
returns jsonb language sql stable security invoker set search_path = pg_catalog, public
as $$
 with costos as (
  select i.venta_id,sum(coalesce(i.cantidad,0)*coalesce(i.costo_unitario,0)) as costo
  from public.venta_items i join public.ventas v on v.id=i.venta_id where v.profile_id=p_owner group by i.venta_id
 ), ventas_dia as (
  select min(v.created_at) as created_at,v.estado,v.metodo_pago,
   sum(v.total) as total,sum(v.monto_pagado) as monto_pagado,count(*) as cantidad,
   count(*) filter(where v.estado='PENDIENTE' and v.total>v.monto_pagado) as cobros_pendientes,
   coalesce(sum(v.total-v.monto_pagado) filter(where v.estado='PENDIENTE' and v.total>v.monto_pagado),0) as saldo_pendiente,
   jsonb_build_array(jsonb_build_object('cantidad',1,'costo_unitario',coalesce(sum(c.costo),0))) as items
  from public.ventas v left join costos c on c.venta_id=v.id where v.profile_id=p_owner
  group by (v.created_at at time zone 'America/Lima')::date,v.estado,v.metodo_pago,(v.created_at>=p_ahora)
 ), envios_dia as (
  select min(e.fecha_registro) as fecha_registro,e.estado,e.metodo,e.fecha_programada,count(*) as cantidad
  from public.envios e where e.user_id=p_owner
  group by (e.fecha_registro at time zone 'America/Lima')::date,e.estado,e.metodo,e.fecha_programada
 ), compras_dia as (
  select min(created_at) as created_at,estado,sum(total) as total from public.compras where profile_id=p_owner
  group by (created_at at time zone 'America/Lima')::date,estado
 ), gastos_dia as (
  select fecha,sum(monto) as monto from public.gastos where profile_id=p_owner group by fecha
 ) select jsonb_build_object(
  'ventas',coalesce((select jsonb_agg(v) from ventas_dia v),'[]'),
  'envios',coalesce((select jsonb_agg(e) from envios_dia e),'[]'),
  'compras',coalesce((select jsonb_agg(c) from compras_dia c),'[]'),
  'gastos',coalesce((select jsonb_agg(g) from gastos_dia g),'[]'),
  'stockBajo',(select count(*) from public.productos where profile_id=p_owner and archivado=false and stock_actual<=stock_minimo),
  'pedidosSinVenta',(select count(*) from public.envios e where e.user_id=p_owner and e.estado in('NO_EMPACADO','EN_OBSERVACION')
    and not exists(select 1 from public.ventas v where v.profile_id=p_owner and v.envio_id=e.id))
 );
$$;

create or replace function public.tori_datos_clientes(p_owner uuid)
returns jsonb language sql stable security invoker set search_path = pg_catalog, public
as $$
 with personas as (
  select p.id,p.nombre,p.dni,p.telefono,p.created_at from public.personas p
  join public.cliente_de c on c.persona_id=p.id where c.profile_id=p_owner
 ), ventas as (
  select persona_id,estado,sum(total) as total,count(*) as cantidad,max(created_at) as created_at
  from public.ventas where profile_id=p_owner and estado in('COMPLETADA','PENDIENTE') group by persona_id,estado
 ), envios as (
  select dni,telefono,count(*) as cantidad,max(fecha_registro) as fecha_registro
  from public.envios where user_id=p_owner group by dni,telefono
 ) select jsonb_build_object(
  'personas',coalesce((select jsonb_agg(p) from personas p),'[]'),
  'ventas',coalesce((select jsonb_agg(v) from ventas v),'[]'),
  'envios',coalesce((select jsonb_agg(e) from envios e),'[]')
 );
$$;
revoke all on function public.tori_datos_dashboard(uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.tori_datos_clientes(uuid) from public,anon,authenticated;
grant execute on function public.tori_datos_dashboard(uuid,timestamptz) to service_role;
grant execute on function public.tori_datos_clientes(uuid) to service_role;
notify pgrst,'reload schema';
commit;
