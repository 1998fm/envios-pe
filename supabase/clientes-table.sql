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
