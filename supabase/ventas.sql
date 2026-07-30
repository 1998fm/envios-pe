create table ventas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  persona_id uuid not null references personas(id),
  persona_nombre text not null,
  persona_dni text not null,
  total numeric(10,2) default 0,
  estado text not null default 'COMPLETADA' check (estado in ('COMPLETADA', 'ANULADA')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references ventas(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  producto_nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

alter table ventas enable row level security;
alter table venta_items enable row level security;

create policy "usuarios ven sus ventas"
  on ventas for select using (profile_id = auth.uid());
create policy "usuarios crean ventas"
  on ventas for insert with check (profile_id = auth.uid());
create policy "usuarios editan ventas"
  on ventas for update using (profile_id = auth.uid());
create policy "usuarios eliminan ventas"
  on ventas for delete using (profile_id = auth.uid());

create policy "usuarios ven items de ventas"
  on venta_items for select using (
    exists (select 1 from ventas where ventas.id = venta_items.venta_id and ventas.profile_id = auth.uid())
  );
create policy "usuarios crean items"
  on venta_items for insert with check (
    exists (select 1 from ventas where ventas.id = venta_items.venta_id and ventas.profile_id = auth.uid())
  );
create policy "usuarios eliminan items"
  on venta_items for delete using (
    exists (select 1 from ventas where ventas.id = venta_items.venta_id and ventas.profile_id = auth.uid())
  );

create index idx_ventas_profile on ventas(profile_id);
create index idx_ventas_persona on ventas(persona_id);
create index idx_venta_items_venta on venta_items(venta_id);
