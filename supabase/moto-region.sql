-- Moto region: 'lima' usa la lista de distritos de Lima precargada
-- (distritos-moto.json). 'provincia' permite al usuario agregar sus
-- propios distritos y precios en Configuracion > Tarifas.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moto_region TEXT NOT NULL DEFAULT 'lima';