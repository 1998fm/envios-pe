create table productos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  nombre text not null,
  sku text,
  descripcion text,
  precio_venta numeric(10,2) default 0,
  precio_compra numeric(10,2) default 0,
  stock_actual integer default 0,
  stock_minimo integer default 0,
  unidad text default 'unidad',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table productos enable row level security;

create policy "usuarios ven sus productos"
  on productos for select using (profile_id = auth.uid());
create policy "usuarios crean productos"
  on productos for insert with check (profile_id = auth.uid());
create policy "usuarios editan productos"
  on productos for update using (profile_id = auth.uid());
create policy "usuarios eliminan productos"
  on productos for delete using (profile_id = auth.uid());

create index idx_productos_profile on productos(profile_id);
create index idx_productos_sku on productos(profile_id, sku);
