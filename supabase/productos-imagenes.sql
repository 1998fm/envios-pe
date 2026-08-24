-- ============================================================
-- IMÁGENES DE PRODUCTO (bucket público 'productos')
--
-- Las fotos se COMPRIMEN en el navegador (~30-60 KB) antes de
-- subirse, así el 1 GB del Storage rinde ~20,000 imágenes.
-- Ruta: {user_id}/producto-{timestamp}.jpg
-- Al eliminar un producto, la API también borra su archivo.
--
-- Idempotente: se puede ejecutar varias veces sin daño.
-- ============================================================

-- 1) Bucket público (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Políticas de acceso al bucket
DROP POLICY IF EXISTS "Productos imagen lectura publica" ON storage.objects;
CREATE POLICY "Productos imagen lectura publica"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "Productos imagen subir dueno" ON storage.objects;
CREATE POLICY "Productos imagen subir dueno"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Productos imagen actualizar dueno" ON storage.objects;
CREATE POLICY "Productos imagen actualizar dueno"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Productos imagen borrar dueno" ON storage.objects;
CREATE POLICY "Productos imagen borrar dueno"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'productos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Columna para la URL pública de la foto
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS imagen_url text;

-- Verificación
SELECT id, public FROM storage.buckets WHERE id = 'productos';
SELECT column_name FROM information_schema.columns
WHERE table_name = 'productos' AND column_name = 'imagen_url';
