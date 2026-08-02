export type TourStep = {
  target: string
  text: string
}

export type TourId =
  | 'tab-resumen'
  | 'tab-envios'
  | 'tab-productos'
  | 'tab-ventas'
  | 'tab-compras'
  | 'tab-gastos'
  | 'modal-nueva-venta'
  | 'modal-detalle-venta'
  | 'modal-nueva-compra'
  | 'modal-detalle-compra'
  | 'modal-nuevo-producto'
  | 'modal-nuevo-gasto'
  | 'modal-detalle-envio'
  | 'modal-configuracion'
  | 'modal-cambio-masivo'
  | 'modal-exportar-shalom'
  | 'modal-etiquetas'
  | 'modal-copiar-datos'
  | 'modal-upgrade'

export type Tour = {
  id: TourId
  titulo: string
  modal?: boolean
  steps: TourStep[]
}

export const TRAYECTO_INICIAL: TourId[] = [
  'tab-resumen',
  'tab-envios',
  'tab-ventas',
  'tab-productos',
  'tab-compras',
  'tab-gastos',
]

export type TabKey = 'resumen' | 'envios' | 'ventas' | 'productos' | 'compras' | 'gastos'

export const TOUR_TAB: Partial<Record<TourId, TabKey>> = {
  'tab-resumen': 'resumen',
  'tab-envios': 'envios',
  'tab-ventas': 'ventas',
  'tab-productos': 'productos',
  'tab-compras': 'compras',
  'tab-gastos': 'gastos',
}

const LEGACY_KEYS: Record<string, string> = {
  'tab-resumen': 'tori_dashboard_tour_done',
  'tab-envios': 'tori_card_tour_done',
}

const TRAYECTO_DONE_KEY = 'tori_trayecto_done'
const TRAYECTO_INDEX_KEY = 'tori_trayecto_index'

export function tourDone(id: string): boolean {
  if (typeof window === 'undefined') return true
  const legacy = LEGACY_KEYS[id]
  if (legacy && localStorage.getItem(legacy) === 'true') return true
  return localStorage.getItem(`tori_tour_${id}_done`) === 'true'
}

export function markTourDone(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`tori_tour_${id}_done`, 'true')
}

export function clearTour(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`tori_tour_${id}_done`)
}

export function trayectoDone(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(TRAYECTO_DONE_KEY) === 'true'
}

export function markTrayectoDone(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TRAYECTO_DONE_KEY, 'true')
}

export function getTrayectoIndex(): number {
  if (typeof window === 'undefined') return 0
  const raw = parseInt(localStorage.getItem(TRAYECTO_INDEX_KEY) || '0', 10)
  return Number.isNaN(raw) ? 0 : raw
}

export function setTrayectoIndex(index: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TRAYECTO_INDEX_KEY, String(index))
}

export function clearAllTours(): void {
  if (typeof window === 'undefined') return
  TOURS.forEach((t) => clearTour(t.id))
  Object.values(LEGACY_KEYS).forEach((k) => localStorage.removeItem(k))
  localStorage.removeItem(TRAYECTO_DONE_KEY)
  localStorage.removeItem(TRAYECTO_INDEX_KEY)
}

export const TOURS: Tour[] = [
  // ==========================================
  // PESTAÑA: RESUMEN
  // ==========================================
  {
    id: 'tab-resumen',
    titulo: 'Resumen',
    steps: [
      {
        target: '#dashboard-content',
        text: '¡Hola! Soy Tori, tu ayudante. Este es el Resumen: aquí ves todo tu negocio de un vistazo. Te guiaré por las secciones, una por una. Toca "Siguiente" para avanzar.',
      },
      {
        target: '[data-tour="resumen-saldo"]',
        text: 'Tu saldo disponible: lo que te queda tras ventas, compras y gastos. Se calcula solo: Ventas − Compras − Gastos.',
      },
      {
        target: '[data-tour="resumen-kpis"]',
        text: 'Tus cifras del día y del mes: cuánto vendiste, cuánto te deben y pedidos por despachar. Solo mira, sin cuentas.',
      },
      {
        target: '[data-tour="resumen-pendientes"]',
        text: 'Tori te recuerda lo urgente de hoy: pedidos sin empacar, cobros pendientes y stock bajo. Toca uno y te lleva directo.',
      },
      {
        target: '[data-tour="resumen-recientes"]',
        text: 'Los últimos movimientos: pedidos, ventas y gastos recientes. Ahora sí, te muestro el resto de secciones en orden.',
      },
    ],
  },

  // ==========================================
  // PESTAÑA: ENVÍOS
  // ==========================================
  {
    id: 'tab-envios',
    titulo: 'Envíos',
    steps: [
      {
        target: '[data-tour="filter-bar"]',
        text: 'Bienvenido a Envíos. Aquí están todos los pedidos que llegan desde tu formulario público. Es el corazón de Tori.',
      },
      {
        target: '[data-tour="filtro-busqueda"]',
        text: 'Busca cualquier pedido por nombre o DNI. Así encuentras al instante a tu cliente, aunque tengas cientos de pedidos.',
      },
      {
        target: '[data-tour="filtro-estado"]',
        text: 'Filtra por estado: No empacado, Empacado o Enviado. Los colores te ayudan a saber en qué va cada pedido.',
      },
      {
        target: '[data-tour="envio-list"]',
        text: 'Cada pedido es una tarjeta con el nombre, DNI, método de envío y estado. Ábrela para ver el detalle completo.',
      },
      {
        target: '[data-tour="envio-card"] [data-tour="estado"]',
        text: 'Cambia el estado aquí: No empacado → Empacado → Enviado. Es así de simple, un clic.',
      },
      {
        target: '[data-tour="envio-card"] [data-tour="checkbox"]',
        text: 'Marca varios pedidos a la vez para usar las acciones del menú: exportar a Shalom, generar etiquetas o copiar direcciones.',
      },
    ],
  },

  // ==========================================
  // PESTAÑA: PRODUCTOS
  // ==========================================
  {
    id: 'tab-productos',
    titulo: 'Productos',
    steps: [
      {
        target: '[data-tour="productos-buscar"]',
        text: 'Bienvenido a Productos. Este es tu inventario: todo lo que vendes, con su stock y precios. Busca por nombre o código.',
      },
      {
        target: '[data-tour="productos-nuevo"]',
        text: 'Con "Nuevo" creas un producto: nombre, stock, precio de venta y de compra.',
      },
      {
        target: '[data-tour="productos-ejemplos"]',
        text: '¿No sabes cómo empezar? "Insertar ejemplos" agrega productos de prueba para que veas cómo funciona antes de cargar los tuyos.',
      },
      {
        target: '[data-tour="productos-tabla"]',
        text: 'Tu inventario completo: stock, precios y unidad. Cuando el stock baja de tu mínimo, la fila se marca en rojo para que lo sepas.',
      },
      {
        target: '[data-tour="productos-vacio"]',
        text: 'Aún no tienes productos. Crea el primero o usa "Insertar ejemplos" para probar.',
      },
    ],
  },

  // ==========================================
  // PESTAÑA: VENTAS
  // ==========================================
  {
    id: 'tab-ventas',
    titulo: 'Ventas',
    steps: [
      {
        target: '[data-tour="ventas-nueva"]',
        text: 'Bienvenido a Ventas. Aquí registras cada venta que haces: en efectivo, Yape/Plin o tarjeta. Al registrar, el stock se descuenta solo.',
      },
      {
        target: '[data-tour="ventas-filtros"]',
        text: 'Filtra por Completadas, Pendientes o Anuladas. Las pendientes son pagos que aún faltan confirmar (por ejemplo, tarjeta).',
      },
      {
        target: '[data-tour="ventas-tabla"]',
        text: 'Cada fila es una venta: cliente, DNI, total y forma de pago. Todo en orden, sin cuadernos.',
      },
      {
        target: '[data-tour="ventas-detalle"]',
        text: 'El botón del ojo abre el detalle completo de la venta: productos, precios y estado.',
      },
      {
        target: '[data-tour="ventas-vacio"]',
        text: 'Aún no hay ventas registradas. Empieza con "Nueva venta" cuando hagas tu primera.',
      },
    ],
  },

  // ==========================================
  // PESTAÑA: COMPRAS
  // ==========================================
  {
    id: 'tab-compras',
    titulo: 'Compras',
    steps: [
      {
        target: '[data-tour="compras-nueva"]',
        text: 'Bienvenido a Compras. Aquí registras lo que compras a tus proveedores: materiales, mercadería, insumos. Al registrar, el stock sube solo.',
      },
      {
        target: '[data-tour="compras-filtros"]',
        text: 'Filtra por Completadas o Anuladas para revisar tu historial de compras.',
      },
      {
        target: '[data-tour="compras-tabla"]',
        text: 'Cada compra muestra proveedor, total y estado. Así sabes cuánto inviertes en tu negocio.',
      },
      {
        target: '[data-tour="compras-vacio"]',
        text: 'Aún no hay compras. Registra la primera para reponer tu inventario.',
      },
    ],
  },

  // ==========================================
  // PESTAÑA: GASTOS
  // ==========================================
  {
    id: 'tab-gastos',
    titulo: 'Gastos',
    steps: [
      {
        target: '[data-tour="gastos-nuevo"]',
        text: 'Bienvenido a Gastos. Aquí anotas todo lo que sales de tu bolsillo: materiales, pasajes, delivery, publicidad, servicios. Nada se te olvida.',
      },
      {
        target: '[data-tour="gastos-filtros"]',
        text: 'Filtra por categoría para ver tus gastos por tipo: materiales, pasajes, delivery, etc.',
      },
      {
        target: '[data-tour="gastos-total"]',
        text: 'Aquí ves el total de tus gastos. Este número se resta de tu saldo disponible en el Resumen.',
      },
      {
        target: '[data-tour="gastos-tabla"]',
        text: 'Cada gasto con su categoría, concepto y monto. Puedes editar o eliminar con los botones.',
      },
      {
        target: '[data-tour="gastos-vacio"]',
        text: 'Aún no hay gastos registrados. Anota el primero cuando salgas dinero.',
      },
    ],
  },

  // ==========================================
  // MODAL: NUEVA VENTA
  // ==========================================
  {
    id: 'modal-nueva-venta',
    titulo: 'Nueva venta',
    modal: true,
    steps: [
      {
        target: '[data-tour="nueva-venta-cliente"]',
        text: 'Este es el formulario de "Nueva venta". Primero busca al cliente por DNI o teléfono. Si no existe, usa "Registro rápido" para crearlo.',
      },
      {
        target: '[data-tour="nueva-venta-productos"]',
        text: 'Aquí eliges los productos que vendió. Escribe para buscar y toca uno para agregarlo a la venta.',
      },
      {
        target: '[data-tour="nueva-venta-items"]',
        text: 'Revisa la lista: puedes cambiar la cantidad y el precio si hiciste un descuento. El total se calcula solo.',
      },
      {
        target: '[data-tour="nueva-venta-pago"]',
        text: 'Elige cómo pagó tu cliente: Efectivo, Yape/Plin o Tarjeta. Si eliges Tarjeta, la venta queda "Pendiente" hasta que confirmes el pago.',
      },
      {
        target: '[data-tour="nueva-venta-crear"]',
        text: 'Con "Crear venta" la guardas y el stock de tus productos se descuenta automáticamente.',
      },
    ],
  },

  // ==========================================
  // MODAL: DETALLE DE VENTA
  // ==========================================
  {
    id: 'modal-detalle-venta',
    titulo: 'Detalle de venta',
    modal: true,
    steps: [
      {
        target: '[data-tour="detalle-entidad"]',
        text: 'Esta es la venta completa. Aquí ves quién la hizo: el nombre del cliente.',
      },
      {
        target: '[data-tour="detalle-tiles"]',
        text: 'Los datos rápidos: DNI, estado, forma de pago y total de la venta.',
      },
      {
        target: '[data-tour="detalle-items"]',
        text: 'Los productos que incluyó, con cantidades y precios. Todo listo para revisar o entregar.',
      },
    ],
  },

  // ==========================================
  // MODAL: NUEVA COMPRA
  // ==========================================
  {
    id: 'modal-nueva-compra',
    titulo: 'Nueva compra',
    modal: true,
    steps: [
      {
        target: '[data-tour="nueva-compra-proveedor"]',
        text: 'Este es el formulario de "Nueva compra". Primero escribe el nombre de tu proveedor o de la tienda donde compraste.',
      },
      {
        target: '[data-tour="nueva-compra-productos"]',
        text: 'Agrega los productos que compraste. Al guardar, el stock de cada uno sube automáticamente.',
      },
      {
        target: '[data-tour="nueva-compra-items"]',
        text: 'Revisa cantidades y precios de compra. El total se calcula solo.',
      },
      {
        target: '[data-tour="nueva-compra-crear"]',
        text: 'Con "Registrar compra" guardas todo y tu inventario queda actualizado.',
      },
    ],
  },

  // ==========================================
  // MODAL: DETALLE DE COMPRA
  // ==========================================
  {
    id: 'modal-detalle-compra',
    titulo: 'Detalle de compra',
    modal: true,
    steps: [
      {
        target: '[data-tour="detalle-entidad"]',
        text: 'Esta es la compra completa. Aquí ves el proveedor al que le compraste.',
      },
      {
        target: '[data-tour="detalle-tiles"]',
        text: 'Los datos rápidos: estado, total y fecha de la compra.',
      },
      {
        target: '[data-tour="detalle-items"]',
        text: 'Los productos que compraste, con cantidades y precios.',
      },
    ],
  },

  // ==========================================
  // MODAL: NUEVO PRODUCTO
  // ==========================================
  {
    id: 'modal-nuevo-producto',
    titulo: 'Nuevo producto',
    modal: true,
    steps: [
      {
        target: '[data-tour="nuevo-producto-nombre"]',
        text: 'Este es el formulario de "Nuevo producto". Escribe el nombre. El código SKU se genera solo, no tienes que pensar en eso.',
      },
      {
        target: '[data-tour="nuevo-producto-stock"]',
        text: 'Cuántas unidades tienes y cuál es el mínimo. Si el stock baja de ese mínimo, Tori te avisa para que repongas a tiempo.',
      },
      {
        target: '[data-tour="nuevo-producto-precios"]',
        text: 'Precio de venta (a cuánto lo vendes) y precio de compra (cuánto te costó). Con eso Tori calcula tus ganancias.',
      },
      {
        target: '[data-tour="nuevo-producto-crear"]',
        text: 'Con "Crear" el producto queda listo para venderlo en tus ventas.',
      },
    ],
  },

  // ==========================================
  // MODAL: NUEVO GASTO
  // ==========================================
  {
    id: 'modal-nuevo-gasto',
    titulo: 'Nuevo gasto',
    modal: true,
    steps: [
      {
        target: '[data-tour="nuevo-gasto-categoria"]',
        text: 'Este es el formulario de "Registrar gasto". Elige la categoría: materiales, pasajes, delivery, publicidad, servicios u otros.',
      },
      {
        target: '[data-tour="nuevo-gasto-concepto"]',
        text: 'Escribe en qué gastaste. Por ejemplo: "cinta adhesiva" o "pasajes a Miraflores".',
      },
      {
        target: '[data-tour="nuevo-gasto-monto"]',
        text: 'El monto y la fecha del gasto. Revisa que el monto sea el correcto.',
      },
      {
        target: '[data-tour="nuevo-gasto-crear"]',
        text: 'Con "Registrar gasto" queda guardado y se resta de tu saldo disponible automáticamente.',
      },
    ],
  },

  // ==========================================
  // MODAL: DETALLE DE PEDIDO
  // ==========================================
  {
    id: 'modal-detalle-envio',
    titulo: 'Detalle de pedido',
    modal: true,
    steps: [
      {
        target: '[data-tour="detalle-envio-info"]',
        text: 'Este es el detalle del pedido: toda la información de tu cliente y su envío.',
      },
      {
        target: '[data-tour="detalle-envio-estado"]',
        text: 'Aquí cambias el estado del pedido: No empacado → Empacado → Enviado. Así llevas el control de cada entrega.',
      },
      {
        target: '[data-tour="detalle-envio-fecha"]',
        text: 'Puedes programar la fecha de entrega si el cliente la pidió para un día en especial.',
      },
      {
        target: '[data-tour="detalle-envio-ventas"]',
        text: 'Si tu cliente tiene ventas registradas, las verás aquí para no repetir ni olvidar ninguna.',
      },
    ],
  },

  // ==========================================
  // MODAL: CONFIGURACIÓN
  // ==========================================
  {
    id: 'modal-configuracion',
    titulo: 'Configuración',
    modal: true,
    steps: [
      {
        target: '[data-tour="config-tabs"]',
        text: 'Aquí configuras tu negocio: tu empresa, los métodos de envío, la logística y las tarifas.',
      },
      {
        target: '[data-tour="config-empresa"]',
        text: 'Los datos de tu negocio: nombre, teléfono, dirección y logo. Esto es lo que ven tus clientes en tu formulario.',
      },
      {
        target: '[data-tour="config-metodos"]',
        text: 'Elige qué métodos de envío ofreces: Shalom, Motorizado, Olva, Marvisur, etc. Solo activa los que usas.',
      },
      {
        target: '[data-tour="config-guardar"]',
        text: 'Con "Guardar" se aplica todo a tu panel y a tu formulario público al instante.',
      },
    ],
  },

  // ==========================================
  // MODAL: CAMBIO MASIVO
  // ==========================================
  {
    id: 'modal-cambio-masivo',
    titulo: 'Cambio masivo',
    modal: true,
    steps: [
      {
        target: '[data-tour="cambio-metodo"]',
        text: 'Este es el "Cambio masivo": te permite actualizar muchos pedidos de una sola vez. Primero elige a qué método aplicas el cambio, o déjalo en "Todos".',
      },
      {
        target: '[data-tour="cambio-estados"]',
        text: 'De qué estado a qué nuevo estado quieres pasar los pedidos. Por ejemplo: de "Empacado" a "Enviado".',
      },
      {
        target: '[data-tour="cambio-seleccionados"]',
        text: 'Puedes aplicar el cambio solo a los pedidos que marcaste con la casilla, en vez de a todos.',
      },
      {
        target: '[data-tour="cambio-aplicar"]',
        text: 'Con "Aplicar cambios" se actualizan todos los pedidos a la vez. Úsalo con calma, revisa primero.',
      },
    ],
  },

  // ==========================================
  // MODAL: EXPORTAR SHALOM
  // ==========================================
  {
    id: 'modal-exportar-shalom',
    titulo: 'Exportar a Shalom',
    modal: true,
    steps: [
      {
        target: '[data-tour="export-resumen"]',
        text: 'Este es el resumen de los envíos Shalom que vas a exportar: cuántos son, para tu agencia.',
      },
      {
        target: '[data-tour="export-marcar"]',
        text: 'Si dejas activada esta opción, los envíos se marcan automáticamente como "Enviado" cuando exportes. Así no tienes que hacerlo a mano.',
      },
      {
        target: '[data-tour="export-confirmar"]',
        text: 'Con "Exportar" descargas el archivo listo para tu agencia Shalom.',
      },
    ],
  },

  // ==========================================
  // MODAL: GENERAR ETIQUETAS
  // ==========================================
  {
    id: 'modal-etiquetas',
    titulo: 'Etiquetas',
    modal: true,
    steps: [
      {
        target: '[data-tour="etiquetas-formato"]',
        text: 'Elige el formato de tus etiquetas: 4 por hoja A4 o una etiqueta individual por paquete.',
      },
      {
        target: '[data-tour="etiquetas-imprimir"]',
        text: 'Con "Imprimir" generas las etiquetas con el nombre y la dirección de cada cliente, listas para pegar en los paquetes.',
      },
    ],
  },

  // ==========================================
  // MODAL: COPIAR DATOS MOTORIZADO
  // ==========================================
  {
    id: 'modal-copiar-datos',
    titulo: 'Copiar datos',
    modal: true,
    steps: [
      {
        target: '[data-tour="copiar-resumen"]',
        text: 'Este es el resumen de los envíos de motorizado que seleccionaste: total y cuántos vas a cobrar.',
      },
      {
        target: '[data-tour="copiar-lista"]',
        text: 'Cada envío con su dirección y su tarifa. Revisa que estén todos los de tu repartidor de hoy.',
      },
      {
        target: '[data-tour="copiar-cobrar"]',
        text: 'Marca cuáles vas a cobrar en la entrega. Los marcados se registran como cobrados.',
      },
      {
        target: '[data-tour="copiar-botones"]',
        text: 'Aquí copias la lista o la exportas para pasársela a tu repartidor. Así no se pierde ninguna dirección.',
      },
    ],
  },

  // ==========================================
  // MODAL: PLANES (UPGRADE)
  // ==========================================
  {
    id: 'modal-upgrade',
    titulo: 'Planes Pro',
    modal: true,
    steps: [
      {
        target: '[data-tour="upgrade-periodo"]',
        text: 'Aquí eliges el plan Pro para desbloquear más funciones: más envíos, logística y tarifas. También puedes quedarte en el plan Básico gratis.',
      },
      {
        target: '[data-tour="upgrade-planes"]',
        text: 'Compara los planes: Básico es gratis para siempre y Pro te da todo el poder de Tori.',
      },
      {
        target: '[data-tour="upgrade-pagar"]',
        text: 'Con el botón de pago te llevamos a Mercado Pago, de forma segura. Puedes pagar con Yape, tarjeta y más.',
      },
    ],
  },
]

export function getTour(id: TourId): Tour | undefined {
  return TOURS.find((t) => t.id === id)
}
