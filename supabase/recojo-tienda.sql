-- Agregar método "Recojo en tienda"
ALTER TABLE profiles ADD COLUMN metodo_recojo BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN mensaje_recojo TEXT DEFAULT 'Recoge tu pedido en nuestra tienda. Te esperamos!';
