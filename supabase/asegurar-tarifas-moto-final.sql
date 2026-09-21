-- ============================================
-- ASEGURAR ESTADO FINAL DE tarifas_moto (2do intento, columna CORRECTA)
-- IDEMPOTENTE: no borra datos. Pegar y correr UNA vez.
-- ============================================

CREATE TABLE IF NOT EXISTS tarifas_moto (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tarifas jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE tarifas_moto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarifas_select_owner" ON tarifas_moto;
CREATE POLICY "tarifas_select_owner" ON tarifas_moto
  FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "tarifas_insert_owner" ON tarifas_moto;
CREATE POLICY "tarifas_insert_owner" ON tarifas_moto
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "tarifas_update_owner" ON tarifas_moto;
CREATE POLICY "tarifas_update_owner" ON tarifas_moto
  FOR UPDATE USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "tarifas_delete_owner" ON tarifas_moto;
CREATE POLICY "tarifas_delete_owner" ON tarifas_moto
  FOR DELETE USING (auth.uid() = profile_id);
