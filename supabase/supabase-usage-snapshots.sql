-- Monitor privado. No registra consultas individuales ni datos de clientes.
begin;
create table if not exists public.supabase_usage_snapshots (
 id uuid primary key default gen_random_uuid(),
 tomado_en timestamptz not null default now(),
 registrado_en timestamptz not null default now(),
 tipo text not null check(tipo in ('tecnico','oficial')),
 ciclo text,
 datos jsonb not null,
 admin_id uuid references public.profiles(id) on delete set null
);
create index if not exists usage_tipo_fecha on public.supabase_usage_snapshots(tipo,tomado_en desc);
create unique index if not exists usage_oficial_fecha_ciclo on public.supabase_usage_snapshots(ciclo,tomado_en) where tipo='oficial';
create index if not exists usage_admin_id on public.supabase_usage_snapshots(admin_id);
alter table public.supabase_usage_snapshots enable row level security;
revoke all on public.supabase_usage_snapshots from public,anon,authenticated;
grant select,insert on public.supabase_usage_snapshots to service_role;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='supabase_usage_snapshots' and policyname='monitor_solo_servidor') then
  create policy monitor_solo_servidor on public.supabase_usage_snapshots to service_role using(true) with check(true);
 end if;
end $$;

-- SECURITY INVOKER: no eleva privilegios ni expone pg_stat_activity/SQL/usuarios.
create or replace function public.tori_medir_consumo()
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public
as $$
declare
 ultimo public.supabase_usage_snapshots; nombre text; filas bigint; bytes bigint;
 tablas jsonb := '[]'; archivos jsonb; datos jsonb; estadisticas jsonb;
begin
 -- El límite se comparte entre todas las instancias y solicitudes concurrentes.
 perform pg_advisory_xact_lock(81726491);
 select * into ultimo from public.supabase_usage_snapshots where tipo='tecnico' order by tomado_en desc limit 1;
 if ultimo.tomado_en>now()-interval '15 minutes' then
   return jsonb_build_object('snapshot',to_jsonb(ultimo),'reutilizado',true);
 end if;
 foreach nombre in array array['profiles','envios','ventas','venta_items','compras','gastos','productos','personas','movimientos_inventario','shalom_exports'] loop
   if to_regclass('public.'||nombre) is not null then
     execute format('select count(*) from public.%I',nombre) into filas;
     bytes := pg_total_relation_size(to_regclass('public.'||nombre));
     tablas := tablas||jsonb_build_array(jsonb_build_object('nombre',nombre,'filas',filas,'bytes',bytes));
   end if;
 end loop;
 select coalesce(jsonb_agg(x),'[]') into archivos from (
   select bucket_id as bucket,count(*) as archivos,
     coalesce(sum(case when (metadata->>'size') ~ '^[0-9]+$' then (metadata->>'size')::numeric else 0 end),0) as bytes
   from storage.objects group by bucket_id order by bucket_id
 ) x;
 select jsonb_build_object('transacciones',xact_commit+xact_rollback,'filasProcesadas',tup_returned,'reinicio',stats_reset)
 into estadisticas from pg_stat_database where datname=current_database();
 datos := jsonb_build_object('databaseBytes',pg_database_size(current_database()),'tablas',tablas,'storage',archivos,'postgres',estadisticas);
 insert into public.supabase_usage_snapshots(tipo,datos) values('tecnico',datos) returning * into ultimo;
 return jsonb_build_object('snapshot',to_jsonb(ultimo),'reutilizado',false);
end $$;
-- La limpieza automática queda desactivada; esta instalación no borra capturas.

create or replace function public.tori_ver_consumo(p_dias integer)
returns jsonb language sql stable security invoker set search_path = pg_catalog, public
as $$
 with parametros as (
  select case when p_dias in(1,7,30,90) then p_dias else 7 end as dias
 ), tecnico as (
  select distinct on (date_trunc(case when p.dias=1 then 'minute' when p.dias=7 then 'hour' else 'day' end,s.tomado_en))
    s.tomado_en,(s.datos->>'databaseBytes')::bigint as "databaseBytes"
  from public.supabase_usage_snapshots s cross join parametros p
  where s.tipo='tecnico' and s.tomado_en>=now()-make_interval(days=>p.dias)
  order by date_trunc(case when p.dias=1 then 'minute' when p.dias=7 then 'hour' else 'day' end,s.tomado_en),s.tomado_en desc
 ), oficiales as (
  select id,tomado_en,ciclo,datos from public.supabase_usage_snapshots cross join parametros p
  where tipo='oficial' and tomado_en>=now()-make_interval(days=>p.dias)
  order by tomado_en desc limit 200
 ) select jsonb_build_object(
 'actual',(select to_jsonb(s) from public.supabase_usage_snapshots s where tipo='tecnico' order by tomado_en desc limit 1),
 'oficial',(select to_jsonb(s) from public.supabase_usage_snapshots s where tipo='oficial' order by tomado_en desc limit 1),
 'baseTecnica',coalesce((select to_jsonb(s) from public.supabase_usage_snapshots s cross join parametros p where tipo='tecnico' and tomado_en<=now()-make_interval(days=>p.dias) order by tomado_en desc limit 1),(select to_jsonb(s) from public.supabase_usage_snapshots s cross join parametros p where tipo='tecnico' and tomado_en>=now()-make_interval(days=>p.dias) order by tomado_en limit 1)),
 'oficialAnterior',(select to_jsonb(s) from public.supabase_usage_snapshots s where tipo='oficial' and ciclo=(select ciclo from public.supabase_usage_snapshots where tipo='oficial' order by tomado_en desc limit 1) and tomado_en<(select max(tomado_en) from public.supabase_usage_snapshots where tipo='oficial') order by tomado_en desc limit 1),
 'baseOficial',(select to_jsonb(s) from public.supabase_usage_snapshots s cross join parametros p where tipo='oficial' and ciclo=(select ciclo from public.supabase_usage_snapshots where tipo='oficial' order by tomado_en desc limit 1) and tomado_en<=now()-make_interval(days=>p.dias) order by tomado_en desc limit 1),
 'tecnicos',coalesce((select jsonb_agg(to_jsonb(t) order by tomado_en) from tecnico t),'[]'),
 'oficiales',coalesce((select jsonb_agg(to_jsonb(o) order by tomado_en) from oficiales o),'[]')
 );
$$;
revoke all on function public.tori_medir_consumo() from public,anon,authenticated;
revoke all on function public.tori_ver_consumo(integer) from public,anon,authenticated;
grant execute on function public.tori_medir_consumo() to service_role;
grant execute on function public.tori_ver_consumo(integer) to service_role;
notify pgrst,'reload schema';
commit;
