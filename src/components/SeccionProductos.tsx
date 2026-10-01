'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { Plus, Search, Pencil, Trash2, Check, X, Printer, Lock, Camera, Archive, ArchiveRestore, CheckSquare, Package, History, Boxes, Tag, Info } from 'lucide-react'
import { fmtSoles } from '@/lib/format'
import { toast } from 'sonner'
import type { Producto, MovimientoInventario } from '@/types/inventario'
import { UNIDADES_MEDIDA } from '@/types/inventario'
import { useConfirm } from '@/components/ConfirmDialog'
import { useOnboarding } from '@/context/OnboardingContext'
import { tourDone, trayectoDone } from '@/lib/tours'
import TourHelpButton from '@/components/TourHelpButton'
import { openUpgrade, planNivel } from '@/lib/planGating'
import EtiquetasProducto, { COPIAS_A4_OPCIONES, TAMANOS_ETIQUETA_PRODUCTO, type TamanoEtiquetaProducto } from '@/components/EtiquetasProducto'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { comprimirImagen, rutaDesdeUrlProducto } from '@/lib/comprimirImagen'

type Props = {
  userId: string
  plan?: string
}

type FotoPendiente = { blob: Blob; preview: string; kb: number }

// Miniatura con vista previa grande al pasar el cursor.
// Usa position:fixed para no ser recortada por el overflow de la tabla.
function PreviewImagenProducto({ src, alt }: { src: string; alt: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 cursor-zoom-in transition-transform duration-150 hover:scale-110"
        onMouseEnter={(e) => {
          const r = (e.target as HTMLElement).getBoundingClientRect()
          setPos({ x: r.right + 10, y: r.top })
        }}
        onMouseLeave={() => setPos(null)}
      />
      {pos && (
        <div
          className="fixed z-[60] pointer-events-none animate-fade-in-up"
          style={{
            left: Math.min(pos.x, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 240),
            top: Math.max(8, Math.min(pos.y - 100, (typeof window !== 'undefined' ? window.innerHeight : 9999) - 250)),
          }}
        >
          <img
            src={src}
            alt=""
            className="w-56 h-56 object-cover rounded-xl border border-slate-200 shadow-2xl bg-white"
          />
        </div>
      )}
    </>
  )
}

/** Boton de accion en la fila: discreto hasta que pasas el mouse encima. */
function BotonFila({
  icono: Icono,
  titulo,
  onClick,
  hover = 'hover:bg-tori-50 hover:text-tori-600',
}: {
  icono: typeof Pencil
  titulo: string
  onClick: () => void
  hover?: string
}) {
  return (
    <button
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className={`grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition-colors ${hover}`}
    >
      <Icono size={15} />
    </button>
  )
}

/**
 * Indicador de la franja del catálogo: etiqueta, cifra y aclaración. El color
 * solo aparece cuando algo necesita atención, para no competir con la tabla.
 */
function KpiCatalogo({
  etiqueta,
  valor,
  ayuda,
  tono,
}: {
  etiqueta: string
  valor: string
  ayuda: string
  tono?: 'ok' | 'malo'
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 backdrop-blur-sm transition-colors ${
        tono === 'ok'
          ? 'border-emerald-300/30 bg-emerald-400/10'
          : tono === 'malo'
            ? 'border-red-300/30 bg-red-400/10'
            : 'border-white/15 bg-white/10'
      }`}
    >
      <p className="text-[9.5px] font-black uppercase tracking-wider text-tori-200">{etiqueta}</p>
      <p
        className={`mt-1.5 text-xl font-black leading-none tabular-nums tracking-tight ${
          tono === 'ok' ? 'text-emerald-100' : tono === 'malo' ? 'text-red-100' : 'text-white'
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-[10px] leading-tight text-tori-100/80">{ayuda}</p>
    </div>
  )
}

/**
 * Titulo de seccion del modal, con el mismo formato que usa el modal de venta
 * nueva: icono en una caja de color, numero opcional y el texto en gris fuerte.
 */
function EtiquetaModal({
  icono: Icono,
  titulo,
  n,
}: {
  icono: typeof Package
  titulo: string
  n?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-tori-50 text-tori-600">
        <Icono size={13} />
      </span>
      {n != null && <span className="text-[10px] font-black tabular-nums text-tori-400">{n}.</span>}
      <span className="text-[13px] font-extrabold text-slate-800">{titulo}</span>
    </div>
  )
}

function generarSKU(nombre: string): string {
  return nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.slice(0, 4).toUpperCase())
    .join('-')
}

const EJEMPLOS = [
  { nombre: 'Polera básica', precio_venta: 29.90, precio_compra: 12.00, stock_actual: 50, stock_minimo: 10, unidad: 'unidad' },
  { nombre: 'Polo manga larga', precio_venta: 39.90, precio_compra: 18.00, stock_actual: 30, stock_minimo: 5, unidad: 'unidad' },
  { nombre: 'Jeans', precio_venta: 59.90, precio_compra: 25.00, stock_actual: 20, stock_minimo: 5, unidad: 'unidad' },
  { nombre: 'Arroz 1kg', precio_venta: 4.50, precio_compra: 3.20, stock_actual: 100, stock_minimo: 20, unidad: 'kg' },
  { nombre: 'Aceite 1L', precio_venta: 9.90, precio_compra: 6.50, stock_actual: 40, stock_minimo: 10, unidad: 'L' },
  { nombre: 'Leche 1L', precio_venta: 5.50, precio_compra: 4.00, stock_actual: 60, stock_minimo: 12, unidad: 'L' },
]

export default function SeccionProductos({ userId, plan = 'basic' }: Props) {
  const confirmar = useConfirm()
  const supabase = createClient()
  const { startTour } = useOnboarding()
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<'activos' | 'archivados'>('activos')
  const [conteoActivos, setConteoActivos] = useState(0)
  const [conteoArchivados, setConteoArchivados] = useState(0)
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [insertandoEjemplos, setInsertandoEjemplos] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Producto>>({})
  const [stockOriginalEditando, setStockOriginalEditando] = useState<number | null>(null)
  const [motivoStock, setMotivoStock] = useState('')
  const [showNuevo, setShowNuevo] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [mostrarModalImprimir, setMostrarModalImprimir] = useState(false)
  const [imprimirProducto, setImprimirProducto] = useState<Producto | null>(null)
  const [modoEtiqueta, setModoEtiqueta] = useState<'A4' | 'INDIVIDUAL'>('A4')
  const [copiasEtiqueta, setCopiasEtiqueta] = useState(4)
  const [tamanoEtiqueta, setTamanoEtiqueta] = useState<TamanoEtiquetaProducto | null>(null)
  const [tamanoPersonalizado, setTamanoPersonalizado] = useState<TamanoEtiquetaProducto>({
    nombre: 'Personalizado',
    anchoMm: 40,
    altoMm: 30,
  })
  const [usarTamanoPersonalizado, setUsarTamanoPersonalizado] = useState(false)
  const [nuevaFoto, setNuevaFoto] = useState<FotoPendiente | null>(null)
  const [editFoto, setEditFoto] = useState<FotoPendiente | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [historialProducto, setHistorialProducto] = useState<Producto | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [nuevoForm, setNuevoForm] = useState({
    nombre: '',
    sku: '',
    precio_venta: 0,
    precio_compra: 0,
    stock_actual: 0,
    stock_minimo: 0,
    unidad: 'unidad',
  })
  const [tipoCreacion, setTipoCreacion] = useState<'individual' | 'variantes'>('individual')
  // Stock en 0 a propósito: el producto se registra primero y la compra se
  // carga después. Si arrancara en 1, cada variante sumaría una unidad que el
  // usuario nunca compró y el inventario quedaría inflado desde el primer día.
  const [variantes, setVariantes] = useState<{ nombre: string; cantidad: number; foto?: FotoPendiente }[]>([
    { nombre: '', cantidad: 0 },
  ])

  async function cargarConteos() {
    const [a, ar] = await Promise.all([
      fetch(`/api/productos?user_id=${userId}&archivado=false&limit=1`).then((r) => r.json()).catch(() => ({ total: 0 })),
      fetch(`/api/productos?user_id=${userId}&archivado=true&limit=1`).then((r) => r.json()).catch(() => ({ total: 0 })),
    ])
    setConteoActivos(a.total ?? 0)
    setConteoArchivados(ar.total ?? 0)
  }

  async function cargarProductos(offset = 0, append = false) {
    const params = new URLSearchParams({ user_id: userId, archivado: String(vista === 'archivados') })
    if (busquedaAplicada) params.set('busqueda', busquedaAplicada)
    params.set('offset', String(offset))
    const res = await fetch(`/api/productos?${params}`)
    const json = await res.json()
    if (res.ok) {
      setProductos((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []))
      setHasMore((json.offset + json.data.length) < json.total)
    }
    setLoading(false)
  }

  async function cargarProductosYConteos(offset = 0, append = false) {
    await cargarProductos(offset, append)
    cargarConteos()
  }

  // La búsqueda va con retardo: antes había que presionar Enter, y eso en un
  // celular es un paso extra. Con 350 ms se siente instantánea al teclear pero
  // no sale una petición por tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim())
      setLoading(true)
    }, busqueda ? 350 : 0)
    return () => clearTimeout(t)
  }, [busqueda])

  // Recarga cuando cambia el usuario, la búsqueda aplicada o la pestaña. La
  // búsqueda sola tiene su propio efecto con retardo, más arriba.
  useEffect(() => {
    cargarProductosYConteos()
  }, [userId, busquedaAplicada, vista])

  useEffect(() => {
    const limpiar = () => setImprimirProducto(null)
    window.addEventListener('afterprint', limpiar)
    return () => window.removeEventListener('afterprint', limpiar)
  }, [])

  async function cargarMas() {
    setCargandoMas(true)
    await cargarProductos(productos.length, true)
    setCargandoMas(false)
  }

  useEffect(() => {
    if (showNuevo && trayectoDone() && !tourDone('modal-nuevo-producto')) {
      const t = setTimeout(() => startTour('modal-nuevo-producto'), 400)
      return () => clearTimeout(t)
    }
  }, [showNuevo, startTour])

  async function escogerFoto(e: ChangeEvent<HTMLInputElement>, destino: 'nuevo' | 'editar') {
    const input = e.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const blob = await comprimirImagen(file)
      const foto: FotoPendiente = {
        blob,
        preview: URL.createObjectURL(blob),
        kb: Math.max(1, Math.round(blob.size / 1024)),
      }
      if (destino === 'nuevo') setNuevaFoto(foto)
      else setEditFoto(foto)
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo procesar la imagen.')
    }
  }

  function quitarFoto(destino: 'nuevo' | 'editar') {
    if (destino === 'nuevo' && nuevaFoto) {
      URL.revokeObjectURL(nuevaFoto.preview)
      setNuevaFoto(null)
    }
    if (destino === 'editar' && editFoto) {
      URL.revokeObjectURL(editFoto.preview)
      setEditFoto(null)
    }
  }

  // Sube la foto ya comprimida al bucket 'productos' y devuelve su URL pública
  async function subirFoto(foto: FotoPendiente): Promise<string> {
    const filePath = `${userId}/producto-${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('productos')
      .upload(filePath, foto.blob, { contentType: 'image/jpeg' })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('productos').getPublicUrl(filePath)
    return data.publicUrl
  }

  function iniciarEdicion(p: Producto) {
    setEditandoId(p.id)
    setEditForm({ ...p })
    setStockOriginalEditando(Number(p.stock_actual ?? 0))
    setMotivoStock('')
    setEditFoto(null)
  }

  async function abrirHistorial(p: Producto) {
    setHistorialProducto(p)
    setMovimientos([])
    setCargandoHistorial(true)
    try {
      const res = await fetch(`/api/productos/${p.id}/movimientos?user_id=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const json = await res.json()
        setMovimientos(json.data || [])
      } else {
        toast.error('Error al cargar el historial')
      }
    } catch {
      toast.error('Error al cargar el historial')
    } finally {
      setCargandoHistorial(false)
    }
  }

  async function guardarEdicion() {
    if (!editandoId) return
    const stockNuevo = Number(editForm.stock_actual ?? 0)
    const stockCambio = stockOriginalEditando !== null && stockNuevo !== stockOriginalEditando
    if (stockCambio && !motivoStock.trim()) {
      toast.error('Para ajustar el stock se requiere un motivo')
      return
    }
    let imagen_url = editForm.imagen_url ?? undefined

    if (editFoto) {
      setSubiendoFoto(true)
      try {
        imagen_url = await subirFoto(editFoto)
      } catch (err: any) {
        toast.error(err?.message || 'Error al subir la imagen')
        setSubiendoFoto(false)
        return
      }
      setSubiendoFoto(false)
    }

    const res = await fetch(`/api/productos/${editandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        ...(imagen_url ? { imagen_url } : {}),
        ...(stockCambio ? { motivo: motivoStock.trim() } : {}),
      }),
    })
    if (res.ok) {
      if (editFoto?.preview) URL.revokeObjectURL(editFoto.preview)
      setEditFoto(null)
      toast.success('Producto actualizado')
      setEditandoId(null)
      cargarProductosYConteos()
    } else {
      toast.error('Error al guardar')
    }
  }

  async function eliminarProducto(id: string, nombre: string) {
    if (!(await confirmar({ message: `¿Eliminar "${nombre}"?`, danger: true, confirmLabel: 'Sí, eliminar' }))) return
    const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Producto eliminado')
      cargarProductosYConteos()
    } else {
      toast.error('Error al eliminar')
    }
  }

  async function cambiarArchivo(ids: string[], archivado: boolean, mensajeExito: string) {
    const res = await fetch('/api/productos/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, archivado }),
    })
    if (res.ok) {
      toast.success(mensajeExito)
      setSeleccion(new Set())
      setModoSeleccion(false)
      cargarProductosYConteos()
    } else {
      toast.error('Error al actualizar')
    }
  }

  async function archivarProducto(p: Producto) {
    if (!(await confirmar({ message: `¿Archivar "${p.nombre}"?`, confirmLabel: 'Sí, archivar' }))) return
    cambiarArchivo([p.id], true, 'Producto archivado')
  }

  async function restaurarProducto(p: Producto) {
    cambiarArchivo([p.id], false, 'Producto restaurado')
  }

  async function archivarSeleccion() {
    const n = seleccion.size
    if (n === 0) return
    if (!(await confirmar({ message: `¿Archivar ${n} producto${n === 1 ? '' : 's'}?`, confirmLabel: `Sí, archivar ${n}` }))) return
    cambiarArchivo([...seleccion], true, `${n} producto${n === 1 ? '' : 's'} archivado${n === 1 ? '' : 's'}`)
  }

  async function restaurarSeleccion() {
    const n = seleccion.size
    if (n === 0) return
    cambiarArchivo([...seleccion], false, `${n} producto${n === 1 ? '' : 's'} restaurado${n === 1 ? '' : 's'}`)
  }

  function toggleSeleccion() {
    setModoSeleccion((m) => !m)
    setSeleccion(new Set())
    setEditandoId(null)
  }

  function toggleUno(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodos() {
    setSeleccion((prev) =>
      prev.size === productos.length ? new Set() : new Set(productos.map((p) => p.id))
    )
  }

  function cambiarVista(nueva: 'activos' | 'archivados') {
    if (nueva === vista) return
    setVista(nueva)
    setBusqueda('')
    setSeleccion(new Set())
    setModoSeleccion(false)
    setLoading(true)
  }

  async function crearProducto() {
    if (tipoCreacion === 'variantes') {
      const validas = variantes.filter((v) => v.nombre.trim())
      if (validas.length === 0) {
        toast.error('Añade al menos una variante')
        return
      }
      if (!nuevoForm.nombre.trim()) {
        toast.error('El nombre base es requerido')
        return
      }
    } else {
      if (!nuevoForm.nombre.trim()) {
        toast.error('El nombre es requerido')
        return
      }
    }

    let imagenUrl: string | undefined
    let rutaSubida: string | undefined

    if (nuevaFoto && tipoCreacion === 'individual') {
      setSubiendoFoto(true)
      try {
        imagenUrl = await subirFoto(nuevaFoto)
        rutaSubida = rutaDesdeUrlProducto(imagenUrl) ?? undefined
      } catch (err: any) {
        toast.error(err?.message || 'Error al subir la imagen')
        setSubiendoFoto(false)
        return
      }
      setSubiendoFoto(false)
    }

    if (tipoCreacion === 'variantes') {
      const validas = variantes.filter((v) => v.nombre.trim())
      let creados = 0
      let errorAlCrear = false

      for (const v of validas) {
        const nombreCompleto = `${nuevoForm.nombre.trim()} - ${v.nombre.trim()}`
        const sku = generarSKU(nombreCompleto)

        let imagenUrlVariante: string | undefined
        let rutaSubidaVariante: string | undefined
        if (v.foto) {
          try {
            imagenUrlVariante = await subirFoto(v.foto)
            rutaSubidaVariante = rutaDesdeUrlProducto(imagenUrlVariante) ?? undefined
          } catch (err: any) {
            toast.error(`Error subiendo foto de ${v.nombre}: ${err?.message}`)
            errorAlCrear = true
            continue
          }
        }

        const res = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombreCompleto,
            sku,
            precio_venta: nuevoForm.precio_venta,
            precio_compra: nuevoForm.precio_compra,
            stock_actual: v.cantidad,
            stock_minimo: nuevoForm.stock_minimo,
            unidad: nuevoForm.unidad,
            user_id: userId,
            ...(imagenUrlVariante ? { imagen_url: imagenUrlVariante } : {}),
          }),
        })

        if (res.ok) {
          creados++
          if (v.foto?.preview) URL.revokeObjectURL(v.foto.preview)
        } else {
          errorAlCrear = true
          if (rutaSubidaVariante) {
            try { await supabase.storage.from('productos').remove([rutaSubidaVariante]) } catch {}
          }
        }
      }

      variantes.forEach((v) => { if (v.foto?.preview) URL.revokeObjectURL(v.foto.preview) })
      if (nuevaFoto?.preview) URL.revokeObjectURL(nuevaFoto.preview)

      if (creados > 0) {
        toast.success(`${creados} producto${creados === 1 ? '' : 's'} creado${creados === 1 ? '' : 's'}`)
        setShowNuevo(false)
        setTipoCreacion('individual')
        setNuevoForm({ nombre: '', sku: '', precio_venta: 0, precio_compra: 0, stock_actual: 0, stock_minimo: 0, unidad: 'unidad' })
        setVariantes([{ nombre: '', cantidad: 0 }])
        setNuevaFoto(null)
        cargarProductosYConteos()
      } else if (errorAlCrear) {
        toast.error('Error al crear algunas variantes')
      }
      return
    }

    /* ===== MODO INDIVIDUAL (código original) ===== */
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nuevoForm, user_id: userId, ...(imagenUrl ? { imagen_url: imagenUrl } : {}) }),
    })
    if (res.ok) {
      if (nuevaFoto?.preview) URL.revokeObjectURL(nuevaFoto.preview)
      setNuevaFoto(null)
      toast.success('Producto creado')
      setShowNuevo(false)
      setNuevoForm({ nombre: '', sku: '', precio_venta: 0, precio_compra: 0, stock_actual: 0, stock_minimo: 0, unidad: 'unidad' })
      cargarProductosYConteos()
    } else {
      if (rutaSubida) {
        try { await supabase.storage.from('productos').remove([rutaSubida]) } catch {}
      }
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Límite alcanzado')
        openUpgrade()
        return
      }
      toast.error('Error al crear')
    }
  }

  async function insertarEjemplos() {
    setInsertandoEjemplos(true)
    for (const ej of EJEMPLOS) {
      await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ej, sku: generarSKU(ej.nombre), user_id: userId }),
      })
    }
    toast.success(`${EJEMPLOS.length} productos de ejemplo creados`)
    setInsertandoEjemplos(false)
    cargarProductosYConteos()
  }

  function SelectUnidad({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-sky-500 rounded px-2 py-1 text-sm focus:outline-none bg-white"
      >
        {UNIDADES_MEDIDA.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    )
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando productos...</div>

  // Valor del catálogo: qué dinero representa el stock que tienes parado.
  // Solo informa de lo que ya está comprado, no proyecta ventas.
  const valorVentaCatalogo = productos.reduce((s, p) => s + p.stock_actual * p.precio_venta, 0)
  const valorCompraCatalogo = productos.reduce((s, p) => s + p.stock_actual * p.precio_compra, 0)

  return (
    <div className="space-y-4">
      {/* Cabecera: mismo lenguaje que la página de ventas */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-tori-700 via-tori-600 to-tori-700 shadow-lg shadow-tori-700/20">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-tori-300/20 blur-3xl" aria-hidden />

        <div className="relative px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[1.5px] text-tori-200">
                Tu catálogo
              </p>
              <h2 className="mt-1 text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">
                {vista === 'archivados' ? 'Archivados' : 'Productos'}
              </h2>
              <p className="mt-1.5 text-[11px] leading-relaxed text-tori-100">
                {vista === 'archivados'
                  ? `${conteoArchivados} archivados. No aparecen al vender.`
                  : `${conteoActivos} ${conteoActivos === 1 ? 'producto' : 'productos'} en el catálogo.`}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {productos.length > 0 && !modoSeleccion && (
                <button
                  data-tour="productos-seleccionar"
                  onClick={toggleSeleccion}
                  className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/25"
                >
                  <CheckSquare size={15} /> Seleccionar
                </button>
              )}
              <button
                data-tour="productos-nuevo"
                onClick={() => setShowNuevo(true)}
                className="btn-shine flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-tori-700 transition-all hover:bg-tori-50 active:scale-[0.98]"
              >
                <Plus size={16} /> Nuevo producto
              </button>
            </div>
          </div>

          {/* Indicadores del catálogo */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <KpiCatalogo
              etiqueta="Productos"
              valor={String(conteoActivos)}
              ayuda={conteoArchivados > 0 ? `${conteoArchivados} archivados` : 'Activos'}
            />
            <KpiCatalogo
              etiqueta="Valor de venta"
              valor={fmtSoles(valorVentaCatalogo)}
              ayuda="Si vendieras todo el stock"
            />
            <KpiCatalogo
              etiqueta="Valor de compra"
              valor={fmtSoles(valorCompraCatalogo)}
              ayuda="Lo que te costó ese stock"
            />
            <KpiCatalogo
              etiqueta="Ganancia potencial"
              valor={fmtSoles(valorVentaCatalogo - valorCompraCatalogo)}
              ayuda={
                valorVentaCatalogo > 0
                  ? `${Math.round(((valorVentaCatalogo - valorCompraCatalogo) / valorVentaCatalogo) * 100)}% de margen`
                  : 'Carga precios para calcularla'
              }
              tono={
                valorVentaCatalogo - valorCompraCatalogo < 0 ? 'malo' : 'ok'
              }
            />
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-tori-100">
            <Info size={12} className="mt-px shrink-0" />
            El valor del catálogo se calcula con el stock actual y tus precios. Si vendes de a poco
            y repones, cambia.
          </p>
        </div>
      </section>

      {/* Buscador y vistas */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div data-tour="productos-buscar" className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              vista === 'archivados'
                ? 'Buscar en archivados...'
                : 'Buscar por nombre, color, talla o SKU...'
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-tori-400 focus:ring-[3px] focus:ring-tori-400/15"
          />
          {busquedaAplicada && (
            <button
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5">
          <button
            data-tour="productos-vista-activos"
            onClick={() => cambiarVista('activos')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all ${
              vista === 'activos'
                ? 'bg-tori-600 text-white shadow-md shadow-tori-600/25'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-tori-300 hover:text-tori-700'
            }`}
          >
            Activos
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                vista === 'activos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {conteoActivos}
            </span>
          </button>
          <button
            data-tour="productos-vista-archivados"
            onClick={() => cambiarVista('archivados')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all ${
              vista === 'archivados'
                ? 'bg-tori-600 text-white shadow-md shadow-tori-600/25'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-tori-300 hover:text-tori-700'
            }`}
          >
            Archivados
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                vista === 'archivados' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {conteoArchivados}
            </span>
          </button>
        </div>

        {productos.length === 0 && vista === 'activos' && (
          <button
            data-tour="productos-ejemplos"
            onClick={insertarEjemplos}
            disabled={insertandoEjemplos}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {insertandoEjemplos ? 'Insertando...' : 'Insertar ejemplos'}
          </button>
        )}
      </section>

      {modoSeleccion && (
        <div data-tour="productos-seleccion-bar" className="flex items-center gap-3 flex-wrap rounded-2xl border border-tori-200 bg-tori-50 px-4 py-3">
          <button
            onClick={toggleSeleccion}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            title="Salir del modo selección"
          >
            <X size={16} />
            <span>Cancelar</span>
          </button>
          <span className="text-sm font-semibold text-slate-700">{seleccion.size} seleccionado{seleccion.size === 1 ? '' : 's'}</span>
          {vista === 'activos' ? (
            <button
              onClick={archivarSeleccion}
              disabled={seleccion.size === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-all"
            >
              <Archive size={15} /> Archivar
            </button>
          ) : (
            <button
              onClick={restaurarSeleccion}
              disabled={seleccion.size === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              <ArchiveRestore size={15} /> Restaurar
            </button>
          )}
          <button
            onClick={toggleTodos}
            disabled={productos.length === 0}
            className="text-sm font-semibold text-sky-600 hover:text-sky-700 disabled:opacity-50 transition-colors"
          >
            {seleccion.size === productos.length && productos.length > 0 ? 'Quitar todos' : 'Todos'}
          </button>
        </div>
      )}

      {productos.length === 0 && !loading && (
        <div
          data-tour="productos-vacio"
          className="grid place-items-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center"
        >
          <div className="max-w-sm">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-tori-50 text-tori-500">
              {vista === 'archivados' ? <Archive size={28} /> : <Package size={28} />}
            </span>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
              {vista === 'archivados'
                ? 'Nada archivado'
                : busquedaAplicada
                  ? 'Ningún producto coincide'
                  : 'Tu catálogo está vacío'}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {vista === 'archivados'
                ? 'Los productos que archives aparecen aquí y puedes restaurarlos cuando quieras.'
                : busquedaAplicada
                  ? 'Prueba con otro término. Puedes buscar por nombre, color, talla o SKU.'
                  : 'Agrega tu primer producto y registra la compra desde la pestaña Compras. El stock empieza en 0.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {busquedaAplicada && (
                <button
                  onClick={() => setBusqueda('')}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Limpiar búsqueda
                </button>
              )}
              {vista === 'activos' && !busquedaAplicada && (
                <>
                  <button
                    onClick={() => setShowNuevo(true)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-tori-600 to-tori-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-tori-600/25 transition-all hover:shadow-xl"
                  >
                    <Plus size={16} /> Nuevo producto
                  </button>
                  <button
                    onClick={insertarEjemplos}
                    disabled={insertandoEjemplos}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    {insertandoEjemplos ? 'Insertando...' : 'Insertar ejemplos'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {productos.length > 0 && (
        <div data-tour="productos-tabla" className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {modoSeleccion && (
                  <th className="w-10 px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={productos.length > 0 && seleccion.size === productos.length}
                      onChange={toggleTodos}
                      className="h-4 w-4 cursor-pointer accent-tori-600"
                      title="Seleccionar todos"
                    />
                  </th>
                )}
                {/* La columna del nombre necesita ancho propio. Sin esto el navegador la
                    reparte entre las otras 8 y "CONJUNTO VISCOSA L - ARENA"
                    se partia justo donde ya no se leia. */}
                <th className="w-[30%] px-5 py-3.5 text-left">Producto</th>
                <th className="px-3 py-3.5 text-left">SKU</th>
                <th className="px-3 py-3.5 text-right">Stock</th>
                <th className="px-3 py-3.5 text-right">P. venta</th>
                <th className="px-3 py-3.5 text-right">P. compra</th>
                <th className="px-3 py-3.5 text-right">Ganancia</th>
                <th className="px-3 py-3.5 text-left">Und</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => {
                const editando = editandoId === p.id
                const bajoStock = p.stock_actual <= p.stock_minimo && p.stock_minimo > 0
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer transition-colors hover:bg-tori-50/40 ${bajoStock ? 'bg-red-50/60' : ''}`}
                    onClick={modoSeleccion ? () => toggleUno(p.id) : undefined}
                  >
                    {modoSeleccion && (
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={seleccion.has(p.id)}
                          onChange={() => toggleUno(p.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 cursor-pointer accent-tori-600"
                        />
                      </td>
                    )}
                    <td className="px-5 py-3.5 align-top">
                      {editando ? (
                        <div className="flex items-center gap-2">
                          <label
                            className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                            title="Cambiar foto"
                          >
                            {editFoto ? (
                              <img src={editFoto.preview} alt="Nueva foto" className="w-full h-full object-cover" />
                            ) : editForm.imagen_url ? (
                              <img src={editForm.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center bg-slate-100 text-xs font-bold text-slate-400">
                                {(editForm.nombre || p.nombre).charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-sky-600 flex items-center justify-center border border-white">
                              <Pencil size={8} className="text-white" />
                            </span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => escogerFoto(e, 'editar')} />
                          </label>
                          <input
                            value={editForm.nombre || ''}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value, sku: generarSKU(e.target.value) })}
                            className="flex-1 min-w-0 px-2 py-1 rounded border border-sky-500 text-sm focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2.5">
                            {p.imagen_url ? (
                              <PreviewImagenProducto src={p.imagen_url} alt={p.nombre} />
                            ) : (
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">
                                {p.nombre.charAt(0).toUpperCase()}
                              </span>
                            )}
                            {/* El nombre se envuelve SIN recortar. Un line-clamp o un truncate
                    dejaban fuera el final ("... VISCOSA L - AR...") y el
                    nombre completo es justo lo que hace falta para
                    distinguir dos productos parecidos. break-words evita que
                    una cadena sin espacios desborde la celda. */}
                            <span
                              title={p.nombre}
                              className="block break-words text-sm font-bold leading-snug text-slate-900"
                            >
                              {p.nombre}
                            </span>
                          </div>
                          {bajoStock && (
                            <span className="mt-0.5 block pl-0.5 text-[10px] font-bold text-red-500">
                              Stock bajo (mín {p.stock_minimo})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-400">
                      {editando ? (
                        <input
                          value={editForm.sku || ''}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                          className="w-24 rounded-lg border border-tori-400 px-2 py-1 font-mono text-xs outline-none"
                        />
                      ) : (
                        <span className="font-mono">{p.sku || '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      {editando ? (
                        <div className="flex flex-col items-end gap-1">
                          {stockOriginalEditando !== null && Number(editForm.stock_actual ?? 0) !== stockOriginalEditando && (
                            <input
                              value={motivoStock}
                              onChange={(e) => setMotivoStock(e.target.value)}
                              placeholder="Motivo del ajuste"
                              className="w-44 rounded-lg border border-warning-300 px-2 py-1 text-xs placeholder:text-slate-400 outline-none"
                            />
                          )}
                          <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            type="text"
                            value={String(editForm.stock_actual ?? 0)}
                            onChange={(e) => setEditForm({ ...editForm, stock_actual: parseInt(e.target.value, 10) || 0 })}
                            className="w-20 rounded-lg border border-tori-400 px-2 py-1 text-right text-sm font-bold tabular-nums outline-none"
                          />
                        </div>
                      ) : (
                        <span
                          className={`text-sm font-extrabold tabular-nums ${bajoStock ? 'text-red-600' : 'text-slate-900'}`}
                        >
                          {p.stock_actual}
                        </span>
                      )}
                      {p.stock_minimo > 0 && (
                        <span className="mt-0.5 block text-[10px] tabular-nums text-slate-400">
                          mín {p.stock_minimo}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      {editando ? (
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          type="text"
                          value={String(editForm.precio_venta ?? 0)}
                          onChange={(e) => setEditForm({ ...editForm, precio_venta: parseFloat(e.target.value) || 0 })}
                          className="w-24 rounded-lg border border-tori-400 px-2 py-1 text-right text-sm font-bold tabular-nums outline-none"
                        />
                      ) : (
                        <span className="text-sm font-bold tabular-nums text-slate-900">
                          {fmtSoles(p.precio_venta)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      {editando ? (
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          type="text"
                          value={String(editForm.precio_compra ?? 0)}
                          onChange={(e) => setEditForm({ ...editForm, precio_compra: parseFloat(e.target.value) || 0 })}
                          className="w-24 rounded-lg border border-tori-400 px-2 py-1 text-right text-sm font-bold tabular-nums outline-none"
                        />
                      ) : (
                        <span className="text-sm font-bold tabular-nums text-slate-500">
                          {fmtSoles(p.precio_compra)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      {editando ? (
                        <span className="text-[11px] text-slate-400">—</span>
                      ) : (
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            p.precio_venta - p.precio_compra >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {fmtSoles(p.precio_venta - p.precio_compra)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-left">
                      {editando ? (
                        <SelectUnidad value={editForm.unidad || 'unidad'} onChange={(v) => setEditForm({ ...editForm, unidad: v })} />
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
                          {p.unidad}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {editando ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={guardarEdicion} disabled={subiendoFoto} className="grid h-8 w-8 place-items-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50" title="Guardar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => { setEditandoId(null); if (editFoto) { URL.revokeObjectURL(editFoto.preview); setEditFoto(null) } }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      ) : modoSeleccion ? (
                        <span className="inline-block w-6" />
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {vista === 'archivados' ? (
                            <BotonFila
                              icono={ArchiveRestore}
                              titulo="Restaurar"
                              hover="hover:bg-emerald-50 hover:text-emerald-600"
                              onClick={() => restaurarProducto(p)}
                            />
                          ) : (
                            <BotonFila
                              icono={Archive}
                              titulo="Archivar"
                              onClick={() => archivarProducto(p)}
                            />
                          )}
                          <BotonFila
                            icono={Printer}
                            titulo={
                              planNivel(plan) < 1
                                ? 'Disponible en Pro y Business Plus'
                                : 'Imprimir etiqueta'
                            }
                            onClick={() => {
                              if (planNivel(plan) < 1) {
                                openUpgrade()
                                return
                              }
                              setImprimirProducto(p)
                              setMostrarModalImprimir(true)
                            }}
                          />
                          <BotonFila
                            icono={History}
                            titulo="Historial de movimientos"
                            hover="hover:bg-violet-50 hover:text-violet-600"
                            onClick={() => abrirHistorial(p)}
                          />
                          <BotonFila icono={Pencil} titulo="Editar" onClick={() => iniciarEdicion(p)} />
                          <BotonFila
                            icono={Trash2}
                            titulo="Eliminar"
                            hover="hover:bg-red-50 hover:text-red-600"
                            onClick={() => eliminarProducto(p.id, p.nombre)}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={cargarMas}
            disabled={cargandoMas}
            className="px-5 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {cargandoMas ? 'Cargando...' : 'Cargar más productos'}
          </button>
        </div>
      )}

      {historialProducto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setHistorialProducto(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-snug text-slate-900 break-words">
                  {historialProducto.nombre}
                </h3>
                <p className="text-xs text-slate-500">
                  Historial de movimientos · Stock actual: <span className="font-semibold text-slate-700">{historialProducto.stock_actual}</span>
                </p>
              </div>
              <button onClick={() => setHistorialProducto(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cargandoHistorial ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-400">Cargando historial...</div>
              ) : movimientos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <History size={32} strokeWidth={1.5} className="mb-2 opacity-60" />
                  <p className="text-sm">Sin movimientos registrados.</p>
                  <p className="text-xs mt-1">El kardex registra movimientos desde su implementación.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {movimientos.map((m) => (
                    <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            m.cantidad > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : m.tipo === 'AJUSTE' && m.cantidad < 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{m.tipo.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(m.created_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {m.motivo && <p className="text-xs text-slate-500 mt-0.5">Motivo: <span className="text-slate-600">{m.motivo}</span></p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400">saldo</p>
                        <p className="text-sm font-mono text-slate-700">
                          <span className="text-slate-400">{m.saldo_antes}</span> → <span className="font-semibold">{m.saldo_despues}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showNuevo && (
        // Alto acotado: sin max-h ni overflow el panel crecia con cada variante
        // hasta salirse de la pantalla y los botones quedaban inalcanzables. El
        // cuerpo es lo unico que scrollea y el pie queda siempre visible.
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => { setShowNuevo(false); quitarFoto('nuevo') }}>
            <div
              className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Nuevo producto"
            >
              {/* Cabecera: mismo lenguaje que el modal de venta nueva */}
              <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-tori-700 to-tori-600 px-6 py-5">
                <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[1.5px] text-tori-200">
                      Catálogo
                    </p>
                    <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
                      Nuevo producto
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TourHelpButton
                      tourId="modal-nuevo-producto"
                      className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                    />
                    <button
                      onClick={() => { setShowNuevo(false); quitarFoto('nuevo') }}
                      aria-label="Cerrar"
                      className="grid h-9 w-9 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* Selector de tipo de creación */}
              <div>
                <EtiquetaModal icono={Boxes} titulo="¿Cómo lo vas a crear?" />
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTipoCreacion('individual')}
                    className={`rounded-[15px] border p-3.5 text-left transition-all ${
                      tipoCreacion === 'individual'
                        ? 'border-tori-400 bg-tori-50 ring-2 ring-tori-400/20'
                        : 'border-slate-200 hover:border-tori-300'
                    }`}
                  >
                    <span className="block text-[12.5px] font-extrabold text-slate-800">
                      Un solo producto
                    </span>
                    <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">
                      Para una prenda o un artículo con una sola versión.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCreacion('variantes')}
                    className={`rounded-[15px] border p-3.5 text-left transition-all ${
                      tipoCreacion === 'variantes'
                        ? 'border-tori-400 bg-tori-50 ring-2 ring-tori-400/20'
                        : 'border-slate-200 hover:border-tori-300'
                    }`}
                  >
                    <span className="block text-[12.5px] font-extrabold text-slate-800">
                      Serie con variantes
                    </span>
                    <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">
                      Crea un producto por color o talla, de una sola vez.
                    </span>
                  </button>
                </div>
              </div>

              {/* ============ CAMPOS SEGÚN TIPO ============ */}
              {tipoCreacion === 'individual' ? (
                /* ============ FORMULARIO INDIVIDUAL ============ */
                <div className="space-y-4">
                  <EtiquetaModal icono={Package} titulo="Identificación" />
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
                    <div data-tour="nuevo-producto-nombre">
                    <input
                      value={nuevoForm.nombre}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value, sku: generarSKU(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      placeholder="Ej: Polera básica"
                    />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</label>
                    <input
                      value={nuevoForm.sku}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, sku: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      placeholder="Se genera automáticamente"
                    />
                  </div>
                </div>
              ) : (
                /* ============ SERIE CON VARIANTES ============ */
                <div className="space-y-4">
                  <EtiquetaModal icono={Boxes} titulo="Nombre base" />
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre base</label>
                    <div data-tour="nuevo-producto-nombre-base">
                    <input
                      value={nuevoForm.nombre}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      placeholder="Ej: Buzo Carla L"
                    />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">Se creará un producto por variante: "Buzo Carla L - AMARILLO", "Buzo Carla L - VERDE"...</p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variantes</label>
                      <span className="text-[11px] tabular-nums text-slate-400">
                        {variantes.length}
                      </span>
                    </div>
                    <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
                      El stock arranca en 0. Cuando registres la compra, el stock se suma solo
                      desde Compras.
                    </p>
                    {/* Scrollean ellas solas: con 20 variantes el modal no crece
                        de forma infinita, y el campo "nombre base" de arriba
                        sigue a la vista. */}
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {variantes.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer border border-slate-200" onClick={() => document.getElementById(`foto-variante-${i}`)?.click()} title="Foto de la variante">
                            {v.foto ? (
                              <img src={v.foto.preview} alt="Variante" className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                <Camera size={20} />
                              </span>
                            )}
                            <input id={`foto-variante-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              comprimirImagen(file).then((blob) => {
                                if (v.foto?.preview) URL.revokeObjectURL(v.foto.preview)
                                const nv = [...variantes]
                                nv[i] = { ...nv[i], foto: { blob, preview: URL.createObjectURL(blob), kb: Math.max(1, Math.round(blob.size / 1024)) } }
                                setVariantes(nv)
                              })
                            }} />
                          </div>
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <input
                              type="text"
                              value={v.nombre}
                              onChange={(e) => {
                                const nv = [...variantes]
                                nv[i] = { ...nv[i], nombre: e.target.value }
                                setVariantes(nv)
                              }}
                              placeholder={i === 0 ? 'Color / Talla (ej: AMARILLO)' : 'Color / Talla'}
                              className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                            />
                            <input
                              type="number"
                              min={0}
                              value={v.cantidad}
                              onChange={(e) => {
                                const nv = [...variantes]
                                // Ojo: con `|| 1` un 0 se volvía 1, porque en
                                // JavaScript `0 || 1` vale 1. El stock arranca
                                // en 0 y tiene que poder quedarse en 0.
                                nv[i] = { ...nv[i], cantidad: Math.max(0, parseInt(e.target.value, 10) || 0) }
                                setVariantes(nv)
                              }}
                              className="w-20 px-3 py-2 rounded-lg border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                            />
                            <span className="text-[11px] text-slate-400">uds</span>
                          </div>
                          {variantes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (v.foto?.preview) URL.revokeObjectURL(v.foto.preview)
                                setVariantes(variantes.filter((_, idx) => idx !== i))
                              }}
                              className="text-red-500 hover:text-red-600 p-1"
                              title="Eliminar variante"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVariantes([...variantes, { nombre: '', cantidad: 0 }])}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 py-2"
                      >
                        <Plus size={16} /> Añadir variante
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* ============ CAMPOS COMUNES (FOTO solo individual, STOCK, PRECIOS, UNIDAD) ============ */}
            <div className="mt-5 space-y-4">
              {tipoCreacion === 'individual' && (
                <div>
                <EtiquetaModal icono={Camera} titulo="Foto del producto" />
                <div className="mt-2.5 flex items-center gap-3">
                  <label
                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer ${
                      nuevaFoto
                        ? 'ring-2 ring-sky-500/50'
                        : 'border-2 border-dashed border-slate-300 hover:border-sky-400 bg-slate-50 transition-colors flex items-center justify-center'
                    }`}
                    title={nuevaFoto ? 'Cambiar foto' : 'Elegir foto'}
                  >
                    {nuevaFoto ? (
                      <img src={nuevaFoto.preview} alt="Vista previa" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={20} className="text-slate-400" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => escogerFoto(e, 'nuevo')} />
                  </label>
                  <div className="flex-1 min-w-0">
                    {nuevaFoto ? (
                      <>
                        <p className="text-[11px] font-semibold text-emerald-600">Comprimida: {nuevaFoto.kb} KB</p>
                        <button
                          onClick={() => quitarFoto('nuevo')}
                          className="mt-1 text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                        >
                          Quitar foto
                        </button>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400">JPG o PNG. Se comprime automáticamente para ahorrar espacio.</p>
                    )}
                  </div>
                </div>
              </div>
              )}

              <div>
                <EtiquetaModal icono={Boxes} titulo="Stock" />
                <div data-tour="nuevo-producto-stock" className="mt-2.5 grid grid-cols-2 gap-3">
                <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.stock_actual || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, stock_actual: parseInt(e.target.value, 10) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock mín.</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.stock_minimo || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, stock_minimo: parseInt(e.target.value, 10) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
                </div>
              </div>

              <div>
               <EtiquetaModal icono={Tag} titulo="Precios" />
                <div data-tour="nuevo-producto-precios" className="mt-2.5 grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio venta (S/)</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.precio_venta || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, precio_venta: parseFloat(e.target.value) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio compra (S/)</label>
                   <input
                     inputMode="numeric"
                     pattern="[0-9]*"
                     type="text"
                     value={nuevoForm.precio_compra || ''}
                     onChange={(e) => setNuevoForm({ ...nuevoForm, precio_compra: parseFloat(e.target.value) || 0 })}
                     className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                   />
                 </div>
</div>

                <div className="mt-2.5">
                  {planNivel(plan) < 1 ? (
                    <button
                      onClick={openUpgrade}
                      className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center justify-between bg-slate-50 text-slate-500 border border-dashed border-slate-300 hover:border-sky-300 transition-colors"
                     title="Disponible en Pro y Business Plus"
                   >
                     <span className="flex items-center gap-2">
                       <Lock size={14} className="text-slate-400" />
                       Ganancia por venta
                     </span>
                     <span className="text-xs font-semibold text-sky-600">Ver planes</span>
                   </button>
                 ) : (
                  (() => {
                   const ganancia = nuevoForm.precio_venta - nuevoForm.precio_compra
                   const pct = nuevoForm.precio_venta > 0 ? (ganancia / nuevoForm.precio_venta) * 100 : 0
                   const positivo = nuevoForm.precio_venta > 0 && ganancia >= 0
                   const sinDatos = nuevoForm.precio_venta <= 0 && nuevoForm.precio_compra <= 0
                   return (
                     <div className={`rounded-xl px-3 py-2.5 text-sm font-semibold flex items-center justify-between ${
                       sinDatos
                         ? 'bg-slate-50 text-slate-400'
                         : positivo
                         ? 'bg-emerald-50 text-emerald-700'
                         : 'bg-red-50 text-red-600'
                     }`}>
                       <span>Ganancia</span>
                       <span>
                         {sinDatos
                           ? '—'
                           : `S/ ${ganancia.toFixed(2)} · ${pct.toFixed(0)}%`}
                       </span>
                     </div>
                   )
                  })()
                 )}
               </div>
              <EtiquetaModal icono={Tag} titulo="Unidad de medida" />
              <select
                value={nuevoForm.unidad}
                onChange={(e) => setNuevoForm({ ...nuevoForm, unidad: e.target.value })}
                className="mt-2.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-tori-400 focus:bg-white"
              >
                {UNIDADES_MEDIDA.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              </div>
              </div>
              {/* Pie fijo: los botones quedan siempre visibles, por muchas
                  variantes que se agreguen. */}
              <div className="flex shrink-0 gap-2.5 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <button
                  onClick={() => { setShowNuevo(false); quitarFoto('nuevo'); variantes.forEach(v => { if (v.foto?.preview) URL.revokeObjectURL(v.foto.preview) }) }}
                  className="h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  data-tour="nuevo-producto-crear"
                  onClick={crearProducto}
                  disabled={subiendoFoto}
                  className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-tori-600 to-tori-700 text-sm font-extrabold text-white shadow-lg shadow-tori-600/30 transition-all hover:shadow-xl disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                >
                  {subiendoFoto ? 'Subiendo foto...' : 'Crear producto'}
                </button>
</div>
              </div>
            </div>
          </div>
      )}

      {mostrarModalImprimir && imprimirProducto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setMostrarModalImprimir(false); setImprimirProducto(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Imprimir etiqueta</h3>
              <button onClick={() => { setMostrarModalImprimir(false); setImprimirProducto(null) }} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div>
              <div className="break-words rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
                {imprimirProducto.nombre}
              </div>
              {imprimirProducto.sku && (
                <div className="mt-1 text-xs font-mono text-slate-400 px-3">
                  {imprimirProducto.sku}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Formato de impresión</label>
              <div className="mt-2 space-y-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    modoEtiqueta === 'A4' ? 'border-sky-500 bg-sky-50/60' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={modoEtiqueta === 'A4'}
                    onChange={() => setModoEtiqueta('A4')}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">Hoja A4</div>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
                      Etiquetas por hoja:
                      <select
                        value={copiasEtiqueta}
                        onChange={(e) => setCopiasEtiqueta(Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      >
                        {COPIAS_A4_OPCIONES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {copiasEtiqueta} {copiasEtiqueta === 1 ? 'etiqueta' : 'etiquetas'} en una sola hoja A4.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    modoEtiqueta === 'INDIVIDUAL'
                      ? 'border-sky-500 bg-sky-50/60'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={modoEtiqueta === 'INDIVIDUAL'}
                    onChange={() => setModoEtiqueta('INDIVIDUAL')}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">Etiqueta individual</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      Tamaño de papel:
                      <select
                        value={
                          usarTamanoPersonalizado
                            ? 'personalizado'
                            : tamanoEtiqueta
                            ? `${tamanoEtiqueta.anchoMm}x${tamanoEtiqueta.altoMm}`
                            : 'completa'
                        }
                        onChange={(e) => {
                          if (e.target.value === 'completa') {
                            setTamanoEtiqueta(null)
                            setUsarTamanoPersonalizado(false)
                            return
                          }
                          if (e.target.value === 'personalizado') {
                            setUsarTamanoPersonalizado(true)
                            setTamanoEtiqueta(tamanoPersonalizado)
                            return
                          }
                          const t = TAMANOS_ETIQUETA_PRODUCTO.find(
                            (t) => `${t.anchoMm}x${t.altoMm}` === e.target.value
                          )
                          if (t) {
                            setTamanoEtiqueta(t)
                            setUsarTamanoPersonalizado(false)
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      >
                        <option value="completa">Página completa (según impresora)</option>
                        {TAMANOS_ETIQUETA_PRODUCTO.map((t) => (
                          <option key={`${t.anchoMm}x${t.altoMm}`} value={`${t.anchoMm}x${t.altoMm}`}>
                            {t.nombre}
                          </option>
                        ))}
                        <option value="personalizado">Personalizado...</option>
                      </select>
                    </div>

                    {usarTamanoPersonalizado && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Ancho
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={297}
                          value={tamanoPersonalizado.anchoMm}
                          onChange={(e) => {
                            const v = Math.min(297, Math.max(1, Number(e.target.value) || 1))
                            const nuevo = { ...tamanoPersonalizado, anchoMm: v }
                            setTamanoPersonalizado(nuevo)
                            setTamanoEtiqueta(nuevo)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        />
                        <span>mm</span>
                        <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Alto
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={297}
                          value={tamanoPersonalizado.altoMm}
                          onChange={(e) => {
                            const v = Math.min(297, Math.max(1, Number(e.target.value) || 1))
                            const nuevo = { ...tamanoPersonalizado, altoMm: v }
                            setTamanoPersonalizado(nuevo)
                            setTamanoEtiqueta(nuevo)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        />
                        <span>mm</span>
                      </div>
                    )}

                    <div className="mt-1 text-xs text-slate-400">
                      Elige un tamaño predefinido o escribe medidas personalizadas (ej. 15 × 30 mm). El QR y el texto se escalan para que todo quepa; usa el mismo tamaño en tu impresora.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setMostrarModalImprimir(false); setImprimirProducto(null) }} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setMostrarModalImprimir(false)
                  setTimeout(() => {
                    window.print()
                  }, 300)
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {imprimirProducto && (
        <EtiquetasProducto
          productos={[imprimirProducto]}
          modo={modoEtiqueta}
          copias={copiasEtiqueta}
          tamano={tamanoEtiqueta}
        />
      )}
    </div>
  )
}
