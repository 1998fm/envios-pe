-- ============================================
-- Migración: envios.agencia_olva
-- Guarda la tienda/agencia Olva elegida por el
-- cliente (cuando tipo_entrega = 'AGENCIA').
-- ============================================

ALTER TABLE public.envios
  ADD COLUMN IF NOT EXISTS agencia_olva TEXT;