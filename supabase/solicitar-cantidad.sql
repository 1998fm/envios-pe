-- Solicitar cantidad de productos
-- 1) Toggle de configuracion en profiles (LOGISTICA -> "Solicitar cantidad de productos")
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS solicitar_cantidad_productos BOOLEAN NOT NULL DEFAULT false;

-- 2) Cantidad de prendas guardada junto a los datos del envio
ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS cantidad_productos INT;
