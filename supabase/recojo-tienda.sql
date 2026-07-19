-- Agregar método "Recojo en tienda"
ALTER TABLE profiles ADD COLUMN metodo_recojo BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN mensaje_recojo TEXT DEFAULT 'Recoge tu pedido en nuestra tienda. Te esperamos!';

-- Permitir RECOJO en la constraint de la tabla envios
ALTER TABLE envios DROP CONSTRAINT IF EXISTS metodo_valido;
ALTER TABLE envios ADD CONSTRAINT metodo_valido CHECK (metodo IN ('MOTORIZADO', 'SHALOM', 'OLVA', 'MARVISUR', 'FLORES', 'OTRO', 'RECOJO'));
