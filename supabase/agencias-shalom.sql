-- =============================================
-- AGENCIAS SHALOM — Envios.pe
-- Tabla que guarda la lista de agencias Shalom
-- sincronizada desde el endpoint oficial de Shalom
-- (serviceswebapi.shalomcontrol.com/api/v1/web/agencias/listar).
--
-- La sincronización la hace la ruta /api/shalom/sync (cron semanal
-- en Vercel) usando el adaptador src/lib/shalom/agencias.ts.
-- =============================================

create table if not exists public.agencias_shalom (
  ter_id         bigint primary key,
  etiqueta       text not null,             -- "DEPARTAMENTO / PROVINCIA / DISTRITO / AGENCIA"
  departamento   text,
  provincia      text,
  lugar          text,
  direccion      text,
  telefono       text,
  latitud        text,
  longitud       text,
  activa         boolean not null default true,
  actualizada_en timestamptz not null default now()
);

-- Índice de búsqueda por texto (para el autocomplete del cliente)
create index if not exists agencias_shalom_etiqueta_idx
  on public.agencias_shalom (etiqueta);

-- Índice por departamento (filtros rápidos)
create index if not exists agencias_shalom_departamento_idx
  on public.agencias_shalom (departamento);

-- Para consultas de solo activas
create index if not exists agencias_shalom_activa_idx
  on public.agencias_shalom (activa);

-- RLS: lectura pública habilitada (los clientes la leen), escritura
-- solo para el servicio. El lado servidor usa la service_role key que
-- ignora RLS, así que basta con permitir SELECT anónimo y bloqueo escrito.
alter table public.agencias_shalom enable row level security;

-- Los visitantes (formulario público) pueden leer la lista.
create policy "agencias_shalom_select_anon"
  on public.agencias_shalom for select
  using (true);

-- Sin policies de insert/update/delete: solo se gestiona desde el
-- servidor con service_role (que ignora RLS).
