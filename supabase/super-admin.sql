-- =============================================
-- SUPER ADMIN — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- Agrega el rol super_admin, bloqueo de cuentas,
-- tabla de auditoría y marca la cuenta admin.
-- =============================================

-- 1. Columna de rol (super_admin | user)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 2. Columna de bloqueo (true = cuenta desactivada)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT false;

-- 3. Fecha de creación del perfil (para ordenar empresas) si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. Índices para el panel admin
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);
CREATE INDEX IF NOT EXISTS profiles_disabled_idx ON profiles (disabled);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles (created_at DESC);

-- 5. Tabla de auditoría de acciones del super admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_email TEXT,
  accion TEXT NOT NULL,
  detalle JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_desc_idx
  ON admin_audit_log (created_at DESC);

-- 6. RLS: auditoría legible solo por el propio admin / service_role (bypass)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MARCAR SUPER ADMIN (cambia este email al tuyo si aplica)
-- Busca el usuario en auth.users y actualiza profiles.role
-- =============================================
DO $$
DECLARE
  target_id uuid;
  target_email text := 'DOLLAR.MASIVE@GMAIL.COM';
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = lower(target_email) LIMIT 1;

  IF target_id IS NULL THEN
    RAISE NOTICE 'No se encontro el usuario con email % en auth.users. Marca el rol manualmente.', target_email;
  ELSE
    UPDATE profiles SET role = 'super_admin' WHERE id = target_id;
    RAISE NOTICE 'Usuario % marcado como super_admin (id %).', target_email, target_id;
  END IF;
END $$;
