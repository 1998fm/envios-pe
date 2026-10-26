-- ============================================================
-- SEGURIDAD: cierre de brechas críticas/altas
-- ============================================================
-- Ejecutar UNA vez en el SQL Editor (es idempotente). Después, volver a
-- ejecutar supabase/logistica-anticipacion-solo-habiles.sql: ahora
-- guardar_configuracion() verifica que quien llama sea el dueño del perfil.
--
--  1. profiles ya no se lee públicamente (solo el propio y el del dueño
--     para sus miembros). El formulario público /f/[slug] lee con service role.
--  2. Un usuario no puede cambiar sus columnas privilegiadas
--     (role, disabled, plan, trial_end, pro_until) ni crear un perfil con ellas.
--  3. Las URLs de redirección/redes del perfil solo pueden ser http(s).
--  4. Las funciones de stock/ventas ya no son invocables con la clave anónima
--     ni por usuarios autenticados: solo el backend (service_role).
--  5. slug_disponible(): reemplaza la consulta directa a profiles del cliente.
-- ============================================================

-- ---------- 1. RLS de profiles -----------------------------------------
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_member" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Un miembro del negocio puede leer el perfil de su dueño (configuración, plan).
CREATE POLICY "profiles_select_member" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_members m
      WHERE m.user_id = auth.uid() AND m.owner_id = profiles.id
    )
  );

-- Update/delete: la política existente solo comprueba USING; se añade WITH CHECK
-- para que el id no se pueda reasignar.
DROP POLICY IF EXISTS "profiles_update_owner" ON profiles;
CREATE POLICY "profiles_update_owner" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- 2 y 3. Trigger de protección --------------------------------
CREATE OR REPLACE FUNCTION proteger_columnas_profiles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_rol text := auth.role();
  v_col text;
BEGIN
  -- Solo se restringe a clientes (anon/authenticated). El backend con
  -- service_role y el SQL Editor (auth.role() null) quedan exentos.
  IF v_rol IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
      NEW.disabled := false;
      NEW.plan := 'basic';
      NEW.trial_end := NULL;
      NEW.pro_until := NULL;
    ELSE
      IF NEW.role IS DISTINCT FROM OLD.role
         OR NEW.disabled IS DISTINCT FROM OLD.disabled
         OR NEW.plan IS DISTINCT FROM OLD.plan
         OR NEW.trial_end IS DISTINCT FROM OLD.trial_end
         OR NEW.pro_until IS DISTINCT FROM OLD.pro_until THEN
        RAISE EXCEPTION 'No autorizado a modificar role, plan o vigencia';
      END IF;
    END IF;
  END IF;

  -- URLs que terminan en un href o en window.location: solo http(s).
  FOREACH v_col IN ARRAY ARRAY[
    'redirect_url', 'instagram_url', 'facebook_url',
    'tiktok_url', 'web_url', 'whatsapp_url'
  ] LOOP
    IF coalesce(to_jsonb(NEW) ->> v_col, '') <> ''
       AND (to_jsonb(NEW) ->> v_col) ~* '^\s*[a-z][a-z0-9+.-]*:'
       AND (to_jsonb(NEW) ->> v_col) !~* '^\s*https?://' THEN
      RAISE EXCEPTION 'La URL de % debe empezar con http:// o https://', v_col;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_columnas_profiles ON profiles;
CREATE TRIGGER trg_proteger_columnas_profiles
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION proteger_columnas_profiles();

-- ---------- 4. Funciones SECURITY DEFINER solo para el backend ----------
DO $$
DECLARE
  firma text;
BEGIN
  FOR firma IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'descontar_stock', 'sumar_stock', 'restar_stock', 'ajustar_stock',
        'editar_venta_atomico', 'anular_venta_atomico', 'eliminar_venta_atomico',
        'limpiar_envios_basico_antiguos'
      )
  LOOP
    EXECUTE 'REVOKE ALL ON FUNCTION ' || firma || ' FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION ' || firma || ' TO service_role';
  END LOOP;
END $$;

-- set_super_admin y similares de super-admin.sql no existen como funciones;
-- el rol solo se asigna por UPDATE directo (service role / SQL Editor).

-- ---------- 5. Disponibilidad de slug -----------------------------------
CREATE OR REPLACE FUNCTION slug_disponible(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE slug = p_slug AND id <> auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION slug_disponible(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION slug_disponible(text) TO authenticated;

-- ---------- Auditoría rápida (solo lectura) -----------------------------
-- Ejecutar a mano para detectar abusos previos:
--   SELECT id, empresa, role FROM profiles WHERE role = 'super_admin';
--   SELECT p.id, p.empresa, p.plan, p.pro_until FROM profiles p
--     WHERE p.plan IN ('pro','business_plus')
--       AND NOT EXISTS (SELECT 1 FROM pagos g WHERE g.user_id = p.id)
--       AND (p.trial_end IS NULL OR p.trial_end < now());
