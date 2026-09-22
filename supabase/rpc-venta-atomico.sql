-- ============================================================
-- RPC ATÓMICOS DE VENTA (editar / anular / eliminar)
-- ============================================================
-- PROBLEMA QUE RESUELVE
-- --------------------
-- Hoy "editar una venta" se hace en 4+ llamadas separadas:
--   1) sumarStock(items viejos)   2) borrar venta_items
--   3) insertar items nuevos      4) descontarStock(items nuevos)
-- Cada paso es atómico POR PRODUCTO, pero el conjunto NO es una transacción:
-- si falla la red/BD a mitad del flujo, el stock queda descuadrado
-- (unidades de más) y no hay registro que lo delate.
--
-- SOLUCIÓN: un solo RPC plpgsql que hace TODO dentro de UNA transacción.
-- Cualquier error → ROLLBACK automático de Postgres. Además registra cada
-- movimiento en el kardex (movimientos_inventario) con tipo EDICION_VENTA /
-- ANULACION_VENTA, y bloquea la fila de la venta (FOR UPDATE) para evitar
-- anulaciones/ediciones concurrentes duplicadas.
--
-- CÓMO APLICAR: Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- Ejecutar DESPUÉS de kardex-movimientos.sql (usa sus funciones).
-- ============================================================

-- ── 1) EDITAR venta (items + montos) en una sola transacción ────────
create or replace function public.editar_venta_atomico(
  p_venta_id       uuid,
  p_items          jsonb,              -- [{producto_id?, producto_nombre, cantidad, precio_unitario, costo_unitario?}]
  p_metodo_pago    text   default null,
  p_persona_nombre text   default null,
  p_persona_dni    text   default null,
  p_monto_pagado   numeric default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_venta        public.ventas%rowtype;
  v_item_anterior record;
  v_item         record;
  v_producto_id  uuid;
  v_cantidad     integer;
  v_precio       numeric;
  v_costo        numeric;
  v_subtotal     numeric;
  v_total        numeric := 0;
  v_ok           bigint;
  v_monto        numeric;
  v_resultado    jsonb;
begin
  -- Bloquea la venta y lee su estado actual (+ items viejos si los hubiera)
  select *
    into v_venta
    from public.ventas
   where id = p_venta_id
   for update;

  if not found then
    raise exception 'Venta % no encontrada', p_venta_id;
  end if;

  -- Guarda de autorización: solo el dueño del perfil edita su venta
  if auth.uid() is not null and v_venta.profile_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  -- 1) Restaurar stock de los ítems anteriores (kardex EDICION_VENTA)
  for v_item_anterior in
    select producto_id, cantidad
      from public.venta_items
     where venta_id = p_venta_id
       and producto_id is not null
  loop
    perform 1 from public.sumar_stock(
      v_item_anterior.producto_id,
      v_item_anterior.cantidad,
      p_venta_id,
      'EDICION_VENTA',
      'Reversión edición venta'
    );
  end loop;

  -- 2) Borrar items anteriores
  delete from public.venta_items where venta_id = p_venta_id;

  -- 3) Insertar items nuevos + validar stock + descontar (mismo transacción)
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_producto_id := nullif(v_item.value->>'producto_id', '');
    v_cantidad    := (coalesce(v_item.value->>'cantidad', '1'))::integer;
    v_precio      := (coalesce(v_item.value->>'precio_unitario', '0'))::numeric;
    v_costo       := (coalesce(v_item.value->>'costo_unitario', '0'))::numeric;
    v_subtotal    := round(v_precio * v_cantidad, 2);
    v_total       := v_total + v_subtotal;

    insert into public.venta_items
      (venta_id, producto_id, producto_nombre, cantidad, precio_unitario,
       costo_unitario, subtotal)
    values
      (p_venta_id, v_producto_id, coalesce(v_item.value->>'producto_nombre', ''),
       v_cantidad, v_precio, v_costo, v_subtotal);

    if v_producto_id is not null then
      select count(*) into v_ok from public.descontar_stock(
        v_producto_id, v_cantidad, p_venta_id,
        'EDICION_VENTA', 'Descuento edición venta');
      if v_ok = 0 then
        raise exception 'Stock insuficiente para el producto % (requerido: %)',
          coalesce(v_item.value->>'producto_nombre', v_producto_id), v_cantidad;
      end if;
    end if;
  end loop;

  -- 4) Recalc monto_pagado (mismas reglas que el flujo anterior)
  if p_monto_pagado is not null and p_monto_pagado >= 0 then
    v_monto := round(p_monto_pagado, 2);
  elsif v_venta.estado = 'COMPLETADA' then
    v_monto := round(v_total, 2);
  else
    v_monto := least(round(coalesce(v_venta.monto_pagado, 0), 2), round(v_total, 2));
  end if;

  -- 5) Actualizar la venta
  update public.ventas
     set total = round(v_total, 2),
         metodo_pago = coalesce(p_metodo_pago, metodo_pago),
         persona_nombre = coalesce(p_persona_nombre, persona_nombre),
         persona_dni = coalesce(p_persona_dni, persona_dni),
         monto_pagado = v_monto,
         updated_at = now()
   where id = p_venta_id;

  -- 6) Retornar la venta actualizada con sus items
  select to_jsonb(v) || jsonb_build_object(
           'items', coalesce((
             select jsonb_agg(to_jsonb(i))
               from public.venta_items i
              where i.venta_id = p_venta_id
           ), '[]'::jsonb))
    into v_resultado
    from public.ventas v
   where v.id = p_venta_id;

  return v_resultado;
end;
$$;

-- ── 2) ANULAR venta: restaura stock + estado, atómico ────────────────
create or replace function public.anular_venta_atomico(
  p_venta_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_venta  public.ventas%rowtype;
  v_item   record;
  v_resultado jsonb;
begin
  select *
    into v_venta
    from public.ventas
   where id = p_venta_id
   for update;

  if not found then
    raise exception 'Venta % no encontrada', p_venta_id;
  end if;

  -- Guarda de autorización (ver editar_venta_atomico)
  if auth.uid() is not null and v_venta.profile_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  if v_venta.estado not in ('COMPLETADA', 'PENDIENTE') then
    raise exception 'Solo se puede anular una venta completada o pendiente';
  end if;

  -- Restaurar stock (kardex ANULACION_VENTA)
  for v_item in
    select producto_id, cantidad
      from public.venta_items
     where venta_id = p_venta_id
       and producto_id is not null
  loop
    perform 1 from public.sumar_stock(
      v_item.producto_id, v_item.cantidad,
      p_venta_id, 'ANULACION_VENTA', 'Anulación venta');
  end loop;

  update public.ventas
     set estado = 'ANULADA',
         updated_at = now()
   where id = p_venta_id;

  select to_jsonb(v) || jsonb_build_object(
           'items', coalesce((
             select jsonb_agg(to_jsonb(i))
               from public.venta_items i
              where i.venta_id = p_venta_id
           ), '[]'::jsonb))
    into v_resultado
    from public.ventas v
   where v.id = p_venta_id;

  return v_resultado;
end;
$$;

-- ── 3) ELIMINAR venta: restaura stock (si aplica) + borra, atómico ───
create or replace function public.eliminar_venta_atomico(
  p_venta_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_venta  public.ventas%rowtype;
  v_item   record;
begin
  select *
    into v_venta
    from public.ventas
   where id = p_venta_id
   for update;

  if not found then
    raise exception 'Venta % no encontrada', p_venta_id;
  end if;

  -- Guarda de autorización (ver editar_venta_atomico)
  if auth.uid() is not null and v_venta.profile_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  -- Restauran stock COMPLETADA y PENDIENTE (el POST descuenta siempre).
  -- ANULADA ya devolvió su stock al anularse.
  if v_venta.estado in ('COMPLETADA', 'PENDIENTE') then
    for v_item in
      select producto_id, cantidad
        from public.venta_items
       where venta_id = p_venta_id
         and producto_id is not null
    loop
      perform 1 from public.sumar_stock(
        v_item.producto_id, v_item.cantidad,
        p_venta_id, 'ANULACION_VENTA', 'Eliminación venta');
    end loop;
  end if;

  delete from public.venta_items where venta_id = p_venta_id;
  delete from public.ventas where id = p_venta_id;

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- VERIFICACIÓN:
--   select proname from pg_proc where proname in
--     ('editar_venta_atomico','anular_venta_atomico','eliminar_venta_atomico');
--   -- Esperado: 3 filas
-- ============================================================