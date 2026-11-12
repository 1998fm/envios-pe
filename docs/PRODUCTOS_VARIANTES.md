# Productos con variantes

Los productos continúan siendo las unidades operativas de ventas, compras, etiquetas y kardex. Una ficha principal reúne sus variantes mediante metadatos nuevos, sin sustituir los IDs de `productos`.

## Instalación en una base existente

Ejecutar **solo** `supabase/productos-familias.sql` en el SQL Editor de Supabase. Es idempotente y aditivo: crea dos tablas, un RPC y un trigger; no actualiza, agrupa, renombra ni recalcula datos existentes. No ejecutar el instalador completo sobre producción.

Hasta instalarlo, la pantalla y la creación de series anteriores continúan disponibles. El botón «Variantes» se habilita cuando la API detecta la estructura instalada. Se conserva el diseño original de Productos, con sus indicadores, buscador, tabla, tarjetas y acciones.

## Uso

- **Nuevo producto → Serie con variantes**: nombre, descripción, precio e imagen generales; hasta tres opciones y 200 combinaciones. Cada variante tiene SKU, costo (según permisos), stock, stock mínimo y excepciones. La creación y el stock inicial se guardan en una sola transacción.
- **Creación guiada**: elige la unidad de medida de la lista y tipos como Color, Talla o Material. Marca los valores sugeridos antes de generar combinaciones; también puedes elegir «Otra opción…» o escribir valores propios separados por comas.
- **Variantes → Agrupar existentes**: selección voluntaria; solo añade vínculos y valores de opciones. Conserva absolutamente todos los campos de los productos e históricos. Al agrupar, los campos individuales son excepciones: para compartirlos después hay que activar su herencia explícitamente o usar «Aplicar precio a todas» / «Unificar información general».
- **Editar ficha**: el precio general afecta a quienes lo heredan. Las excepciones conservan sus valores. Un cambio individual en la vista anterior marca el campo correspondiente como excepción.
- **Separar** y **Deshacer agrupación** eliminan vínculos; los productos siguen existiendo con sus datos e históricos.
- La pantalla principal conserva las herramientas anteriores, incluidos etiquetas, kardex y acciones masivas. El gestor se abre como una ventana desde «Variantes» y permite editar fichas sin sustituir el catálogo habitual.
- Ventas y compras siguen mostrando las variantes individualmente. Cada movimiento afecta al stock de la variante seleccionada.

Cambiar datos del catálogo no modifica los nombres, importes ni costos históricos registrados en ventas o compras. Los ajustes de stock requieren motivo y registran kardex. Se comprueba la versión de la ficha y el stock esperado para rechazar ediciones desactualizadas. Las fotos compartidas no se borran mientras un producto o una ficha las utilice.

## Seguridad y verificación

Las rutas requieren Plus y permiso de productos; el dueño se toma de la sesión. Los costos se omiten sin permiso de ganancias. Tablas y RPC nuevos no permiten acceso directo con anon/authenticated. Pruebas de integración en `e2e/productos-familias*.spec.ts`, además de seguridad, ausencia de filtraciones y flujos principales.
