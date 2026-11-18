-- Lecturas exclusivamente desde las API del servidor. No modifica registros.
-- Replica buscar.ts: AND entre palabras, prioridad por inicio de palabra,
-- fallback parcial, sin tildes, peso por campo y frase completa.
begin;

create or replace function public.tori_puntuar_busqueda(p_campos text[], p_palabras text[], p_frase text)
returns table(puntos double precision, precisa boolean)
language plpgsql immutable security invoker set search_path = pg_catalog
as $$
declare
 textos text[] := '{}'; texto text; palabra text; i integer; pos integer;
 peso double precision; alguna boolean; exacta boolean;
begin
 foreach texto in array p_campos loop
   texto := btrim(regexp_replace(regexp_replace(lower(normalize(coalesce(texto,''), NFD)), U&'[\0300-\036f]', '', 'g'), '[[:space:]]+', ' ', 'g'));
   if texto <> '' then textos := array_append(textos,texto); end if;
 end loop;
 puntos := 0; precisa := true;
 if cardinality(p_palabras)=0 then return next; return; end if;
 if cardinality(textos)=0 then return; end if;
 foreach palabra in array p_palabras loop
   alguna := false; exacta := false;
   for i in 1..cardinality(textos) loop
     texto := textos[i]; peso := case when i=1 then 1.0 else 0.45 end;
     if strpos(texto,palabra)>0 then alguna := true; end if;
     pos := strpos(' '||texto,' '||palabra)-1;
     if pos<0 then puntos := puntos+peso;
     else
       exacta := true;
       puntos := puntos+(6+8*greatest(0,1-pos::double precision/length(texto)))*peso;
     end if;
   end loop;
   if not alguna then return; end if;
   precisa := precisa and exacta;
 end loop;
 if p_frase<>'' and exists(select 1 from unnest(textos) t where strpos(t,p_frase)>0) then puntos := puntos+25; end if;
 return next;
end $$;

create or replace function public.tori_buscar_envios(
 p_owner uuid, p_palabras text[], p_frase text, p_estados text[], p_metodos text[],
 p_desde timestamptz, p_hasta timestamptz, p_offset integer, p_limit integer
) returns jsonb language sql stable security invoker set search_path = pg_catalog, public
as $$
 with candidatos as materialized (
   select e.id,e.nombre,e.fecha_registro,s.puntos,s.precisa
   from public.envios e
   cross join lateral public.tori_puntuar_busqueda(array[e.nombre,e.dni,e.telefono],p_palabras,p_frase) s
   where e.user_id=p_owner
     and (cardinality(p_estados)=0 or e.estado=any(p_estados))
     and (cardinality(p_metodos)=0 or e.metodo=any(p_metodos))
     and (p_desde is null or e.fecha_registro>=p_desde)
     and (p_hasta is null or e.fecha_registro<=p_hasta)
 ), elegidos as materialized (
   select * from candidatos where precisa or not exists(select 1 from candidatos where precisa)
 ), pagina as (
   select id,row_number() over(order by puntos desc,coalesce(nombre,'') collate "es-x-icu",fecha_registro desc,id) as orden from elegidos
   order by puntos desc,coalesce(nombre,'') collate "es-x-icu",fecha_registro desc,id
   offset greatest(0,p_offset) limit least(200,greatest(1,p_limit))
 ) select jsonb_build_object('ids',coalesce((select jsonb_agg(id order by orden) from pagina),'[]'::jsonb),'total',(select count(*) from elegidos));
$$;

create or replace function public.tori_buscar_productos(
 p_owner uuid, p_palabras text[], p_frase text, p_archivado boolean, p_catalogo boolean, p_offset integer, p_limit integer
) returns jsonb language sql stable security invoker set search_path = pg_catalog, public
as $$
 with candidatos as materialized (
   select p.id,p.nombre,s.puntos,s.precisa from public.productos p
   cross join lateral public.tori_puntuar_busqueda(array[p.nombre,p.sku,p.descripcion],p_palabras,p_frase) s
   where p.profile_id=p_owner and p.archivado=p_archivado
     and (not p_catalogo or not exists(select 1 from public.producto_variantes pv where pv.producto_id=p.id))
 ), elegidos as materialized (
   select * from candidatos where precisa or not exists(select 1 from candidatos where precisa)
 ), pagina as (
   select id,row_number() over(order by puntos desc,coalesce(nombre,'') collate "es-x-icu",id) as orden from elegidos order by puntos desc,coalesce(nombre,'') collate "es-x-icu",id
   offset greatest(0,p_offset) limit least(1000,greatest(1,p_limit))
 ) select jsonb_build_object('ids',coalesce((select jsonb_agg(id order by orden) from pagina),'[]'::jsonb),'total',(select count(*) from elegidos));
$$;
revoke all on function public.tori_buscar_productos(uuid,text[],text,boolean,boolean,integer,integer) from public,anon,authenticated;
grant execute on function public.tori_buscar_productos(uuid,text[],text,boolean,boolean,integer,integer) to service_role;

create or replace function public.tori_resumen_ventas(p_owner uuid)
returns jsonb language sql stable security invoker set search_path = pg_catalog, public
as $$
 with filas as (
   select v.estado,coalesce(v.total,0) as total,coalesce(v.monto_pagado,0) as pagado,
     case when count(i.id)=0 or count(i.costo_unitario)<count(i.id) then null
       else round(sum(i.cantidad*i.costo_unitario),2) end as costo
   from public.ventas v left join public.venta_items i on i.venta_id=v.id
   where v.profile_id=p_owner group by v.id
 ), sumas as (
   select count(*) as ventas,
     count(*) filter(where estado='COMPLETADA') as completas,
     count(*) filter(where estado='PENDIENTE') as pendientes,
     count(*) filter(where estado='ANULADA') as anuladas,
     count(*) filter(where estado<>'ANULADA') as activas,
     coalesce(sum(total) filter(where estado<>'ANULADA'),0) as monto,
     coalesce(sum(pagado) filter(where estado<>'ANULADA'),0) as cobrado,
     coalesce(sum(total-pagado) filter(where estado<>'ANULADA' and pagado<total),0) as por_cobrar,
     coalesce(sum(costo) filter(where estado<>'ANULADA'),0) as costo,
     coalesce(sum(round(total-costo,2)) filter(where estado<>'ANULADA'),0) as ganancia,
     coalesce(sum(round(total-costo,2)) filter(where estado<>'ANULADA' and pagado<total),0) as ganancia_por_cobrar,
     count(*) filter(where estado<>'ANULADA' and costo is null) as sin_costo
   from filas
 ) select jsonb_build_object(
   'ventas',ventas,'porEstado',jsonb_build_object('COMPLETADA',completas,'PENDIENTE',pendientes,'ANULADA',anuladas),
   'monto',round(monto,2),'cobrado',round(least(monto,cobrado),2),'porCobrar',round(por_cobrar,2),
   'ticketPromedio',case when activas>0 then round(monto/activas,2) else 0 end,
   'costo',costo,'ganancia',ganancia,'pctGanancia',case when monto>0 then round(ganancia/monto*100,2) else 0 end,
   'gananciaPorCobrar',ganancia_por_cobrar,'ventasSinCosto',sin_costo,'truncado',false
 ) from sumas;
$$;

create or replace function public.tori_total_gastos(p_owner uuid, p_categoria text)
returns numeric language sql stable security invoker set search_path = pg_catalog, public
as $$
 select coalesce(sum(monto),0) from public.gastos
 where profile_id=p_owner and (p_categoria='' or categoria=p_categoria);
$$;
revoke all on function public.tori_total_gastos(uuid,text) from public,anon,authenticated;
grant execute on function public.tori_total_gastos(uuid,text) to service_role;

-- Huella del contenido: detecta también eliminaciones y cambios sin updated_at.
create or replace function public.tori_revision_lectura(p_owner uuid, p_tabla text)
returns text language plpgsql stable security invoker set search_path = pg_catalog, public
as $$
declare huella text;
begin
 if p_tabla='envios' then
   select md5(coalesce(string_agg(md5(row_to_json(e)::text),'' order by e.id),'')) into huella
   from public.envios e where e.user_id=p_owner;
 elsif p_tabla='productos' then
   select md5(coalesce(string_agg(md5(row_to_json(p)::text),'' order by p.id),'')) into huella
   from public.productos p where p.profile_id=p_owner;
 elsif p_tabla='ventas' then
   select md5(
     coalesce((select string_agg(md5(row_to_json(v)::text),'' order by v.id) from public.ventas v where v.profile_id=p_owner),'') || ':' ||
     coalesce((select string_agg(md5(row_to_json(i)::text),'' order by i.id) from public.venta_items i join public.ventas v on v.id=i.venta_id where v.profile_id=p_owner),'')
   ) into huella;
 else raise exception 'Lectura no válida';
 end if;
 return huella;
end $$;
revoke all on function public.tori_revision_lectura(uuid,text) from public,anon,authenticated;
grant execute on function public.tori_revision_lectura(uuid,text) to service_role;

-- Solo el servidor puede elegir p_owner; la API obtiene ese id de la sesión.
revoke all on function public.tori_puntuar_busqueda(text[],text[],text) from public,anon,authenticated;
revoke all on function public.tori_buscar_envios(uuid,text[],text,text[],text[],timestamptz,timestamptz,integer,integer) from public,anon,authenticated;
revoke all on function public.tori_resumen_ventas(uuid) from public,anon,authenticated;
grant execute on function public.tori_puntuar_busqueda(text[],text[],text) to service_role;
grant execute on function public.tori_buscar_envios(uuid,text[],text,text[],text[],timestamptz,timestamptz,integer,integer) to service_role;
grant execute on function public.tori_resumen_ventas(uuid) to service_role;
notify pgrst,'reload schema';
commit;
