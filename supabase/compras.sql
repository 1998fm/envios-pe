create table compras (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  proveedor text not null,
  total numeric(10,2) default 0,
  estado text not null default 'COMPLETADA' check (estado in ('COMPLETADA', 'ANULADA')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references compras(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  producto_nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

alter table compras enable row level security;
alter table compra_items enable row level security;

create policy "usuarios ven sus compras"
  on compras for select using (profile_id = auth.uid());
create policy "usuarios crean compras"
  on compras for insert with check (profile_id = auth.uid());
create policy "usuarios editan compras"
  on compras for update using (profile_id = auth.uid());
create policy "usuarios eliminan compras"
  on compras for delete using (profile_id = auth.uid());

create policy "usuarios ven items de compras"
  on compra_items for select using (
    exists (select 1 from compras where compras.id = compra_items.compra_id and compras.profile_id = auth.uid())
  );
create policy "usuarios crean items"
  on compra_items for insert with check (
    exists (select 1 from compras where compras.id = compra_items.compra_id and compras.profile_id = auth.uid())
  );
create policy "usuarios eliminan items"
  on compra_items for delete using (
    exists (select 1 from compras where compras.id = compra_items.compra_id and compras.profile_id = auth.uid())
  );

create index idx_compras_profile on compras(profile_id);
create index idx_compra_items_compra on compra_items(compra_id);
