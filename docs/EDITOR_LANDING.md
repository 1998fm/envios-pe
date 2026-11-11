# Editor visual de la landing

Superadmin → **Editor de landing**. La landing original sigue siendo el valor inicial: instalar o desplegar el editor no publica cambios de contenido.

- Secciones: mostrar/ocultar, ordenar, eliminar a papelera, restaurar y agregar bloques con título, descripción, imagen y botón.
- Contenido: seleccionar textos en la vista previa o en el listado; modificar texto, tamaño, color, negrita, enlaces e imagen de la sección. Desactivar «Seleccionar textos» permite probar las demostraciones interactivas y abrir preguntas frecuentes.
- Publicación: borrador separado, confirmación antes de publicar, SEO e historial de las últimas 20 publicaciones. Recuperar una versión la carga en el editor; publicar es un paso independiente. Deshacer/rehacer conserva los últimos 50 cambios locales.
- Los importes calculados de Plus conservan su vínculo con `PRECIOS_PLUS`: este editor no modifica la contratación ni los permisos de los planes.

## Persistencia y seguridad

`src/lib/landing/storage.ts` usa un bucket **privado** `tori-landing`, creado por el servidor en el primer guardado. No requiere SQL ni variables nuevas. Cada canal (`borrador` y `publicado`) guarda archivos JSON numerados e inmutables. Crear el siguiente archivo **sin upsert** impide que dos sesiones sobrescriban la misma revisión. Si otra sesión guarda primero, la API responde 409 y el editor conserva los cambios locales para revisarlos antes de recargar.

La cuenta del servidor necesita permiso para crear buckets; se usa el mismo cliente service-role que ya gestiona los uploads del sistema. Si la operación falla, el editor informa el error y la página pública mantiene la versión anterior/original. No se convierte un bucket público existente en almacén de borradores.

Todos los endpoints `/api/admin/landing*` y la vista previa exigen `requireSuperAdmin`. Solo se envía al visitante el documento publicado, sin autor, borrador ni textos personalizados de secciones retiradas. La landing se renderiza en servidor, incluidos los textos y metadatos SEO. Los mensajes de la vista previa comprueban origen y ventana emisora. Los cambios se renderizan como texto React, nunca como HTML libre. Se restringen URLs, colores, tamaños y volumen del documento. Las acciones quedan en la auditoría existente.

Las versiones son la fuente del contenido: **no eliminar manualmente el bucket ni sus archivos**. El listado muestra las últimas 20 publicaciones; las versiones anteriores se conservan en el almacenamiento.

## Mantener el contenido

`LandingSection` identifica los bloques originales y `LandingValue` habilita cada texto. Los enlaces usan `LandingLink` / `LandingAnchor`. No se cambian valores usados para cálculos o interacción: se modifica su presentación al renderizar.

`src/lib/landing/catalogo.json` incluye textos originales para editar estados que todavía no están visibles (por ejemplo, respuestas de preguntas frecuentes). La vista previa también descubre textos de estados interactivos al abrirlos. Al añadir texto nuevo a los componentes, usar `LandingValue` y añadir la entrada al catálogo si debe aparecer antes de abrir ese estado.

El emulador local implementa buckets privados, listado y colisiones de archivos para verificar el mismo comportamiento sin tocar producción. `e2e/landing-editor.spec.ts` cubre autorización, borradores, concurrencia, publicación, SEO, historial y edición mediante iframe.
