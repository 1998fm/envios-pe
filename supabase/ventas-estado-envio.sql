alter table ventas add column estado_envio text not null default 'PENDIENTE'
  check (estado_envio in ('PENDIENTE', 'EMPACADO', 'ENVIADO', 'ENTREGADO'));

alter table ventas add column envio_id uuid references envios(id);
