-- Mostrar/ocultar la opcion "Escoger dia de entrega" en el formulario publico
-- true = el cliente puede elegir la fecha de entrega
-- false = no se muestra la opcion; se asigna la fecha mas cercana automaticamente
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mostrar_escoger_fecha BOOLEAN NOT NULL DEFAULT true;
