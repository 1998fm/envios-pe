-- Reglas compartidas y reserva atómica. No cambia fechas ni filas existentes.
-- Admite la columna DATE de producción y TIMESTAMPTZ de instalaciones anteriores.
create or replace function public.tori_dia_logistica(p_fecha date)
returns date language sql immutable strict security invoker set search_path=public,pg_temp
as $$ select p_fecha $$;
create or replace function public.tori_dia_logistica(p_fecha timestamptz)
returns date language sql immutable strict security invoker set search_path=public,pg_temp
as $$ select (p_fecha at time zone 'America/Lima')::date $$;
create index if not exists envios_cupo_logistico on public.envios(user_id,public.tori_dia_logistica(fecha_programada),metodo);

create or replace function public.tori_reglas_logistica(p_owner uuid,p_metodo text,p_actual timestamptz default now())
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p public.profiles; v_plus boolean; v_dias text[]; v_anticipacion int; v_habiles boolean;
 v_limitar boolean; v_cupo int; v_usa boolean; v_hora time; v_base date; v_fecha date; v_sumar int; v_contados int:=0;
 v_nombres text[]:=array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
begin
 select * into p from public.profiles where id=p_owner;
 if not found then raise exception 'No se encontró la configuración del negocio.'; end if;
 if p_metodo not in ('MOTORIZADO','SHALOM','OLVA','MARVISUR','FLORES','OTRO','RECOJO') or p_metodo is null then raise exception 'Método de entrega no válido.'; end if;
 v_plus:=p.plan in ('pro','business_plus') and (coalesce(p.pro_until>p_actual,false) or coalesce(p.trial_end>p_actual,false));
 if p_metodo='MOTORIZADO' then
  v_dias:=coalesce(p.logistica_moto_dias,array['MONDAY']);
  v_anticipacion:=case when v_plus then p.logistica_moto_anticipacion else 1 end;
  v_habiles:=v_plus and coalesce(p.logistica_moto_anticipacion_solo_habiles,false);
  v_limitar:=v_plus and coalesce(p.logistica_moto_limitar,false); v_cupo:=coalesce(p.logistica_moto_cupo,0);
  v_usa:=v_plus and coalesce(p.logistica_moto_usa_hora_corte,false); v_hora:=coalesce(p.logistica_moto_hora_corte,'18:00'::time);
 else
  v_dias:=coalesce(p.logistica_agencias_dias,array['MONDAY']);
  v_anticipacion:=case when v_plus then p.logistica_agencias_anticipacion else 1 end;
  v_habiles:=v_plus and coalesce(p.logistica_agencias_anticipacion_solo_habiles,false);
  v_limitar:=v_plus and coalesce(p.logistica_agencias_limitar,false); v_cupo:=coalesce(p.logistica_agencias_cupo,0);
  v_usa:=v_plus and coalesce(p.logistica_agencias_usa_hora_corte,false); v_hora:=coalesce(p.logistica_agencias_hora_corte,'18:00'::time);
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
 return jsonb_build_object('minima',v_fecha,'dias',v_dias,'limitar',v_limitar,'cupo',v_cupo,'plus',v_plus);
end $$;

-- Un solo agregado acotado; no devuelve pedidos ni información personal.
create or replace function public.tori_fechas_logistica(p_owner uuid,p_metodo text,p_cantidad int default 3,p_actual timestamptz default now())
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare r jsonb; v_min date; v_result jsonb;
begin
 r:=public.tori_reglas_logistica(p_owner,p_metodo,p_actual); v_min:=(r->>'minima')::date;
 with candidatos as (
  select (v_min+i)::date as dia from generate_series(0,729) i
  where (array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'])[extract(isodow from (v_min+i))::int] in (select jsonb_array_elements_text(r->'dias'))
 ), conteos as (
  select public.tori_dia_logistica(e.fecha_programada) as dia,count(*) as cantidad from public.envios e
  where (r->>'limitar')::boolean and e.user_id=p_owner
  and public.tori_dia_logistica(e.fecha_programada)>=v_min and public.tori_dia_logistica(e.fecha_programada)<v_min+730
  and ((p_metodo='MOTORIZADO' and e.metodo='MOTORIZADO') or (p_metodo<>'MOTORIZADO' and e.metodo<>'MOTORIZADO'))
  group by public.tori_dia_logistica(e.fecha_programada)
 ), disponibles as (
  select c.dia from candidatos c left join conteos n using(dia)
  where not (r->>'limitar')::boolean or coalesce(n.cantidad,0)<(r->>'cupo')::int
  order by c.dia limit greatest(1,least(coalesce(p_cantidad,3),3))
 ) select coalesce(jsonb_agg(dia order by dia),'[]'::jsonb) into v_result from disponibles;
 return jsonb_build_object('fechasDisponibles',v_result,'minima',v_min);
end $$;

create or replace function public.tori_resolver_fecha_envio(p_owner uuid,p_metodo text,p_fecha text default null,p_excluir uuid default null)
returns date language plpgsql security invoker set search_path=public,pg_temp as $$
declare r jsonb; v_fecha date; v_count bigint; v_fechas jsonb;
begin
 r:=public.tori_reglas_logistica(p_owner,p_metodo);
 if p_fecha is null or p_fecha='' then
  v_fechas:=public.tori_fechas_logistica(p_owner,p_metodo,1);
  if jsonb_array_length(v_fechas->'fechasDisponibles')=0 then raise exception 'No hay fechas disponibles. Contacta al negocio.'; end if;
  return (v_fechas->'fechasDisponibles'->>0)::date;
 end if;
 begin
  if p_fecha ~ '^\d{4}-\d{2}-\d{2}$' then v_fecha:=p_fecha::date;
  else v_fecha:=(p_fecha::timestamptz at time zone 'America/Lima')::date; end if;
 exception when others then raise exception 'Fecha de entrega no válida.'; end;
 if v_fecha<(r->>'minima')::date then raise exception 'La fecha ya no cumple la anticipación mínima. Elige otra fecha disponible.'; end if;
 if not ((array['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'])[extract(isodow from v_fecha)::int] in (select jsonb_array_elements_text(r->'dias'))) then raise exception 'El negocio no atiende ese día. Elige otra fecha disponible.'; end if;
 if (r->>'limitar')::boolean then
  select count(*) into v_count from public.envios e where e.user_id=p_owner and public.tori_dia_logistica(e.fecha_programada)=v_fecha
  and (p_excluir is null or e.id<>p_excluir)
  and ((p_metodo='MOTORIZADO' and e.metodo='MOTORIZADO') or (p_metodo<>'MOTORIZADO' and e.metodo<>'MOTORIZADO'));
  if v_count>=(r->>'cupo')::int then raise exception 'Se completó el cupo de esa fecha. Elige otra fecha disponible.'; end if;
 end if;
 return v_fecha;
end $$;

create or replace function public.tori_crear_envio_logistico(p_envio jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare n public.envios; v_owner uuid; v_dia date; v_reglas jsonb;
begin
 v_owner:=(p_envio->>'user_id')::uuid;
 -- Serializar reservas, reprogramaciones y cambios de configuración del negocio.
 perform 1 from public.profiles where id=v_owner for update;
 if not found then raise exception 'No se encontró el negocio.'; end if;
 if nullif(p_envio->>'idempotency_key','') is not null then
  select * into n from public.envios where user_id=v_owner and idempotency_key=(p_envio->>'idempotency_key')::uuid;
  if found then return to_jsonb(n); end if;
 end if;
 v_reglas:=public.tori_reglas_logistica(v_owner,p_envio->>'metodo');
 v_dia:=public.tori_resolver_fecha_envio(v_owner,p_envio->>'metodo',case when (v_reglas->>'plus')::boolean then p_envio->>'fecha_programada' else null end);
 p_envio:=jsonb_set(p_envio,'{fecha_programada}',to_jsonb(v_dia::text || 'T12:00:00-05:00'));
 n:=jsonb_populate_record(null::public.envios,p_envio);
 n.fecha_programada:=v_dia::text || 'T12:00:00-05:00';
 insert into public.envios(user_id,nombre,dni,telefono,metodo,nombre_metodo,destino,direccion,referencia,detalle,observaciones,estado,fecha_registro,fecha_programada,tipo_entrega,agencia_olva,cantidad_productos,idempotency_key)
 values(v_owner,n.nombre,n.dni,n.telefono,n.metodo,n.nombre_metodo,n.destino,n.direccion,n.referencia,n.detalle,n.observaciones,'NO_EMPACADO',now(),n.fecha_programada,n.tipo_entrega,n.agencia_olva,n.cantidad_productos,n.idempotency_key) returning * into n;
 return to_jsonb(n);
end $$;

create or replace function public.tori_actualizar_envio_logistico(p_owner uuid,p_id uuid,p_cambios jsonb,p_esperado jsonb default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare n public.envios; v_dia date; v_key text; v_value jsonb;
begin
 perform 1 from public.profiles where id=p_owner for update;
 select * into n from public.envios where id=p_id and user_id=p_owner for update;
 if not found then return null; end if;
 if p_esperado is not null then
  for v_key,v_value in select * from jsonb_each(p_esperado) loop
   if (to_jsonb(n)->v_key) is distinct from v_value then raise exception 'El pedido cambió desde que abriste la ficha. Actualiza y revisa de nuevo.'; end if;
  end loop;
 end if;
 if p_cambios ? 'fecha_programada' then
  -- Conservar una fecha previa si no hay cambio; no revalidar históricos por editar otro dato.
  if (p_cambios->>'fecha_programada') ~ '^\d{4}-\d{2}-\d{2}$' then v_dia:=(p_cambios->>'fecha_programada')::date;
  else v_dia:=((p_cambios->>'fecha_programada')::timestamptz at time zone 'America/Lima')::date; end if;
  if v_dia is distinct from public.tori_dia_logistica(n.fecha_programada) then
   v_dia:=public.tori_resolver_fecha_envio(p_owner,n.metodo,p_cambios->>'fecha_programada',p_id);
   p_cambios:=jsonb_set(p_cambios,'{fecha_programada}',to_jsonb(v_dia::text || 'T12:00:00-05:00'));
  else p_cambios:=p_cambios-'fecha_programada'; end if;
 end if;
 if exists(select 1 from jsonb_object_keys(p_cambios) k where k not in ('fecha_programada','nombre','dni','telefono','direccion','destino','observaciones','estado','tamano','updated_at')) then raise exception 'Campo de pedido no permitido.'; end if;
 n:=jsonb_populate_record(n,p_cambios);
 update public.envios set fecha_programada=n.fecha_programada,nombre=n.nombre,dni=n.dni,telefono=n.telefono,direccion=n.direccion,destino=n.destino,observaciones=n.observaciones,estado=n.estado,tamano=n.tamano,updated_at=now()
 where id=p_id and user_id=p_owner returning * into n;
 return to_jsonb(n);
end $$;

revoke all on function public.tori_dia_logistica(date),public.tori_dia_logistica(timestamptz),public.tori_reglas_logistica(uuid,text,timestamptz),public.tori_fechas_logistica(uuid,text,integer,timestamptz),public.tori_resolver_fecha_envio(uuid,text,text,uuid),public.tori_crear_envio_logistico(jsonb),public.tori_actualizar_envio_logistico(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.tori_dia_logistica(date),public.tori_dia_logistica(timestamptz),public.tori_reglas_logistica(uuid,text,timestamptz),public.tori_fechas_logistica(uuid,text,integer,timestamptz),public.tori_resolver_fecha_envio(uuid,text,text,uuid),public.tori_crear_envio_logistico(jsonb),public.tori_actualizar_envio_logistico(uuid,uuid,jsonb,jsonb) to service_role;
