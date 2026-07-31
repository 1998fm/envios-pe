create table gastos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  categoria text not null default 'OTROS' check (categoria in ('MATERIALES', 'PASAJES', 'DELIVERY', 'PUBLICIDAD', 'SERVICIOS', 'OTROS')),
  concepto text not null,
  monto numeric(10,2) not null default 0,
  fecha date not null default current_date,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table gastos enable row level security;

create policy "usuarios ven sus gastos"
  on gastos for select using (profile_id = auth.uid());
create policy "usuarios crean gastos"
  on gastos for insert with check (profile_id = auth.uid());
create policy "usuarios editan gastos"
  on gastos for update using (profile_id = auth.uid());
create policy "usuarios eliminan gastos"
  on gastos for delete using (profile_id = auth.uid());

create index idx_gastos_profile on gastos(profile_id);
