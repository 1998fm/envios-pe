-- ============================================================
-- CÓDIGOS LEGIBLES: E-0001 (envios) y V-0001 (ventas)
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Agrega una columna codigo con correlativo por negocio (user_id/profile_id).
-- ============================================================

alter table envios add column if not exists codigo text;
alter table ventas add column if not exists codigo text;

-- ------------------------------------------------------------
-- 1) Backfill: asignar correlativo a los registros existentes
--    ordenados por antigüedad dentro de cada negocio.
-- ------------------------------------------------------------
with numerados as (
  select id, user_id,
         row_number() over (partition by user_id order by fecha_registro, id) as rn
  from envios
  where codigo is null or codigo = ''
)
update envios e
set codigo = 'E-' || lpad(n.rn::text, 4, '0')
from numerados n
where e.id = n.id;

with numerados as (
  select id, profile_id,
         row_number() over (partition by profile_id order by created_at, id) as rn
  from ventas
  where codigo is null or codigo = ''
)
update ventas v
set codigo = 'V-' || lpad(n.rn::text, 4, '0')
from numerados n
where v.id = n.id;

-- ------------------------------------------------------------
-- 2) Correlativo automático para nuevos registros.
-- ------------------------------------------------------------
create table if not exists secuencias_codigos (
  owner_id uuid not null,
  tipo text not null,
  ultimo bigint not null default 0,
  primary key (owner_id, tipo)
);

create or replace function next_codigo_correlativo(p_owner uuid, p_tipo text, p_prefijo text)
returns text
language plpgsql
volatile
as $$
declare
  v_ultimo bigint;
begin
  insert into secuencias_codigos (owner_id, tipo, ultimo)
  values (p_owner, p_tipo, 1)
  on conflict (owner_id, tipo)
  do update set ultimo = secuencias_codigos.ultimo + 1
  returning ultimo into v_ultimo;
  return p_prefijo || '-' || lpad(v_ultimo::text, 4, '0');
end;
$$;

-- ------------------------------------------------------------
-- 3) Sembrar secuencia inicial (continuar desde el correlativo actual).
-- ------------------------------------------------------------
insert into secuencias_codigos (owner_id, tipo, ultimo)
select user_id, 'envio',
       max(coalesce(nullif(split_part(codigo, '-', 2), ''), '0')::int)
from envios
where codigo ~ '^E-[0-9]+$'
group by user_id
on conflict (owner_id, tipo) do update set ultimo = secuencias_codigos.ultimo;

insert into secuencias_codigos (owner_id, tipo, ultimo)
select profile_id, 'venta',
       max(coalesce(nullif(split_part(codigo, '-', 2), ''), '0')::int)
from ventas
where codigo ~ '^V-[0-9]+$'
group by profile_id
on conflict (owner_id, tipo) do update set ultimo = secuencias_codigos.ultimo;

-- ------------------------------------------------------------
-- 4) Triggers de asignación en INSERT.
-- ------------------------------------------------------------
create or replace function asignar_codigo_envio()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := next_codigo_correlativo(new.user_id, 'envio', 'E');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_envios_codigo on envios;
create trigger trg_envios_codigo
before insert on envios
for each row execute function asignar_codigo_envio();

create or replace function asignar_codigo_venta()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := next_codigo_correlativo(new.profile_id, 'venta', 'V');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ventas_codigo on ventas;
create trigger trg_ventas_codigo
before insert on ventas
for each row execute function asignar_codigo_venta();