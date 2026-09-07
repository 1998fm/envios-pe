-- Registro de pagos (facturación): comprobantes de suscripciones MercadoPago.
-- Una fila por suscripción (preapproval), upsert: renueva conservando el último pro_until.
create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  preapproval_id text not null unique,
  plan text not null,
  monto numeric(10,2) not null,
  periodo_meses integer not null default 1,
  pro_until timestamptz not null,
  origen text not null default 'webhook',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pagos_user on public.pagos(user_id, created_at desc);