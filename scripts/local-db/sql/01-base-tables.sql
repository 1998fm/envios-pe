-- Tablas base que en producción se crearon a mano desde el panel de Supabase
-- y por eso NO existen en supabase/*.sql. Reconstruidas a partir del uso en
-- el código y de los ALTER TABLE del repositorio. Las columnas que añade un
-- script de supabase/ NO se declaran aquí (se crean al aplicar ese script).

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa text,
  telefono text,
  direccion text,
  slug text UNIQUE,
  origen_shalom text,
  logo_url text,
  redirect_url text,
  redirect_message text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  web_url text,
  whatsapp_url text,
  metodo_motorizado boolean DEFAULT false,
  metodo_shalom boolean DEFAULT false,
  metodo_olva boolean DEFAULT false,
  metodo_marvisur boolean DEFAULT false,
  metodo_flores boolean DEFAULT false,
  metodo_otro boolean DEFAULT false,
  nombre_metodo_otro text,
  logistica_moto_dias text[] DEFAULT '{MONDAY}',
  logistica_moto_usa_hora_corte boolean DEFAULT false,
  logistica_moto_hora_corte time DEFAULT '18:00',
  logistica_moto_limitar boolean DEFAULT false,
  logistica_moto_cupo integer DEFAULT 0,
  logistica_agencias_dias text[] DEFAULT '{MONDAY}',
  logistica_agencias_usa_hora_corte boolean DEFAULT false,
  logistica_agencias_hora_corte time DEFAULT '18:00',
  logistica_agencias_limitar boolean DEFAULT false,
  logistica_agencias_cupo integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre text,
  dni text,
  telefono text,
  metodo text,
  nombre_metodo text,
  destino text,
  direccion text,
  referencia text,
  detalle text,
  observaciones text,
  tamano text,
  estado text NOT NULL DEFAULT 'NO_EMPACADO',
  fecha_registro timestamptz NOT NULL DEFAULT now(),
  fecha_programada timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT estado_valido CHECK (estado IN ('NO_EMPACADO', 'EMPACADO', 'ENVIADO'))
);

-- Forma final de tarifas_moto (ver supabase/asegurar-tarifas-moto-final.sql).
CREATE TABLE IF NOT EXISTS public.tarifas_moto (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tarifas jsonb NOT NULL DEFAULT '{}'::jsonb
);
