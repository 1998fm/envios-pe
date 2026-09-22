-- ============================================================
-- KARDEX DE INVENTARIO (NO toca ningún stock actual existente)
-- ============================================================
-- Propósito:
--   1) Tabla movimientos_inventario = libro de movimientos (kardex).
--   2) Los RPC de stock (descontar/sumar/restar) se RE-ESCRIBEN para que,
--      dentro de la MISMA transacción atómica, actualicen el saldo y
--      registren su movimiento. Firma y retorno IGUALES → no rompe nada.
--   3) NUEVO ajustar_stock(...): ajuste de inventario con motivo obligatorio.
--   4) NUEVO bloqueo en restar_stock: al anular una compra ya vendida,
--      se RECHAZA (no deja stock negativo).
--
-- IMPORTANTE: este script NO modifica valores existentes de stock_actual.
-- Solo cambia el código de las funciones y agrega registros nuevos al
-- kardex. Los saldos actuales quedan idénticos.
--
-- CÓMO APLICAR: Supabase → SQL Editor → pegar TODO → Run. Idempotente.
-- NOTA: este archivo SÚPERA a supabase/rpc-stock.sql (misma tabla, funciones
-- con auditoría). Ejecutarlo DESPUÉS de rpc-stock.sql, o simplemente usar
-- este archivo como fuente de verdad de los RPC de stock.
-- ============================================================

-- ── 1) Tabla Kardex ─────────────────────────────────────────────
create table if not exists public.movimientos_inventario (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  producto_id    uuid not null references public.productos(id) on delete cascade,
  tipo           text not null check (tipo in
    ('COMPRA','VENTA','ANULACION_COMPRA','ANULACION_VENTA','AJUSTE','EDICION_VENTA')),
  cantidad       integer not null,              -- + entra, - sale
  saldo_antes    integer not null,
  saldo_despues  integer not null,
  referencia_id  uuid,                           -- venta/compra que lo originó
  motivo         text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_mov_inv_producto
  on public.movimientos_inventario (producto_id, created_at desc);
create index if not exists idx_mov_inv_referencia
  on public.movimientos_inventario (referencia_id);
create index if not exists idx_mov_inv_perfil
  on public.movimientos_inventario (profile_id, created_at desc);

alter table public.movimientos_inventario enable row level security;

-- Solo el dueño del perfil puede leer su kardex (escritura vía RPC definer)
drop policy if exists "kardex lectura propio perfil"
  on public.movimientos_inventario;
create policy "kardex lectura propio perfil"
  on public.movimientos_inventario for select
  using (profile_id = auth.uid());

-- ── 2) DESCONTAR stock (ventas): atómico, nunca negativo, con kardex ─
create or replace function public.descontar_stock(
  p_producto_id    uuid,
  p_cantidad       integer,
  p_referencia_id  uuid   default null,
  p_tipo           text   default 'VENTA',
  p_motivo         text   default null
)
returns table (stock_final integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_saldo_antes   integer;
  v_saldo_despues integer;
  v_profile_id    uuid;
begin
  -- Bloquea la fila del producto para serializar descuentos concurrentes
  select stock_actual, profile_id
    into v_saldo_antes, v_profile_id
    from public.productos
   where id = p_producto_id
   for update;

  if not found then
    return;  -- 0 filas: producto inexistente
  end if;

  -- Guarda de autorización: con service role (backend) auth.uid() es null y se
  -- permite; con un cliente anónimo solo se opera sobre inventario propio.
  if auth.uid() is not null and v_profile_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  if v_saldo_antes < p_cantidad then
    return;  -- 0 filas: stock insuficiente (la app distingue con lectura ligera)
  end if;

  update public.productos
     set stock_actual = stock_actual - p_cantidad,
         updated_at   = now()
   where id = p_producto_id
     and stock_actual >= p_cantidad
   returning stock_actual::integer into v_saldo_despues;

  if not found then
    return;
  end if;

  insert into public.movimientos_inventario
    (profile_id, producto_id, tipo, cantidad, saldo_antes, saldo_despues,
     referencia_id, motivo)
  values
    (v_profile_id, p_producto_id, p_tipo, -p_cantidad, v_saldo_antes,
     v_saldo_despues, p_referencia_id, coalesce(p_motivo, 'Venta'));

  return query select v_saldo_despues::integer;
end;
$$;

-- ── 3) SUMAR stock (compras / reversiones): atómico, con kardex ──────
create or replace function public.sumar_stock(
  p_producto_id    uuid,
  p_cantidad       integer,
  p_referencia_id  uuid   default null,
  p_tipo           text   default 'COMPRA',
  p_motivo         text   default null
)
returns table (stock_final integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_saldo_antes   integer;
  v_saldo_despues integer;
  v_profile_id    uuid;
begin
  select stock_actual, profile_id
    into v_saldo_antes, v_profile_id
    from public.productos
   where id = p_producto_id
   for update;

  if not found then
    return;
  end if;

  -- Guarda de autorización (ver descontar_stock)
  if auth.uid() is not null and v_profile_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  update public.productos
     set stock_actual = stock_actual + p_cantidad,
         updated_at   = now()
   where id = p_producto_id
   returning stock_actual::integer into v_saldo_despues;

  insert into public.movimientos_inventario
    (profile_id, producto_id, tipo, cantidad, saldo_antes, saldo_despues,
     referencia_id, motivo)
  values
    (v_profile_id, p_producto_id, p_tipo, p_cantidad, v_saldo_antes,
     v_saldo_despues, p_referencia_id, coalesce(p_motivo, 'Compra'));

  return query select v_saldo_despues::integer;
end;
$$;

-- ── 4) RESTAR stock (anular compras): BLOQUEA si el stock no alcanza ─
-- ANTES permitía dejar stock negativo silenciosamente. DECISIÓN DE NEGOCIO:
-- si se intenta anular una compra cuyos ítems ya se vendieron, se REVÉRSA la
-- anulación (0 filas) para no fabricar stock fantasma negativo.
create or replace function public.restar_stock(
  p_producto_id    uuid,
  p_cantidad       integer,
  p_referencia_id  uuid   default null,
  p_tipo           text   default 'ANULACION_COMPRA',
  p_motivo         text   default null
)
returns table (stock_final integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_saldo_antes   integer;
  v_saldo_despues integer;
  v_profile_id    uuid;
begin
  select stock_actual, profile_id
    into v_saldo_antes, v_profile_id
    from public.productos
   where id = p_producto_id
   for update;

  if not found then
    return;
  end if;

  -- Guarda de autorización (ver descontar_stock)
  if auth.uid() is not null and v_profile_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  -- Guarda: no se resta si no hay saldo suficiente (bloquea el negativo)
  update public.productos
     set stock_actual = stock_actual - p_cantidad,
         updated_at   = now()
   where id = p_producto_id
     and stock_actual >= p_cantidad
   returning stock_actual::integer into v_saldo_despues;

  if not found then
    return;  -- 0 filas: stock insuficiente → la anulación queda bloqueada
  end if;

  insert into public.movimientos_inventario
    (profile_id, producto_id, tipo, cantidad, saldo_antes, saldo_despues,
     referencia_id, motivo)
  values
    (v_profile_id, p_producto_id, p_tipo, -p_cantidad, v_saldo_antes,
     v_saldo_despues, p_referencia_id, coalesce(p_motivo, 'Anulación compra'));

  return query select v_saldo_despues::integer;
end;
$$;

-- ── 5) AJUSTAR stock (manual): motivo obligatorio, nunca negativo ─────
create or replace function public.ajustar_stock(
  p_producto_id  uuid,
  p_stock_nuevo  integer,
  p_motivo       text
)
returns table (stock_final integer)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_saldo_antes integer;
  v_delta       integer;
  v_profile_id  uuid;
begin
  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'Ajuste de stock requiere un motivo';
  end if;

  if p_stock_nuevo < 0 then
    raise exception 'El stock ajustado no puede ser negativo';
  end if;

  select stock_actual, profile_id
    into v_saldo_antes, v_profile_id
    from public.productos
   where id = p_producto_id
   for update;

  if not found then
    return;
  end if;

  -- Guarda de autorización (ver descontar_stock)
  if auth.uid() is not null and v_profile_id <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  v_delta := p_stock_nuevo - v_saldo_antes;

  update public.productos
     set stock_actual = p_stock_nuevo,
         updated_at   = now()
   where id = p_producto_id;

  if v_delta <> 0 then
    insert into public.movimientos_inventario
      (profile_id, producto_id, tipo, cantidad, saldo_antes, saldo_despues,
       referencia_id, motivo)
    values
      (v_profile_id, p_producto_id, 'AJUSTE', v_delta, v_saldo_antes,
       p_stock_nuevo, null, p_motivo);
  end if;

  return query select p_stock_nuevo::integer;
end;
$$;

-- ============================================================
-- VERIFICACIÓN:
--   select proname from pg_proc where proname in
--     ('descontar_stock','sumar_stock','restar_stock','ajustar_stock');
--   select tablename from pg_tables where tablename='movimientos_inventario';
-- ============================================================