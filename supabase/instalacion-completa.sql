-- ============================================================
-- INSTALACIÓN COMPLETA — Tori (envios-pe)
-- ============================================================
-- Deja lista una base de Supabase NUEVA y vacía. Pégalo entero en
-- Supabase → SQL Editor → New query → Run (una sola vez).
--
-- Archivo generado: NO se edita a mano. Para regenerarlo:
--   node scripts/local-db/generar-instalacion.mjs
--
-- Después de ejecutarlo hay que hacer a mano (ver el README del proyecto):
--   1. Storage → crear el bucket público "logos".
--   2. Registrar tu usuario y volverlo super admin:
--        UPDATE profiles SET role = 'super_admin'
--         WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-correo@ejemplo.com');
--   3. Auth → URL Configuration: Site URL y Redirect URL  <tu-sitio>/auth/callback
--
-- Incluye supabase/acceso-solo-servidor.sql al final: el navegador no accede a la
-- base, solo el servidor de la app (requiere la versión actual de la app).
-- ============================================================


-- >>>>>>>>>> tablas base (profiles, envios, tarifas_moto) <<<<<<<<<<
-- Tablas base que en producción se crearon a mano desde el panel de Supabase
-- y por eso NO existen en supabase/*.sql. Reconstruidas a partir del uso en
-- el código y de los ALTER TABLE del repositorio. Las columnas que añade un
-- script de supabase/ NO se declaran aquí (se crean al aplicar ese script).

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa text,
  telefono text,
  direccion text,
  slug text UNIQUE,
  origen_shalom text,
  logo_url text,
  redirect_url text,
  redirect_message text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  web_url text,
  whatsapp_url text,
  metodo_motorizado boolean DEFAULT false,
  metodo_shalom boolean DEFAULT false,
  metodo_olva boolean DEFAULT false,
  metodo_marvisur boolean DEFAULT false,
  metodo_flores boolean DEFAULT false,
  metodo_otro boolean DEFAULT false,
  nombre_metodo_otro text,
  logistica_moto_dias text[] DEFAULT '{MONDAY}',
  logistica_moto_usa_hora_corte boolean DEFAULT false,
  logistica_moto_hora_corte time DEFAULT '18:00',
  logistica_moto_limitar boolean DEFAULT false,
  logistica_moto_cupo integer DEFAULT 0,
  logistica_agencias_dias text[] DEFAULT '{MONDAY}',
  logistica_agencias_usa_hora_corte boolean DEFAULT false,
  logistica_agencias_hora_corte time DEFAULT '18:00',
  logistica_agencias_limitar boolean DEFAULT false,
  logistica_agencias_cupo integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre text,
  dni text,
  telefono text,
  metodo text,
  nombre_metodo text,
  destino text,
  direccion text,
  referencia text,
  detalle text,
  observaciones text,
  tamano text,
  estado text NOT NULL DEFAULT 'NO_EMPACADO',
  fecha_registro timestamptz NOT NULL DEFAULT now(),
  fecha_programada timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT estado_valido CHECK (estado IN ('NO_EMPACADO', 'EMPACADO', 'ENVIADO'))
);

-- Forma final de tarifas_moto (ver supabase/asegurar-tarifas-moto-final.sql).
CREATE TABLE IF NOT EXISTS public.tarifas_moto (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tarifas jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- >>>>>>>>>> supabase/clientes-table.sql <<<<<<<<<<
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cliente_de (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(persona_id, profile_id)
);

CREATE INDEX idx_cliente_de_profile ON cliente_de(profile_id);
CREATE INDEX idx_personas_dni ON personas(dni);

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_de ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_de_select_owner"
  ON cliente_de FOR SELECT
  USING (profile_id = auth.uid());

-- >>>>>>>>>> supabase/personas-dni-nullable.sql <<<<<<<<<<
-- Hacer dni nullable para permitir crear personas sin DNI
alter table personas alter column dni drop not null;

-- >>>>>>>>>> supabase/personas-telefono-nullable.sql <<<<<<<<<<
-- Permitir clientes sin teléfono: la app crea personas con telefono null
-- en "Registro rápido" de ventas y al guardar envíos.
alter table personas alter column telefono drop not null;

-- >>>>>>>>>> supabase/inventario.sql <<<<<<<<<<
create table productos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  nombre text not null,
  sku text,
  descripcion text,
  precio_venta numeric(10,2) default 0,
  precio_compra numeric(10,2) default 0,
  stock_actual integer default 0,
  stock_minimo integer default 0,
  unidad text default 'unidad',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table productos enable row level security;

create policy "usuarios ven sus productos"
  on productos for select using (profile_id = auth.uid());
create policy "usuarios crean productos"
  on productos for insert with check (profile_id = auth.uid());
create policy "usuarios editan productos"
  on productos for update using (profile_id = auth.uid());
create policy "usuarios eliminan productos"
  on productos for delete using (profile_id = auth.uid());

create index idx_productos_profile on productos(profile_id);
create index idx_productos_sku on productos(profile_id, sku);

-- >>>>>>>>>> supabase/productos-archivados.sql <<<<<<<<<<
-- =============================================================================
-- Archivar productos: columna 'archivado' para separar activos de archivados
-- sin borrar el registro (historial de ventas/compras intacto).
--
-- Cómo aplicar:
--   1) En Supabase: SQL Editor → New query → pega y ejecuta este archivo completo.
-- =============================================================================

alter table public.productos
  add column if not exists archivado boolean not null default false;

create index if not exists productos_profile_archivado_idx
  on public.productos (profile_id, archivado);

-- >>>>>>>>>> supabase/productos-imagenes.sql <<<<<<<<<<
-- ============================================================
-- IMÁGENES DE PRODUCTO (bucket público 'productos')
--
-- Las fotos se COMPRIMEN en el navegador (~30-60 KB) antes de
-- subirse, así el 1 GB del Storage rinde ~20,000 imágenes.
-- Ruta: {user_id}/producto-{timestamp}.jpg
-- Al eliminar un producto, la API también borra su archivo.
--
-- Idempotente: se puede ejecutar varias veces sin daño.
-- ============================================================

-- 1) Bucket público (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Políticas de acceso al bucket
DROP POLICY IF EXISTS "Productos imagen lectura publica" ON storage.objects;
CREATE POLICY "Productos imagen lectura publica"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "Productos imagen subir dueno" ON storage.objects;
CREATE POLICY "Productos imagen subir dueno"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Productos imagen actualizar dueno" ON storage.objects;
CREATE POLICY "Productos imagen actualizar dueno"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Productos imagen borrar dueno" ON storage.objects;
CREATE POLICY "Productos imagen borrar dueno"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Columna para la URL pública de la foto
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS imagen_url text;

-- Verificación
SELECT id, public FROM storage.buckets WHERE id = 'productos';
SELECT column_name FROM information_schema.columns
WHERE table_name = 'productos' AND column_name = 'imagen_url';

-- >>>>>>>>>> supabase/compras.sql <<<<<<<<<<
create table compras (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  proveedor text not null,
  total numeric(10,2) default 0,
  estado text not null default 'COMPLETADA' check (estado in ('COMPLETADA', 'ANULADA')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references compras(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  producto_nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

alter table compras enable row level security;
alter table compra_items enable row level security;

create policy "usuarios ven sus compras"
  on compras for select using (profile_id = auth.uid());
create policy "usuarios crean compras"
  on compras for insert with check (profile_id = auth.uid());
create policy "usuarios editan compras"
  on compras for update using (profile_id = auth.uid());
create policy "usuarios eliminan compras"
  on compras for delete using (profile_id = auth.uid());

create policy "usuarios ven items de compras"
  on compra_items for select using (
    exists (select 1 from compras where compras.id = compra_items.compra_id and compras.profile_id = auth.uid())
  );
create policy "usuarios crean items"
  on compra_items for insert with check (
    exists (select 1 from compras where compras.id = compra_items.compra_id and compras.profile_id = auth.uid())
  );
create policy "usuarios eliminan items"
  on compra_items for delete using (
    exists (select 1 from compras where compras.id = compra_items.compra_id and compras.profile_id = auth.uid())
  );

create index idx_compras_profile on compras(profile_id);
create index idx_compra_items_compra on compra_items(compra_id);

-- >>>>>>>>>> supabase/gastos.sql <<<<<<<<<<
create table gastos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  categoria text not null default 'OTROS' check (categoria in ('MATERIALES', 'PASAJES', 'DELIVERY', 'PUBLICIDAD', 'SERVICIOS', 'OTROS')),
  concepto text not null,
  monto numeric(10,2) not null default 0,
  fecha date not null default current_date,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table gastos enable row level security;

create policy "usuarios ven sus gastos"
  on gastos for select using (profile_id = auth.uid());
create policy "usuarios crean gastos"
  on gastos for insert with check (profile_id = auth.uid());
create policy "usuarios editan gastos"
  on gastos for update using (profile_id = auth.uid());
create policy "usuarios eliminan gastos"
  on gastos for delete using (profile_id = auth.uid());

create index idx_gastos_profile on gastos(profile_id);

-- >>>>>>>>>> supabase/ventas.sql <<<<<<<<<<
create table ventas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  persona_id uuid not null references personas(id),
  persona_nombre text not null,
  persona_dni text not null,
  total numeric(10,2) default 0,
  estado text not null default 'COMPLETADA' check (estado in ('COMPLETADA', 'ANULADA')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references ventas(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  producto_nombre text not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

alter table ventas enable row level security;
alter table venta_items enable row level security;

create policy "usuarios ven sus ventas"
  on ventas for select using (profile_id = auth.uid());
create policy "usuarios crean ventas"
  on ventas for insert with check (profile_id = auth.uid());
create policy "usuarios editan ventas"
  on ventas for update using (profile_id = auth.uid());
create policy "usuarios eliminan ventas"
  on ventas for delete using (profile_id = auth.uid());

create policy "usuarios ven items de ventas"
  on venta_items for select using (
    exists (select 1 from ventas where ventas.id = venta_items.venta_id and ventas.profile_id = auth.uid())
  );
create policy "usuarios crean items"
  on venta_items for insert with check (
    exists (select 1 from ventas where ventas.id = venta_items.venta_id and ventas.profile_id = auth.uid())
  );
create policy "usuarios eliminan items"
  on venta_items for delete using (
    exists (select 1 from ventas where ventas.id = venta_items.venta_id and ventas.profile_id = auth.uid())
  );

create index idx_ventas_profile on ventas(profile_id);
create index idx_ventas_persona on ventas(persona_id);
create index idx_venta_items_venta on venta_items(venta_id);

-- >>>>>>>>>> supabase/ventas-estados-migracion.sql <<<<<<<<<<
-- IMPORTANTE: Las ventas se crean como COMPLETADA (default en POST /api/ventas)
-- Primero actualiza todas las ventas PENDIENTE existentes a COMPLETADA
update ventas set estado = 'COMPLETADA' where estado = 'PENDIENTE';


-- Luego cambia el constraint (ya no hay filas que lo violen)
alter table ventas drop constraint ventas_estado_check;
alter table ventas add constraint ventas_estado_check check (estado in ('COMPLETADA', 'ANULADA'));
alter table ventas alter column estado set default 'COMPLETADA';

-- >>>>>>>>>> supabase/ventas-estado-envio.sql <<<<<<<<<<
alter table ventas add column estado_envio text not null default 'PENDIENTE'
  check (estado_envio in ('PENDIENTE', 'EMPACADO', 'ENVIADO', 'ENTREGADO'));

alter table ventas add column envio_id uuid references envios(id);

-- >>>>>>>>>> supabase/ventas-estado-envio-completado.sql <<<<<<<<<<
-- Ampliar estado_envio de ventas: COMPLETADO (envío finalizado)
alter table ventas drop constraint if exists ventas_estado_envio_check;
alter table ventas add constraint ventas_estado_envio_check
  check (estado_envio in ('PENDIENTE', 'EMPACADO', 'ENVIADO', 'ENTREGADO', 'COMPLETADO'));

-- >>>>>>>>>> supabase/ventas-metodo-pago.sql <<<<<<<<<<
-- Método de pago en ventas
-- EFECTIVO, YAPE_PLIN, TARJETA
alter table ventas add column if not exists metodo_pago text not null default 'EFECTIVO';

-- Ampliar estados de venta: PENDIENTE (por confirmar pago con tarjeta)
alter table ventas drop constraint if exists ventas_estado_check;
alter table ventas add constraint ventas_estado_check
  check (estado in ('COMPLETADA', 'ANULADA', 'PENDIENTE'));

-- >>>>>>>>>> supabase/ventas-telefono.sql <<<<<<<<<<
-- Guardar el teléfono del cliente en la venta (snapshot, igual que nombre y dni)
alter table ventas add column if not exists persona_telefono text;

-- Backfill: teléfono actual de cada cliente para ventas ya registradas
update ventas v
  set persona_telefono = p.telefono
  from personas p
  where v.persona_id = p.id
    and v.persona_telefono is null;

-- >>>>>>>>>> supabase/ventas-persona-dni-nullable.sql <<<<<<<<<<
-- Permitir ventas a clientes sin DNI (personas.dni ya es nullable)
-- El insert en /api/ventas usaba persona_dni NOT NULL y fallaba con 500
alter table ventas alter column persona_dni drop not null;

-- >>>>>>>>>> supabase/ventas-costo.sql <<<<<<<<<<
-- Costo unitario en items de venta (para calcular ganancia por venta)
-- Se guarda una "foto" del costo del producto al momento de la venta
alter table venta_items add column if not exists costo_unitario numeric(10,2) not null default 0;

-- Backfill: costo actual de cada producto para ventas ya registradas
update venta_items vi
set costo_unitario = coalesce(p.precio_compra, 0)
from productos p
where vi.producto_id = p.id
  and vi.costo_unitario = 0;

-- >>>>>>>>>> supabase/venta-abonos.sql <<<<<<<<<<
-- Abonos parciales: pagos parciales contra una venta.
-- Cada abono suma al monto_pagado de la venta; cuando monto_pagado >= total,
-- la venta se marca COMPLETADA automáticamente (se hace desde la API).
create table if not exists public.venta_abonos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  metodo_pago text not null default 'EFECTIVO',
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_venta_abonos_venta on public.venta_abonos(venta_id, created_at);

-- Monto total pagado de cada venta (se sincroniza desde la API de abonos)
alter table public.ventas add column if not exists monto_pagado numeric(10,2) not null default 0;

-- Backfill: las ventas ya COMPLETADAS antes de este cambio se consideran
-- cobradas en su totalidad (mantener saldo disponible del dashboard coherente).
update public.ventas set monto_pagado = total where estado = 'COMPLETADA' and monto_pagado = 0;

-- >>>>>>>>>> supabase/envio-items.sql <<<<<<<<<<
create table if not exists envio_items (
  id uuid default gen_random_uuid() primary key,
  envio_id uuid not null references envios(id) on delete cascade,
  venta_item_id uuid not null references venta_items(id) on delete cascade,
  cantidad integer not null check (cantidad > 0),
  created_at timestamptz default now(),
  unique(envio_id, venta_item_id)
);

alter table envio_items enable row level security;

create policy "envio_items_select" on envio_items for select
  using (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));

create policy "envio_items_insert" on envio_items for insert
  with check (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));

create policy "envio_items_update" on envio_items for update
  using (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));

create policy "envio_items_delete" on envio_items for delete
  using (exists (
    select 1 from envios where id = envio_id and user_id = auth.uid()
  ));

-- >>>>>>>>>> supabase/envio-estado-observacion.sql <<<<<<<<<<
-- =============================================================================
-- Nuevo estado "EN_OBSERVACION" para envíos.
-- El constraint 'estado_valido' no lo contemplaba y rechazaba el UPDATE/INSERT.
--
-- Cómo aplicar:
--   1) En Supabase: SQL Editor → New query → pega y ejecuta este archivo completo.
-- =============================================================================

alter table public.envios
  drop constraint if exists estado_valido;

alter table public.envios
  add constraint estado_valido
  check (estado in ('NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION', 'ENVIADO'));

-- >>>>>>>>>> supabase/olva-agencia-envios.sql <<<<<<<<<<
-- ============================================
-- Migración: envios.agencia_olva
-- Guarda la tienda/agencia Olva elegida por el
-- cliente (cuando tipo_entrega = 'AGENCIA').
-- ============================================

ALTER TABLE public.envios
  ADD COLUMN IF NOT EXISTS agencia_olva TEXT;

-- >>>>>>>>>> supabase/tipo-entrega.sql <<<<<<<<<<
-- Modalidad de entrega para métodos de agencia (OLVA): recojo en agencia o domlicio
ALTER TABLE envios ADD COLUMN IF NOT EXISTS tipo_entrega TEXT;
ALTER TABLE envios DROP CONSTRAINT IF EXISTS tipo_entrega_valido;
ALTER TABLE envios ADD CONSTRAINT tipo_entrega_valido CHECK (tipo_entrega IN ('AGENCIA', 'DOMICILIO'));

-- >>>>>>>>>> supabase/solicitar-cantidad.sql <<<<<<<<<<
-- Solicitar cantidad de productos
-- 1) Toggle de configuracion en profiles (LOGISTICA -> "Solicitar cantidad de productos")
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS solicitar_cantidad_productos BOOLEAN NOT NULL DEFAULT false;

-- 2) Cantidad de prendas guardada junto a los datos del envio
ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS cantidad_productos INT;

-- >>>>>>>>>> supabase/recojo-tienda.sql <<<<<<<<<<
-- Agregar método "Recojo en tienda"
ALTER TABLE profiles ADD COLUMN metodo_recojo BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN mensaje_recojo TEXT DEFAULT 'Recoge tu pedido en nuestra tienda. Te esperamos!';

-- Permitir RECOJO en la constraint de la tabla envios
ALTER TABLE envios DROP CONSTRAINT IF EXISTS metodo_valido;
ALTER TABLE envios ADD CONSTRAINT metodo_valido CHECK (metodo IN ('MOTORIZADO', 'SHALOM', 'OLVA', 'MARVISUR', 'FLORES', 'OTRO', 'RECOJO'));

-- >>>>>>>>>> supabase/mostrar-tracking.sql <<<<<<<<<<
-- Mostrar tracking en el formulario público
-- Toggle de configuracion en profiles (LOGISTICA -> "Mostrar tracking de pedidos").
-- Con true (default) el boton "¿Ya hiciste un pedido? Rastrea el estado" aparece
-- en el formulario del cliente. Con false se oculta.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mostrar_tracking BOOLEAN NOT NULL DEFAULT true;

-- >>>>>>>>>> supabase/escoger-fecha.sql <<<<<<<<<<
-- Mostrar/ocultar la opcion "Escoger dia de entrega" en el formulario publico
-- true = el cliente puede elegir la fecha de entrega
-- false = no se muestra la opcion; se asigna la fecha mas cercana automaticamente
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mostrar_escoger_fecha BOOLEAN NOT NULL DEFAULT true;

-- >>>>>>>>>> supabase/moto-region.sql <<<<<<<<<<
-- Moto region: 'lima' usa la lista de distritos de Lima precargada
-- (distritos-moto.json). 'provincia' permite al usuario agregar sus
-- propios distritos y precios en Configuracion > Tarifas.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moto_region TEXT NOT NULL DEFAULT 'lima';

-- >>>>>>>>>> supabase/redirect-message-image.sql <<<<<<<<<<
-- =============================================
-- MENSAJE DE ÉXITO CON IMAGEN — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Agregar columna para la URL de la imagen del mensaje de éxito
-- (se guarda en el bucket 'logos' bajo la ruta {user.id}/mensaje-exito.{ext})
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS redirect_message_image TEXT;

-- >>>>>>>>>> supabase/color-formulario.sql <<<<<<<<<<
-- ============================================================
-- COLOR PERSONALIZADO DEL FORMULARIO PÚBLICO
-- ============================================================
-- Añade dos columnas en profiles: color principal y secundario
-- del formulario público (/f/[slug]), guardados como HEX (#rrggbb).
-- Por defecto se usan los colores actuales del tema:
--   principal = #0284c7 (sky-600), secundario = #4f46e5 (indigo-600).
--
-- Pasos:
--   1) Ejecutar este ALTER.
--   2) Ejecutar (de nuevo) supabase/rpc-guardar-configuracion.sql que
--      ya incluye los parámetros p_color_formulario_primario/secundario.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS color_formulario_primario text NOT NULL DEFAULT '#0284c7',
  ADD COLUMN IF NOT EXISTS color_formulario_secundario text NOT NULL DEFAULT '#4f46e5';

-- >>>>>>>>>> supabase/cerrar-formulario.sql <<<<<<<<<<
-- Deshabilitar el formulario publico de envios ("cerrar" el sistema de envios)
-- cerrar_formulario = true  -> el formulario se reemplaza por un mensaje
-- cerrar_formulario = false -> el formulario funciona normal
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cerrar_formulario BOOLEAN NOT NULL DEFAULT false;

-- Mensaje que ve el cliente cuando el formulario esta deshabilitado
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cerrar_formulario_mensaje TEXT NOT NULL DEFAULT '';

-- >>>>>>>>>> supabase/cerrar-formulario-dias.sql <<<<<<<<<<
-- Cerrar el formulario también en días específicos de la semana.
-- cerrar_formulario_dias = arreglo de nombres de día (MONDAY..SUNDAY).
-- Vacío ('{}') = sin cierre por día. Funciona junto con la hora de corte
-- de motorizado/agencias: se cierra si cumple cualquiera de las condiciones.
alter table profiles
  add column if not exists cerrar_formulario_dias text[] not null default '{}';

-- >>>>>>>>>> supabase/antelacion-minima.sql <<<<<<<<<<
-- =============================================
-- ANTELACIÓN MÍNIMA (días) — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Antelación mínima para Motorizado (1 = comportamiento actual)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logistica_moto_anticipacion INT NOT NULL DEFAULT 1;

-- Antelación mínima para Agencias (1 = comportamiento actual)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logistica_agencias_anticipacion INT NOT NULL DEFAULT 1;

-- >>>>>>>>>> supabase/plan-system.sql <<<<<<<<<<
-- =============================================
-- PLAN SYSTEM — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna plan a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic';

-- 2. Agregar columna trial_end (NULL = sin trial o trial terminado)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- 2b. Agregar columna pro_until (NULL = sin Pro pagado, fecha hasta la que tiene Pro activo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;

-- 3. La columna role de profiles NO se usa para los roles de negocio.
--    Ahí vive 'user' | 'super_admin' (control interno de la plataforma),
--    definido en supabase/super-admin.sql. Los roles del negocio (con sus
--    permisos) viven en business_roles / business_members:
--    ver supabase/roles-negocio.sql

-- 4. Tabla de configuración de planes
CREATE TABLE IF NOT EXISTS plan_features (
  plan TEXT PRIMARY KEY,
  max_envios INT,
  max_metodos INT,
  form_branding BOOLEAN NOT NULL DEFAULT FALSE,
  dashboard_completo BOOLEAN NOT NULL DEFAULT FALSE,
  envios_masivos BOOLEAN NOT NULL DEFAULT FALSE,
  control_logistico BOOLEAN NOT NULL DEFAULT FALSE,
  max_productos INT,
  max_ventas INT,
  max_exportaciones_shalom INT,
  max_pedidos_copiar INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3b. Agregar columnas nuevas a plan_features (para tablas existentes)
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_productos INT;
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_ventas INT;
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_exportaciones_shalom INT;
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_pedidos_copiar INT;

-- 4. Insertar planes por defecto
INSERT INTO plan_features (plan, max_envios, max_metodos, form_branding, dashboard_completo, envios_masivos, control_logistico, max_productos, max_ventas, max_exportaciones_shalom, max_pedidos_copiar)
VALUES
  ('basic', 50, 2, FALSE, FALSE, FALSE, FALSE, 50, 100, 10, 50),
  ('pro', NULL, NULL, TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL)
ON CONFLICT (plan) DO NOTHING;

-- 4c. Asegurar valores por defecto
UPDATE plan_features
SET max_productos = 50, max_ventas = 100, max_exportaciones_shalom = 10, max_pedidos_copiar = 50
WHERE plan = 'basic' AND (max_productos IS NULL OR max_ventas IS NULL OR max_exportaciones_shalom IS NULL OR max_pedidos_copiar IS NULL);

UPDATE plan_features
SET max_productos = NULL, max_ventas = NULL, max_exportaciones_shalom = NULL, max_pedidos_copiar = NULL
WHERE plan = 'pro';

-- 5. Registro de exportaciones Shalom (1 fila por operación de export)
CREATE TABLE IF NOT EXISTS shalom_exports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cantidad INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shalom_exports_user_mes_idx
  ON shalom_exports (user_id, created_at DESC);

-- >>>>>>>>>> supabase/plan-3-planes.sql <<<<<<<<<<
-- =============================================
-- PLAN SYSTEM 3 PLANES — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columna max_miembros si no existe (DEBE IR PRIMERO)
ALTER TABLE plan_features ADD COLUMN IF NOT EXISTS max_miembros INT;

-- 2. Insertar plan Business Plus (ilimitado + booleans TRUE)
INSERT INTO plan_features (plan, max_envios, max_metodos, form_branding, dashboard_completo, envios_masivos, control_logistico, max_productos, max_ventas, max_exportaciones_shalom, max_pedidos_copiar, max_miembros)
VALUES ('business_plus', NULL, NULL, TRUE, TRUE, TRUE, TRUE, NULL, NULL, NULL, NULL, 4)
ON CONFLICT (plan) DO NOTHING;

-- 3. Actualizar Pro a límites definidos (500 envíos, 200 productos, 2000 ventas)
UPDATE plan_features
SET max_envios = 500,
    max_productos = 200,
    max_ventas = 2000,
    max_miembros = 0
WHERE plan = 'pro';

-- 4. Actualizar Básico: export Shalom 8/mes, 0 miembros
UPDATE plan_features
SET max_exportaciones_shalom = 8,
    max_miembros = 0
WHERE plan = 'basic';

-- 5. MIGRACIÓN: todos los 'pro' actuales (trial y pagados) pasan a Business Plus
-- conservando trial_end / pro_until intactos. checkTrialStatus los degrada a basic al expirar.
UPDATE profiles
SET plan = 'business_plus'
WHERE plan = 'pro';

-- >>>>>>>>>> supabase/super-admin.sql <<<<<<<<<<
-- =============================================
-- SUPER ADMIN — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- Agrega el rol super_admin, bloqueo de cuentas,
-- tabla de auditoría y marca la cuenta admin.
-- =============================================

-- 1. Columna de rol (super_admin | user)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 2. Columna de bloqueo (true = cuenta desactivada)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT false;

-- 3. Fecha de creación del perfil (para ordenar empresas) si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. Índices para el panel admin
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);
CREATE INDEX IF NOT EXISTS profiles_disabled_idx ON profiles (disabled);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles (created_at DESC);

-- 5. Tabla de auditoría de acciones del super admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_email TEXT,
  accion TEXT NOT NULL,
  detalle JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_desc_idx
  ON admin_audit_log (created_at DESC);

-- 6. RLS: auditoría legible solo por el propio admin / service_role (bypass)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MARCAR SUPER ADMIN (cambia este email al tuyo si aplica)
-- Busca el usuario en auth.users y actualiza profiles.role
-- =============================================
DO $$
DECLARE
  target_id uuid;
  -- Reemplaza por TU correo antes de ejecutar (no lo subas a Git).
  target_email text := 'TU_CORREO_ADMIN@EJEMPLO.COM';
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = lower(target_email) LIMIT 1;

  IF target_id IS NULL THEN
    RAISE NOTICE 'No se encontro el usuario con email % en auth.users. Marca el rol manualmente.', target_email;
  ELSE
    UPDATE profiles SET role = 'super_admin' WHERE id = target_id;
    RAISE NOTICE 'Usuario % marcado como super_admin (id %).', target_email, target_id;
  END IF;
END $$;

-- >>>>>>>>>> supabase/pagos.sql <<<<<<<<<<
-- Registro de pagos (facturación): comprobantes de suscripciones MercadoPago.
-- Una fila por suscripción (preapproval), upsert: renueva conservando el último pro_until.
create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  preapproval_id text not null unique,
  plan text not null,
  monto numeric(10,2) not null,
  periodo_meses integer not null default 1,
  pro_until timestamptz not null,
  origen text not null default 'webhook',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pagos_user on public.pagos(user_id, created_at desc);

-- >>>>>>>>>> supabase/agencias-shalom.sql <<<<<<<<<<
-- =============================================
-- AGENCIAS SHALOM — Envios.pe
-- Tabla que guarda la lista de agencias Shalom
-- sincronizada desde el endpoint oficial de Shalom
-- (serviceswebapi.shalomcontrol.com/api/v1/web/agencias/listar).
--
-- La sincronización la hace la ruta /api/shalom/sync (cron semanal
-- en Vercel) usando el adaptador src/lib/shalom/agencias.ts.
-- =============================================

create table if not exists public.agencias_shalom (
  ter_id         bigint primary key,
  etiqueta       text not null,             -- "DEPARTAMENTO / PROVINCIA / DISTRITO / AGENCIA"
  departamento   text,
  provincia      text,
  lugar          text,
  direccion      text,
  telefono       text,
  latitud        text,
  longitud       text,
  activa         boolean not null default true,
  actualizada_en timestamptz not null default now()
);

-- Índice de búsqueda por texto (para el autocomplete del cliente)
create index if not exists agencias_shalom_etiqueta_idx
  on public.agencias_shalom (etiqueta);

-- Índice por departamento (filtros rápidos)
create index if not exists agencias_shalom_departamento_idx
  on public.agencias_shalom (departamento);

-- Para consultas de solo activas
create index if not exists agencias_shalom_activa_idx
  on public.agencias_shalom (activa);

-- RLS: lectura pública habilitada (los clientes la leen), escritura
-- solo para el servicio. El lado servidor usa la service_role key que
-- ignora RLS, así que basta con permitir SELECT anónimo y bloqueo escrito.
alter table public.agencias_shalom enable row level security;

-- Los visitantes (formulario público) pueden leer la lista.
create policy "agencias_shalom_select_anon"
  on public.agencias_shalom for select
  using (true);

-- Sin policies de insert/update/delete: solo se gestiona desde el
-- servidor con service_role (que ignora RLS).

-- >>>>>>>>>> supabase/agencias-shalom-recibe.sql <<<<<<<<<<
-- ============================================================
-- Migración: agencias_shalom.recibe
-- Marca qué agencias SÍ reciben paquetes del público.
-- Se deriva de `ter_categoria_recibe` en la data oficial de Shalom:
--   - recibe = true  → la agencia acepta paquetes (tiene categoría de recepción)
--   - recibe = false → centro de acopio interno, terminal aeroportuaria,
--                      solo-envío, sucursal pendiente, etc. (NO acepta paquetes)
--
-- Después de ejecutar esto, corre el sync de agencias desde el panel admin
-- (o POST /api/shalom/sync) para llenar el flag con la data vigente de Shalom.
-- Mientras no haya resync, el endpoint /api/shalom/agencias cae al JSON
-- estático (que ya viene filtrado), así el cambio es inmediato.
-- ============================================================

ALTER TABLE agencias_shalom
  ADD COLUMN IF NOT EXISTS recibe BOOLEAN NOT NULL DEFAULT FALSE;

-- >>>>>>>>>> supabase/agencias-olva.sql <<<<<<<<<<
-- =============================================
-- AGENCIAS OLVA COURIER — Envios.pe
-- Tabla que guarda la lista de tiendas/agencia Olva
-- sincronizada desde el endpoint oficial de Olva
-- (admin-ajax.php?action=get_olva_stores).
--
-- La sincronización la hace la ruta /api/olva/sync (cron semanal
-- en Vercel) usando el adaptador src/lib/olva/agencias.ts.
-- =============================================

create table if not exists public.agencias_olva (
  office_id      text primary key,
  nombres        text not null,          -- ej: "TIENDA CHACHAPOYAS - JR. ORTIZ ARRIETA N° 270"
  direccion      text,
  department     text,                   -- departamento (sin acentos, como lo manda Olva)
  province       text,
  district       text,
  office_type    text,                   -- OFICINAS EXTERNAS / OFICINA OPERACIONES / AGENTE / OFICINA IN HOUSE
  lat            text,
  lng            text,
  activa         boolean not null default true,
  actualizada_en timestamptz not null default now()
);

-- Índice por departamento (filtros rápidos por provincia)
create index if not exists agencias_olva_department_idx
  on public.agencias_olva (department);

-- Índice por provincia (el formulario filtra "provincia -> agencias")
create index if not exists agencias_olva_province_idx
  on public.agencias_olva (province);

-- Para consultas de solo activas
create index if not exists agencias_olva_activa_idx
  on public.agencias_olva (activa);

-- RLS: lectura pública habilitada (los clientes la leen), escritura
-- solo para el servicio. El lado servidor usa la service_role key que
-- ignora RLS, así que basta con permitir SELECT anónimo y bloqueo escrito.
alter table public.agencias_olva enable row level security;

-- Los visitantes (formulario público) pueden leer la lista.
create policy "agencias_olva_select_anon"
  on public.agencias_olva for select
  using (true);

-- Sin policies de insert/update/delete: solo se gestiona desde el
-- servidor con service_role (que ignora RLS).

-- >>>>>>>>>> supabase/codigos-envios-ventas.sql <<<<<<<<<<
-- ============================================================
-- CÓDIGOS LEGIBLES: E-0001 (envios) y V-0001 (ventas)
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Agrega una columna codigo con correlativo por negocio (user_id/profile_id).
-- ============================================================

alter table envios add column if not exists codigo text;
alter table ventas add column if not exists codigo text;

-- ------------------------------------------------------------
-- 1) Backfill: asignar correlativo a los registros existentes
--    ordenados por antigüedad dentro de cada negocio.
-- ------------------------------------------------------------
with numerados as (
  select id, user_id,
         row_number() over (partition by user_id order by fecha_registro, id) as rn
  from envios
  where codigo is null or codigo = ''
)
update envios e
set codigo = 'E-' || lpad(n.rn::text, 4, '0')
from numerados n
where e.id = n.id;

with numerados as (
  select id, profile_id,
         row_number() over (partition by profile_id order by created_at, id) as rn
  from ventas
  where codigo is null or codigo = ''
)
update ventas v
set codigo = 'V-' || lpad(n.rn::text, 4, '0')
from numerados n
where v.id = n.id;

-- ------------------------------------------------------------
-- 2) Correlativo automático para nuevos registros.
-- ------------------------------------------------------------
create table if not exists secuencias_codigos (
  owner_id uuid not null,
  tipo text not null,
  ultimo bigint not null default 0,
  primary key (owner_id, tipo)
);

create or replace function next_codigo_correlativo(p_owner uuid, p_tipo text, p_prefijo text)
returns text
language plpgsql
volatile
as $$
declare
  v_ultimo bigint;
begin
  insert into secuencias_codigos (owner_id, tipo, ultimo)
  values (p_owner, p_tipo, 1)
  on conflict (owner_id, tipo)
  do update set ultimo = secuencias_codigos.ultimo + 1
  returning ultimo into v_ultimo;
  return p_prefijo || '-' || lpad(v_ultimo::text, 4, '0');
end;
$$;

-- ------------------------------------------------------------
-- 3) Sembrar secuencia inicial (continuar desde el correlativo actual).
-- ------------------------------------------------------------
insert into secuencias_codigos (owner_id, tipo, ultimo)
select user_id, 'envio',
       max(coalesce(nullif(split_part(codigo, '-', 2), ''), '0')::int)
from envios
where codigo ~ '^E-[0-9]+$'
group by user_id
on conflict (owner_id, tipo) do update set ultimo = secuencias_codigos.ultimo;

insert into secuencias_codigos (owner_id, tipo, ultimo)
select profile_id, 'venta',
       max(coalesce(nullif(split_part(codigo, '-', 2), ''), '0')::int)
from ventas
where codigo ~ '^V-[0-9]+$'
group by profile_id
on conflict (owner_id, tipo) do update set ultimo = secuencias_codigos.ultimo;

-- ------------------------------------------------------------
-- 4) Triggers de asignación en INSERT.
-- ------------------------------------------------------------
create or replace function asignar_codigo_envio()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := next_codigo_correlativo(new.user_id, 'envio', 'E');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_envios_codigo on envios;
create trigger trg_envios_codigo
before insert on envios
for each row execute function asignar_codigo_envio();

create or replace function asignar_codigo_venta()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := next_codigo_correlativo(new.profile_id, 'venta', 'V');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ventas_codigo on ventas;
create trigger trg_ventas_codigo
before insert on ventas
for each row execute function asignar_codigo_venta();

-- >>>>>>>>>> supabase/envios-idempotencia.sql <<<<<<<<<<
-- ============================================================
-- IDEMPOTENCIA DEL FORMULARIO PÚBLICO (anti-duplicados)
--
-- Regla: 1 llave = 1 envío. Si el cliente reintenta (recarga la
-- página, error de red, doble envío), el servidor devuelve SIEMPRE
-- el envío original en vez de crear otro.
--
-- Ejecutar en Supabase SQL Editor.
-- Es idempotente: se puede ejecutar varias veces sin daño.
-- El código funciona incluso si esta migración aún no se ejecutó.
-- ============================================================

ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS envios_idempotencia_key_idx
  ON envios (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Verificación: debe devolver 1 fila
SELECT indexname
FROM pg_indexes
WHERE tablename = 'envios'
  AND indexname = 'envios_idempotencia_key_idx';

-- >>>>>>>>>> supabase/rpc-stock.sql <<<<<<<<<<
-- ============================================================
-- RPC STOCK ATÓMICO (reemplaza el "CAS triplicado" de src/lib/stock.ts)
-- ============================================================
--
-- PROBLEMA QUE RESUELVE
-- --------------------
-- Antes, lib/stock.ts repetía TRES VECES el mismo patrón compare-and-set:
--   1) leer stock_actual
--   2) calcular el nuevo valor en JS
--   3) UPDATE condicionado a `.eq('stock_actual', valorLeido)`
--   4) si 0 filas (otro proceso lo cambió entre la lectura y la escritura)
--      → reintentar hasta MAX_INTENTOS, con reintento dentro del mismo archivo.
--
-- Eso dejaba una ventana de carrera: dos ventas simultáneas al mismo
-- producto → una de las dos reintenta → a veces FALLA con "tras 5 intentos"
-- aunque hubiera stock. Y la regla "nunca negativo" vivía duplicada en las 3
-- funciones del archivo (el mismo tipo de problema que corregimos con el
-- receptor EMPACADO: regla copiada en varios lugares).
--
-- SOLUCIÓN
-- --------
-- Chequeo + descuento en UNA sola instrucción SQL atómica en la base:
-- el UPDATE con guarda `stock_actual >= p_cantidad` garantiza que el stock
-- NUNCA quede negativo, y al ser una única sentencia la base lo serializa.
-- Sin lectura previa, sin bucle, sin reintentos.
--
-- Las 3 funciones matchean el contrato que exige lib/stock.ts:
--   * parámetros : p_producto_id (uuid) y p_cantidad (int)
--   * retorno    : TABLE (stock_final int)  → 1 fila = se aplicó,
--                                            0 filas = guarda no pasó
--                 (el código distingue "no encontrado" vs "insuficiente"
--                  con una lectura ligera SOLO en el caso de 0 filas)
--
-- CÓMO APLICAR
-- ------------
-- Supabase → SQL Editor → New query → pegar TODO este archivo → Run.
-- Es idempotente (CREATE OR REPLACE): se puede repetir sin daño.
-- Ejecutarlo ANTES de que la app nueva (que llama a estos RPC) quede activa.
-- ============================================================

-- ── Descontar stock (Ventas): atómico, nunca negativo ─────────────
CREATE OR REPLACE FUNCTION descontar_stock(
  p_producto_id uuid,
  p_cantidad    integer
)
RETURNS TABLE (stock_final integer)
LANGUAGE sql
VOLATILE                    -- hace UPDATE → NO es STABLE/IMMUTABLE
AS $$
  UPDATE productos
     SET stock_actual = stock_actual - p_cantidad,
         updated_at   = now()
   WHERE id             = p_producto_id
     AND stock_actual   >= p_cantidad      -- guarda atómica (sin stock negativo)
  RETURNING stock_actual::integer AS stock_final;
$$;

-- ── Sumar stock (Compras / reversiones de venta): atómico ─────────
CREATE OR REPLACE FUNCTION sumar_stock(
  p_producto_id uuid,
  p_cantidad    integer
)
RETURNS TABLE (stock_final integer)
LANGUAGE sql
VOLATILE
AS $$
  UPDATE productos
     SET stock_actual = stock_actual + p_cantidad,
         updated_at   = now()
   WHERE id = p_producto_id
  RETURNING stock_actual::integer AS stock_final;
$$;

-- ── Restar stock (anular Compras): permite NEGATIVO a propósito ────
-- A diferencia de descontar_stock NO tiene guarda: al anular una compra
-- cuyos ítems ya pudieron venderse, el stock puede quedar negativo (mismo
-- comportamiento que el código anterior). Solo se evita la carrera.
CREATE OR REPLACE FUNCTION restar_stock(
  p_producto_id uuid,
  p_cantidad    integer
)
RETURNS TABLE (stock_final integer)
LANGUAGE sql
VOLATILE
AS $$
  UPDATE productos
     SET stock_actual = stock_actual - p_cantidad,
         updated_at   = now()
   WHERE id = p_producto_id
  RETURNING stock_actual::integer AS stock_final;
$$;

-- ============================================================
-- VERIFICACIÓN (opcional, tras ejecutar):
--   SELECT proname
--   FROM pg_proc
--   WHERE proname IN ('descontar_stock','sumar_stock','restar_stock')
--   ORDER BY proname;
-- Esperado: 3 filas. Cero filas = algo no se creó.
-- NOTA: NO probar ejecutando las funciones "a mano" sobre productos reales
-- (descontarían/sumarían stock de verdad). Con confirmar que existen basta.
-- ============================================================

-- >>>>>>>>>> supabase/kardex-movimientos.sql <<<<<<<<<<
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

-- >>>>>>>>>> supabase/rpc-venta-atomico.sql <<<<<<<<<<
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

-- >>>>>>>>>> supabase/rpc-guardar-configuracion.sql <<<<<<<<<<
-- ============================================================
-- GUARDAR CONFIGURACIÓN ATÓMICA (sustituye 4 escrituras separadas)
-- ============================================================
-- Antes (handler dashboard, guardarConfiguracion):
--   1) UPDATE profiles  (empresa/redes/métodos/logística)
--   2) UPDATE profiles  (moto_region)          ← best-effort aparte
--   3) UPDATE profiles  (cerrar_formulario_dias)
--   4) UPSERT tarifas_moto
--   → 4 idas a la base sin transacción. Si falla la 2/3, la config quedó
--     a medias (idéntico al bug de stock CAS que ya eliminamos).
--
-- Después: UNA sola llamada rpc('guardar_configuracion', ...) que hace
--   UPDATE profiles (todas las columnas de config, en un solo UPDATE)
--   + UPSERT tarifas_moto
--   dentro de UNA transacción. O se guarda todo, o nada.
--
-- El cliente conserva 3 cosas que NO son de base atómica (mejor aparte):
--   · subir logo a Storage (logos)
--   · subir imagen de mensaje a Storage (logos)
--   · chequeo de slug duplicado (SELECT de lectura)
-- El RPC recibe ya las URLs finales (logo_url, redirect_message_image) y
-- el slug aprobado. No vuelve a subir nada a Storage.
--
-- Ejecutar UNA vez desde el SQL Editor. Es reemplazable (CREATE OR REPLACE).
-- ============================================================

CREATE OR REPLACE FUNCTION guardar_configuracion(
  p_profile_id uuid,
  -- Empresa
  p_empresa text,
  p_telefono text,
  p_direccion text,
  p_slug text,
  p_origen_shalom text,
  p_logo_url text,
  -- Redirect
  p_redirect_url text,
  p_redirect_message text,
  p_redirect_message_image text,
  -- Redes
  p_instagram_url text,
  p_facebook_url text,
  p_tiktok_url text,
  p_web_url text,
  p_whatsapp_url text,
  -- Métodos
  p_metodo_motorizado boolean,
  p_metodo_shalom boolean,
  p_metodo_olva boolean,
  p_metodo_marvisur boolean,
  p_metodo_flores boolean,
  p_metodo_otro boolean,
  p_nombre_metodo_otro text,
  p_metodo_recojo boolean,
  p_mensaje_recojo text,
  -- Logística motorizado
  p_logistica_moto_dias text[],
  p_logistica_moto_usa_hora_corte boolean,
  p_logistica_moto_hora_corte text,
  p_logistica_moto_anticipacion integer,
  p_logistica_moto_limitar boolean,
  p_logistica_moto_cupo integer,
  -- Logística agencias
  p_logistica_agencias_dias text[],
  p_logistica_agencias_usa_hora_corte boolean,
  p_logistica_agencias_hora_corte text,
  p_logistica_agencias_anticipacion integer,
  p_logistica_agencias_limitar boolean,
  p_logistica_agencias_cupo integer,
  -- Formulario / extras
  p_solicitar_cantidad_productos boolean,
  p_mostrar_escoger_fecha boolean,
  p_mostrar_tracking boolean,
  p_cerrar_formulario boolean,
  p_cerrar_formulario_mensaje text,
  p_moto_region text,
  p_cerrar_formulario_dias text[],
  -- Personalización del formulario
  p_color_formulario_primario text,
  p_color_formulario_secundario text,
  -- Tarifas
  p_tarifas jsonb
)
RETURNS TABLE (slug_final text, error_text text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Autorización: solo el dueño del perfil (o el backend con service role)
  -- puede guardar esta configuración. SECURITY DEFINER salta RLS, así que sin
  -- este chequeo cualquiera podría pisar el perfil de otro negocio.
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_profile_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Las URLs que se abren desde el formulario público deben ser http(s).
  IF coalesce(p_redirect_url, '') <> '' AND p_redirect_url !~* '^https?://' THEN
    RAISE EXCEPTION 'La URL de redirección debe empezar con http:// o https://';
  END IF;

  -- =======================
  -- PASO 1: TODO PROFILES EN UN SOLO UPDATE (atómico)
  -- =======================
  UPDATE profiles SET
    empresa                = p_empresa,
    telefono               = p_telefono,
    direccion              = p_direccion,
    slug                   = p_slug,
    origen_shalom          = p_origen_shalom,
    logo_url               = p_logo_url,
    redirect_url           = p_redirect_url,
    redirect_message       = p_redirect_message,
    redirect_message_image = p_redirect_message_image,
    instagram_url          = p_instagram_url,
    facebook_url           = p_facebook_url,
    tiktok_url             = p_tiktok_url,
    web_url                = p_web_url,
    whatsapp_url           = p_whatsapp_url,
    metodo_motorizado      = p_metodo_motorizado,
    metodo_shalom          = p_metodo_shalom,
    metodo_olva            = p_metodo_olva,
    metodo_marvisur        = p_metodo_marvisur,
    metodo_flores          = p_metodo_flores,
    metodo_otro            = p_metodo_otro,
    nombre_metodo_otro     = p_nombre_metodo_otro,
    metodo_recojo          = p_metodo_recojo,
    mensaje_recojo         = p_mensaje_recojo,
    logistica_moto_dias           = p_logistica_moto_dias,
    logistica_moto_usa_hora_corte = p_logistica_moto_usa_hora_corte,
    logistica_moto_hora_corte     = NULLIF(p_logistica_moto_hora_corte, '')::time,
    logistica_moto_anticipacion   = p_logistica_moto_anticipacion,
    logistica_moto_limitar        = p_logistica_moto_limitar,
    logistica_moto_cupo           = p_logistica_moto_cupo,
    logistica_agencias_dias           = p_logistica_agencias_dias,
    logistica_agencias_usa_hora_corte = p_logistica_agencias_usa_hora_corte,
    logistica_agencias_hora_corte     = NULLIF(p_logistica_agencias_hora_corte, '')::time,
    logistica_agencias_anticipacion   = p_logistica_agencias_anticipacion,
    logistica_agencias_limitar        = p_logistica_agencias_limitar,
    logistica_agencias_cupo           = p_logistica_agencias_cupo,
    solicitar_cantidad_productos = p_solicitar_cantidad_productos,
    mostrar_escoger_fecha        = p_mostrar_escoger_fecha,
    mostrar_tracking             = p_mostrar_tracking,
    cerrar_formulario            = p_cerrar_formulario,
    cerrar_formulario_mensaje    = p_cerrar_formulario_mensaje,
    moto_region                  = p_moto_region,
    cerrar_formulario_dias       = p_cerrar_formulario_dias,
    color_formulario_primario    = p_color_formulario_primario,
    color_formulario_secundario  = p_color_formulario_secundario
  WHERE id = p_profile_id;

  -- =======================
  -- PASO 2: TARIFAS EN EL MISMO UPDATE (si vienen filtradas no vacías)
  -- =======================
  -- tarifas_moto tiene columna jsonb tarifas + constraint único en profile_id
  -- (el código actual usa .upsert() → existe UNIQUE(profile_id)).
  IF p_tarifas IS NOT NULL THEN
    INSERT INTO tarifas_moto (profile_id, tarifas)
    VALUES (p_profile_id, p_tarifas)
    ON CONFLICT (profile_id)
    DO UPDATE SET tarifas = EXCLUDED.tarifas;
  END IF;

  -- =======================
  -- OK: devuelve el slug guardado
  -- =======================
  RETURN QUERY SELECT p_slug::text, NULL::text;

EXCEPTION WHEN OTHERS THEN
  -- Deshacemos todo (ROLLBACK implícito de plpgsql al lanzar error)
  RETURN QUERY SELECT NULL::text, SQLERRM;
END;
$$;

-- >>>>>>>>>> supabase/logistica-anticipacion-solo-habiles.sql <<<<<<<<<<
-- ============================================================
-- ANTICIPACIÓN EN DÍAS HÁBILES
-- ============================================================
-- Agrega el interruptor "Aplicar solo a días hábiles" por método.
-- Apagado (default) el comportamiento no cambia: días corridos.
-- Encendido la anticipación avanza contando solo los días de
-- atención del negocio (los marcados en "¿Qué días atiendes?").
--
-- Ejecutar UNA vez desde el SQL Editor. Es reemplazable.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS logistica_moto_anticipacion_solo_habiles boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS logistica_agencias_anticipacion_solo_habiles boolean NOT NULL DEFAULT false;

-- ============================================================
-- La firma del RPC cambia al agregar parámetros: hay que eliminar
-- los overloads anteriores para que PostgREST no quede ambiguo.
-- ============================================================
DO $$
DECLARE
  firma text;
BEGIN
  FOR firma IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE proname = 'guardar_configuracion'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION ' || firma;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION guardar_configuracion(
  p_profile_id uuid,
  -- Empresa
  p_empresa text,
  p_telefono text,
  p_direccion text,
  p_slug text,
  p_origen_shalom text,
  p_logo_url text,
  -- Redirect
  p_redirect_url text,
  p_redirect_message text,
  p_redirect_message_image text,
  -- Redes
  p_instagram_url text,
  p_facebook_url text,
  p_tiktok_url text,
  p_web_url text,
  p_whatsapp_url text,
  -- Métodos
  p_metodo_motorizado boolean,
  p_metodo_shalom boolean,
  p_metodo_olva boolean,
  p_metodo_marvisur boolean,
  p_metodo_flores boolean,
  p_metodo_otro boolean,
  p_nombre_metodo_otro text,
  p_metodo_recojo boolean,
  p_mensaje_recojo text,
  -- Logística motorizado
  p_logistica_moto_dias text[],
  p_logistica_moto_usa_hora_corte boolean,
  p_logistica_moto_hora_corte text,
  p_logistica_moto_anticipacion integer,
  p_logistica_moto_anticipacion_solo_habiles boolean,
  p_logistica_moto_limitar boolean,
  p_logistica_moto_cupo integer,
  -- Logística agencias
  p_logistica_agencias_dias text[],
  p_logistica_agencias_usa_hora_corte boolean,
  p_logistica_agencias_hora_corte text,
  p_logistica_agencias_anticipacion integer,
  p_logistica_agencias_anticipacion_solo_habiles boolean,
  p_logistica_agencias_limitar boolean,
  p_logistica_agencias_cupo integer,
  -- Formulario / extras
  p_solicitar_cantidad_productos boolean,
  p_mostrar_escoger_fecha boolean,
  p_mostrar_tracking boolean,
  p_cerrar_formulario boolean,
  p_cerrar_formulario_mensaje text,
  p_moto_region text,
  p_cerrar_formulario_dias text[],
  -- Personalización del formulario
  p_color_formulario_primario text,
  p_color_formulario_secundario text,
  -- Tarifas
  p_tarifas jsonb
)
RETURNS TABLE (slug_final text, error_text text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Autorización: solo el dueño del perfil (o el backend con service role)
  -- puede guardar esta configuración. SECURITY DEFINER salta RLS, así que sin
  -- este chequeo cualquiera podría pisar el perfil de otro negocio.
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_profile_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Las URLs que se abren desde el formulario público deben ser http(s).
  IF coalesce(p_redirect_url, '') <> '' AND p_redirect_url !~* '^https?://' THEN
    RAISE EXCEPTION 'La URL de redirección debe empezar con http:// o https://';
  END IF;

  -- =======================
  -- PASO 1: TODO PROFILES EN UN SOLO UPDATE (atómico)
  -- =======================
  UPDATE profiles SET
    empresa                = p_empresa,
    telefono               = p_telefono,
    direccion              = p_direccion,
    slug                   = p_slug,
    origen_shalom          = p_origen_shalom,
    logo_url               = p_logo_url,
    redirect_url           = p_redirect_url,
    redirect_message       = p_redirect_message,
    redirect_message_image = p_redirect_message_image,
    instagram_url          = p_instagram_url,
    facebook_url           = p_facebook_url,
    tiktok_url             = p_tiktok_url,
    web_url                = p_web_url,
    whatsapp_url           = p_whatsapp_url,
    metodo_motorizado      = p_metodo_motorizado,
    metodo_shalom          = p_metodo_shalom,
    metodo_olva            = p_metodo_olva,
    metodo_marvisur        = p_metodo_marvisur,
    metodo_flores          = p_metodo_flores,
    metodo_otro            = p_metodo_otro,
    nombre_metodo_otro     = p_nombre_metodo_otro,
    metodo_recojo          = p_metodo_recojo,
    mensaje_recojo         = p_mensaje_recojo,
    logistica_moto_dias           = p_logistica_moto_dias,
    logistica_moto_usa_hora_corte = p_logistica_moto_usa_hora_corte,
    logistica_moto_hora_corte     = NULLIF(p_logistica_moto_hora_corte, '')::time,
    logistica_moto_anticipacion   = p_logistica_moto_anticipacion,
    logistica_moto_anticipacion_solo_habiles = COALESCE(p_logistica_moto_anticipacion_solo_habiles, false),
    logistica_moto_limitar        = p_logistica_moto_limitar,
    logistica_moto_cupo           = p_logistica_moto_cupo,
    logistica_agencias_dias           = p_logistica_agencias_dias,
    logistica_agencias_usa_hora_corte = p_logistica_agencias_usa_hora_corte,
    logistica_agencias_hora_corte     = NULLIF(p_logistica_agencias_hora_corte, '')::time,
    logistica_agencias_anticipacion   = p_logistica_agencias_anticipacion,
    logistica_agencias_anticipacion_solo_habiles = COALESCE(p_logistica_agencias_anticipacion_solo_habiles, false),
    logistica_agencias_limitar        = p_logistica_agencias_limitar,
    logistica_agencias_cupo           = p_logistica_agencias_cupo,
    solicitar_cantidad_productos = p_solicitar_cantidad_productos,
    mostrar_escoger_fecha        = p_mostrar_escoger_fecha,
    mostrar_tracking             = p_mostrar_tracking,
    cerrar_formulario            = p_cerrar_formulario,
    cerrar_formulario_mensaje    = p_cerrar_formulario_mensaje,
    moto_region                  = p_moto_region,
    cerrar_formulario_dias       = p_cerrar_formulario_dias,
    color_formulario_primario    = p_color_formulario_primario,
    color_formulario_secundario  = p_color_formulario_secundario
  WHERE id = p_profile_id;

  -- =======================
  -- PASO 2: TARIFAS EN EL MISMO UPDATE (si vienen filtradas no vacías)
  -- =======================
  IF p_tarifas IS NOT NULL THEN
    INSERT INTO tarifas_moto (profile_id, tarifas)
    VALUES (p_profile_id, p_tarifas)
    ON CONFLICT (profile_id)
    DO UPDATE SET tarifas = EXCLUDED.tarifas;
  END IF;

  -- =======================
  -- OK: devuelve el slug guardado
  -- =======================
  RETURN QUERY SELECT p_slug::text, NULL::text;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::text, SQLERRM;
END;
$$;

-- >>>>>>>>>> supabase/roles-negocio.sql <<<<<<<<<<
-- ============================================================
-- ROLES Y PERMISOS POR NEGOCIO
-- Ejecutar en Supabase → SQL Editor (una vez, es idempotente).
-- ============================================================
--
-- Modelo:
--   business_roles    → roles definidos por el dueño (vista por defecto + permisos)
--   business_members  → qué usuario pertenece a qué negocio y con qué rol
--
-- El dueño de la cuenta (profiles.id) es el "owner" de su negocio y
-- administra sus roles. Los miembros ven el dashboard del negocio del
-- dueño, filtrado por los permisos de su rol.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tablas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_roles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre         text NOT NULL,
  vista_default  text NOT NULL DEFAULT 'resumen',
  permisos       jsonb NOT NULL DEFAULT '{}'::jsonb,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_roles_owner_nombre_unico UNIQUE (owner_id, nombre)
);

CREATE TABLE IF NOT EXISTS business_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id    uuid NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
  creado_en  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_members_owner_user_unico UNIQUE (owner_id, user_id)
);

CREATE INDEX IF NOT EXISTS business_roles_owner_idx ON business_roles (owner_id);
CREATE INDEX IF NOT EXISTS business_members_user_idx  ON business_members (user_id);
CREATE INDEX IF NOT EXISTS business_members_owner_idx ON business_members (owner_id);

-- ------------------------------------------------------------
-- 2. RLS
-- ------------------------------------------------------------
ALTER TABLE business_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- Roles: el dueño ve los suyos; un miembro ve el rol que tiene asignado.
DROP POLICY IF EXISTS business_roles_select ON business_roles;
CREATE POLICY business_roles_select ON business_roles
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (SELECT role_id FROM business_members WHERE user_id = auth.uid())
  );

-- Escribe roles: solo el dueño de ese negocio.
DROP POLICY IF EXISTS business_roles_write ON business_roles;
CREATE POLICY business_roles_write ON business_roles
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Miembros: el dueño ve los suyos; cada miembro ve su propia fila.
DROP POLICY IF EXISTS business_members_select ON business_members;
CREATE POLICY business_members_select ON business_members
  FOR SELECT USING (
    owner_id = auth.uid() OR user_id = auth.uid()
  );

-- Escribe miembros: solo el dueño de ese negocio.
DROP POLICY IF EXISTS business_members_write ON business_members;
CREATE POLICY business_members_write ON business_members
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ------------------------------------------------------------
-- 3. Los miembros necesitan LEER los datos del negocio del dueño.
--    Las políticas de negocio usan auth.uid() = user_id, así que un
--    miembro no vería nada sin esta extensión.
--
--    Reemplaza la política <tabla>_select_owner por una que también
--    acepta las filas cuyo user_id / profile_id pertenece a un negocio
--    del usuario. Las escrituras siguen siendo solo del dueño.
--
--    Cubre ambas convenciones: user_id (envios, ventas, productos...)
--    y profile_id (tarifas_moto).
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
  col text;
BEGIN
  FOR t, col IN
    SELECT DISTINCT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name IN ('user_id', 'profile_id')
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('business_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_owner', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_member', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = %I OR %I IN (SELECT owner_id FROM public.business_members WHERE user_id = auth.uid()))',
      t || '_select_member', t, col, col
    );
    RAISE NOTICE 'RLS de lectura extendida a miembros en: %.%', t, col;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 4. Invitaciones
--    Cuando el dueño agrega a alguien que todavía no tiene cuenta,
--    se genera una invitación con un link. Quien lo abre crea su
--    contraseña y queda dentro del negocio con el rol asignado.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email      text NOT NULL,
  role_id    uuid NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,
  estado     text NOT NULL DEFAULT 'pendiente',
  creado_en  timestamptz NOT NULL DEFAULT now(),
  expira_en  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT business_invites_owner_email_unico UNIQUE (owner_id, email)
);

CREATE INDEX IF NOT EXISTS business_invites_owner_idx ON business_invites (owner_id);
CREATE INDEX IF NOT EXISTS business_invites_token_idx  ON business_invites (token);

ALTER TABLE business_invites ENABLE ROW LEVEL SECURITY;

-- Solo el dueño ve sus invitaciones. La aceptación se hace con
-- service_role (el usuario todavía no tiene sesión al abrir el link).
DROP POLICY IF EXISTS business_invites_select ON business_invites;
CREATE POLICY business_invites_select ON business_invites
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS business_invites_write ON business_invites;
CREATE POLICY business_invites_write ON business_invites
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ------------------------------------------------------------
-- 5. Nota sobre el plan
--    profiles.role NO se usa para los roles de negocio: ahí vive
--    'user' | 'super_admin' (control interno de la plataforma).
--    Los roles del negocio viven en business_roles.
-- ------------------------------------------------------------

-- >>>>>>>>>> supabase/limpieza-envios-30-dias.sql <<<<<<<<<<
-- =============================================
-- LIMPIEZA AUTOMÁTICA — Envios.pe
-- Elimina envíos ENVIADO de +30 días SOLO para usuarios en plan Básico
-- (pro / business_plus NO se tocan). Las ventas vinculadas conservan su
-- estado_envio (COMPLETADO) y solo se desvinculan (envio_id = NULL).
--
-- REGLA DE GRACIA (actualizada):
--   * Básico que NUNCA pagó            -> se borran sus ENVIADO a los 30 días.
--   * Ex-miembro (pagó alguna vez y su
--     pro_until venció)                -> período de gracia de 90 días desde el
--     vencimiento para poder renovar; SOLO entonces se borran sus ENVIADO.
--
-- Requiere la extensión pg_cron. Si el paso 1 falla con
-- "schema cron does not exist", habilítala desde:
--   Dashboard de Supabase → Database → Extensions → pg_cron → habilitar
--   O ejecuta:  create extension if not exists pg_cron;
--
-- PASOS:
--   1) Ejecutar SOLO el paso 1 (habilitar extensión) si hace falta
--   2) Ejecutar el resto del archivo (tabla + función + programar cron)
-- =============================================

-- PASO 1: HABILITAR pg_cron (ejecutar aislado si el schema "cron" no existe)
-- create extension if not exists pg_cron;

-- PASO 2 en adelante:

-- Tabla de auditoría de la limpieza (guarda trazabilidad y contadores)
create table if not exists limpieza_envios_log (
  id bigserial primary key,
  ejecutada_en timestamptz not null default now(),
  elegibles integer not null default 0,          -- ENVIADO >30d en plan Básico (candidatos a borrar)
  borrados integer not null default 0,            -- envíos efectivamente eliminados
  no_borrados_pro_plus integer not null default 0, -- ENVIADO >30d de usuarios Pro/Business Plus (NO se borran)
  en_espera_gracia integer not null default 0,    -- ENVIADO >30d de ex-miembros en los 90 días de gracia (NO se borran)
  total_envios integer not null default 0         -- total de envíos en la BD en ese momento
);

-- Columna nueva (idempotente por si la tabla ya existía)
alter table limpieza_envios_log add column if not exists en_espera_gracia integer not null default 0;

-- Función de limpieza
create or replace function limpiar_envios_basico_antiguos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_elegibles integer;
  v_no_pro_plus integer;
  v_en_espera integer;
  v_total integer;
  v_envio record;
  v_borrados integer := 0;
begin
  -- Contador total de envíos en la BD
  select count(*) into v_total from envios;

  -- ============================================================
  -- 1) CANDIDATOS A BORRAR (plan Básico efectivo)
  --      - pro_until null (nunca pagó): envio +30 días
  --      - pro_until vencido hace MÁS de 90 días (ex-miembro
  --        fuera de gracia): envio +30 días
  -- ============================================================
  select count(*) into v_elegibles
  from envios e
  join profiles p on p.id = e.user_id
  where
    e.estado = 'ENVIADO'
    and e.fecha_registro <= now() - interval '30 days'
    and (p.pro_until is null or p.pro_until <= now())
    and (
      p.pro_until is null
      or (
        p.pro_until is not null
        and p.pro_until <= now() - interval '90 days'
      )
    )
    and (
      p.trial_end is null
      or p.trial_end <= now()
      or p.plan not in ('pro', 'business_plus')
    );

  -- ============================================================
  -- 2) EN ESPERA DE GRACIA (ex-miembros con pro_until vencido
  --    en los últimos 90 días): NO se borran todavía
  -- ============================================================
  select count(*) into v_en_espera
  from envios e
  join profiles p on p.id = e.user_id
  where
    e.estado = 'ENVIADO'
    and e.fecha_registro <= now() - interval '30 days'
    and p.pro_until is not null
    and p.pro_until <= now()
    and p.pro_until > now() - interval '90 days'
    and (
      p.trial_end is null
      or p.trial_end <= now()
      or p.plan not in ('pro', 'business_plus')
    );

  -- ============================================================
  -- 3) ENVÍOS ENVIADO >30d DE PRO/BUSINESS PLUS ACTIVO
  --    (NO se borran; sirven para el comparativo de la cuenta)
  -- ============================================================
  select count(*) into v_no_pro_plus
  from envios e
  join profiles p on p.id = e.user_id
  where
    e.estado = 'ENVIADO'
    and e.fecha_registro <= now() - interval '30 days'
    and (
      (p.pro_until is not null and p.pro_until > now())
      or (
        p.trial_end is not null and p.trial_end > now()
        and p.plan in ('pro', 'business_plus')
      )
    );

  -- ============================================================
  -- 4) BORRAR candidatos (misma condición que el contador 1)
  -- ============================================================
  for v_envio in
    select e.id
    from envios e
    join profiles p on p.id = e.user_id
    where
      e.estado = 'ENVIADO'
      and e.fecha_registro <= now() - interval '30 days'
      and (p.pro_until is null or p.pro_until <= now())
      and (
        p.pro_until is null
        or (
          p.pro_until is not null
          and p.pro_until <= now() - interval '90 days'
        )
      )
      and (
        p.trial_end is null
        or p.trial_end <= now()
        or p.plan not in ('pro', 'business_plus')
      )
  loop
    -- Desvincular ventas (conservan su estado_envio actual, p.ej. COMPLETADO)
    update ventas
       set envio_id = null,
           updated_at = now()
     where envio_id = v_envio.id;

    -- Eliminar items del envío (aunque cascade, explícito por robustez)
    delete from envio_items where envio_id = v_envio.id;

    -- Eliminar el envío
    delete from envios where id = v_envio.id;

    v_borrados := v_borrados + 1;
  end loop;

  -- Registrar la ejecución en el log
  insert into limpieza_envios_log (elegibles, borrados, no_borrados_pro_plus, en_espera_gracia, total_envios)
  values (v_elegibles, v_borrados, v_no_pro_plus, v_en_espera, v_total);

  return v_borrados;
end;
$$;

-- Pregunta: cómo comparar eliminados vs en espera de gracia:
--   select ejecutada_en, elegibles, borrados,
--          no_borrados_pro_plus,
--          en_espera_gracia,
--          total_envios
--   from limpieza_envios_log order by id desc;

-- Programar la limpieza diaria (si la extensión pg_cron ya está activa,
-- reemplaza el job existente con el mismo nombre si lo hubiera).
do $cronbloque$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule(
      'limpiar-envios-basico-30-dias',  -- nombre del job
      '0 3 * * *',                      -- cron: todos los días a las 03:00 UTC
      $$ select limpiar_envios_basico_antiguos(); $$
    );
    raise notice 'Cron programado correctamente (diario 03:00 UTC).';
  else
    raise notice 'AVISO: la extensión pg_cron no está habilitada. '
                 'Habilítala en Database -> Extensions -> pg_cron (o ejecuta: '
                 'create extension if not exists pg_cron;) y vuelve a ejecutar '
                 'este bloque. La función de limpieza ya quedó creada.';
  end if;
end $cronbloque$;

-- Para probar manualmente:
-- select limpiar_envios_basico_antiguos();

-- >>>>>>>>>> supabase/indices-optimizacion.sql <<<<<<<<<<
-- Índices para optimizar consultas con miles de registros
-- Cada tenant filtra por su user/profile_id y ordena por fecha (desc)

-- Ventas: filtro por profile_id + estado, orden por created_at desc
create index if not exists idx_ventas_profile_created
  on ventas (profile_id, created_at desc);

create index if not exists idx_ventas_profile_estado_created
  on ventas (profile_id, estado, created_at desc);

-- Items de venta por producto (costo/ganancia)
create index if not exists idx_venta_items_producto
  on venta_items (producto_id);

-- Compras: filtro por profile_id + estado, orden por created_at desc
create index if not exists idx_compras_profile_created
  on compras (profile_id, created_at desc);

create index if not exists idx_compras_profile_estado_created
  on compras (profile_id, estado, created_at desc);

-- Items de compra por producto
create index if not exists idx_compra_items_producto
  on compra_items (producto_id);

-- Gastos: filtro por profile_id + categoria, orden por fecha desc
create index if not exists idx_gastos_profile_fecha
  on gastos (profile_id, fecha desc);

create index if not exists idx_gastos_profile_categoria_fecha
  on gastos (profile_id, categoria, fecha desc);

-- Productos: filtro por profile_id, orden por nombre
create index if not exists idx_productos_profile_nombre
  on productos (profile_id, nombre);

-- Envíos: filtro por user_id, orden por fecha_registro desc
create index if not exists idx_envios_user_fecha
  on envios (user_id, fecha_registro desc);

create index if not exists idx_envios_user_estado_fecha
  on envios (user_id, estado, fecha_registro desc);

-- Personas: búsqueda por teléfono (además del dni ya indexado)
create index if not exists idx_personas_telefono
  on personas (telefono);

-- >>>>>>>>>> supabase/realtime-envios.sql <<<<<<<<<<
-- Enable Realtime for the envios table
alter publication supabase_realtime add table envios;

-- >>>>>>>>>> supabase/realtime-ventas.sql <<<<<<<<<<
-- ============================================================
-- REALTIME: habilitar la tabla ventas en la publicación.
-- (envios ya estaba habilitado en realtime-envios.sql)
-- Ejecutar una sola vez en Supabase SQL Editor.
-- ============================================================

alter publication supabase_realtime add table ventas;

-- >>>>>>>>>> supabase/rls-policies.sql <<<<<<<<<<
-- =============================================
-- RLS POLICIES — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_moto ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES
-- =============================================

-- Cualquier persona puede leer perfiles (necesario para /f/[slug])
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

-- Solo el propietario puede crear su propio perfil
CREATE POLICY "profiles_insert_owner" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Solo el propietario puede actualizar su perfil
CREATE POLICY "profiles_update_owner" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Solo el propietario puede eliminar su perfil
CREATE POLICY "profiles_delete_owner" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- =============================================
-- ENVIOS
-- =============================================

-- El dashboard lista envíos del usuario autenticado
CREATE POLICY "envios_select_owner" ON envios
  FOR SELECT USING (auth.uid() = user_id);

-- Actualizar estado/tamaño desde el dashboard
CREATE POLICY "envios_update_owner" ON envios
  FOR UPDATE USING (auth.uid() = user_id);

-- Eliminar envíos (si se implementa)
CREATE POLICY "envios_delete_owner" ON envios
  FOR DELETE USING (auth.uid() = user_id);

-- NOTA: INSERT se hace via /api/envios con service_role key (bypass RLS)

-- =============================================
-- TARIFAS_MOTO
-- =============================================

-- Leer tarifas propias
CREATE POLICY "tarifas_select_owner" ON tarifas_moto
  FOR SELECT USING (auth.uid() = profile_id);

-- Insertar/actualizar tarifas desde configuración
CREATE POLICY "tarifas_insert_owner" ON tarifas_moto
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "tarifas_update_owner" ON tarifas_moto
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "tarifas_delete_owner" ON tarifas_moto
  FOR DELETE USING (auth.uid() = profile_id);

-- >>>>>>>>>> supabase/seguridad-fixes.sql <<<<<<<<<<
-- ============================================================
-- SEGURIDAD: cierre de brechas críticas/altas
-- ============================================================
-- Ejecutar UNA vez en el SQL Editor (es idempotente). Después, volver a
-- ejecutar supabase/logistica-anticipacion-solo-habiles.sql: ahora
-- guardar_configuracion() verifica que quien llama sea el dueño del perfil.
--
--  1. profiles ya no se lee públicamente (solo el propio y el del dueño
--     para sus miembros). El formulario público /f/[slug] lee con service role.
--  2. Un usuario no puede cambiar sus columnas privilegiadas
--     (role, disabled, plan, trial_end, pro_until) ni crear un perfil con ellas.
--  3. Las URLs de redirección/redes del perfil solo pueden ser http(s).
--  4. Las funciones de stock/ventas ya no son invocables con la clave anónima
--     ni por usuarios autenticados: solo el backend (service_role).
--  5. slug_disponible(): reemplaza la consulta directa a profiles del cliente.
-- ============================================================

-- ---------- 1. RLS de profiles -----------------------------------------
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_member" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Un miembro del negocio puede leer el perfil de su dueño (configuración, plan).
CREATE POLICY "profiles_select_member" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_members m
      WHERE m.user_id = auth.uid() AND m.owner_id = profiles.id
    )
  );

-- Update/delete: la política existente solo comprueba USING; se añade WITH CHECK
-- para que el id no se pueda reasignar.
DROP POLICY IF EXISTS "profiles_update_owner" ON profiles;
CREATE POLICY "profiles_update_owner" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- 2 y 3. Trigger de protección --------------------------------
CREATE OR REPLACE FUNCTION proteger_columnas_profiles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_rol text := auth.role();
  v_col text;
BEGIN
  -- Solo se restringe a clientes (anon/authenticated). El backend con
  -- service_role y el SQL Editor (auth.role() null) quedan exentos.
  IF v_rol IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
      NEW.disabled := false;
      NEW.plan := 'basic';
      NEW.trial_end := NULL;
      NEW.pro_until := NULL;
    ELSE
      IF NEW.role IS DISTINCT FROM OLD.role
         OR NEW.disabled IS DISTINCT FROM OLD.disabled
         OR NEW.plan IS DISTINCT FROM OLD.plan
         OR NEW.trial_end IS DISTINCT FROM OLD.trial_end
         OR NEW.pro_until IS DISTINCT FROM OLD.pro_until THEN
        RAISE EXCEPTION 'No autorizado a modificar role, plan o vigencia';
      END IF;
    END IF;
  END IF;

  -- URLs que terminan en un href o en window.location: solo http(s).
  FOREACH v_col IN ARRAY ARRAY[
    'redirect_url', 'instagram_url', 'facebook_url',
    'tiktok_url', 'web_url', 'whatsapp_url'
  ] LOOP
    IF coalesce(to_jsonb(NEW) ->> v_col, '') <> ''
       AND (to_jsonb(NEW) ->> v_col) ~* '^\s*[a-z][a-z0-9+.-]*:'
       AND (to_jsonb(NEW) ->> v_col) !~* '^\s*https?://' THEN
      RAISE EXCEPTION 'La URL de % debe empezar con http:// o https://', v_col;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_columnas_profiles ON profiles;
CREATE TRIGGER trg_proteger_columnas_profiles
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION proteger_columnas_profiles();

-- ---------- 4. Funciones SECURITY DEFINER solo para el backend ----------
DO $$
DECLARE
  firma text;
BEGIN
  FOR firma IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'descontar_stock', 'sumar_stock', 'restar_stock', 'ajustar_stock',
        'editar_venta_atomico', 'anular_venta_atomico', 'eliminar_venta_atomico',
        'limpiar_envios_basico_antiguos'
      )
  LOOP
    EXECUTE 'REVOKE ALL ON FUNCTION ' || firma || ' FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION ' || firma || ' TO service_role';
  END LOOP;
END $$;

-- set_super_admin y similares de super-admin.sql no existen como funciones;
-- el rol solo se asigna por UPDATE directo (service role / SQL Editor).

-- ---------- 5. Disponibilidad de slug -----------------------------------
CREATE OR REPLACE FUNCTION slug_disponible(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE slug = p_slug AND id <> auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION slug_disponible(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION slug_disponible(text) TO authenticated;

-- ---------- Auditoría rápida (solo lectura) -----------------------------
-- Ejecutar a mano para detectar abusos previos:
--   SELECT id, empresa, role FROM profiles WHERE role = 'super_admin';
--   SELECT p.id, p.empresa, p.plan, p.pro_until FROM profiles p
--     WHERE p.plan IN ('pro','business_plus')
--       AND NOT EXISTS (SELECT 1 FROM pagos g WHERE g.user_id = p.id)
--       AND (p.trial_end IS NULL OR p.trial_end < now());

-- >>>>>>>>>> supabase/plan-basico-plus.sql <<<<<<<<<<
-- Dos planes comerciales. Idempotente; no modifica importes de suscripciones,
-- recibos, datos de operación ni las fechas de pruebas o pagos existentes.
BEGIN;
UPDATE plan_features SET
  max_envios = NULL, max_productos = 0, max_ventas = 0,
  max_exportaciones_shalom = 0, max_pedidos_copiar = 0,
  dashboard_completo = FALSE, envios_masivos = FALSE, max_miembros = 0
WHERE plan = 'basic';
UPDATE plan_features SET
  max_envios = NULL, max_metodos = NULL, max_productos = NULL, max_ventas = NULL,
  max_exportaciones_shalom = NULL, max_pedidos_copiar = NULL,
  form_branding = TRUE, dashboard_completo = TRUE, envios_masivos = TRUE,
  control_logistico = TRUE, max_miembros = 4
WHERE plan = 'business_plus';
-- Compatibilidad: los antiguos Pro conservan trial_end y pro_until.
UPDATE profiles SET plan = 'business_plus' WHERE plan = 'pro';
DELETE FROM plan_features WHERE plan = 'pro';
COMMIT;

-- >>>>>>>>>> supabase/acceso-solo-servidor.sql <<<<<<<<<<
-- ============================================================
-- ACCESO A LOS DATOS SOLO DESDE EL SERVIDOR
-- ============================================================
-- Ejecutar DESPUÉS de desplegar la versión de la app en la que el navegador ya
-- no habla con la base (todo pasa por /api). Si se ejecuta antes, la versión
-- anterior de la app deja de funcionar.
--
-- Efecto: las claves públicas (anon) y las sesiones de usuario (authenticated)
-- ya no pueden leer ni escribir NINGUNA tabla ni ejecutar NINGUNA función del
-- esquema public, ni siquiera sus propios datos. Solo el servidor de la app
-- (service_role) accede. Aunque alguien encuentre la URL del proyecto y la clave
-- anónima, la API de datos le responde "permission denied".
--
-- RLS sigue activo como segunda barrera. Es idempotente.
--
-- Además, en Supabase → Project Settings → Data API se puede apagar la API de
-- datos (o quitar `public` de "Exposed schemas"): es el mismo resultado a nivel
-- de red. La autenticación (login) la hace el servidor de la app.
-- ============================================================

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT ALL     ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL     ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Lo que se cree de aquí en adelante tampoco queda abierto a los roles públicos.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Las imágenes se suben desde el servidor: el navegador ya no escribe en Storage.
-- (En Supabase la tabla pertenece a otro rol; si no se puede cambiar, se ignora y
-- basta con quitar a mano las políticas de INSERT/UPDATE/DELETE del panel.)
DO $$
BEGIN
  REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon, authenticated;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudieron revocar permisos en storage.objects: %', SQLERRM;
END $$;

-- >>>>>>>>>> supabase/productos-familias.sql <<<<<<<<<<
-- Catálogo integrado. Migración ADITIVA: no actualiza ni agrupa productos existentes.
-- Los IDs usados por ventas/compras/kardex siguen siendo productos.id.
begin;
create table if not exists public.productos_familias (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 nombre text not null check(length(trim(nombre)) between 1 and 200),
 descripcion text,
 precio_base numeric(10,2) not null default 0 check(precio_base>=0),
 imagen_url text,
 unidad text not null default 'unidad',
 opciones jsonb not null default '["Variante"]' check(jsonb_typeof(opciones)='array'),
 archivado boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default clock_timestamp()
);
create table if not exists public.producto_variantes (
 producto_id uuid primary key references public.productos(id) on delete cascade,
 familia_id uuid not null references public.productos_familias(id) on delete cascade,
 opciones jsonb not null check(jsonb_typeof(opciones)='object' and opciones<>'{}'),
 precio_especial boolean not null default false,
 nombre_especial boolean not null default false,
 descripcion_especial boolean not null default false,
 imagen_especial boolean not null default false,
 unique(familia_id, opciones) deferrable initially deferred
);
create index if not exists productos_familias_owner on public.productos_familias(profile_id,id);
create index if not exists producto_variantes_familia on public.producto_variantes(familia_id);
alter table public.productos_familias enable row level security;
alter table public.producto_variantes enable row level security;
revoke all on public.productos_familias, public.producto_variantes from anon,authenticated;
grant all on public.productos_familias, public.producto_variantes to service_role;

create or replace function public.marcar_variante_editada() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if current_setting('tori.familia_propagando',true)='1' then return new; end if;
 begin
  perform id from productos_familias where id in(select familia_id from producto_variantes where producto_id=new.id) for update nowait;
 exception when lock_not_available then raise exception 'La ficha se está editando. Vuelve a intentar' using errcode='40001'; end;
 update producto_variantes set
  precio_especial=precio_especial or new.precio_venta is distinct from old.precio_venta,
  nombre_especial=nombre_especial or new.nombre is distinct from old.nombre,
  descripcion_especial=descripcion_especial or new.descripcion is distinct from old.descripcion,
  imagen_especial=imagen_especial or new.imagen_url is distinct from old.imagen_url
 where producto_id=new.id;
 update productos_familias set updated_at=clock_timestamp() where id in(select familia_id from producto_variantes where producto_id=new.id);
 return new;
end $$;
drop trigger if exists producto_variante_edicion on public.productos;
create trigger producto_variante_edicion after update of nombre,descripcion,precio_venta,imagen_url,sku,stock_minimo,unidad,archivado,precio_compra on public.productos for each row execute function public.marcar_variante_editada();

create or replace function public.gestionar_producto_familia(
 p_owner uuid, p_accion text, p_familia uuid, p_esperado timestamptz,
 p_datos jsonb, p_variantes jsonb
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare
 f productos_familias%rowtype; pr productos%rowtype; vi producto_variantes%rowtype;
 v jsonb; opciones_val jsonb; pid uuid; etiqueta text; nsku text; especial boolean;
 prev_setting text;
begin
 if p_owner is null or not exists(select 1 from profiles where id=p_owner) then raise exception 'Negocio no encontrado'; end if;
 if p_accion not in('crear','agrupar','guardar','desvincular','disolver') then raise exception 'Acción no válida'; end if;
 if jsonb_typeof(p_variantes)<>'array' or jsonb_array_length(p_variantes)>200 then raise exception 'Lista de variantes no válida'; end if;
 prev_setting:=coalesce(current_setting('tori.familia_propagando',true),'');
 perform set_config('tori.familia_propagando','1',true);
 if p_accion in('crear','agrupar') then
  if jsonb_array_length(p_variantes)<1 then raise exception 'Agrega al menos una variante'; end if;
  insert into productos_familias(profile_id,nombre,descripcion,precio_base,imagen_url,unidad,opciones)
  values(p_owner,trim(p_datos->>'nombre'),nullif(p_datos->>'descripcion',''),(p_datos->>'precio_base')::numeric,nullif(p_datos->>'imagen_url',''),coalesce(nullif(p_datos->>'unidad',''),'unidad'),p_datos->'opciones') returning * into f;
 else
  select * into f from productos_familias where id=p_familia and profile_id=p_owner for update;
  if not found then raise exception 'Producto principal no encontrado'; end if;
  if p_esperado is null or f.updated_at<>p_esperado then raise exception 'El producto cambió. Actualiza la ficha antes de guardar'; end if;
 end if;
 if p_accion='disolver' then
  delete from productos_familias where id=f.id;
  perform set_config('tori.familia_propagando',prev_setting,true); return f.id;
 end if;
 -- Bloquear en orden estable evita intercalar ventas o ajustes de una misma variante.
 perform p.id from productos p where p.id in(select producto_id from producto_variantes where familia_id=f.id) or (p_accion='agrupar' and p.id in(select (x->>'producto_id')::uuid from jsonb_array_elements(p_variantes) x)) order by p.id for update;
 if p_accion='desvincular' then
  for v in select value from jsonb_array_elements(p_variantes) loop
   if not exists(select 1 from producto_variantes pv join productos p on p.id=pv.producto_id where pv.producto_id=(v->>'producto_id')::uuid and pv.familia_id=f.id and p.profile_id=p_owner) then raise exception 'Variante no encontrada'; end if;
   delete from producto_variantes where producto_id=(v->>'producto_id')::uuid and familia_id=f.id;
  end loop;
  update productos_familias set updated_at=clock_timestamp() where id=f.id;
  perform set_config('tori.familia_propagando',prev_setting,true); return f.id;
 end if;
 if p_accion='guardar' then
  if p_datos->'opciones' is distinct from f.opciones then raise exception 'Las opciones de una ficha existente no se pueden cambiar'; end if;
  if (select count(*) from producto_variantes where familia_id=f.id) + (select count(*) from jsonb_array_elements(p_variantes) x where nullif(x->>'producto_id','') is null)>200 then raise exception 'Máximo 200 variantes por ficha'; end if;
  update productos_familias set nombre=trim(p_datos->>'nombre'),descripcion=nullif(p_datos->>'descripcion',''),precio_base=(p_datos->>'precio_base')::numeric,
    imagen_url=nullif(p_datos->>'imagen_url',''),unidad=coalesce(nullif(p_datos->>'unidad',''),'unidad'),opciones=p_datos->'opciones',updated_at=clock_timestamp()
  where id=f.id returning * into f;
 end if;
 if jsonb_array_length(f.opciones)<1 or jsonb_array_length(f.opciones)>3 then raise exception 'Define de una a tres opciones'; end if;
 for v in select value from jsonb_array_elements(p_variantes) loop
  opciones_val:=v->'opciones';
  if jsonb_typeof(opciones_val)<>'object' or (select count(*) from jsonb_object_keys(opciones_val))<>jsonb_array_length(f.opciones) then raise exception 'Completa las opciones de cada variante'; end if;
  etiqueta:='';
  for nsku in select jsonb_array_elements_text(f.opciones) loop
   if length(trim(coalesce(opciones_val->>nsku,''))) not between 1 and 100 then raise exception 'Valor de variante no válido'; end if;
   etiqueta:=etiqueta||case when etiqueta='' then '' else ' / ' end||trim(opciones_val->>nsku);
  end loop;
  if p_accion='agrupar' then
   select * into pr from productos where id=(v->>'producto_id')::uuid and profile_id=p_owner for update;
   if not found then raise exception 'Producto no encontrado en este negocio'; end if;
   if exists(select 1 from producto_variantes where producto_id=pr.id) then raise exception 'Un producto ya pertenece a otra ficha'; end if;
   -- Agrupar SOLO inserta la relación. No cambia productos, stocks ni históricos.
   insert into producto_variantes(producto_id,familia_id,opciones,precio_especial,nombre_especial,descripcion_especial,imagen_especial)
   values(pr.id,f.id,opciones_val,true,true,true,true);
   continue;
  end if;
  if nullif(v->>'producto_id','') is null then
   nsku:=nullif(trim(v->>'sku'),'');
   if nsku is not null and exists(select 1 from productos where profile_id=p_owner and lower(sku)=lower(nsku)) then raise exception 'El SKU ya está registrado'; end if;
   especial:=coalesce((v->>'precio_especial')::boolean,false);
   if coalesce((v->>'precio_venta')::numeric,f.precio_base)<0 or coalesce((v->>'precio_compra')::numeric,0)<0 or coalesce((v->>'stock_actual')::integer,0)<0 then raise exception 'Los importes y el stock deben ser positivos o cero'; end if;
   insert into productos(profile_id,nombre,sku,descripcion,precio_venta,precio_compra,stock_actual,stock_minimo,unidad,imagen_url,archivado)
   values(p_owner,f.nombre||' - '||etiqueta,nsku,f.descripcion,case when especial then (v->>'precio_venta')::numeric else f.precio_base end,coalesce((v->>'precio_compra')::numeric,0),0,coalesce((v->>'stock_minimo')::integer,0),f.unidad,coalesce(nullif(v->>'imagen_url',''),f.imagen_url),coalesce((v->>'archivado')::boolean,false)) returning id into pid;
   insert into producto_variantes(producto_id,familia_id,opciones,precio_especial,imagen_especial) values(pid,f.id,opciones_val,especial,nullif(v->>'imagen_url','') is not null);
   if coalesce((v->>'stock_actual')::integer,0)>0 then perform * from ajustar_stock(pid,(v->>'stock_actual')::integer,'Stock inicial'); end if;
  else
   pid:=(v->>'producto_id')::uuid;
   select * into vi from producto_variantes where producto_id=pid and familia_id=f.id;
   if not found then raise exception 'La variante no pertenece a este producto'; end if;
   select * into pr from productos where id=pid and profile_id=p_owner for update;
   if not found then raise exception 'Variante no encontrada en este negocio'; end if;
   update producto_variantes set opciones=opciones_val,
    precio_especial=coalesce((v->>'precio_especial')::boolean,precio_especial),
    nombre_especial=coalesce((v->>'nombre_especial')::boolean,nombre_especial),
    descripcion_especial=coalesce((v->>'descripcion_especial')::boolean,descripcion_especial),
    imagen_especial=coalesce((v->>'imagen_especial')::boolean,imagen_especial)
   where producto_id=pid returning * into vi;
   if v ? 'sku' and (nullif(v->>'sku','') is distinct from pr.sku) and nullif(v->>'sku','') is not null and exists(select 1 from productos where profile_id=p_owner and id<>pid and lower(sku)=lower(v->>'sku')) then raise exception 'El SKU ya está registrado'; end if;
   update productos set
    nombre=case when v ? 'nombre' then v->>'nombre' else nombre end,
    descripcion=case when v ? 'descripcion' then nullif(v->>'descripcion','') else descripcion end,
    precio_venta=case when v ? 'precio_venta' then (v->>'precio_venta')::numeric else precio_venta end,
    sku=case when v ? 'sku' then nullif(v->>'sku','') else sku end,
    imagen_url=case when v ? 'imagen_url' then nullif(v->>'imagen_url','') else imagen_url end,
    precio_compra=case when v ? 'precio_compra' then (v->>'precio_compra')::numeric else precio_compra end,
    stock_minimo=case when v ? 'stock_minimo' then (v->>'stock_minimo')::integer else stock_minimo end,
    archivado=case when v ? 'archivado' then (v->>'archivado')::boolean else archivado end,
    updated_at=clock_timestamp() where id=pid;
   if v ? 'stock_actual' then
    if (v->>'stock_esperado')::integer is distinct from pr.stock_actual then raise exception 'El stock cambió durante la edición. Actualiza la ficha'; end if;
    if length(trim(coalesce(v->>'motivo','')))<3 then raise exception 'Indica el motivo del ajuste de stock'; end if;
    if (v->>'stock_actual')::integer<0 then raise exception 'El stock no puede ser negativo'; end if;
    perform * from ajustar_stock(pid,(v->>'stock_actual')::integer,v->>'motivo');
    update productos set archivado=((v->>'stock_actual')::integer<=0) where id=pid;
   end if;
  end if;
 end loop;
 -- Campos heredados. Las excepciones permanecen hasta que el usuario las quite.
 update productos p set
  nombre=case when not pv.nombre_especial then f.nombre||' - '||(select string_agg(pv.opciones->>x.value,' / ' order by x.ordinality) from jsonb_array_elements_text(f.opciones) with ordinality x(value,ordinality)) else p.nombre end,
  descripcion=case when not pv.descripcion_especial then f.descripcion else p.descripcion end,
  precio_venta=case when not pv.precio_especial then f.precio_base else p.precio_venta end,
  imagen_url=case when not pv.imagen_especial then f.imagen_url else p.imagen_url end,
  updated_at=clock_timestamp()
 from producto_variantes pv where p.id=pv.producto_id and pv.familia_id=f.id and p.profile_id=p_owner and p_accion<>'agrupar';
 update productos_familias set updated_at=clock_timestamp() where id=f.id;
 perform set_config('tori.familia_propagando',prev_setting,true);
 return f.id;
end $$;
revoke all on function public.gestionar_producto_familia(uuid,text,uuid,timestamptz,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.gestionar_producto_familia(uuid,text,uuid,timestamptz,jsonb,jsonb) to service_role;
revoke all on function public.marcar_variante_editada() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;

-- >>>>>>>>>> supabase/eliminar-producto-familia.sql <<<<<<<<<<
-- Instala la eliminación completa. Ejecutar este SQL no elimina ningún producto.
begin;
create or replace function public.eliminar_producto_familia(
 p_owner uuid, p_familia uuid, p_esperado timestamptz
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 f productos_familias%rowtype; ids uuid[]; fotos jsonb; cantidad integer;
begin
 select * into f from productos_familias where id=p_familia and profile_id=p_owner for update;
 if not found then raise exception 'Producto principal no encontrado'; end if;
 if p_esperado is null or f.updated_at<>p_esperado then
  raise exception 'El producto cambió. Actualiza la ficha antes de eliminar' using errcode='40001';
 end if;
 -- Mismo orden de bloqueos que la edición de fichas; todo se confirma o se revierte.
 perform p.id from productos p join producto_variantes v on v.producto_id=p.id
 where v.familia_id=f.id order by p.id for update of p;
 if exists(select 1 from producto_variantes v join productos p on p.id=v.producto_id
           where v.familia_id=f.id and p.profile_id<>p_owner) then
  raise exception 'La ficha contiene una variante de otro negocio';
 end if;
 select coalesce(array_agg(producto_id),array[]::uuid[]) into ids
 from producto_variantes where familia_id=f.id;
 select coalesce(jsonb_agg(distinct url),'[]'::jsonb) into fotos from (
  select imagen_url as url from productos where id=any(ids)
  union select f.imagen_url
 ) x where url is not null;
 -- Las FK conservan compras/ventas con su nombre e importes (producto_id pasa a NULL).
 -- El kardex de los productos eliminados se borra según su FK ON DELETE CASCADE.
 delete from productos where profile_id=p_owner and id=any(ids);
 get diagnostics cantidad=row_count;
 delete from productos_familias where id=f.id and profile_id=p_owner;
 return jsonb_build_object('eliminados',cantidad,'imagenes',fotos);
end $$;
revoke all on function public.eliminar_producto_familia(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.eliminar_producto_familia(uuid,uuid,timestamptz) to service_role;
notify pgrst,'reload schema';
commit;
