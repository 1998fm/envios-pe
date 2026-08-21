# MANUAL FUNCIONAL DE TORI — Guía completa del sistema

> Material para entrenar a la AI que responde por WhatsApp.
> Describe TODO lo que hace el sistema, para qué sirve cada cosa, cómo hacer un pedido y qué hace cada botón.
> Lenguaje 100% funcional: sin tecnicismos, sin código.
> Referencia: agosto 2026.

---

## ÍNDICE

1. Qué es Tori y para quién es
2. Los planes y precios
3. Cómo crear una cuenta y configurar el negocio por primera vez
4. Cómo un cliente hace un pedido (formulario público)
5. El dashboard: cómo está organizado
6. Barra superior
7. Menú lateral
8. Sección Resumen
9. Sección Envíos (pedidos)
10. El ciclo de vida de un pedido (estados)
11. Detalle de un pedido
12. Sección Ventas
13. Cómo se relacionan las ventas con los envíos
14. Sección Productos
15. Sección Compras
16. Sección Gastos
17. Acciones masivas (Shalom, cambio masivo, etiquetas, copiar datos)
18. Configuración
19. Ayuda y tours guiados
20. Preguntas y casos frecuentes (respuestas rápidas)

---

## 1. QUÉ ES TORI Y PARA QUIÉN ES

Tori es una herramienta web para emprendedores peruanos que venden por WhatsApp, Instagram u otras redes. Les da dos cosas:

**Para el cliente del emprendedor:** un formulario propio del negocio (un link) donde el cliente registra su pedido de envío él mismo: sus datos, dirección y método de entrega. Así el emprendedor no copia y pega direcciones a mano.

**Para el emprendedor:** un panel de control (dashboard) donde llegan todos los pedidos ordenados, y donde además puede llevar la cuenta completa de su negocio: ventas, productos, stock, compras a proveedores y gastos. También ve cuánto dinero tiene disponible, qué pedidos faltan empacar, qué falta cobrar y qué productos están quedando sin stock.

En resumen: Tori organiza los pedidos y las cuentas de un negocio pequeño de ventas online.

---

## 2. LOS PLANES Y PRECIOS

Hay 3 planes:

### Plan Básico — Gratis
- 50 envíos por mes.
- Hasta 2 métodos de envío activos a la vez.
- Hasta 50 productos.
- Hasta 100 ventas registradas.
- 8 exportaciones a Shalom por mes.
- Copiar datos de hasta 50 pedidos motorizados.
- Generar etiquetas de envío: sí.
- Compras y gastos: sí.
- NO incluye: logo propio en el formulario, redes sociales en el formulario, tarifas por distrito, hora de corte ni cupo diario, cambio masivo de estados, URL de redirección, marca blanca, etiquetas de producto con QR, ver la ganancia por venta, lector de QR en ventas.

### Plan Pro — S/ 29.90 al mes (o S/ 79.90 cada 3 meses)
Todo lo del Básico pero con más capacidad y funciones:
- 500 envíos por mes.
- Métodos de envío ilimitados.
- Hasta 200 productos.
- Hasta 2000 ventas.
- Exportar a Shalom ilimitado.
- Copiar datos ilimitado.
- Logo del negocio en el formulario (marca propia).
- URL de redirección (el cliente va a otra página después de pedir).
- Hora de corte y cupo diario de envíos (control logístico).
- Tarifas de motorizado por distrito.
- Cambio masivo de estados.
- Marca blanca en el formulario.
- Etiquetas de producto con nombre, SKU y código QR.
- Ver la ganancia de cada venta.

### Plan Business Plus — S/ 49.90 al mes (o S/ 129.90 cada 3 meses)
Todo lo del Pro, sin límites, más:
- Envíos, productos y ventas ILIMITADOS.
- Redes sociales (Instagram, Facebook, TikTok, web y WhatsApp) visibles en el formulario del cliente.
- Lector de código QR para registrar ventas escaneando productos.

### Prueba gratuita
Al crear una cuenta se reciben **30 días gratis con todas las funciones de Business Plus**. Al terminar los 30 días, la cuenta pasa automáticamente al plan Básico (gratis). Los datos y la configuración NO se pierden. Si el usuario paga, activa Pro o Business Plus al instante.

### Pago
El pago es por MercadoPago (suscripción automática) y se hace desde el botón "Ver planes" dentro del dashboard. Se activa al instante después de pagar. Si alguien cancela la suscripción, conserva lo pagado hasta que termine el período y después vuelve a Básico.

Si un negocio llega a un límite de su plan (por ejemplo los 50 envíos del Básico), el sistema avisa y ofrece actualizar. Nada se bloquea de forma permanente ni se pierde información.

---

## 3. CÓMO CREAR UNA CUENTA Y CONFIGURAR EL NEGOCIO POR PRIMERA VEZ

### Crear cuenta
En la página principal hay un botón para registrarse. Pide:
- Nombre del negocio.
- Correo electrónico.
- Contraseña (mínimo 6 caracteres).

Al terminar, la sesión se abre sola y entra a una configuración inicial guiada.

### Recuperar contraseña
En la pantalla de inicio de sesión hay un enlace "¿Olvidaste tu contraseña?". Llega un correo para crear una nueva.

### Configuración inicial (4 pasos + confirmación)
Después de registrarse, el sistema guía en 4 pasos (se pueden saltar con "Configurar después"):

**Paso 1 — Tu negocio:** nombre del negocio, teléfono, dirección (opcional) y logo. El nombre define el link público del negocio.

**Paso 2 — Métodos de envío:** elegir cuáles de estos métodos ofrece el negocio: Motorizado, Shalom, Olva, Marvisur, Flores, Otro (con nombre personalizado) y Recojo en tienda. Si elige Shalom, se pide la agencia de origen. Si elige Recojo, se puede escribir el mensaje que verán los clientes.

**Paso 3 — Horarios:** días de atención y, en planes pagos, hora de corte y cupo diario de envíos (para motorizado y para agencias).

**Paso 4 — Precios:** tarifas de motorizado por distrito de Lima (39 distritos). Tiene un botón de "Precio único para todos los distritos" para poner el mismo precio a todo, un buscador y un campo de precio por distrito.

**Pantalla final:** celebra con confeti, resume lo configurado, muestra el link público del negocio para copiarlo y compártirlo, y el botón "Ir a mi dashboard".

Los botones del asistente: "Atrás" (volver), "Siguiente"/"Finalizar" (guarda y avanza) y "Configurar después" (salta todo).

---

## 4. CÓMO UN CLIENTE HACE UN PEDIDO (FORMULARIO PÚBLICO)

Cada negocio tiene su propio link público (algo así como tori.pe/f/nombre-del-negocio). El emprendedor lo comparte por WhatsApp o redes, y el cliente llena ahí su pedido. Es una sola pantalla sencilla:

1. **Datos personales:** nombre completo, DNI y teléfono (mínimo 9 dígitos). El formulario aclara: "Usa el mismo número con el que realizaste tu compra por WhatsApp" — esto es importante porque el sistema usa el DNI/teléfono para reconocer al cliente y conectar su compra con su envío.

2. **Método de envío:** el cliente elige entre los que el negocio tenga activos (tarjetas para tocar):
   - **Motorizado:** pide distrito de Lima, dirección y referencia. MUESTRA EL COSTO EXACTO DEL ENVÍO según el distrito (si el negocio configuró tarifas).
   - **Shalom:** pide elegir la agencia donde recogerá (buscador con todas las agencias del Perú).
   - **Olva, Marvisur, Flores u otro método:** pide provincia, dirección y referencia.
   - **Recojo en tienda:** solo muestra el mensaje informativo del negocio (no pide dirección).

3. **Escoger día de entrega (opcional):** solo para motorizado y en planes pagos. El cliente puede ver hasta 3 fechas disponibles según los días de atención y el cupo del negocio, y elegir una. Si el negocio no usa esta función, el sistema asigna la fecha automáticamente.

4. **Botón "Solicitar Envío":** registra el pedido. Si falta algún dato obligatorio, el sistema lo indica.

5. **Pantalla de éxito:** confeti y mensaje "Pedido registrado correctamente". Puede mostrar un mensaje personalizado del negocio y, si el negocio lo configuró, redirigir al cliente a otra página (por ejemplo, el link de pago o su catálogo).

6. **Redes sociales:** en Business Plus, el formulario muestra abajo los accesos a Instagram, Facebook, TikTok, web y WhatsApp del negocio.

El logo del negocio aparece arriba del formulario en planes pagos (Pro y Business Plus).

IMPORTANTE: el cliente NO elige productos en este formulario. Solo registra sus datos y su envío. Los productos comprados se registran en la sección Ventas del emprendedor, y el sistema conecta ambas cosas por el DNI/teléfono (ver sección 13).

---

## 5. EL DASHBOARD: CÓMO ESTÁ ORGANIZADO

El dashboard es el panel del emprendedor. Se entra con el correo y contraseña. Tiene tres partes:

- **Barra superior:** logo, plan actual, botón para compartir el formulario y botón para salir.
- **Menú lateral izquierdo:** las 6 secciones (Resumen, Envíos, Ventas, Productos, Compras, Gastos) y las acciones especiales (Shalom, Cambio Masivo, Etiquetas, Copiar datos, Configuración). Se puede plegar y desplegar.
- **Área central:** el contenido de la sección elegida.

La primera vez que se entra, el sistema ofrece un recorrido guiado por todas las secciones.

---

## 6. BARRA SUPERIOR

| Elemento | Para qué sirve |
|---|---|
| **Logo y nombre** | Identifica el negocio. |
| **Insignia del plan** | Muestra el plan actual: "Business Plus · Trial Xd" (días restantes de prueba), "Pro", "Business Plus" o "Básico". |
| **Botón "Compartir formulario"** | Copia al portapapeles el link público del negocio para pegarlo en WhatsApp o redes. Avisa "Formulario copiado". |
| **Botón de salir (icono)** | Cierra la sesión. |
| **Banner de prueba (últimos días)** | Avisa que la prueba gratuita está por terminar y lleva a "Ver planes". |
| **Banner de Básico** | Recuerda que se puede actualizar a un plan pago. |

---

## 7. MENÚ LATERAL

**Secciones (navegación):**
- Resumen — el tablero general del negocio.
- Envíos — los pedidos de entrega de los clientes.
- Ventas — las ventas registradas con sus productos.
- Productos — el inventario y el stock.
- Compras — lo que se compra a proveedores.
- Gastos — los gastos del negocio.

**Acciones (debajo de las secciones):**
- **Shalom** — exporta pedidos a un archivo para Shalom (solo si el negocio usa Shalom; en Básico muestra cuántas exportaciones lleva del mes).
- **Cambio Masivo** — cambia el estado de muchos pedidos a la vez (solo Pro y Business Plus).
- **Generar etiquetas** — imprime etiquetas de los pedidos seleccionados.
- **Copiar datos** — prepara la lista de entregas del motorizado para copiar o exportar (solo con pedidos motorizados seleccionados).
- **Configuración** — abre la configuración del negocio.

Las funciones bloqueadas por plan muestran un candado y llevan a "Ver planes".

---

## 8. SECCIÓN RESUMEN

Es el tablero general. Todo es informativo salvo las tarjetas de acción:

- **Saldo disponible:** dinero que queda después de restar compras y gastos de las ventas. Verde si es positivo, rojo si es negativo. Muestra los subtotales de ventas, compras y gastos.
- **Tarjetas de indicadores:** ventas del mes (con comparación % vs mes anterior), ventas de hoy, cobros pendientes (cuántos y cuánto dinero), pedidos por despachar (y cuántos ya empacados), envíos del mes, gastos del mes y productos con stock bajo.
- **Pendiente de acción (tarjetas clicables):** Sin empacar, Por enviar, Por cobrar y Productos bajo stock. Cada una lleva directo a la sección correspondiente para resolverlo.
- **Gráficos:** pedidos de los últimos 30 días, ventas por método de pago (Efectivo/Yape-Plin/Tarjeta), envíos por estado y envíos por método.
- **Recientes:** últimos pedidos, últimas ventas y últimos gastos.

---

## 9. SECCIÓN ENVÍOS (PEDIDOS)

Aquí llegan todos los pedidos que los clientes registran en el formulario público. También entran nuevos pedidos automáticamente mientras se está en el panel (sin refrescar).

### Filtros (parte superior)
- **Buscador:** busca por nombre, DNI o teléfono del cliente.
- **Estado:** filtra por No Empacado, Empacado o Enviado (por defecto muestra los dos primeros).
- **Método:** filtra por método de envío (según los activos del negocio).

### Lista de pedidos
- Se puede agrupar por **fecha programada** o por **fecha de registro** (botones "Programada" / "Registro").
- **Checkbox "Seleccionar todos"** para marcar todos los visibles y usar acciones masivas.
- Botón **"Cargar más envíos"** si hay muchos.

### Cada tarjeta de pedido muestra
Nombre del cliente, destino/detalle, método de envío, fecha, y dos controles:

| Control | Qué hace |
|---|---|
| **Checkbox** | Marca el pedido para acciones masivas (etiquetas, Shalom, copiar datos, cambio masivo). |
| **Selector de tamaño** | Tamaño del paquete: Sin definir, XS, S, M o L. Se usa sobre todo para la exportación a Shalom (medidas). |
| **Selector de estado** | Cambia el estado del pedido: No Empacado → Empacado → Enviado. "Enviar" un pedido = ponerlo en Enviado. Al pasar a Enviado, las ventas vinculadas de ese cliente se marcan como completadas en su parte de envío. |

- **Doble clic en la tarjeta** abre el detalle completo del pedido.
- No hay botón de "despachar" aparte: despachar = cambiar el estado a Enviado.

---

## 10. EL CICLO DE VIDA DE UN PEDIDO (ESTADOS)

1. **No Empacado:** el pedido acaba de llegar. Hay que preparar/recolectar lo que compró el cliente.
2. **Empacado:** ya está listo y verificado (se confirma con el botón "Validar contenido del pedido" en el detalle, o cambiando el estado a mano).
3. **Enviado:** salió a reparto/entrega. Aquí se considera despachado.

El flujo normal: llega el pedido → se empaca y valida → se envía. Si algo sale mal se puede devolver el estado hacia atrás sin problema.

---

## 11. DETALLE DE UN PEDIDO

Se abre con doble clic sobre la tarjeta de un pedido. Muestra:
- Datos del cliente: nombre, DNI y teléfono.
- Datos del envío: método, estado, tamaño y fecha de registro.
- Destino: dirección/agencia/distrito y referencia.
- **Fecha programada de entrega**, con campo para cambiarla y botón "Guardar".
- **Productos del cliente:** aquí aparecen las ventas completadas de ese mismo cliente (reconocido por DNI o teléfono) que aún no han sido empacadas, con sus productos y montos.

Botones del detalle:
| Botón | Qué hace |
|---|---|
| **Guardar (fecha programada)** | Fija el día acordado para la entrega. |
| **Validar contenido del pedido** | Confirma que todo lo listado ya fue empacado. Marca esas ventas como "Empacado" y las deja vinculadas a este envío. Pide confirmación antes ("¿todo lo listado ha sido empacado?"). |
| **Eliminar** | Borra el pedido (pide confirmación). Usar con cuidado. |
| **Cerrar** | Sale del detalle. |

---

## 12. SECCIÓN VENTAS

Aquí el emprendedor registra lo que vende, con sus productos y montos. La tabla muestra: cliente, DNI, productos, total, método de pago, estado, estado de envío y fecha.

### Registrar una nueva venta (paso a paso)
1. Botón **"Nueva venta"**.
2. **Buscar cliente** por DNI o teléfono (botón Buscar). Si el cliente ya pidió por el formulario o compró antes, aparece solo.
3. Si no existe, aparece el panel "Cliente no encontrado" con **"Registro rápido"**: nombre, DNI y teléfono, y botón "Registrar cliente".
4. **Buscar productos** y tocarlos para agregarlos a la venta. Se puede ajustar cantidad y quitar items. Los productos sin stock aparecen deshabilitados. Muestra subtotal y total.
5. **Elegir método de pago:** Efectivo, Yape/Plin o Tarjeta. OJO: si eligen Tarjeta, la venta queda registrada como **Pendiente** (hasta confirmar el pago).
6. Botón **"Crear venta"**. El stock de los productos se descuenta automáticamente.

### Escáner de QR (solo Business Plus)
Junto al buscador hay un botón **"Escanear"**: abre la cámara del celular o acepta un lector USB de códigos. Al escanear el QR de un producto (o escribir/escanear su SKU), el producto se agrega a la venta; si ya estaba, suma uno más a la cantidad. Suena un bip al leer correctamente y otro distinto si el código no corresponde a ningún producto. Sirve para facturar rápido en el mostrador.

### Estados de una venta
- **Completada:** venta confirmada y pagada.
- **Pendiente:** falta confirmar el pago (por ejemplo, pago con tarjeta).
- **Anulada:** venta cancelada; el stock de los productos se devuelve automáticamente.

### Botones por fila
| Botón | Cuándo aparece | Qué hace |
|---|---|---|
| **Ojo (detalle)** | Siempre | Abre el detalle de la venta: productos, montos, método de pago y la ganancia estimada (Pro y Business Plus). |
| **Check (confirmar)** | Solo Pendientes | Confirma la venta y la pasa a Completada. |
| **Flecha circular (anular)** | Solo Completadas | Anula la venta y devuelve el stock. Pide confirmación. |
| **X (eliminar)** | Ventas no completadas | Elimina la venta definitivamente. Pide confirmación. |

### Filtros
Botones "Completadas" / "Pendientes" / "Anuladas" para ver cada grupo.

### Ganancia por venta (Pro y Business Plus)
El detalle de cada venta calcula la ganancia: total vendido menos el costo de los productos (precio de compra registrado en Productos). Muestra también el porcentaje.

---

## 13. CÓMO SE RELACIONAN LAS VENTAS CON LOS ENVÍOS

Este es el corazón del sistema y es importante entenderlo bien:

1. El cliente compra por WhatsApp y el emprendedor registra la **venta** (con productos) en la sección Ventas. Esa venta queda "pendiente de envío".
2. Cuando el cliente quiere recibir su compra, llena el **formulario público** y se genera el **pedido/envío**.
3. El sistema reconoce al cliente por su DNI o teléfono: al abrir el detalle del pedido, aparecen sus ventas pendientes con sus productos.
4. El emprendedor revisa que todo esté y presiona **"Validar contenido del pedido"**: eso marca las ventas como Empacadas y las une a ese envío.
5. Cuando el pedido pasa a **Enviado**, las ventas vinculadas pasan automáticamente a completadas en su parte de envío.

Es decir: la venta es lo económico (qué compró y cuánto pagó); el envío es lo logístico (cuándo y cómo lo recibe). Se registran por separado porque el cliente puede comprar hoy y pedir el envío la semana siguiente. El sistema los conecta solos por el DNI/teléfono.

Regla práctica: cada vez que el cliente pida envío, se despacha todo lo que tenga pendiente.

---

## 14. SECCIÓN PRODUCTOS

El inventario del negocio. Tabla con: nombre, SKU, stock, precio de venta, precio de compra, unidad y acciones.

| Botón | Qué hace |
|---|---|
| **Buscador** | Filtra productos por nombre. |
| **"Nuevo"** | Abre el formulario de nuevo producto. |
| **"Insertar ejemplos"** (solo con lista vacía) | Crea 6 productos de ejemplo para probar el sistema. |
| **Lápiz (editar)** | Edita la fila directamente: nombre, SKU, stock, precios y unidad. |
| **Check** | Guarda los cambios. |
| **X** | Cancela la edición sin guardar. |
| **Basurero** | Elimina el producto (pide confirmación). |
| **Impresora** | Imprime la etiqueta del producto con nombre, SKU y código QR (Pro y Business Plus). |

**Nuevo producto:** nombre (el SKU se genera solo si se deja vacío), SKU, stock actual, stock mínimo, precio de venta, precio de compra y unidad (unidad, kg, g, litro, ml, metro, cm, par, docena, caja, paquete, bolsa, botella, lata, tarro, rollo, pliego).

**Stock bajo:** cuando el stock actual baja del stock mínimo, la fila se pinta de rojo y el producto aparece en la alerta "Stock bajo" del Resumen. Sirve para saber cuándo reponer.

**Cómo se mueve el stock automáticamente:**
- Venta creada → el stock BAJA.
- Compra registrada → el stock SUBE.
- Venta anulada o eliminada → el stock se DEVUELVE.
- Compra anulada o eliminada → el stock se QUITA de nuevo.

---

## 15. SECCIÓN COMPRAS

Registro de lo que el negocio compra a sus proveedores (para revender). Sirve para subir el stock y llevar el costo.

Tabla: proveedor, productos, total, estado, fecha y acciones.

| Botón | Qué hace |
|---|---|
| **"Nueva compra"** | Abre el formulario: proveedor, buscar productos y cantidades, precio de cada uno y total. Al registrarla, el stock de esos productos AUMENTA. |
| **Ojo (detalle)** | Ver la compra completa. |
| **Flecha circular (anular)** | Solo compras completadas. Anula la compra y quita el stock que había sumado. Pide confirmación. |
| **X (eliminar)** | Solo compras no completadas. Elimina definitivamente. |

Filtros: "Completadas" / "Anuladas".

---

## 16. SECCIÓN GASTOS

Gastos generales del negocio (que no son compra de mercadería): materiales, pasajes, delivery, publicidad, servicios u otros.

Tabla: fecha, categoría, concepto, monto y acciones. Arriba muestra el total de la lista.

| Botón | Qué hace |
|---|---|
| **"Registrar gasto"** | Abre el formulario: categoría (botones), concepto, monto en soles, fecha y notas opcionales. |
| **Lápiz (editar)** | Pre-llena el formulario con ese gasto para modificarlo. |
| **X (eliminar)** | Borra el gasto (pide confirmación). |

Filtros por categoría. Estos gastos restan en el "Saldo disponible" del Resumen.

---

## 17. ACCIONES MASIVAS

Todas funcionan sobre los pedidos marcados con el checkbox en la sección Envíos.

### Exportar a Shalom
Prepara un archivo de Excel con los pedidos para trabajarlos en Shalom (pro.shalom.pe).
- Si hay pedidos seleccionados, exporta esos; si no, exporta todos los de Shalom que estén Empacados.
- El archivo incluye destinatario, teléfono, agencia de origen, destino y medidas según el tamaño del paquete.
- Casilla opcional: **"Marcar automáticamente como ENVIADO después de exportarlos"** — así no hay que cambiar el estado a mano.
- Enlace directo para abrir Shalom Pro.
- En Básico hay un límite de 8 exportaciones por mes (el sistema avisa y ofrece actualizar).

### Cambio Masivo (Pro y Business Plus)
Cambia el estado de muchos pedidos a la vez. Se elige método, estado actual y nuevo estado, y opcionalmente aplicar solo a los seleccionados. Ejemplo típico: 20 pedidos empacados → Enviado en un clic.

### Generar etiquetas
Imprime etiquetas de los pedidos seleccionados. Dos formatos: **4 etiquetas por hoja A4** o **etiqueta individual**. Cada etiqueta lleva cliente, DNI, teléfono, detalle de entrega, logo del negocio y método. Requiere al menos un pedido seleccionado.

### Copiar datos (Motorizado)
Prepara la hoja de ruta del motorizado:
- Solo aparece si TODOS los pedidos seleccionados son de Motorizado.
- Muestra un resumen: cuántos pedidos van, cuánto se cobrará de envío y cuáles no se cobran.
- Por cada pedido hay una casilla **"Cobrar envío"** (calcula el monto según la tarifa del distrito) y un botón **"Cobrar todos los envíos"**.
- **"Copiar datos"** pone en el portapapeles un texto listo para enviar al motorizado: cliente, teléfono, dirección, referencia y cuánto cobrar (o "NO COBRAR").
- **"Exportar Excel"** genera el mismo listado en un archivo Excel.
- IMPORTANTE: marcar "cobrar" aquí es solo para el texto/Excel que se le pasa al motorizado; NO registra ningún cobro en el sistema.
- En Básico está limitado a 50 pedidos por vez.

---

## 18. CONFIGURACIÓN

Se abre desde el menú lateral. Tiene 4 pestañas:

### Pestaña Empresa
- **Datos del negocio:** nombre, teléfono y dirección.
- **Agencia de origen (Shalom):** buscador con todas las agencias del Perú; define desde dónde salen los envíos Shalom.
- **Logo del negocio** (Pro y Business Plus): aparece en el formulario del cliente y en las etiquetas.
- **Mensaje de éxito:** el texto que verá el cliente después de registrar su pedido.
- **URL de redirección** (Pro y Business Plus): página a la que va el cliente tras pedir (por ejemplo, link de pago).
- **Redes sociales** (Business Plus): Instagram, Facebook, TikTok, web y WhatsApp; se muestran en el formulario.

### Pestaña Métodos
Activar o desactivar los 7 métodos de envío: Motorizado, Shalom, Olva, Marvisur, Flores, Otro y Recojo.
- En Básico se pueden tener máximo 2 activos a la vez; en planes pagos, ilimitados.
- "Otro" permite ponerle nombre propio (una agencia local, por ejemplo).
- "Recojo" permite editar el mensaje que verán los clientes.
- Los métodos apagados NO aparecen en el formulario del cliente.

### Pestaña Logística (Pro y Business Plus para corte y cupo)
Dos bloques: Motorizado y Agencias. Cada uno permite:
- **Días de atención** de la semana (disponible en todos los planes).
- **Hora de corte** (Pro+): hora límite del día para tomar pedidos; lo que llega después pasa al siguiente día hábil.
- **Limitar envíos por día** con un cupo máximo (Pro+): útil si el motorizado no puede con más de X entregas diarias.
- Con esto funciona la elección de día de entrega que ven los clientes motorizados.

### Pestaña Tarifas (Pro y Business Plus)
Precio de envío en motorizado por cada distrito de Lima (39 distritos), con buscador y opción de "precio único para todos". El cliente ve el costo exacto de su envío antes de confirmar.

Botones finales: **Cancelar** (cierra sin guardar) y **Guardar** (aplica todo y avisa "Configuración guardada").

---

## 19. AYUDA Y TOURS GUIADOS

- **Chat flotante de ayuda (botón abajo a la derecha):** "Hola, soy Tori". Tiene respuestas rápidas a las dudas más comunes sobre planes, métodos, tarifas, límites y funciones.
- **Tours guiados:** la primera vez que se entra al dashboard, el sistema ofrece un recorrido sección por sección. Después, cada ventana importante (nueva venta, nueva compra, nuevo producto, gasto, detalle de pedido, configuración, cambio masivo, Shalom, etiquetas, copiar datos) tiene un icono de información para repetir su tour cuando se quiera.

---

## 20. PREGUNTAS Y CASOS FRECUENTES (RESPUESTAS RÁPIDAS)

**¿Cómo hago un pedido?**
Entra al link de la tienda, llena tus datos (nombre, DNI, teléfono), elige el método de envío, completa tu dirección o agencia y presiona "Solicitar Envío". Verás una confirmación al instante.

**¿Por qué pide el mismo teléfono de WhatsApp?**
Porque el sistema usa tu DNI/teléfono para reconocer tu compra y conectarla con tu envío.

**¿Cuánto cuesta el envío en motorizado?**
Depende del distrito; el formulario muestra el costo exacto antes de confirmar.

**¿Puedo elegir el día de entrega?**
Con motorizado sí, si la tienda lo permite: aparecen hasta 3 fechas disponibles para elegir.

**Mi cliente pidió el envío pero no veo sus productos. ¿Qué pasó?**
Los productos se registran en Ventas. Verifica que la venta esté registrada con el MISMO DNI o teléfono con el que el cliente pidió el envío. Entonces aparecerá en el detalle del pedido para validarla.

**¿Cómo marco un pedido como entregado/enviado?**
Cambia su estado a "Enviado" en la tarjeta (o con Cambio Masivo si son varios). Las ventas vinculadas se completan solas.

**Registré una venta con tarjeta y quedó "Pendiente". ¿Está mal?**
No. Los pagos con tarjeta quedan Pendientes hasta que confirmes el pago con el botón de check.

**Anulé una venta, ¿se perdió el stock?**
No, el stock se devuelve automáticamente al anular o eliminar una venta.

**¿Cómo hago para que suba el stock?**
Registrando una Compra con esos productos. Al registrarla, el stock aumenta solo.

**¿Qué es el "Saldo disponible"?**
Ventas menos compras menos gastos. Es el dinero aproximado que te queda.

**¿Cómo comparto mi formulario?**
Botón "Compartir formulario" en la barra superior: copia el link para pegarlo en WhatsApp o redes.

**¿Cuántos envíos tengo incluidos?**
Básico: 50/mes. Pro: 500/mes. Business Plus: ilimitados.

**¿Qué pasa cuando termina mi prueba de 30 días?**
Pasas al plan Básico (gratis) sin perder nada. Puedes actualizar a Pro o Business Plus cuando quieras.

**¿Cómo pago?**
Desde "Ver planes" en el dashboard, con MercadoPago. Se activa al instante.

**¿Puedo cambiar el precio de envío por distrito?**
Sí, en Configuración > Tarifas (Pro y Business Plus). También puedes usar un precio único para todos.

**¿Para qué sirve el tamaño del paquete (XS, S, M, L)?**
Principalmente para la exportación a Shalom, que necesita las medidas del paquete.

**¿El "cobrar envío" de Copiar datos registra el pago del cliente?**
No. Solo arma el texto/Excel para el motorizado indicando cuánto cobrar en puerta.

**¿Qué es "Validar contenido del pedido"?**
La confirmación de que ya empacaste todo lo que el cliente compró. Une la venta con el envío y pasa la venta a Empacado.

**¿Puedo usar Tori desde el celular?**
Sí, el dashboard y el formulario funcionan en el navegador del celular. El escáner de QR usa la cámara del celular.

**¿Mis datos se pierden si cambio de plan?**
No. Todo se mantiene; solo cambian los límites y funciones disponibles.

---

*Fin del manual. Documento funcional generado para entrenamiento de la AI de WhatsApp.*
