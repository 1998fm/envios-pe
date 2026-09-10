-- Guardar el teléfono del cliente en la venta (snapshot, igual que nombre y dni)
alter table ventas add column if not exists persona_telefono text;

-- Backfill: teléfono actual de cada cliente para ventas ya registradas
update ventas v
  set persona_telefono = p.telefono
  from personas p
  where v.persona_id = p.id
    and v.persona_telefono is null;