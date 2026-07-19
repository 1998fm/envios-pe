create table if not exists envio_items (
  id uuid default gen_random_uuid() primary key,
  envio_id uuid not null references envios(id) on delete cascade,
  venta_item_id uuid not null references venta_items(id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  created_at timestamptz default now(),
  unique(envio_id, venta_item_id)
);

alter table envio_items enable row level security;

create policy "envio_items_select" on envio_items for select
  using (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));

create policy "envio_items_insert" on envio_items for insert
  with check (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));

create policy "envio_items_update" on envio_items for update
  using (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));

create policy "envio_items_delete" on envio_items for delete
  using (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));
