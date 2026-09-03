-- Deshabilitar el formulario publico de envios ("cerrar" el sistema de envios)
-- cerrar_formulario = true  -> el formulario se reemplaza por un mensaje
-- cerrar_formulario = false -> el formulario funciona normal
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cerrar_formulario BOOLEAN NOT NULL DEFAULT false;

-- Mensaje que ve el cliente cuando el formulario esta deshabilitado
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cerrar_formulario_mensaje TEXT NOT NULL DEFAULT '';
