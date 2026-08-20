-- =============================================
-- TARIFAS MOTO → JSONB (1 fila por usuario)
-- IDEMPOTENTE: converge al estado final desde cualquier
-- estado parcial (incluye tabla nueva vacía).
-- Fuente de verdad: tarifas_moto_backup.
-- =============================================

BEGIN;

-- ── 1) RESPALDO (solo si no existe y hay formato viejo) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'tarifas_moto_backup'
  ) AND EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tarifas_moto'
      AND column_name = 'distrito'
  ) THEN
    CREATE TABLE tarifas_moto_backup AS
      SELECT profile_id, distrito, precio FROM tarifas_moto;
    ALTER TABLE tarifas_moto_backup ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ── 2) Si aún está en formato viejo (distrito/precio), migrar a JSONB ──
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tarifas_moto'
      AND column_name = 'distrito'
  ) THEN
    DROP TABLE IF EXISTS tarifas_moto_nuevo;
    CREATE TABLE tarifas_moto_nuevo (
      profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      tarifas jsonb NOT NULL DEFAULT '{}'::jsonb
    );
    INSERT INTO tarifas_moto_nuevo (profile_id, tarifas)
    SELECT tm.profile_id,
           jsonb_object_agg(tm.distrito, to_jsonb(tm.precio)) AS tarifas
    FROM tarifas_moto tm
    INNER JOIN profiles p ON p.id = tm.profile_id
    WHERE tm.distrito IS NOT NULL
    GROUP BY tm.profile_id;
    DROP TABLE tarifas_moto;
    ALTER TABLE tarifas_moto_nuevo RENAME TO tarifas_moto;
  END IF;
END $$;

-- ── 3) Reconstruir datos desde el backup ─────────
-- Limpia filas (parciales) de usuarios del backup y las restaura completas.
-- Conserva filas en formato nuevo de usuarios que NO estén en el backup.
DELETE FROM tarifas_moto t
USING tarifas_moto_backup b
WHERE t.profile_id = b.profile_id;

INSERT INTO tarifas_moto (profile_id, tarifas)
SELECT b.profile_id,
       jsonb_object_agg(b.distrito, to_jsonb(b.precio)) AS tarifas
FROM tarifas_moto_backup b
INNER JOIN profiles p ON p.id = b.profile_id
WHERE b.distrito IS NOT NULL
GROUP BY b.profile_id;

-- ── 4) RLS (solo el dueño) ────────────────────────
ALTER TABLE tarifas_moto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarifas_select_owner" ON tarifas_moto;
DROP POLICY IF EXISTS "tarifas_insert_owner" ON tarifas_moto;
DROP POLICY IF EXISTS "tarifas_update_owner" ON tarifas_moto;
DROP POLICY IF EXISTS "tarifas_delete_owner" ON tarifas_moto;

CREATE POLICY "tarifas_select_owner" ON tarifas_moto
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "tarifas_insert_owner" ON tarifas_moto
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "tarifas_update_owner" ON tarifas_moto
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "tarifas_delete_owner" ON tarifas_moto
  FOR DELETE USING (auth.uid() = profile_id);

COMMIT;

-- ── Verificación ───────────────────────────────────
SELECT
  (SELECT count(*) FROM tarifas_moto) AS filas_nuevas,
  (SELECT count(DISTINCT b.profile_id) FROM tarifas_moto_backup b
     INNER JOIN profiles p ON p.id = b.profile_id) AS usuarios_con_tarifas,
  (SELECT count(*) FROM tarifas_moto_backup) AS filas_backup;