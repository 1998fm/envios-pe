-- =============================================
-- TARIFAS MOTO → JSONB (1 fila por usuario)
-- IDEMPOTENTE: puede ejecutarse varias veces y
-- converge al estado final sin importar el estado
-- parcial en que haya quedado una ejecución previa.
-- =============================================

BEGIN;

-- ── 1) RESPALDO ─────────────────────────────────
-- Crea el backup SOLO si no existe y aún existe la
-- tabla con el formato viejo (columnas distrito/precio).
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

-- ── 2) MIGRACIÓN ────────────────────────────────
-- Si tarifas_moto aún es formato viejo, migra a JSONB.
DO $$
DECLARE
  tiene_columna_jsonb boolean;
  existe_tabla boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tarifas_moto'
      AND column_name = 'tarifas'
  ) INTO tiene_columna_jsonb;

  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'tarifas_moto'
  ) INTO existe_tabla;

  IF NOT existe_tabla THEN
    -- Caso: la tabla vieja ya se eliminó pero quedó la nueva sin renombrar
    IF EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'tarifas_moto_nuevo'
    ) THEN
      ALTER TABLE tarifas_moto_nuevo RENAME TO tarifas_moto;
    END IF;
    RETURN;
  END IF;

  IF tiene_columna_jsonb THEN
    RETURN; -- ya migrada
  END IF;

  -- Formato viejo (distrito/precio): migrar
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
END $$;

-- ── 3) RLS (solo el dueño) ──────────────────────
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

-- ── Verificación ────────────────────────────────
SELECT count(*) AS filas_por_usuario FROM tarifas_moto;

-- NOTA: tarifas_moto_backup conserva los registros originales.
-- Cuando confirmes que todo funciona, elimínala con:
--   DROP TABLE tarifas_moto_backup;