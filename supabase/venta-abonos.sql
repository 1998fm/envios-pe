-- Abonos parciales: pagos parciales contra una venta.
-- Cada abono suma al monto_pagado de la venta; cuando monto_pagado >= total,
-- la venta se marca COMPLETADA automáticamente (se hace desde la API).
create table if not exists public.venta_abonos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  metodo_pago text not null default 'EFECTIVO',
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_venta_abonos_venta on public.venta_abonos(venta_id, created_at);

-- Monto total pagado de cada venta (se sincroniza desde la API de abonos)
alter table public.ventas add column if not exists monto_pagado numeric(10,2) not null default 0;

-- Backfill: las ventas ya COMPLETADAS antes de este cambio se consideran
-- cobradas en su totalidad (mantener saldo disponible del dashboard coherente).
update public.ventas set monto_pagado = total where estado = 'COMPLETADA' and monto_pagado = 0;