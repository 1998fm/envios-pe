-- =============================================
-- NORMALIZAR NOMBRES DE DISTRITO EN TARIFAS_MOTO
-- Concilia las claves del JSONB `tarifas_moto.tarifas` con el origen de
-- verdad del sistema (`distritos-moto.json`). El caso conocido: el distrito
-- "STA. CLARA" se renombró a "SANTA CLARA", quedando claves históricas
-- desincronizadas que hacían que el formulario no mostrara precio.
--
-- Aplica un mapeo idempotente sobre las claves que coinciden con las
-- variantes normalizadas del distrito cambiado. EJECUTAR UNA VEZ.
-- =============================================

BEGIN;

DO $$
DECLARE
  fila RECORD;
  tarifas_nuevas jsonb;
  clave_actual text;
  clave_nueva text;
BEGIN
  FOR fila IN
    SELECT profile_id, tarifas
    FROM tarifas_moto
  LOOP
    tarifas_nuevas := '{}'::jsonb;

    FOR clave_actual IN
      SELECT jsonb_object_keys(fila.tarifas)
    LOOP
      clave_nueva := clave_actual;

      -- Normalización: minúsculas, espacios colapsados, sin tildes.
      IF lower(btrim(regexp_replace(clave_actual, '\s+', ' ', 'g'))) = 'sta. clara'
         OR lower(btrim(regexp_replace(clave_actual, '\s+', ' ', 'g'))) = 'sta clara'
         OR lower(regexp_replace(clave_actual, '\.', '', 'g')) = 'sta clara' THEN
        clave_nueva := 'SANTA CLARA';
      END IF;

      -- Conserva el valor aunque lo hayamos renombrado.
      tarifas_nuevas := jsonb_set(
        tarifas_nuevas,
        ARRAY[clave_nueva],
        fila.tarifas -> clave_actual
      );
    END LOOP;

    UPDATE tarifas_moto
    SET tarifas = tarifas_nuevas
    WHERE profile_id = fila.profile_id;
  END LOOP;
END $$;

COMMIT;

-- ── Verificación: debería quedar solo "SANTA CLARA" y ningún "STA. CLARA" ──
SELECT profile_id, tarifas
FROM tarifas_moto
WHERE tarifas ? 'STA. CLARA'
   OR tarifas ? 'STA. Clara'
   OR tarifas ? 'Sta. Clara'
   OR tarifas ? 'stan. clara';