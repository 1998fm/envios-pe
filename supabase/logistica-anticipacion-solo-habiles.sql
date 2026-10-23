-- ============================================================
-- ANTICIPACIÓN EN DÍAS HÁBILES
-- ============================================================
-- Agrega el interruptor "Aplicar solo a días hábiles" por método.
-- Apagado (default) el comportamiento no cambia: días corridos.
-- Encendido la anticipación avanza contando solo los días de
-- atención del negocio (los marcados en "¿Qué días atiendes?").
--
-- Ejecutar UNA vez desde el SQL Editor. Es reemplazable.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS logistica_moto_anticipacion_solo_habiles boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS logistica_agencias_anticipacion_solo_habiles boolean NOT NULL DEFAULT false;

-- ============================================================
-- La firma del RPC cambia al agregar parámetros: hay que eliminar
-- los overloads anteriores para que PostgREST no quede ambiguo.
-- ============================================================
DO $$
DECLARE
  firma text;
BEGIN
  FOR firma IN
    SELECT oid::regprocedure::text
    FROM pg_proc
    WHERE proname = 'guardar_configuracion'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION ' || firma;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION guardar_configuracion(
  p_profile_id uuid,
  -- Empresa
  p_empresa text,
  p_telefono text,
  p_direccion text,
  p_slug text,
  p_origen_shalom text,
  p_logo_url text,
  -- Redirect
  p_redirect_url text,
  p_redirect_message text,
  p_redirect_message_image text,
  -- Redes
  p_instagram_url text,
  p_facebook_url text,
  p_tiktok_url text,
  p_web_url text,
  p_whatsapp_url text,
  -- Métodos
  p_metodo_motorizado boolean,
  p_metodo_shalom boolean,
  p_metodo_olva boolean,
  p_metodo_marvisur boolean,
  p_metodo_flores boolean,
  p_metodo_otro boolean,
  p_nombre_metodo_otro text,
  p_metodo_recojo boolean,
  p_mensaje_recojo text,
  -- Logística motorizado
  p_logistica_moto_dias text[],
  p_logistica_moto_usa_hora_corte boolean,
  p_logistica_moto_hora_corte text,
  p_logistica_moto_anticipacion integer,
  p_logistica_moto_anticipacion_solo_habiles boolean,
  p_logistica_moto_limitar boolean,
  p_logistica_moto_cupo integer,
  -- Logística agencias
  p_logistica_agencias_dias text[],
  p_logistica_agencias_usa_hora_corte boolean,
  p_logistica_agencias_hora_corte text,
  p_logistica_agencias_anticipacion integer,
  p_logistica_agencias_anticipacion_solo_habiles boolean,
  p_logistica_agencias_limitar boolean,
  p_logistica_agencias_cupo integer,
  -- Formulario / extras
  p_solicitar_cantidad_productos boolean,
  p_mostrar_escoger_fecha boolean,
  p_mostrar_tracking boolean,
  p_cerrar_formulario boolean,
  p_cerrar_formulario_mensaje text,
  p_moto_region text,
  p_cerrar_formulario_dias text[],
  -- Personalización del formulario
  p_color_formulario_primario text,
  p_color_formulario_secundario text,
  -- Tarifas
  p_tarifas jsonb
)
RETURNS TABLE (slug_final text, error_text text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- =======================
  -- PASO 1: TODO PROFILES EN UN SOLO UPDATE (atómico)
  -- =======================
  UPDATE profiles SET
    empresa                = p_empresa,
    telefono               = p_telefono,
    direccion              = p_direccion,
    slug                   = p_slug,
    origen_shalom          = p_origen_shalom,
    logo_url               = p_logo_url,
    redirect_url           = p_redirect_url,
    redirect_message       = p_redirect_message,
    redirect_message_image = p_redirect_message_image,
    instagram_url          = p_instagram_url,
    facebook_url           = p_facebook_url,
    tiktok_url             = p_tiktok_url,
    web_url                = p_web_url,
    whatsapp_url           = p_whatsapp_url,
    metodo_motorizado      = p_metodo_motorizado,
    metodo_shalom          = p_metodo_shalom,
    metodo_olva            = p_metodo_olva,
    metodo_marvisur        = p_metodo_marvisur,
    metodo_flores          = p_metodo_flores,
    metodo_otro            = p_metodo_otro,
    nombre_metodo_otro     = p_nombre_metodo_otro,
    metodo_recojo          = p_metodo_recojo,
    mensaje_recojo         = p_mensaje_recojo,
    logistica_moto_dias           = p_logistica_moto_dias,
    logistica_moto_usa_hora_corte = p_logistica_moto_usa_hora_corte,
    logistica_moto_hora_corte     = NULLIF(p_logistica_moto_hora_corte, '')::time,
    logistica_moto_anticipacion   = p_logistica_moto_anticipacion,
    logistica_moto_anticipacion_solo_habiles = COALESCE(p_logistica_moto_anticipacion_solo_habiles, false),
    logistica_moto_limitar        = p_logistica_moto_limitar,
    logistica_moto_cupo           = p_logistica_moto_cupo,
    logistica_agencias_dias           = p_logistica_agencias_dias,
    logistica_agencias_usa_hora_corte = p_logistica_agencias_usa_hora_corte,
    logistica_agencias_hora_corte     = NULLIF(p_logistica_agencias_hora_corte, '')::time,
    logistica_agencias_anticipacion   = p_logistica_agencias_anticipacion,
    logistica_agencias_anticipacion_solo_habiles = COALESCE(p_logistica_agencias_anticipacion_solo_habiles, false),
    logistica_agencias_limitar        = p_logistica_agencias_limitar,
    logistica_agencias_cupo           = p_logistica_agencias_cupo,
    solicitar_cantidad_productos = p_solicitar_cantidad_productos,
    mostrar_escoger_fecha        = p_mostrar_escoger_fecha,
    mostrar_tracking             = p_mostrar_tracking,
    cerrar_formulario            = p_cerrar_formulario,
    cerrar_formulario_mensaje    = p_cerrar_formulario_mensaje,
    moto_region                  = p_moto_region,
    cerrar_formulario_dias       = p_cerrar_formulario_dias,
    color_formulario_primario    = p_color_formulario_primario,
    color_formulario_secundario  = p_color_formulario_secundario
  WHERE id = p_profile_id;

  -- =======================
  -- PASO 2: TARIFAS EN EL MISMO UPDATE (si vienen filtradas no vacías)
  -- =======================
  IF p_tarifas IS NOT NULL THEN
    INSERT INTO tarifas_moto (profile_id, tarifas)
    VALUES (p_profile_id, p_tarifas)
    ON CONFLICT (profile_id)
    DO UPDATE SET tarifas = EXCLUDED.tarifas;
  END IF;

  -- =======================
  -- OK: devuelve el slug guardado
  -- =======================
  RETURN QUERY SELECT p_slug::text, NULL::text;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::text, SQLERRM;
END;
$$;
