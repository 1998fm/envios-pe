-- Ampliar estado_envio de ventas: COMPLETADO (envío finalizado)
alter table ventas drop constraint if exists ventas_estado_envio_check;
alter table ventas add constraint ventas_estado_envio_check
  check (estado_envio in ('PENDIENTE', 'EMPACADO', 'ENVIADO', 'ENTREGADO', 'COMPLETADO'));
