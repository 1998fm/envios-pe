-- =============================================
-- RLS POLICIES — Envios.pe
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_moto ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES
-- =============================================

-- Cualquier persona puede leer perfiles (necesario para /f/[slug])
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

-- Solo el propietario puede crear su propio perfil
CREATE POLICY "profiles_insert_owner" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Solo el propietario puede actualizar su perfil
CREATE POLICY "profiles_update_owner" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Solo el propietario puede eliminar su perfil
CREATE POLICY "profiles_delete_owner" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- =============================================
-- ENVIOS
-- =============================================

-- El dashboard lista envíos del usuario autenticado
CREATE POLICY "envios_select_owner" ON envios
  FOR SELECT USING (auth.uid() = user_id);

-- Actualizar estado/tamaño desde el dashboard
CREATE POLICY "envios_update_owner" ON envios
  FOR UPDATE USING (auth.uid() = user_id);

-- Eliminar envíos (si se implementa)
CREATE POLICY "envios_delete_owner" ON envios
  FOR DELETE USING (auth.uid() = user_id);

-- NOTA: INSERT se hace via /api/envios con service_role key (bypass RLS)

-- =============================================
-- TARIFAS_MOTO
-- =============================================

-- Leer tarifas propias
CREATE POLICY "tarifas_select_owner" ON tarifas_moto
  FOR SELECT USING (auth.uid() = profile_id);

-- Insertar/actualizar tarifas desde configuración
CREATE POLICY "tarifas_insert_owner" ON tarifas_moto
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "tarifas_update_owner" ON tarifas_moto
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "tarifas_delete_owner" ON tarifas_moto
  FOR DELETE USING (auth.uid() = profile_id);
