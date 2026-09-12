-- =============================================
-- AGENCIAS OLVA COURIER — Envios.pe
-- Tabla que guarda la lista de tiendas/agencia Olva
-- sincronizada desde el endpoint oficial de Olva
-- (admin-ajax.php?action=get_olva_stores).
--
-- La sincronización la hace la ruta /api/olva/sync (cron semanal
-- en Vercel) usando el adaptador src/lib/olva/agencias.ts.
-- =============================================

create table if not exists public.agencias_olva (
  office_id      text primary key,
  nombres        text not null,          -- ej: "TIENDA CHACHAPOYAS - JR. ORTIZ ARRIETA N° 270"
  direccion      text,
  department     text,                   -- departamento (sin acentos, como lo manda Olva)
  province       text,
  district       text,
  office_type    text,                   -- OFICINAS EXTERNAS / OFICINA OPERACIONES / AGENTE / OFICINA IN HOUSE
  lat            text,
  lng            text,
  activa         boolean not null default true,
  actualizada_en timestamptz not null default now()
);

-- Índice por departamento (filtros rápidos por provincia)
create index if not exists agencias_olva_department_idx
  on public.agencias_olva (department);

-- Índice por provincia (el formulario filtra "provincia -> agencias")
create index if not exists agencias_olva_province_idx
  on public.agencias_olva (province);

-- Para consultas de solo activas
create index if not exists agencias_olva_activa_idx
  on public.agencias_olva (activa);

-- RLS: lectura pública habilitada (los clientes la leen), escritura
-- solo para el servicio. El lado servidor usa la service_role key que
-- ignora RLS, así que basta con permitir SELECT anónimo y bloqueo escrito.
alter table public.agencias_olva enable row level security;

-- Los visitantes (formulario público) pueden leer la lista.
create policy "agencias_olva_select_anon"
  on public.agencias_olva for select
  using (true);

-- Sin policies de insert/update/delete: solo se gestiona desde el
-- servidor con service_role (que ignora RLS).