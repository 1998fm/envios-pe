-- Cola privada y durable: no borra ni modifica registros de negocio.
create table if not exists public.mp_eventos (
 id text primary key,
 tipo text not null check (tipo in ('payment','subscription_authorized_payment','subscription_preapproval')),
 recurso text not null check (recurso ~ '^[A-Za-z0-9_-]{1,100}$'),
 estado text not null default 'pendiente' check (estado in ('pendiente','procesando','error','completado','ignorado')),
 intentos integer not null default 0,
 creado_en timestamptz not null default now(),
 actualizado_en timestamptz not null default now(),
 proximo_intento timestamptz not null default now(),
 lease uuid,
 codigo text,
 detalle text,
 origen text not null default 'webhook'
);
create index if not exists mp_eventos_pendientes on public.mp_eventos(proximo_intento,creado_en) where estado in ('pendiente','error','procesando');
create table if not exists public.mp_conciliaciones (
 id uuid primary key default gen_random_uuid(),
 inicio timestamptz not null default now(),
 fin timestamptz,
 origen text not null,
 ok boolean,
 resultado jsonb
);
alter table public.mp_eventos enable row level security;
alter table public.mp_conciliaciones enable row level security;
revoke all on public.mp_eventos,public.mp_conciliaciones from public,anon,authenticated;
grant select,insert,update on public.mp_eventos,public.mp_conciliaciones to service_role;
-- Un trabajador por evento, con recuperación de trabajos interrumpidos.
create or replace function public.tori_tomar_evento_mp(p_id text default null)
returns jsonb language plpgsql security invoker set search_path = public,pg_temp as $$
declare v public.mp_eventos;
begin
 select * into v from public.mp_eventos
 where (p_id is null or id=p_id)
 and ((estado in ('pendiente','error') and (p_id is not null or proximo_intento<=now()))
 or (estado='procesando' and actualizado_en<now()-interval '6 minutes'))
 order by creado_en for update skip locked limit 1;
 if not found then return null; end if;
 update public.mp_eventos set estado='procesando',intentos=intentos+1,actualizado_en=now(),lease=gen_random_uuid()
 where id=v.id returning * into v;
 return to_jsonb(v);
end $$;
revoke all on function public.tori_tomar_evento_mp(text) from public,anon,authenticated;
grant execute on function public.tori_tomar_evento_mp(text) to service_role;
