-- Archiva automáticamente todos los productos con stock 0 o negativo.
-- Ejecutar en Supabase SQL Editor. Es seguro re-ejecutar.
-- (Los que están archivados y con stock > 0 no se tocan aquí: la app los
-- reactiva sola cuando vuelven a tener stock.)

update productos
  set archivado = true,
      updated_at = now()
  where stock_actual is not null
    and stock_actual <= 0
    and archivado is not true;