begin;
-- Control comercial de funciones. No modifica perfiles, pagos ni datos del negocio.
alter table public.plan_features add column if not exists permisos jsonb not null default '{}'::jsonb;
alter table public.plan_features add column if not exists revision bigint not null default 0;
update public.plan_features set permisos='{"envios": true, "formulario": true, "productos": false, "ventas": false, "compras": false, "gastos": false, "clientes": false, "resumen": false, "configuracion": true, "roles": false, "envios_detalle": true, "envios_estado": true, "envios_tamano": true, "envios_reprogramar": true, "envios_observaciones": true, "envios_eliminar": true, "envios_validar": false, "copiar": false, "etiquetas": false, "shalom": false, "cambio_masivo": false, "exportar": false, "productos_crear": true, "productos_editar": true, "productos_archivar": true, "productos_eliminar": true, "productos_variantes": true, "productos_kardex": true, "productos_fotos": true, "ventas_crear": true, "ventas_editar": true, "ventas_anular": true, "ventas_cobros": true, "compras_crear": true, "compras_anular": true, "gastos_crear": true, "gastos_editar": true, "gastos_eliminar": true, "clientes_editar": true, "clientes_eliminar": true, "etiquetas_producto": false, "lector_qr": false, "ganancia": false, "empresa": true, "metodos": true, "logo": false, "redes": false, "redirect": false, "colores": true, "tracking": true, "cantidad": true, "cierre": true, "marca_blanca": false, "escoger_fecha": false, "tarifas": false, "logistica_anticipacion": false, "logistica_corte": false, "logistica_cupo": false, "roles_crear": true, "roles_miembros": true, "roles_invitaciones": true}'::jsonb, max_envios=null,max_productos=null,max_ventas=null,max_exportaciones_shalom=null,max_pedidos_copiar=null where plan='basic' and permisos='{}'::jsonb;
update public.plan_features set permisos='{"envios": true, "formulario": true, "productos": true, "ventas": true, "compras": true, "gastos": true, "clientes": true, "resumen": true, "configuracion": true, "roles": true, "envios_detalle": true, "envios_estado": true, "envios_tamano": true, "envios_reprogramar": true, "envios_observaciones": true, "envios_eliminar": true, "envios_validar": true, "copiar": true, "etiquetas": true, "shalom": true, "cambio_masivo": true, "exportar": true, "productos_crear": true, "productos_editar": true, "productos_archivar": true, "productos_eliminar": true, "productos_variantes": true, "productos_kardex": true, "productos_fotos": true, "ventas_crear": true, "ventas_editar": true, "ventas_anular": true, "ventas_cobros": true, "compras_crear": true, "compras_anular": true, "gastos_crear": true, "gastos_editar": true, "gastos_eliminar": true, "clientes_editar": true, "clientes_eliminar": true, "etiquetas_producto": true, "lector_qr": true, "ganancia": true, "empresa": true, "metodos": true, "logo": true, "redes": true, "redirect": true, "colores": true, "tracking": true, "cantidad": true, "cierre": true, "marca_blanca": true, "escoger_fecha": true, "tarifas": true, "logistica_anticipacion": true, "logistica_corte": true, "logistica_cupo": true, "roles_crear": true, "roles_miembros": true, "roles_invitaciones": true}'::jsonb, max_productos=null,max_ventas=null,max_exportaciones_shalom=null,max_pedidos_copiar=null,max_miembros=4 where plan='business_plus' and permisos='{}'::jsonb;
create or replace function public.tori_plan_permite(p_plan text,p_clave text)
returns boolean language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare v jsonb; v_parent text;
begin
 select permisos into v from public.plan_features where plan=case when p_plan='pro' then 'business_plus' else p_plan end;
 if v is null or coalesce((v->>p_clave)::boolean,false)=false then return false; end if;
 v_parent:=case when p_clave like 'logistica_%' or p_clave in ('empresa','metodos','logo','redes','redirect','colores','tarifas') then 'configuracion'
 when p_clave in ('tracking','cantidad','cierre','marca_blanca','escoger_fecha') then 'formulario'
 when p_clave in ('copiar','etiquetas','shalom','cambio_masivo','exportar') or p_clave like 'envios_%' then 'envios'
 when p_clave='etiquetas_producto' then 'productos' when p_clave='lector_qr' then 'ventas'
 when position('_' in p_clave)>0 then split_part(p_clave,'_',1) else null end;
 return v_parent is null or coalesce((v->>v_parent)::boolean,false);
end $$;
revoke all on function public.tori_plan_permite(text,text) from public,anon,authenticated;
grant execute on function public.tori_plan_permite(text,text) to service_role;

create or replace function public.tori_publicar_planes(p_actor uuid,p_email text,p_planes jsonb)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v public.plan_features; n jsonb; k text; anteriores jsonb;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='super_admin' and not coalesce(disabled,false)) then raise exception 'Acceso restringido'; end if;
 if jsonb_typeof(p_planes) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_planes))<>2 or not(p_planes ?& array['basic','business_plus']) then raise exception 'Envía ambos planes completos'; end if;
 perform 1 from public.plan_features where plan in ('basic','business_plus') order by plan for update;
 select jsonb_agg(to_jsonb(p)) into anteriores from public.plan_features p where plan in ('basic','business_plus');
 for v in select * from public.plan_features where plan in ('basic','business_plus') order by plan loop
  n:=p_planes->v.plan;
  if (n->>'revision')::bigint is distinct from v.revision then raise exception using message='Los planes cambiaron. Recarga antes de publicar.',errcode='40001'; end if;
  if jsonb_typeof(n->'permisos') is distinct from 'object' or (select count(*) from jsonb_object_keys(n->'permisos'))<>61 then raise exception 'Permisos incompletos'; end if;
  foreach k in array array['envios','formulario','productos','ventas','compras','gastos','clientes','resumen','configuracion','roles','envios_detalle','envios_estado','envios_tamano','envios_reprogramar','envios_observaciones','envios_eliminar','envios_validar','copiar','etiquetas','shalom','cambio_masivo','exportar','productos_crear','productos_editar','productos_archivar','productos_eliminar','productos_variantes','productos_kardex','productos_fotos','ventas_crear','ventas_editar','ventas_anular','ventas_cobros','compras_crear','compras_anular','gastos_crear','gastos_editar','gastos_eliminar','clientes_editar','clientes_eliminar','etiquetas_producto','lector_qr','ganancia','empresa','metodos','logo','redes','redirect','colores','tracking','cantidad','cierre','marca_blanca','escoger_fecha','tarifas','logistica_anticipacion','logistica_corte','logistica_cupo','roles_crear','roles_miembros','roles_invitaciones'] loop
   if jsonb_typeof(n->'permisos'->k) is distinct from 'boolean' then raise exception 'Permiso no válido: %',k; end if;
  end loop;
  foreach k in array array['max_envios','max_metodos','max_productos','max_ventas','max_exportaciones_shalom','max_pedidos_copiar','max_miembros'] loop
   if not(n ? k) or (n->k <> 'null'::jsonb and (jsonb_typeof(n->k)<>'number' or (n->>k)!~'^\d+$' or (n->>k)::numeric>2147483647)) then raise exception 'Límite no válido: %',k; end if;
  end loop;
  update public.plan_features set permisos=n->'permisos',revision=revision+1,max_envios=(n->>'max_envios')::int,max_metodos=(n->>'max_metodos')::int,max_productos=(n->>'max_productos')::int,max_ventas=(n->>'max_ventas')::int,max_exportaciones_shalom=(n->>'max_exportaciones_shalom')::int,max_pedidos_copiar=(n->>'max_pedidos_copiar')::int,max_miembros=(n->>'max_miembros')::int where plan=v.plan;
 end loop;
 insert into public.admin_audit_log(admin_id,admin_email,accion,detalle) values(p_actor,p_email,'editar_planes',jsonb_build_object('antes',anteriores,'despues',p_planes));
end $$;
revoke all on function public.tori_publicar_planes(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.tori_publicar_planes(uuid,text,jsonb) to service_role;

-- Las reglas logísticas usan la misma configuración comercial que el panel.
create or replace function public.tori_reglas_logistica(p_owner uuid,p_metodo text,p_actual timestamptz default now())
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p public.profiles; v_plus boolean; v_plan text; v_dias text[]; v_anticipacion int; v_habiles boolean;
 v_limitar boolean; v_cupo int; v_usa boolean; v_hora time; v_base date; v_fecha date; v_sumar int; v_contados int:=0;
 v_nombres text[]:=array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
begin
 select * into p from public.profiles where id=p_owner;
 if not found then raise exception 'No se encontró la configuración del negocio.'; end if;
 if p_metodo not in ('MOTORIZADO','SHALOM','OLVA','MARVISUR','FLORES','OTRO','RECOJO') or p_metodo is null then raise exception 'Método de entrega no válido.'; end if;
 v_plus:=p.plan in ('pro','business_plus') and (coalesce(p.pro_until>p_actual,false) or coalesce(p.trial_end>p_actual,false));
 v_plan:=case when v_plus then 'business_plus' else 'basic' end;
 if p_metodo='MOTORIZADO' then
  v_dias:=coalesce(p.logistica_moto_dias,array['MONDAY']);
  v_anticipacion:=case when public.tori_plan_permite(v_plan,'logistica_anticipacion') then p.logistica_moto_anticipacion else 1 end;
  v_habiles:=public.tori_plan_permite(v_plan,'logistica_anticipacion') and coalesce(p.logistica_moto_anticipacion_solo_habiles,false);
  v_limitar:=public.tori_plan_permite(v_plan,'logistica_cupo') and coalesce(p.logistica_moto_limitar,false); v_cupo:=coalesce(p.logistica_moto_cupo,0);
  v_usa:=public.tori_plan_permite(v_plan,'logistica_corte') and coalesce(p.logistica_moto_usa_hora_corte,false); v_hora:=coalesce(p.logistica_moto_hora_corte,'18:00'::time);
 else
  v_dias:=coalesce(p.logistica_agencias_dias,array['MONDAY']);
  v_anticipacion:=case when public.tori_plan_permite(v_plan,'logistica_anticipacion') then p.logistica_agencias_anticipacion else 1 end;
  v_habiles:=public.tori_plan_permite(v_plan,'logistica_anticipacion') and coalesce(p.logistica_agencias_anticipacion_solo_habiles,false);
  v_limitar:=public.tori_plan_permite(v_plan,'logistica_cupo') and coalesce(p.logistica_agencias_limitar,false); v_cupo:=coalesce(p.logistica_agencias_cupo,0);
  v_usa:=public.tori_plan_permite(v_plan,'logistica_corte') and coalesce(p.logistica_agencias_usa_hora_corte,false); v_hora:=coalesce(p.logistica_agencias_hora_corte,'18:00'::time);
 end if;
 select array_agg(x) into v_dias from unnest(v_dias) x where x=any(v_nombres);
 if coalesce(cardinality(v_dias),0)=0 then raise exception 'No hay días de atención configurados para este método.'; end if;
 if coalesce(v_anticipacion,0)<1 or v_anticipacion>365 then raise exception 'Configura una anticipación entre 1 y 365 días.'; end if;
 if v_limitar and v_cupo<1 then raise exception 'Configura un cupo diario mayor que cero.'; end if;
 v_base:=(p_actual at time zone 'America/Lima')::date;
 v_sumar:=v_anticipacion+case when v_usa and (p_actual at time zone 'America/Lima')::time>=v_hora then 1 else 0 end;
 v_fecha:=v_base;
 if v_habiles and v_anticipacion>=2 then
  while v_contados<v_sumar loop
   v_fecha:=v_fecha+1;
   if v_nombres[extract(isodow from v_fecha)::int]=any(v_dias) then v_contados:=v_contados+1; end if;
  end loop;
 else v_fecha:=v_base+v_sumar;
 end if;
 while not (v_nombres[extract(isodow from v_fecha)::int]=any(v_dias)) loop v_fecha:=v_fecha+1; end loop;
 return jsonb_build_object('minima',v_fecha,'dias',v_dias,'limitar',v_limitar,'cupo',v_cupo,'plus',v_plus,'escoger_fecha',public.tori_plan_permite(v_plan,'escoger_fecha'));
end $$;

create or replace function public.tori_crear_envio_logistico(p_envio jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare n public.envios; v_owner uuid; v_dia date; v_reglas jsonb; v_plan text; v_max int; v_count bigint;
begin
 v_owner:=(p_envio->>'user_id')::uuid;
 -- Serializar reservas, reprogramaciones y cambios de configuración del negocio.
 perform 1 from public.profiles where id=v_owner for update;
 if not found then raise exception 'No se encontró el negocio.'; end if;
 if nullif(p_envio->>'idempotency_key','') is not null then
  select * into n from public.envios where user_id=v_owner and idempotency_key=(p_envio->>'idempotency_key')::uuid;
  if found then return to_jsonb(n); end if;
 end if;
 select case when plan in ('pro','business_plus') and (coalesce(pro_until>now(),false) or coalesce(trial_end>now(),false)) then 'business_plus' else 'basic' end into v_plan from public.profiles where id=v_owner;
 if not public.tori_plan_permite(v_plan,'formulario') then raise exception 'El formulario no está disponible para este negocio.'; end if;
 select max_envios into v_max from public.plan_features where plan=v_plan;
 if v_max is not null then
  select count(*) into v_count from public.envios where user_id=v_owner and fecha_registro>=date_trunc('month',now() at time zone 'America/Lima') at time zone 'America/Lima';
  if v_count>=v_max then raise exception 'El negocio alcanzó el límite mensual de solicitudes.'; end if;
 end if;
 if not public.tori_plan_permite(v_plan,'cantidad') then p_envio:=jsonb_set(p_envio,'{cantidad_productos}','null'::jsonb); end if;
 v_reglas:=public.tori_reglas_logistica(v_owner,p_envio->>'metodo');
 v_dia:=public.tori_resolver_fecha_envio(v_owner,p_envio->>'metodo',case when (v_reglas->>'escoger_fecha')::boolean then p_envio->>'fecha_programada' else null end);
 p_envio:=jsonb_set(p_envio,'{fecha_programada}',to_jsonb(v_dia::text || 'T12:00:00-05:00'));
 n:=jsonb_populate_record(null::public.envios,p_envio);
 n.fecha_programada:=v_dia::text || 'T12:00:00-05:00';
 insert into public.envios(user_id,nombre,dni,telefono,metodo,nombre_metodo,destino,direccion,referencia,detalle,observaciones,estado,fecha_registro,fecha_programada,tipo_entrega,agencia_olva,cantidad_productos,idempotency_key)
 values(v_owner,n.nombre,n.dni,n.telefono,n.metodo,n.nombre_metodo,n.destino,n.direccion,n.referencia,n.detalle,n.observaciones,'NO_EMPACADO',now(),n.fecha_programada,n.tipo_entrega,n.agencia_olva,n.cantidad_productos,n.idempotency_key) returning * into n;
 return to_jsonb(n);
end $$;


-- Serializa las altas/restauraciones con los límites para evitar eludirlos por lotes.
create or replace function public.tori_limite_catalogo() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_plan text; v_max int; v_count bigint;
begin
 if TG_TABLE_NAME='productos' then
  if NEW.archivado then return NEW; end if;
 end if;
 if TG_OP='UPDATE' then
  if OLD.archivado is not true or NEW.archivado is not false then return NEW; end if;
 end if;
 perform 1 from public.profiles where id=NEW.profile_id for update;
 select case when plan in ('pro','business_plus') and (coalesce(pro_until>now(),false) or coalesce(trial_end>now(),false)) then 'business_plus' else 'basic' end into v_plan from public.profiles where id=NEW.profile_id;
 if TG_TABLE_NAME='productos' then
  select max_productos into v_max from public.plan_features where plan=v_plan;
  if v_max is not null then select count(*) into v_count from public.productos where profile_id=NEW.profile_id and not archivado and id<>NEW.id; end if;
 else
  select max_ventas into v_max from public.plan_features where plan=v_plan;
  if v_max is not null then select count(*) into v_count from public.ventas where profile_id=NEW.profile_id and id<>NEW.id; end if;
 end if;
 if v_max is not null and v_count>=v_max then raise exception 'Se alcanzó el límite de % del plan.',TG_TABLE_NAME; end if;
 return NEW;
end $$;
revoke all on function public.tori_limite_catalogo() from public,anon,authenticated;
grant execute on function public.tori_limite_catalogo() to service_role;
create or replace trigger planes_limite_producto before insert or update of archivado on public.productos for each row execute function public.tori_limite_catalogo();
create or replace trigger planes_limite_venta before insert on public.ventas for each row execute function public.tori_limite_catalogo();

create or replace function public.tori_registrar_exportacion(p_owner uuid,p_cantidad int) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_plan text; v_max int; v_count bigint;
begin
 perform 1 from public.profiles where id=p_owner for update;
 select case when plan in ('pro','business_plus') and (coalesce(pro_until>now(),false) or coalesce(trial_end>now(),false)) then 'business_plus' else 'basic' end into v_plan from public.profiles where id=p_owner;
 if not public.tori_plan_permite(v_plan,'shalom') then raise exception 'Tu plan no permite exportar a Shalom.'; end if;
 select max_exportaciones_shalom into v_max from public.plan_features where plan=v_plan;
 select count(*) into v_count from public.shalom_exports where user_id=p_owner and created_at>=date_trunc('month',now() at time zone 'America/Lima') at time zone 'America/Lima';
 if v_max is not null and v_count>=v_max then raise exception 'Se alcanzó el límite mensual de exportaciones Shalom.'; end if;
 insert into public.shalom_exports(user_id,cantidad) values(p_owner,greatest(0,p_cantidad));
 return jsonb_build_object('ok',true,'used',v_count+1,'max',v_max);
end $$;
revoke all on function public.tori_registrar_exportacion(uuid,int) from public,anon,authenticated;
grant execute on function public.tori_registrar_exportacion(uuid,int) to service_role;
create or replace function public.tori_limite_equipo() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_plan text; v_max int; v_count bigint;
begin
 perform 1 from public.profiles where id=NEW.owner_id for update;
 select case when plan in ('pro','business_plus') and (coalesce(pro_until>now(),false) or coalesce(trial_end>now(),false)) then 'business_plus' else 'basic' end into v_plan from public.profiles where id=NEW.owner_id;
 select max_miembros into v_max from public.plan_features where plan=v_plan;
 if public.tori_plan_permite(v_plan,'roles') and v_max is not null then
  select count(*) into v_count from public.business_members where owner_id=NEW.owner_id and user_id<>NEW.user_id;
  if v_count>=v_max then raise exception 'Se alcanzó el límite de miembros del plan.'; end if;
 end if;
 return NEW;
end $$;
revoke all on function public.tori_limite_equipo() from public,anon,authenticated;
grant execute on function public.tori_limite_equipo() to service_role;
create or replace trigger planes_limite_equipo before insert on public.business_members for each row execute function public.tori_limite_equipo();

commit;
