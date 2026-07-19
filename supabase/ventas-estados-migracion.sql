-- IMPORTANTE: Las ventas se crean como COMPLETADA (default en POST /api/ventas)
-- Primero actualiza todas las ventas PENDIENTE existentes a COMPLETADA
update ventas set estado = 'COMPLETADA' where estado = 'PENDIENTE';


-- Luego cambia el constraint (ya no hay filas que lo violen)
alter table ventas drop constraint ventas_estado_check;
alter table ventas add constraint ventas_estado_check check (estado in ('COMPLETADA', 'ANULADA'));
alter table ventas alter column estado set default 'COMPLETADA';

