-- Modalidad de entrega para métodos de agencia (OLVA): recojo en agencia o domlicio
ALTER TABLE envios ADD COLUMN IF NOT EXISTS tipo_entrega TEXT;
ALTER TABLE envios DROP CONSTRAINT IF EXISTS tipo_entrega_valido;
ALTER TABLE envios ADD CONSTRAINT tipo_entrega_valido CHECK (tipo_entrega IN ('AGENCIA', 'DOMICILIO'));