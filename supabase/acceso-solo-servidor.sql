-- ============================================================
-- ACCESO A LOS DATOS SOLO DESDE EL SERVIDOR
-- ============================================================
-- Ejecutar DESPUÉS de desplegar la versión de la app en la que el navegador ya
-- no habla con la base (todo pasa por /api). Si se ejecuta antes, la versión
-- anterior de la app deja de funcionar.
--
-- Efecto: las claves públicas (anon) y las sesiones de usuario (authenticated)
-- ya no pueden leer ni escribir NINGUNA tabla ni ejecutar NINGUNA función del
-- esquema public, ni siquiera sus propios datos. Solo el servidor de la app
-- (service_role) accede. Aunque alguien encuentre la URL del proyecto y la clave
-- anónima, la API de datos le responde "permission denied".
--
-- RLS sigue activo como segunda barrera. Es idempotente.
--
-- Además, en Supabase → Project Settings → Data API se puede apagar la API de
-- datos (o quitar `public` de "Exposed schemas"): es el mismo resultado a nivel
-- de red. La autenticación (login) la hace el servidor de la app.
-- ============================================================

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT ALL     ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL     ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Lo que se cree de aquí en adelante tampoco queda abierto a los roles públicos.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Las imágenes se suben desde el servidor: el navegador ya no escribe en Storage.
-- (En Supabase la tabla pertenece a otro rol; si no se puede cambiar, se ignora y
-- basta con quitar a mano las políticas de INSERT/UPDATE/DELETE del panel.)
DO $$
BEGIN
  REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon, authenticated;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudieron revocar permisos en storage.objects: %', SQLERRM;
END $$;
