-- =============================================
-- TARIFAS MOTO → JSONB (1 fila por usuario)
-- Ejecutar en Supabase SQL Editor
-- Reduce ~39 filas por usuario a 1 fila con columna JSONB.
-- Conserva todos los datos actuales; crea backup automático.
-- =============================================

BEGIN;

-- 1) Respaldo de los datos actuales (se conserva hasta confirmar)
CREATE TABLE IF NOT EXISTS tarifas_moto_backup AS
SELECT profile_id, distrito, precio FROM tarifas_moto;

ALTER TABLE tarifas_moto_backup ENABLE ROW LEVEL SECURITY;

-- 2) Nueva estructura: 1 fila por perfil
CREATE TABLE tarifas_moto_nuevo (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tarifas jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 3) Migrar datos existentes (agrupa todos los distritos por usuario)
--    Solo migra perfiles que existen en "profiles" (descarta huérfanos)
INSERT INTO tarifas_moto_nuevo (profile_id, tarifas)
SELECT tm.profile_id,
       jsonb_object_agg(tm.distrito, to_jsonb(tm.precio)) AS tarifas
FROM tarifas_moto tm
INNER JOIN profiles p ON p.id = tm.profile_id
WHERE tm.distrito IS NOT NULL
GROUP BY tm.profile_id;

-- 4) Reemplazar la tabla vieja
DROP TABLE tarifas_moto;
ALTER TABLE tarifas_moto_nuevo RENAME TO tarifas_moto;

-- 5) RLS (solo el dueño)
ALTER TABLE tarifas_moto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tarifas_select_owner" ON tarifas_moto
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "tarifas_insert_owner" ON tarifas_moto
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "tarifas_update_owner" ON tarifas_moto
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "tarifas_delete_owner" ON tarifas_moto
  FOR DELETE USING (auth.uid() = profile_id);

COMMIT;

-- =============================================
-- NOTA: tarifas_moto_backup conserva los registros originales.
-- Cuando confirmes que todo funciona, elimínala con:
--   DROP TABLE tarifas_moto_backup;
-- =============================================