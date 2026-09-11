-- Permitir clientes sin teléfono: la app crea personas con telefono null
-- en "Registro rápido" de ventas y al guardar envíos.
alter table personas alter column telefono drop not null;