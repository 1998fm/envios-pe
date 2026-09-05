-- Cerrar el formulario también en días específicos de la semana.
-- cerrar_formulario_dias = arreglo de nombres de día (MONDAY..SUNDAY).
-- Vacío ('{}') = sin cierre por día. Funciona junto con la hora de corte
-- de motorizado/agencias: se cierra si cumple cualquiera de las condiciones.
alter table profiles
  add column if not exists cerrar_formulario_dias text[] not null default '{}';