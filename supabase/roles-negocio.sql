-- ============================================================
-- ROLES Y PERMISOS POR NEGOCIO
-- Ejecutar en Supabase → SQL Editor (una vez, es idempotente).
-- ============================================================
--
-- Modelo:
--   business_roles    → roles definidos por el dueño (vista por defecto + permisos)
--   business_members  → qué usuario pertenece a qué negocio y con qué rol
--
-- El dueño de la cuenta (profiles.id) es el "owner" de su negocio y
-- administra sus roles. Los miembros ven el dashboard del negocio del
-- dueño, filtrado por los permisos de su rol.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tablas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_roles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre         text NOT NULL,
  vista_default  text NOT NULL DEFAULT 'resumen',
  permisos       jsonb NOT NULL DEFAULT '{}'::jsonb,
  creado_en      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_roles_owner_nombre_unico UNIQUE (owner_id, nombre)
);

CREATE TABLE IF NOT EXISTS business_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id    uuid NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
  creado_en  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_members_owner_user_unico UNIQUE (owner_id, user_id)
);

CREATE INDEX IF NOT EXISTS business_roles_owner_idx ON business_roles (owner_id);
CREATE INDEX IF NOT EXISTS business_members_user_idx  ON business_members (user_id);
CREATE INDEX IF NOT EXISTS business_members_owner_idx ON business_members (owner_id);

-- ------------------------------------------------------------
-- 2. RLS
-- ------------------------------------------------------------
ALTER TABLE business_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- Roles: el dueño ve los suyos; un miembro ve el rol que tiene asignado.
DROP POLICY IF EXISTS business_roles_select ON business_roles;
CREATE POLICY business_roles_select ON business_roles
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (SELECT role_id FROM business_members WHERE user_id = auth.uid())
  );

-- Escribe roles: solo el dueño de ese negocio.
DROP POLICY IF EXISTS business_roles_write ON business_roles;
CREATE POLICY business_roles_write ON business_roles
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Miembros: el dueño ve los suyos; cada miembro ve su propia fila.
DROP POLICY IF EXISTS business_members_select ON business_members;
CREATE POLICY business_members_select ON business_members
  FOR SELECT USING (
    owner_id = auth.uid() OR user_id = auth.uid()
  );

-- Escribe miembros: solo el dueño de ese negocio.
DROP POLICY IF EXISTS business_members_write ON business_members;
CREATE POLICY business_members_write ON business_members
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ------------------------------------------------------------
-- 3. Los miembros necesitan LEER los datos del negocio del dueño.
--    Las políticas de negocio usan auth.uid() = user_id, así que un
--    miembro no vería nada sin esta extensión.
--
--    Reemplaza la política <tabla>_select_owner por una que también
--    acepta las filas cuyo user_id / profile_id pertenece a un negocio
--    del usuario. Las escrituras siguen siendo solo del dueño.
--
--    Cubre ambas convenciones: user_id (envios, ventas, productos...)
--    y profile_id (tarifas_moto).
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
  col text;
BEGIN
  FOR t, col IN
    SELECT DISTINCT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name IN ('user_id', 'profile_id')
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('business_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_owner', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = %I OR %I IN (SELECT owner_id FROM public.business_members WHERE user_id = auth.uid()))',
      t || '_select_member', t, col, col
    );
    RAISE NOTICE 'RLS de lectura extendida a miembros en: %.%', t, col;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 4. Invitaciones
--    Cuando el dueño agrega a alguien que todavía no tiene cuenta,
--    se genera una invitación con un link. Quien lo abre crea su
--    contraseña y queda dentro del negocio con el rol asignado.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email      text NOT NULL,
  role_id    uuid NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,
  estado     text NOT NULL DEFAULT 'pendiente',
  creado_en  timestamptz NOT NULL DEFAULT now(),
  expira_en  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT business_invites_owner_email_unico UNIQUE (owner_id, email)
);

CREATE INDEX IF NOT EXISTS business_invites_owner_idx ON business_invites (owner_id);
CREATE INDEX IF NOT EXISTS business_invites_token_idx  ON business_invites (token);

ALTER TABLE business_invites ENABLE ROW LEVEL SECURITY;

-- Solo el dueño ve sus invitaciones. La aceptación se hace con
-- service_role (el usuario todavía no tiene sesión al abrir el link).
DROP POLICY IF EXISTS business_invites_select ON business_invites;
CREATE POLICY business_invites_select ON business_invites
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS business_invites_write ON business_invites;
CREATE POLICY business_invites_write ON business_invites
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ------------------------------------------------------------
-- 5. Nota sobre el plan
--    profiles.role NO se usa para los roles de negocio: ahí vive
--    'user' | 'super_admin' (control interno de la plataforma).
--    Los roles del negocio viven en business_roles.
-- ------------------------------------------------------------
