-- Limpieza: quitar espacios en DNI y teléfono de personas, ventas y envíos.
-- Ejecutar en Supabase SQL Editor. Es seguro re-ejecutar.

update personas
  set dni = trim(dni),
      telefono = trim(telefono),
      nombre = trim(nombre),
      updated_at = now()
  where dni <> trim(dni)
     or telefono <> trim(telefono)
     or nombre <> trim(nombre);

update ventas
  set persona_dni = trim(persona_dni),
      persona_telefono = trim(persona_telefono),
      persona_nombre = trim(persona_nombre),
      updated_at = now()
  where persona_dni <> trim(persona_dni)
     or persona_telefono <> trim(persona_telefono)
     or persona_nombre <> trim(persona_nombre);

update envios
  set dni = trim(dni),
      telefono = trim(telefono),
      nombre = trim(nombre)
  where dni <> trim(dni)
     or telefono <> trim(telefono)
     or nombre <> trim(nombre);