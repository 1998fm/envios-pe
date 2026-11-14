import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const agencias = JSON.parse(
  readFileSync(
    new URL("../../src/data/agencias-shalom.json", import.meta.url),
    "utf8",
  ),
);
const origen = agencias.find((a) => a.includes("LIMA / LIMA / LA VICTORIA"));
const destino =
  agencias.find((a) => a.includes("AREQUIPA / AREQUIPA / CAYMA")) ||
  agencias.find((a) => a.startsWith("AREQUIPA /"));
async function post(api, url, data) {
  const r = await api.post(url, { data });
  assert(r.ok(), `${url}: ${await r.text()}`);
  return r.json();
}
export const guiaEnvios = {
  titulo: "Envíos: del formulario al despacho",
  tarifas: { Miraflores: 10 },
  perfil: { metodo_shalom: true, origen_shalom: origen, telefono: "999111222" },
  async preparar(api) {
    const s = await (await api.get("/api/session")).json();
    const p = (
      await post(api, "/api/productos", {
        nombre: "Polo algodón azul M",
        sku: "POLO-AZUL-M",
        precio_venta: 25.5,
        precio_compra: 12.5,
        stock_actual: 10,
        unidad: "unidad",
      })
    ).data;
    const persona = (
      await post(api, "/api/personas", {
        nombre: "María López",
        dni: "45678912",
        telefono: "999 888 777",
      })
    ).data;
    const venta = (
      await post(api, "/api/ventas", {
        persona_id: persona.id,
        persona_nombre: "María López",
        persona_dni: "45678912",
        persona_telefono: "999 888 777",
        metodo_pago: "YAPE_PLIN",
        estado: "PENDIENTE",
        monto_pagado: 20,
        items: [
          {
            producto_id: p.id,
            producto_nombre: p.nombre,
            cantidad: 2,
            precio_unitario: 25.5,
          },
        ],
      })
    ).data;
    const maria = (
      await post(api, "/api/envios", {
        user_id: s.user.id,
        nombre: "María López",
        dni: "45678912",
        telefono: "999888777",
        metodo: "MOTORIZADO",
        destino: "Miraflores",
        direccion: "Av. Ejemplo 123, departamento 201",
        referencia: "Portería del edificio",
        detalle: "Dos polos azules talla M",
        cantidad_productos: 2,
      })
    ).envio;
    const carlos = (
      await post(api, "/api/envios", {
        user_id: s.user.id,
        nombre: "Carlos Ruiz",
        dni: "87654321",
        telefono: "988777666",
        metodo: "SHALOM",
        destino,
        direccion: "Recojo en agencia",
        detalle: "Paquete de ejemplo",
        cantidad_productos: 1,
      })
    ).envio;
    return { maria, carlos, venta, producto: p, slug: s.profile.slug };
  },
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
    decorar,
  }) {
    const maria = () =>
      page
        .locator('[data-tour="envio-card"]')
        .filter({ hasText: "María López" });
    const carlos = () =>
      page
        .locator('[data-tour="envio-card"]')
        .filter({ hasText: "Carlos Ruiz" });
    const cancelar = () =>
      click(
        page
          .getByRole("button", { name: "Cancelar", exact: true })
          .filter({ visible: true }),
      );
    async function menu(accion) {
      await page.getByTitle("Abrir menú", { exact: true }).hover();
      await pause(450);
      await click(
        page.locator(`[data-tour="${accion}"]`).filter({ visible: true }),
      );
    }
    async function estado(card, nombre, opcion) {
      await click(
        card.locator('[data-tour="estado"]').getByRole("button").first(),
      );
      await click(card.getByRole("button", { name: opcion, exact: true }));
      if (nombre !== "Enviado")
        await card.getByRole("button", { name: nombre, exact: true }).waitFor();
    }
    async function guardarConRespuesta(
      boton,
      metodo = "PATCH",
      fragmento = datos.maria.id,
    ) {
      const r = page.waitForResponse(
        (r) => r.url().includes(fragmento) && r.request().method() === metodo,
      );
      await click(boton);
      assert((await r).ok());
      await pause(900);
    }
    step(
      "INICIO · Tu mesa de preparación y despacho",
      "Un recorrido completo: recibir, revisar, validar, preparar y despachar.",
    );
    await cover(
      "Envíos.<br>Del formulario al despacho.",
      "Guía completa con ejemplos y capítulos.<br>Datos ficticios · Plan Plus · permisos de dueño.",
    );
    await pause(5000);
    await page.evaluate(() =>
      document.querySelector("#tutorial-cover").remove(),
    );
    await explicar(
      "Tres cosas que debes distinguir",
      [
        "<b>Venta</b><br>Registra productos, cantidades y cobro. Una venta puede seguir pendiente de pago.",
        "<b>Solicitud de envío</b><br>Tu cliente indica sus datos y el destino. Aquí organizas la preparación y el despacho.",
      ],
      "Registrar un envío no crea una venta ni confirma automáticamente un cobro.",
    );
    step(
      "FORMULARIO · Cómo llegan los pedidos",
      "Comparte tu formulario. Las solicitudes recibidas aparecen en esta sección.",
    );
    await point(
      page.getByRole("button", { name: "Compartir formulario", exact: true }),
    );
    await pause(1600);
    await explicar(
      "Un enlace para tus clientes",
      [
        "<b>Compartir formulario</b><br>Copia el enlace de tu negocio. Tú lo envías al cliente por el canal que utilices.",
        "<b>El cliente lo completa</b><br>Nombre, identificación, celular y datos de entrega según el método. Revisa que sean correctos.",
      ],
      "Métodos, cobertura, fechas y tarifas se configuran en Configuración. Esa sección tiene su propia guía detallada.",
    );
    await page.goto(`/f/${datos.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await decorar();
    await pause(3000);
    await explicar(
      "Lo que ve tu cliente",
      [
        "<b>Formulario del negocio</b><br>Ofrece los métodos habilitados y solicita sus datos. No es la pantalla de compras de inventario.",
        "<b>Antes de compartir</b><br>Prueba tu cobertura, tus días de entrega y tus tarifas. Una solicitud no significa que ya despachaste.",
      ],
      "En este ejemplo ya recibimos dos solicitudes para mostrar el trabajo del dashboard.",
    );
    await page.goto("/dashboard?v=envios");
    await maria().waitFor();
    await decorar();
    step(
      "LISTA · Entender cada tarjeta",
      "Nombre, código del pedido, DNI, celular, destino, método, tamaño y estado.",
    );
    await point(maria());
    await pause(2200);
    await explicar(
      "Lee la tarjeta antes de actuar",
      [
        "<b>Identificación</b><br>Nombre, DNI, celular y código distinguen al cliente y a esta solicitud concreta.",
        "<b>Entrega y preparación</b><br>El método y destino dicen dónde va. El tamaño clasifica el paquete y el estado indica en qué parte de tu operación está.",
      ],
      "La cantidad de prendas puede ser declarada en el formulario: contrástala con el contenido real de las ventas.",
    );
    step(
      "FILTROS · Por qué no aparece un pedido",
      "La vista inicial muestra pendientes, empacados y observados. Los enviados pueden estar ocultos.",
    );
    await click(
      page.locator('[data-tour="filtro-estado"]').getByRole("button").first(),
    );
    await pause(1600);
    await explicar(
      "Buscar no elimina los demás filtros",
      [
        "<b>Estado y método</b><br>Un pedido debe coincidir con todos los filtros activos. Puedes incluir varios estados o métodos.",
        "<b>Si no aparece</b><br>Revisa Enviado, el método, las fechas y el texto de búsqueda antes de pensar que se perdió.",
      ],
      "Los filtros solo cambian la lista que ves. No cambian estados ni borran pedidos.",
    );
    await click(
      page.locator('[data-tour="filtro-estado"]').getByRole("button").first(),
    );
    step(
      "BUSCAR · Nombre, DNI o teléfono",
      "Busca al cliente. Borra el texto al terminar para recuperar los demás pedidos.",
    );
    await type(
      page.getByPlaceholder("Buscar por nombre, DNI o teléfono..."),
      "999888777",
    );
    await carlos().waitFor({ state: "hidden" });
    await pause(1600);
    await type(
      page.getByPlaceholder("Buscar por nombre, DNI o teléfono..."),
      "",
    );
    await carlos().waitFor();
    step(
      "FECHAS · Registro y programación son distintos",
      "El filtro por fecha consulta el registro de la solicitud; Programada organiza el trabajo de entrega.",
    );
    await click(
      page.getByRole("button", { name: "Filtrar por fecha", exact: true }),
    );
    await pause(1400);
    await explicar(
      "Cómo interpretar las fechas",
      [
        "<b>Filtro Desde / Hasta</b><br>Consulta cuándo se registró la solicitud, usando los días del negocio en Perú. Solo Desde busca ese día; ambos definen un rango.",
        "<b>Programada / Registro</b><br>Cambia cómo se agrupan las tarjetas. No reprograma los pedidos ni cambia por sí solo el filtro de fecha.",
      ],
      "Solo Hasta incluye los registros hasta el final de ese día. Si una lista queda vacía, revisa el rango.",
    );
    await click(
      page.getByRole("button", { name: "Filtrar por fecha", exact: true }),
    );
    await click(page.getByRole("button", { name: "Registro", exact: true }));
    await pause(1500);
    await click(page.getByRole("button", { name: "Programada", exact: true }));
    step(
      "DETALLE · Abrir y revisar al destinatario",
      "En computadora: doble clic en la tarjeta. En celular: un toque.",
    );
    await point(maria());
    await maria().dblclick();
    await page.getByText("Destino del envío", { exact: true }).waitFor();
    await pause(1800);
    await explicar(
      "Comprueba quién recibe y a dónde va",
      [
        "<b>Motorizado o domicilio</b><br>Verifica distrito, dirección, referencia, teléfono y fecha. Una dirección incompleta debe resolverse antes del despacho.",
        "<b>Recojo en agencia</b><br>Comprueba la agencia exacta. Una ciudad puede tener varias agencias; no basta con decir Arequipa.",
      ],
      "Si encuentras un dato incorrecto, confírmalo con tu cliente antes de continuar.",
    );
    step(
      "REPROGRAMAR · Cambiar la fecha del pedido",
      "Elige la nueva fecha y pulsa Guardar. Cerrar sin guardar no confirma el cambio.",
    );
    const fecha = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    datos.fecha = fecha;
    await point(page.locator('[data-tour="detalle-envio-fecha"] input'));
    await page.locator('[data-tour="detalle-envio-fecha"] input').fill(fecha);
    await guardarConRespuesta(
      page
        .locator('[data-tour="detalle-envio-fecha"]')
        .getByRole("button", { name: "Guardar", exact: true }),
    );
    await explicar(
      "Reprogramar es una decisión de tu operación",
      [
        "<b>Confirma la nueva fecha</b><br>Coordina con el cliente y revisa que tu operación pueda atenderla.",
        "<b>Guarda y comprueba</b><br>La fecha cambia para este pedido. No modifica por sí sola tus reglas generales de Logística.",
      ],
      "La programación del pedido y la fecha en que el cliente lo registró son datos distintos.",
    );
    step(
      "CONTENIDO · Relacionar el envío con las ventas",
      "Revisa cada venta, producto y cantidad que aparecen en Contenido del pedido.",
    );
    await point(page.getByText("Contenido del pedido", { exact: true }));
    await page.getByText("Polo algodón azul M", { exact: true }).waitFor();
    await pause(1800);
    await explicar(
      "Si faltan las compras de un cliente",
      [
        "<b>Primero debe existir la venta</b><br>En esta sección se muestran los productos vendidos al cliente. Compras registra lo que tú adquiriste de proveedores.",
        "<b>Revisa DNI y celular</b><br>La relación usa las ventas del mismo negocio, ya vinculadas o disponibles para ese cliente. Los espacios del celular se normalizan.",
      ],
      "Una venta anulada, ya completada para otro envío o vinculada a otra solicitud no debe reutilizarse como contenido nuevo.",
    );
    step(
      "VALIDAR · Confirmar lo que realmente empacaste",
      "Compara prendas, variantes y cantidades con el paquete antes de validar.",
    );
    await explicar(
      "Validar contenido no es cobrar ni despachar",
      [
        "<b>Ejemplo: 2 polos azules M</b><br>Confirma físicamente que el paquete contiene esa versión y esa cantidad.",
        "<b>Validar contenido del pedido</b><br>Vincula esas ventas a esta solicitud y marca su preparación como empacada. No vuelve a descontar stock.",
      ],
      "El estado de la tarjeta se gestiona aparte. Tampoco convierte una venta pendiente en una venta pagada.",
    );
    await click(
      page.getByRole("button", {
        name: "Validar contenido del pedido",
        exact: true,
      }),
    );
    await guardarConRespuesta(
      page.getByRole("button", { name: "Sí, validar", exact: true }),
      "POST",
      `${datos.maria.id}/ventas`,
    );
    await page
      .getByText("Contenido validado · listo para envío", { exact: true })
      .waitFor();
    step(
      "OBSERVACIONES · Dejar una incidencia útil",
      "Describe qué falta resolver. Guarda la observación para que el equipo pueda verla.",
    );
    await type(
      page.getByPlaceholder(
        "Registra cualquier incidente: dato faltante, dirección incompleta, paquete con inconvenientes, etc.",
      ),
      "Confirmar horario de recepción con portería.",
    );
    await guardarConRespuesta(
      page.getByRole("button", { name: "Guardar observación", exact: true }),
    );
    await explicar(
      "Una nota no cambia automáticamente el estado",
      [
        "<b>Escribe algo concreto</b><br>Ejemplo: Confirmar horario con portería. Evita notas que no indiquen qué hacer.",
        "<b>Guarda, actualiza o quita</b><br>Guardar conserva la nota. Quitar pide confirmación. Marcar En Observación es una acción aparte.",
      ],
      "No despaches mientras quede una incidencia que impida entregar correctamente.",
    );
    await click(
      page.getByRole("button", { name: "Cerrar", exact: true }).last(),
    );
    step(
      "ESTADOS · No empacado, observado, empacado y enviado",
      "El estado debe reflejar lo que ocurrió realmente con el paquete.",
    );
    await estado(maria(), "En Obs.", "En Obs.");
    await pause(1200);
    await explicar(
      "Cómo usar los cuatro estados",
      [
        "<b>No Empacado / En Observación</b><br>Pendiente de preparar, o con una incidencia que debes resolver. Una nota ayuda al equipo a saber cuál.",
        "<b>Empacado / Enviado</b><br>Preparación terminada, o despacho realizado según tu operación. Enviado no es una confirmación automática de entrega del courier.",
      ],
      "El estado se guarda al seleccionarlo. Corrige un clic equivocado, pero no uses Enviado solo para ocultar un pedido.",
    );
    await estado(maria(), "Empacado", "Empacado");
    step(
      "TAMAÑO · Clasificar el paquete",
      "XS, S, M o L ayudan a identificar el tamaño. No reemplazan el contenido validado.",
    );
    await click(
      maria().getByRole("button", { name: "Sin definir", exact: true }),
    );
    await click(
      maria().getByRole("button", { name: "Paquete M", exact: true }),
    );
    await pause(1600);
    await explicar(
      "Tamaño y tarifa son datos diferentes",
      [
        "<b>Clasificación de preparación</b><br>Elige un tamaño que represente el paquete armado.",
        "<b>No recalcula el cobro</b><br>Cambiar M por L no determina automáticamente el peso, las dimensiones ni el precio del courier.",
      ],
      "Revisa las condiciones reales de tu servicio de entrega por separado.",
    );
    step(
      "SELECCIÓN · Elegir pedidos para una herramienta",
      "Las casillas seleccionan pedidos; abrir la tarjeta muestra su detalle.",
    );
    await click(maria().locator('[data-tour="checkbox"]'));
    await point(page.getByText("(1 seleccionados)", { exact: true }));
    await pause(1500);
    await explicar(
      "Revisa siempre cuántos seleccionaste",
      [
        "<b>Casilla de una tarjeta</b><br>Incluye o retira ese pedido del conjunto seleccionado.",
        "<b>Seleccionar todos</b><br>Actúa sobre los pedidos visibles y cargados. Si hay Cargar más, la lista todavía puede estar incompleta.",
      ],
      "Antes de una acción masiva, revisa los filtros, la cantidad seleccionada y el alcance que indica su modal.",
    );
    step(
      "ETIQUETAS · Preparar la identificación del paquete",
      "Selecciona pedidos y abre Generar etiquetas en el menú lateral.",
    );
    await menu("generar-etiquetas");
    await page
      .getByRole("heading", { name: "Generar etiquetas", exact: true })
      .waitFor();
    await pause(1800);
    await explicar(
      "Elige el formato antes de imprimir",
      [
        "<b>4 etiquetas por hoja</b><br>Distribución 2 por 2 para una hoja A4. Etiqueta individual usa una página por etiqueta.",
        "<b>Revisa los datos</b><br>Confirma destinatario, método y contenido. La impresión se realiza desde el diálogo de tu navegador.",
      ],
      "Generar o imprimir etiquetas no significa que el pedido ya fue entregado al transportista. No cambia el estado por sí solo.",
    );
    await cancelar();
    step(
      "COPIAR DATOS · Lista para el motorizado",
      "Selecciona pedidos de Motorizado y abre Copiar datos.",
    );
    await menu("copiar-datos");
    await page
      .getByText("Copiar datos para Motorizado", { exact: true })
      .waitFor();
    await pause(1800);
    await explicar(
      "Cobrar envío no es cobrar los productos",
      [
        "<b>Revisa cada dirección</b><br>La herramienta reúne datos para tu operación de Motorizado. Puedes copiar el texto o exportar Excel.",
        "<b>Cobrar envío</b><br>Indica si corresponde cobrar la tarifa de reparto de ese pedido. No representa automáticamente el saldo de la venta.",
      ],
      "Verifica las tarifas en Configuración. No confundas el costo del reparto con el importe de los productos.",
    );
    await click(
      page.getByRole("checkbox", { name: "Cobrar envío", exact: true }),
    );
    await pause(1500);
    const descarga = page.waitForEvent("download");
    await click(
      page.getByRole("button", { name: "Exportar Excel", exact: true }),
    );
    const archivo = await descarga;
    assert(!(await archivo.failure()));
    datos.excelMoto = true;
    await cancelar();
    await click(maria().locator('[data-tour="checkbox"]'));
    await click(carlos().locator('[data-tour="checkbox"]'));
    step(
      "CAMBIO MASIVO · Preparar varios pedidos con cuidado",
      "Ejemplo: marcar como Empacado solo el pedido seleccionado de Carlos.",
    );
    await menu("cambio-masivo");
    await page
      .getByRole("heading", { name: "Cambio Masivo", exact: true })
      .waitFor();
    await click(
      page.locator('input[type="checkbox"]').filter({ visible: true }).last(),
    );
    const selects = page.locator("select").filter({ visible: true });
    await point(selects.last());
    await selects.last().selectOption("EMPACADO");
    await pause(1800);
    await explicar(
      "Seleccionados y método/estado no son el mismo alcance",
      [
        "<b>Solo pedidos seleccionados</b><br>Usa las casillas que elegiste. Revisa la cantidad antes de aplicar.",
        "<b>Sin esa opción</b><br>La pantalla usa método y estado actual sobre la lista cargada. No supongas que procesa todos los registros históricos.",
      ],
      "Nuevo estado modifica pedidos. Si eliges Enviado, también cambia la preparación de sus ventas vinculadas; no el cobro.",
    );
    await guardarConRespuesta(
      page.getByRole("button", { name: "Aplicar cambios", exact: true }),
      "PATCH",
      "/api/envios/bulk",
    );
    await pause(1700);
    step(
      "SHALOM PRO · Preparar el archivo correcto",
      "Solo entran pedidos Shalom empacados. Verifica la agencia de origen y el destino exacto.",
    );
    await menu("exportar-shalom");
    await page
      .getByRole("heading", { name: "Exportar Shalom", exact: true })
      .waitFor();
    await pause(1800);
    await explicar(
      "Qué prepara Shalom Pro",
      [
        "<b>Un Excel para la operación de Shalom</b><br>Revisa origen, destinatarios, agencias y archivos seleccionados. La herramienta separa lotes cuando corresponde.",
        "<b>Seleccionados o todos los empacados</b><br>Si seleccionaste pedidos, filtra ese conjunto. Sin selección, ofrece los Shalom empacados elegibles del negocio.",
      ],
      "Descargar el archivo no registra por sí solo una entrega física ni reemplaza la revisión en el sistema de Shalom.",
    );
    await point(page.locator('[data-tour="export-marcar"]'));
    await explicar(
      "La casilla que cambia el estado",
      [
        "<b>Marcar automáticamente como ENVIADO</b><br>Si está activa, la exportación también actualiza los pedidos. No la dejes marcada si aún no corresponde despachar.",
        "<b>Ejemplo de esta guía</b><br>La desmarcamos y solo descargamos el Excel. Carlos continúa Empacado para revisarlo antes de la entrega.",
      ],
      "Exportar y enviar se refiere al estado en Tori; no significa que un courier haya recogido o entregado el paquete.",
    );
    await click(page.locator('[data-tour="export-marcar"] input'));
    const excel = page.waitForEvent("download");
    await click(page.getByRole("button", { name: "Descargar", exact: true }));
    assert(!(await (await excel).failure()));
    datos.excelShalom = true;
    await pause(1800);
    // El modal puede permanecer abierto después de descargar.
    if (
      await page
        .getByRole("heading", { name: "Exportar Shalom", exact: true })
        .isVisible()
    )
      await cancelar();
    await click(carlos().locator('[data-tour="checkbox"]'));
    step(
      "DESPACHAR · Marcar como Enviado en el momento correcto",
      "Ejemplo: María ya fue entregada al responsable del reparto. Ahora actualizamos su estado.",
    );
    await estado(maria(), "Enviado", "Enviado");
    await pause(2000);
    await explicar(
      "Si desaparece de la lista, revisa el filtro",
      [
        "<b>Vista inicial sin Enviado</b><br>Un pedido despachado puede dejar de coincidir con los estados seleccionados.",
        "<b>Ventas vinculadas</b><br>Su estado de envío pasa a completado. Esto no registra automáticamente un pago pendiente ni descuenta stock nuevamente.",
      ],
      "No confundas Enviado en Tori con una constancia de entrega final del operador logístico.",
    );
    await click(
      page.locator('[data-tour="filtro-estado"]').getByRole("button").first(),
    );
    await click(
      page
        .locator('[data-tour="filtro-estado"]')
        .getByRole("button", { name: "Seleccionar todos", exact: true }),
    );
    await click(
      page.locator('[data-tour="filtro-estado"]').getByRole("button").first(),
    );
    await maria().waitFor();
    step(
      "ELIMINAR · Solo para una solicitud que corresponde retirar",
      "Eliminar el pedido es diferente de cambiar su estado o anular una venta.",
    );
    await maria().dblclick();
    await page.getByRole("button", { name: "Eliminar", exact: true }).waitFor();
    await click(page.getByRole("button", { name: "Eliminar", exact: true }));
    await pause(1800);
    await explicar(
      "Antes de confirmar una eliminación",
      [
        "<b>Se retira esta solicitud</b><br>Las ventas vinculadas quedan libres de la relación con ese pedido. No es una anulación de venta.",
        "<b>No devuelve stock ni registra devoluciones</b><br>Si hay un problema con productos o dinero, corrige la operación correspondiente en su sección.",
      ],
      "En esta guía cancelamos la eliminación: María y Carlos seguirán registrados.",
    );
    await cancelar();
    await click(
      page.getByRole("button", { name: "Cerrar", exact: true }).last(),
    );
    step(
      "PLAN Y PERMISOS · Qué puede ver cada usuario",
      "La demostración usa Plus y permisos de dueño. Tu cuenta puede mostrar menos opciones.",
    );
    await explicar(
      "Básico, Plus y equipo",
      [
        "<b>Básico</b><br>Recibe solicitudes sin límite mensual y permite su gestión individual. Las herramientas operativas avanzadas requieren Plus.",
        "<b>Plus y permisos</b><br>Contenido de ventas, Copiar datos, etiquetas, Shalom Pro y cambios masivos dependen del plan y del acceso del usuario.",
      ],
      "Si falta una herramienta, revisa plan, permisos y métodos habilitados antes de registrar otra solicitud.",
    );
    step(
      "LISTA FINAL · Tu rutina antes de despachar",
      "Datos y destino → contenido real → incidencias → empaque → documentos → despacho.",
    );
    await explicar(
      "Una rutina simple y completa",
      [
        "<b>Antes de preparar</b><br>Busca al cliente, abre el detalle, revisa destino y fecha, y comprueba productos y cantidades.",
        "<b>Antes de despachar</b><br>Resuelve incidencias, valida contenido, marca el empaque y prepara etiquetas o archivos. Actualiza Enviado solo cuando corresponda.",
      ],
      "Puedes repetir cualquier capítulo. Configuración, Ventas y Productos tienen guías complementarias.",
    );
    await cover(
      "Cada pedido,<br>revisado y preparado.",
      "Un estado claro para el equipo.<br>Un destino y un contenido comprobados.",
    );
    await pause(5000);
  },
  async verificar(api, d) {
    const envios = (await (await api.get("/api/envios")).json()).data;
    assert.equal(envios.length, 2);
    const m = envios.find((e) => e.id === d.maria.id),
      c = envios.find((e) => e.id === d.carlos.id);
    assert.equal(m.estado, "ENVIADO");
    assert.equal(m.tamano, "PAQUETE M");
    assert(m.observaciones.includes("portería"));
    assert(m.fecha_programada.startsWith(d.fecha));
    assert.equal(c.estado, "EMPACADO");
    const ventas = (await (await api.get("/api/ventas")).json()).data;
    assert.equal(ventas[0].estado, "PENDIENTE");
    assert.equal(ventas[0].monto_pagado, 20);
    assert.equal(ventas[0].estado_envio, "COMPLETADO");
    assert.equal(ventas[0].envio_id, d.maria.id);
    assert.equal(
      (await (await api.get("/api/productos")).json()).data[0].stock_actual,
      8,
    );
    assert(d.excelMoto && d.excelShalom);
  },
};
