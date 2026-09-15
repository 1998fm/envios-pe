-- Mostrar tracking en el formulario público
-- Toggle de configuracion en profiles (LOGISTICA -> "Mostrar tracking de pedidos").
-- Con true (default) el boton "¿Ya hiciste un pedido? Rastrea el estado" aparece
-- en el formulario del cliente. Con false se oculta.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mostrar_tracking BOOLEAN NOT NULL DEFAULT true;