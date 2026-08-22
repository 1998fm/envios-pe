-- ============================================================
-- IDEMPOTENCIA DEL FORMULARIO PÚBLICO (anti-duplicados)
--
-- Regla: 1 llave = 1 envío. Si el cliente reintenta (recarga la
-- página, error de red, doble envío), el servidor devuelve SIEMPRE
-- el envío original en vez de crear otro.
--
-- Ejecutar en Supabase SQL Editor.
-- Es idempotente: se puede ejecutar varias veces sin daño.
-- El código funciona incluso si esta migración aún no se ejecutó.
-- ============================================================

ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS envios_idempotencia_key_idx
  ON envios (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Verificación: debe devolver 1 fila
SELECT indexname
FROM pg_indexes
WHERE tablename = 'envios'
  AND indexname = 'envios_idempotencia_key_idx';
