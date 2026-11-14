import assert from "node:assert/strict";

async function producto(api, stock) {
  const r = await api.post("/api/productos", {
    data: {
      nombre: "Polo algodón",
      sku: "POLO-ALG",
      precio_venta: 25.5,
      precio_compra: 12.5,
      stock_actual: stock,
      stock_minimo: 3,
      unidad: "unidad",
    },
  });
  assert.equal(r.status(), 200, await r.text());
  return (await r.json()).data;
}
async function stock(api, id) {
  const j = await (await api.get("/api/productos?limit=1000")).json();
  const p = j.data.find((p) => p.id === id);
  assert(p);
  return p.stock_actual;
}
async function registrar(page, click, nombre, url) {
  const pendiente = page.waitForResponse(
    (r) => r.url().endsWith(url) && r.request().method() === "POST",
  );
  await click(page.getByRole("button", { name: nombre, exact: true }));
  const r = await pendiente;
  assert(r.ok(), await r.text());
  return r.json();
}

export const guias = {
  productos: {
    titulo: "Productos: crea y organiza tu catálogo",
    preparar: async () => ({}),
    async run({
      page,
      ctx,
      datos,
      step,
      click,
      type,
      point,
      pause,
      explicar,
      cover,
    }) {
      step(
        "INICIO · Para qué sirve Productos",
        "Primero crea el catálogo. Después registra compras y ventas sobre esos productos.",
      );
      await cover(
        "Productos.<br>El inicio de tu inventario.",
        "Crearemos un polo con precio, costo y stock.<br>Demostración con Plan Plus y permisos de dueño.",
      );
      await pause(3500);
      await page.evaluate(() =>
        document.querySelector("#tutorial-cover").remove(),
      );
      await explicar(
        "Producto, compra y venta son cosas distintas",
        [
          "<b>Productos</b><br>Define qué vendes y sus datos: nombre, precio, costo y existencias.",
          "<b>Compras y Ventas</b><br>Registran las entradas y salidas de mercadería. No necesitas volver a crear el producto.",
        ],
        "Usa un registro para cada producto o variante. Evita duplicados.",
      );
      step(
        "CREAR · Nuevo producto",
        "Abre Nuevo producto. Un solo producto sirve para una única versión.",
      );
      await click(page.locator('[data-tour="productos-nuevo"]'));
      await pause(900);
      await type(
        page.getByPlaceholder("Ej: Polera básica", { exact: true }),
        "Polo algodón",
      );
      await point(
        page.getByPlaceholder("Se genera automáticamente", { exact: true }),
      );
      await pause(1400);
      await explicar(
        "Nombre y SKU",
        [
          "<b>Nombre claro</b><br>Ejemplo: Polo algodón. Incluye la versión si necesitas distinguirla.",
          "<b>SKU</b><br>Es tu código para identificar el producto. Se propone automáticamente y puedes editarlo.",
        ],
        "La foto es opcional. Usa Serie con variantes para colores o tallas; tiene su propio tutorial.",
      );
      step(
        "STOCK · Existencias iniciales y alerta",
        "Stock: unidades que ya tienes. Stock mínimo: referencia para la alerta de stock bajo.",
      );
      await type(
        page.locator('[data-tour="nuevo-producto-stock"] input').nth(0),
        "20",
      );
      await type(
        page.locator('[data-tour="nuevo-producto-stock"] input').nth(1),
        "3",
      );
      await explicar(
        "Stock inicial no es una compra nueva",
        [
          "<b>Stock inicial: 20</b><br>Son las unidades que ya tienes al empezar a usar Tori.",
          "<b>Stock mínimo: 3</b><br>Sirve de referencia para avisarte cuando las existencias bajan por debajo del mínimo.",
        ],
        "Si ya contaste esas unidades como stock inicial, no registres otra compra por las mismas unidades.",
      );
      step(
        "PRECIOS · Venta y compra por unidad",
        "Precio de venta: S/ 25.50. Precio de compra: S/ 12.50 por unidad.",
      );
      await type(
        page.locator('[data-tour="nuevo-producto-precios"] input').nth(0),
        "25.50",
      );
      await type(
        page.locator('[data-tour="nuevo-producto-precios"] input').nth(1),
        "12.50",
      );
      await explicar(
        "No confundas los dos precios",
        [
          "<b>Venta: S/ 25.50</b><br>Lo que cobras al cliente por una unidad.",
          "<b>Compra: S/ 12.50</b><br>Tu costo de referencia por unidad. La diferencia es S/ 13.00, antes de otros gastos.",
        ],
        "La diferencia entre precios no es la ganancia neta después de gastos y otros costos.",
      );
      await point(
        page
          .getByRole("dialog", { name: "Nuevo producto", exact: true })
          .getByRole("combobox"),
      );
      await pause(1000);
      step(
        "Guardar el producto",
        "Revisa la unidad de medida y pulsa Crear producto.",
      );
      await registrar(page, click, "Crear producto", "/api/productos");
      await page
        .getByRole("button", { name: "Editar", exact: true })
        .first()
        .waitFor();
      await pause(1800);
      const lista = await (await ctx.request.get("/api/productos")).json();
      datos.id = lista.data[0].id;
      assert.equal(lista.data[0].stock_actual, 20);
      step(
        "HISTORIAL · Cómo revisar los movimientos",
        "Abre Historial de movimientos para saber por qué cambió el stock.",
      );
      await click(
        page
          .getByTitle("Historial de movimientos", { exact: true })
          .filter({ visible: true }),
      );
      await pause(1800);
      await explicar(
        "El kardex explica tus existencias",
        [
          "<b>Entradas y salidas</b><br>Muestra compras, ventas, ajustes y sus saldos.",
          "<b>Corregir un conteo</b><br>En Editar puedes ajustar stock con un motivo. Para reponer mercadería habitual, usa Compras.",
        ],
        "Conserva el historial para entender los cambios.",
      );
      await click(page.getByTitle("Cerrar", { exact: true }));
      step(
        "ARCHIVAR · Ocultar sin borrar",
        "Archivar retira el producto de la venta, pero conserva su registro.",
      );
      await click(
        page.getByTitle("Archivar", { exact: true }).filter({ visible: true }),
      );
      const archivo = page.waitForResponse(
        (r) =>
          r.url().includes("/api/productos") &&
          r.request().method() === "PATCH",
      );
      await click(
        page.getByRole("button", { name: "Sí, archivar", exact: true }),
      );
      assert((await archivo).ok());
      await pause(1000);
      await click(page.getByRole("button", { name: /^Archivados/ }));
      await click(
        page.getByTitle("Restaurar", { exact: true }).filter({ visible: true }),
      );
      await pause(1000);
      await click(page.getByRole("button", { name: /^Activos/ }));
      await explicar(
        "Archivar, restaurar y variantes",
        [
          "<b>Archivados</b><br>Busca el producto y usa Restaurar para volver a ofrecerlo si tiene stock.",
          "<b>Variantes</b><br>Agrupa colores o tallas bajo una ficha. Cada variante conserva su propio stock.",
        ],
        "La guía específica de Serie con variantes está en su botón ⓘ.",
      );
      await point(page.getByRole("button", { name: "Variantes", exact: true }));
      await pause(1400);
      step(
        "Listo · Continúa con Compras o Ventas",
        "El catálogo ya tiene el producto. Las operaciones se registran en sus secciones.",
      );
      await cover(
        "Tu catálogo está listo.",
        "Para reponer: Compras.<br>Para vender: Ventas.",
      );
      await pause(3500);
    },
    async verificar(api, datos) {
      const j = await (await api.get("/api/productos")).json();
      assert.equal(j.data.length, 1);
      assert.equal(j.data[0].stock_actual, 20);
      assert.equal(j.data[0].precio_venta, 25.5);
      assert.equal(j.data[0].precio_compra, 12.5);
      assert.equal(j.data[0].archivado, false);
      assert.equal(j.data[0].id, datos.id);
    },
  },
  compras: {
    titulo: "Compras: registra la entrada de mercadería",
    preparar: async (api) => ({ producto: await producto(api, 5) }),
    async run({
      page,
      ctx,
      datos,
      step,
      click,
      type,
      point,
      pause,
      explicar,
      cover,
    }) {
      step(
        "INICIO · Para qué sirve Compras",
        "Usa Compras cuando ingresa mercadería que adquiriste de un proveedor.",
      );
      await cover(
        "Compras.<br>Registra lo que ingresa.",
        "Ejemplo: comprar 10 polos a S/ 12.50 cada uno.<br>Demostración con Plan Plus y permisos de dueño.",
      );
      await pause(3500);
      await page.evaluate(() =>
        document.querySelector("#tutorial-cover").remove(),
      );
      await explicar(
        "Antes de registrar una compra",
        [
          "<b>El producto debe existir</b><br>Créalo primero en Productos. Aquí eliges ese mismo registro.",
          "<b>Stock inicial del ejemplo: 5</b><br>Compraremos 10 unidades nuevas. Al guardar, el stock será 15.",
        ],
        "No registres dos veces la misma entrada de mercadería.",
      );
      step(
        "CREAR · Nueva compra y proveedor",
        "Abre Nueva compra y escribe el proveedor de esta operación.",
      );
      await click(page.locator('[data-tour="compras-nueva"]'));
      await type(
        page.getByPlaceholder("Nombre del proveedor", { exact: true }),
        "Proveedor Textil",
      );
      step(
        "PRODUCTOS · Busca y agrega el producto",
        "Busca por nombre y selecciona la versión exacta que estás comprando.",
      );
      await type(
        page.getByPlaceholder("Buscar producto...", { exact: true }),
        "Polo algodón",
      );
      await click(page.getByRole("button", { name: /Polo algodón.*12\.50/ }));
      step(
        "CANTIDAD Y COSTO · Revisa los importes",
        "Cantidad: 10. Precio de compra por unidad: S/ 12.50. Total: S/ 125.00.",
      );
      const item = page
        .getByRole("textbox", { name: "Precio de Polo algodón", exact: true })
        .locator("..");
      await type(item.locator('input[inputmode="numeric"]'), "10");
      await type(
        page.getByRole("textbox", {
          name: "Precio de Polo algodón",
          exact: true,
        }),
        "12.50",
      );
      await explicar(
        "Cantidad × costo unitario",
        [
          "<b>10 unidades × S/ 12.50</b><br>El total de esta compra es S/ 125.00.",
          "<b>El precio es por unidad</b><br>No escribas S/ 125.00 en el campo unitario. Ese sería el costo de una sola unidad.",
        ],
        "Este costo corresponde a la compra, no es el precio de venta al cliente.",
      );
      step(
        "GUARDAR · Registrar compra",
        "Revisa los productos, las cantidades y el total. Después pulsa Registrar compra.",
      );
      await registrar(page, click, "Registrar compra", "/api/compras");
      await page
        .getByTitle("Ver detalle", { exact: true })
        .filter({ visible: true })
        .waitFor();
      await pause(1700);
      assert.equal(await stock(ctx.request, datos.producto.id), 15);
      await explicar(
        "Qué cambia al guardar",
        [
          "<b>Stock: 5 + 10 = 15</b><br>La mercadería comprada se suma al producto que seleccionaste.",
          "<b>Registro de la operación</b><br>Quedan el proveedor, los productos, la cantidad y el total de S/ 125.00.",
        ],
        "Registrar una compra no transfiere dinero al proveedor ni cambia el precio de venta del catálogo.",
      );
      step(
        "CONSULTAR · Abre el detalle",
        "Usa Ver detalle para revisar el proveedor, el total y los productos registrados.",
      );
      await click(
        page
          .getByTitle("Ver detalle", { exact: true })
          .filter({ visible: true }),
      );
      await pause(1800);
      await point(
        page
          .getByText("S/ 125.00", { exact: true })
          .filter({ visible: true })
          .first(),
      );
      await pause(1400);
      await click(page.getByRole("button", { name: "Cerrar", exact: true }));
      step(
        "CORREGIR · Qué significa anular",
        "Si te equivocaste, revisa la operación antes de anularla. No registres un duplicado para corregirla.",
      );
      await point(
        page.getByTitle("Anular", { exact: true }).filter({ visible: true }),
      );
      await explicar(
        "Anular no es ocultar",
        [
          "<b>Anular una compra revierte su entrada de stock</b><br>Hazlo solo cuando corresponda corregir esa operación.",
          "<b>Si esa mercadería ya se vendió</b><br>La anulación puede rechazarse para no dejar stock negativo.",
        ],
        "En este ejemplo no anulamos: la compra es válida y el stock queda en 15.",
      );
      step(
        "Listo · Compra registrada y stock actualizado",
        "Consulta tus movimientos en Productos → Historial de movimientos.",
      );
      await cover(
        "Compra registrada.<br>Stock actualizado.",
        "5 unidades anteriores + 10 compradas = 15.<br>Ahora puedes registrar las ventas.",
      );
      await pause(3500);
    },
    async verificar(api, datos) {
      const j = await (await api.get("/api/compras")).json();
      assert.equal(j.data.length, 1);
      assert.equal(j.data[0].total, 125);
      assert.equal(j.data[0].estado, "COMPLETADA");
      assert.equal(await stock(api, datos.producto.id), 15);
    },
  },
  ventas: {
    titulo: "Ventas: registra productos, cliente y cobro",
    preparar: async (api) => ({ producto: await producto(api, 10) }),
    async run({
      page,
      ctx,
      datos,
      step,
      click,
      type,
      point,
      pause,
      explicar,
      cover,
    }) {
      step(
        "INICIO · Para qué sirve Ventas",
        "Registra quién compra, qué producto se lleva y cuánto te ha pagado.",
      );
      await cover(
        "Ventas.<br>Del cliente al cobro.",
        "Ejemplo: vender 2 polos a S/ 25.50.<br>Demostración con Plan Plus y permisos de dueño.",
      );
      await pause(3500);
      await page.evaluate(() =>
        document.querySelector("#tutorial-cover").remove(),
      );
      await explicar(
        "Antes de vender",
        [
          "<b>Revisa el catálogo y el stock</b><br>El producto o variante debe existir y tener unidades disponibles.",
          "<b>Ejemplo: 10 polos disponibles</b><br>Venderemos 2. Al registrar la venta quedarán 8.",
        ],
        "Cada variante se selecciona por separado.",
      );
      step(
        "CLIENTE · Buscar antes de registrar",
        "Abre Nueva venta y busca por DNI o teléfono para reutilizar el cliente si ya existe.",
      );
      await click(
        page.getByRole("button", { name: "Nueva venta", exact: true }).first(),
      );
      await type(
        page.getByPlaceholder("DNI o teléfono del cliente", { exact: true }),
        "999888777",
      );
      await click(page.getByRole("button", { name: "Buscar", exact: true }));
      await type(
        page.getByPlaceholder("Nombre completo", { exact: true }),
        "María López",
      );
      await type(page.getByPlaceholder("DNI", { exact: true }), "45678912");
      await click(
        page.getByRole("button", { name: "Registrar cliente", exact: true }),
      );
      await explicar(
        "Usa el cliente correcto",
        [
          "<b>Si ya existe, reutilízalo</b><br>Busca por DNI o celular antes de crear otra ficha.",
          "<b>Si es nuevo, regístralo</b><br>Completa su nombre y contacto real. El celular ayuda a relacionar la venta con su solicitud de envío.",
        ],
        "En esta demostración usamos datos de ejemplo, no los de una persona real.",
      );
      step(
        "PRODUCTOS · Agrega la versión correcta",
        "Busca el producto por nombre o SKU y selecciónalo.",
      );
      await type(
        page.getByPlaceholder("Buscar producto por nombre o SKU", {
          exact: true,
        }),
        "Polo algodón",
      );
      await click(page.getByRole("button", { name: /Polo algodón.*POLO-ALG/ }));
      await type(
        page.getByRole("textbox", {
          name: "Cantidad de Polo algodón",
          exact: true,
        }),
        "2",
      );
      await type(
        page.getByRole("textbox", {
          name: "Precio de Polo algodón",
          exact: true,
        }),
        "25.50",
      );
      await explicar(
        "Revisa cantidad y precio unitario",
        [
          "<b>2 polos × S/ 25.50</b><br>Total de la venta: S/ 51.00.",
          "<b>Precio por unidad</b><br>No escribas el total de S/ 51.00 en el precio de una sola unidad.",
        ],
        "Verifica el nombre de la variante antes de guardar.",
      );
      step(
        "PAGO · Elige cómo y cuánto te pagó",
        "Selecciona el método de pago y registra el estado real del cobro.",
      );
      await click(
        page.getByRole("button", { name: "Yape / Plin", exact: true }),
      );
      await click(page.getByRole("button", { name: "Pendiente", exact: true }));
      await click(
        page.getByRole("checkbox", {
          name: "Me pagó solo una parte",
          exact: true,
        }),
      );
      await type(page.getByPlaceholder("51.00", { exact: true }), "20.00");
      await explicar(
        "Pago completo, pendiente o parcial",
        [
          "<b>Si recibiste todo</b><br>Usa Sí, ya pagó. Si todavía no cobraste, usa Pendiente.",
          "<b>Ejemplo: solo recibiste S/ 20.00</b><br>Marca Me pagó solo una parte. De S/ 51.00, queda por cobrar S/ 31.00.",
        ],
        "Con tarjeta, la venta queda pendiente hasta que confirmes el cobro.",
      );
      step(
        "GUARDAR · Crear venta",
        "Comprueba cliente, productos, total y pago antes de crear la venta.",
      );
      await registrar(page, click, "Crear venta", "/api/ventas");
      await page
        .getByTitle("Ver detalle", { exact: true })
        .filter({ visible: true })
        .waitFor();
      await pause(1700);
      let j = await (await ctx.request.get("/api/ventas")).json();
      assert.equal(j.data[0].estado, "PENDIENTE");
      assert.equal(j.data[0].monto_pagado, 20);
      assert.equal(await stock(ctx.request, datos.producto.id), 8);
      await explicar(
        "La venta descuenta stock aunque el cobro siga pendiente",
        [
          "<b>Stock: 10 − 2 = 8</b><br>Las 2 unidades ya forman parte de la venta registrada.",
          "<b>Pago y envío son distintos</b><br>Cobrar no marca un pedido como enviado ni crea automáticamente su solicitud de envío.",
        ],
        "No registres otra venta cuando recibas el saldo: actualiza el cobro de la misma venta.",
      );
      step(
        "CONSULTAR · Revisa el detalle",
        "Abre Ver detalle para comprobar los datos y productos de la operación.",
      );
      await click(
        page
          .getByTitle("Ver detalle", { exact: true })
          .filter({ visible: true }),
      );
      await pause(1900);
      await click(page.getByRole("button", { name: "Cerrar", exact: true }));
      step(
        "COBRAR · Completar el pago pendiente",
        "Solo cuando recibas el saldo, usa Marcar como cobrada y confirma.",
      );
      await click(
        page
          .getByTitle("Marcar como cobrada", { exact: true })
          .filter({ visible: true }),
      );
      await pause(1300);
      const cobro = page.waitForResponse(
        (r) =>
          r.url().includes("/api/ventas") && r.request().method() === "PUT",
      );
      await click(
        page.getByRole("button", { name: "Sí, ya cobré", exact: true }),
      );
      assert((await cobro).ok());
      await pause(1800);
      j = await (await ctx.request.get("/api/ventas")).json();
      assert.equal(j.data[0].estado, "COMPLETADA");
      assert.equal(j.data[0].monto_pagado, 51);
      assert.equal(await stock(ctx.request, datos.producto.id), 8);
      await explicar(
        "Un solo registro de venta",
        [
          "<b>Venta completada: S/ 51.00 cobrados</b><br>Se completa el saldo de esa misma operación.",
          "<b>Stock final: 8</b><br>Confirmar el cobro no vuelve a descontar las 2 unidades.",
        ],
        "Anular es una corrección distinta: revierte la venta y devuelve stock. No lo uses para indicar un cobro.",
      );
      step(
        "Listo · Venta y cobro registrados",
        "Continúa con la gestión del envío cuando corresponda.",
      );
      await cover(
        "Venta registrada.<br>Cobro completo.",
        "Un cliente, una venta y su pago actualizado.<br>El envío se gestiona por separado.",
      );
      await pause(3500);
    },
    async verificar(api, datos) {
      const j = await (await api.get("/api/ventas")).json();
      assert.equal(j.data.length, 1);
      assert.equal(j.data[0].total, 51);
      assert.equal(j.data[0].estado, "COMPLETADA");
      assert.equal(j.data[0].monto_pagado, 51);
      assert.equal(await stock(api, datos.producto.id), 8);
    },
  },
  variantes: {
    titulo: "Serie con variantes",
    preparar: async () => ({}),
    async run({ page, ctx, step, click, type, point, pause, explicar, cover }) {
      const select = async (loc, value) => {
        await point(loc);
        await loc.selectOption(value);
        await pause(500);
      };
      step(
        "INICIO · Serie con variantes",
        "Un ejemplo completo: dos colores y dos tallas.",
      );
      await cover(
        "Un producto.<br>Todas sus variantes.",
        "Crearemos un polo en Negro y Blanco, con tallas S y M.",
      );
      await pause(3500);
      await page.evaluate(() =>
        document.querySelector("#tutorial-cover").remove(),
      );
      step(
        "1. Abre Serie con variantes",
        "Productos → Nuevo producto → Serie con variantes.",
      );
      await click(page.locator('[data-tour="productos-nuevo"]'));
      await click(page.getByRole("button", { name: /Serie con variantes/ }));
      await pause(1800);
      step(
        "2. Completa los datos generales",
        "Nombre, precio y unidad. Estos datos se comparten entre variantes.",
      );
      await type(
        page.getByRole("textbox", { name: "Nombre general", exact: true }),
        "Polo algodón",
      );
      await type(
        page.getByRole("textbox", { name: "Precio general", exact: true }),
        "25.50",
      );
      await select(
        page.getByRole("combobox", { name: "Unidad de medida", exact: true }),
        "unidad",
      );
      await pause(1800);
      step(
        "COSTO · Un costo para todo el conjunto",
        "Costo general: S/ 12.50 por unidad. Puedes cambiar una variante si cuesta distinto.",
      );
      await type(
        page.getByRole("textbox", { name: "Costo general", exact: true }),
        "12.50",
      );
      await explicar(
        "Precio y costo son distintos",
        [
          "<b>Precio general: S/ 25.50</b><br>Lo que cobras al cliente por una unidad.",
          "<b>Costo general: S/ 12.50</b><br>Lo que te cuesta esa unidad. Se aplica a las variantes que usan el costo general.",
        ],
        "Cada campo admite decimales.",
      );
      step(
        "3. Define los colores",
        "Elige Color y escribe sus valores separados por comas.",
      );
      await select(
        page.getByRole("combobox", { name: "Nombre de opción 1", exact: true }),
        "Color",
      );
      await type(
        page.getByRole("textbox", { name: "Valores 1", exact: true }),
        "Negro, Blanco",
      );
      await pause(1800);
      step(
        "4. Añade las tallas",
        "Pulsa Añadir opción, elige Talla y escribe S, M.",
      );
      await click(
        page.getByRole("button", { name: "Añadir opción", exact: true }),
      );
      await select(
        page.getByRole("combobox", { name: "Nombre de opción 2", exact: true }),
        "Talla",
      );
      await type(
        page.getByRole("textbox", { name: "Valores 2", exact: true }),
        "S, M",
      );
      await pause(1600);
      step(
        "5. Genera las combinaciones",
        "Dos colores × dos tallas = cuatro variantes.",
      );
      await click(
        page.getByRole("button", {
          name: "Generar combinaciones",
          exact: true,
        }),
      );
      await point(page.getByRole("dialog").locator("thead"));
      await pause(3000);
      step(
        "SKU · Cada variante ya tiene su código",
        "Los SKU se generan automáticamente y puedes editarlos.",
      );
      await point(
        page.getByRole("textbox", { name: "SKU variante 1", exact: true }),
      );
      await pause(1800);
      await click(
        page.getByRole("checkbox", {
          name: "Usar costo general variante 1",
          exact: true,
        }),
      );
      await type(
        page.getByRole("textbox", { name: "Costo variante 1", exact: true }),
        "14.75",
      );
      await explicar(
        "Una variante con costo diferente",
        [
          "<b>Desmarca Usar costo general</b><br>Solo esa variante permite escribir su costo particular.",
          "<b>Ejemplo: S/ 14.75</b><br>Las otras conservan S/ 12.50. Lo mismo ocurre con el precio de venta al desmarcar Usar precio general.",
        ],
        "Aplicar costo a todas permite unificar los importes; pide confirmación antes de quitar excepciones.",
      );
      step(
        "6. Revisa el stock de cada variante",
        "Cada combinación tiene su propio stock. El precio general ya está aplicado.",
      );
      for (const [i, stock] of [10, 8, 6, 4].entries()) {
        await type(
          page.getByRole("spinbutton", {
            name: `Stock variante ${i + 1}`,
            exact: true,
          }),
          String(stock),
        );
      }
      await pause(1500);
      step(
        "7. Guarda el producto y sus variantes",
        "Revisa los datos y pulsa Guardar producto y variantes.",
      );
      await click(
        page.getByRole("button", {
          name: "Guardar producto y variantes",
          exact: true,
        }),
      );
      await page
        .getByRole("heading", {
          name: "Editar producto y variantes",
          exact: true,
        })
        .waitFor();
      await pause(1400);
      await click(
        page.getByRole("button", { name: "Cerrar ficha", exact: true }),
      );
      await page
        .getByRole("button", { name: "Seleccionar", exact: true })
        .waitFor();
      await pause(2000);
      step(
        "Para editar el conjunto: abre Variantes",
        "Entra en Variantes y selecciona la ficha Polo algodón.",
      );
      await click(page.getByRole("button", { name: "Variantes", exact: true }));
      await click(
        page.getByRole("button", { name: /Polo algodón.*4 variantes/ }),
      );
      await pause(1200);
      step(
        "Cambia el precio general y guarda",
        "Precio: S/ 29.90. Costo: S/ 13.25. La variante con costo especial conserva S/ 14.75.",
      );
      await type(
        page.getByRole("textbox", { name: "Precio general", exact: true }),
        "29.90",
      );
      await type(
        page.getByRole("textbox", { name: "Costo general", exact: true }),
        "13.25",
      );
      await click(
        page.getByRole("button", {
          name: "Guardar producto y variantes",
          exact: true,
        }),
      );
      await pause(1600);
      await click(
        page.getByRole("button", { name: "Cerrar ficha", exact: true }),
      );
      await click(
        page.getByRole("button", { name: "Cerrar variantes", exact: true }),
      );
      await pause(1200);
      const productos = await (await ctx.request.get("/api/productos")).json();
      if (
        productos.data.length !== 4 ||
        productos.data.some((p) => p.precio_venta !== 29.9) ||
        productos.data.filter((p) => p.precio_compra === 13.25).length !== 3 ||
        productos.data.filter((p) => p.precio_compra === 14.75).length !== 1 ||
        new Set(productos.data.map((p) => p.sku)).size !== 4 ||
        JSON.stringify(
          productos.data.map((p) => p.stock_actual).sort((a, b) => a - b),
        ) !== JSON.stringify([4, 6, 8, 10])
      )
        throw Error("No se verificó el guardado de las cuatro variantes");
      step(
        "Listo: cuatro variantes, una sola ficha",
        "En ventas y compras eliges cada variante por separado.",
      );
      await cover(
        "4 variantes.<br>Una sola ficha.",
        "Cada variante conserva su stock.<br>Desde Variantes editas la información general.",
      );
      await pause(4500);
    },
    async verificar(api) {
      const j = await (await api.get("/api/productos")).json();
      assert.equal(j.data.length, 4);
      assert(j.data.every((p) => p.precio_venta === 29.9));
      assert.deepEqual(
        j.data.map((p) => p.stock_actual).sort((a, b) => a - b),
        [4, 6, 8, 10],
      );
      assert.equal(j.data.filter((p) => p.precio_compra === 13.25).length, 3);
      assert.equal(j.data.filter((p) => p.precio_compra === 14.75).length, 1);
    },
  },
};
