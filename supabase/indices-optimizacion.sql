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