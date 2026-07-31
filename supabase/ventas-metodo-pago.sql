-- Método de pago en ventas
-- EFECTIVO, YAPE_PLIN, TARJETA
alter table ventas add column if not exists metodo_pago text not null default 'EFECTIVO';

-- Ampliar estados de venta: PENDIENTE (por confirmar pago con tarjeta)
alter table ventas drop constraint if exists ventas_estado_check;
alter table ventas add constraint ventas_estado_check
  check (estado in ('COMPLETADA', 'ANULADA', 'PENDIENTE'));
