-- Costo unitario en items de venta (para calcular ganancia por venta)
-- Se guarda una "foto" del costo del producto al momento de la venta
alter table venta_items add column if not exists costo_unitario numeric(10,2) not null default 0;

-- Backfill: costo actual de cada producto para ventas ya registradas
update venta_items vi
set costo_unitario = coalesce(p.precio_compra, 0)
from productos p
where vi.producto_id = p.id
  and vi.costo_unitario = 0;