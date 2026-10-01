'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus,
  Search,
  X,
  Eye,
  Check,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Copy,
  Inbox,
  Wallet,
  Receipt,
  Package,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import type { Venta } from '@/types/inventario'
import ModalDetalleVenta from '@/components/ModalDetalleVenta'
import ModalNuevaVenta from '@/components/ModalNuevaVenta'
import ItemsVentaConBurbuja from '@/components/ItemsVentaConBurbuja'
import { useConfirm } from '@/components/ConfirmDialog'
import { fmtSoles, fmtMontoCorto } from '@/lib/format'
import { planNivel } from '@/lib/planGating'
import {
  FILTROS,
  TONO_BADGE,
  TONO_PUNTO,
  etiquetaEstado,
  tonoEstado,
  etiquetaEnvio,
  tonoEnvio,
  etiquetaPago,
  tonoPago,
  resumenVenta,
  fechaVenta,
  subtotalItem,
  type Tono,
  type ResumenVentas,
} from '@/lib/ventasUI'

type Props = { userId: string; plan?: string }

// La forma del resumen la define el motor, no esta copia: si se duplica
// aquí, se desincroniza en silencio la próxima vez que se agregue una cifra.
type Resumen = ResumenVentas

const PAGE_SIZE = 20

export default function SeccionVentas({ userId, plan = 'basic' }: Props) {
  const confirmar = useConfirm()
  const muestraGanancia = planNivel(plan) >= 1

  const [ventas, setVentas] = useState<Venta[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [navegando, setNavegando] = useState(false)

  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)
  const [itemsAbiertos, setItemsAbiertos] = useState<string | null>(null)
  const [showNueva, setShowNueva] = useState(false)

  const ultimoFetchRef = useRef(0)

  /* ------------------------------------------------------------------ */
  /* Datos                                                               */
  /* ------------------------------------------------------------------ */

  const cargarVentas = useCallback(
    async (page = 0) => {
      ultimoFetchRef.current = Date.now()
      const params = new URLSearchParams({ user_id: userId, resumen: '1' })
      if (filtroEstado) params.set('estado', filtroEstado)
      if (busqueda.trim()) params.set('busqueda', busqueda.trim())
      params.set('offset', String(page * PAGE_SIZE))
      params.set('limit', String(PAGE_SIZE))

      const res = await fetch(`/api/ventas?${params}`)
      if (!res.ok) {
        setLoading(false)
        return
      }
      const json = await res.json()
      setVentas(json.data || [])
      setTotalRegistros(json.total ?? 0)
      setResumen(json.resumen ?? null)
      setLoading(false)
    },
    [userId, filtroEstado, busqueda]
  )

  // La búsqueda espera a que dejes de escribir. Sin esto, cada tecla dispara un
  // fetch con un ilike%termino% que la base no puede cachear.
  useEffect(() => {
    const t = setTimeout(() => {
      setPagina(0)
      setLoading(true)
      cargarVentas(0)
    }, busqueda ? 300 : 0)
    return () => clearTimeout(t)
  }, [cargarVentas, busqueda])

  // Realtime: si otra sesión registra o edita una venta, la lista se actualiza.
  // Se omite si acabamos de hacer un fetch, para no recargar dos veces por la
  // propia acción del usuario.
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const recarga = () => {
      if (Date.now() - ultimoFetchRef.current < 1500) return
      cargarVentas(0)
    }
    const canal = supabase
      .channel('ventas-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ventas' }, recarga)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ventas' }, recarga)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ventas' }, recarga)
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [userId, cargarVentas])

  const irAPagina = async (page: number) => {
    setNavegando(true)
    setLoading(true)
    await cargarVentas(page)
    setPagina(page)
    setNavegando(false)
  }

  /* ------------------------------------------------------------------ */
  /* Acciones                                                            */
  /* ------------------------------------------------------------------ */

  async function anularVenta(venta: Venta) {
    const ok = await confirmar({
      title: 'Anular la venta',
      message: `Se anulará la venta de ${venta.persona_nombre} y se restaurará el stock.`,
      confirmLabel: 'Sí, anular',
      danger: true,
    })
    if (!ok) return
    const res = await fetch(`/api/ventas/${venta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'ANULADA' }),
    })
    if (res.ok) {
      toast.success('Venta anulada')
      cargarVentas(0)
    } else {
      toast.error('No se pudo anular la venta')
    }
  }

  async function confirmarVenta(venta: Venta) {
    const ok = await confirmar({
      title: 'Confirmar el pago',
      message: `Se marcará como completada la venta de ${venta.persona_nombre} por ${fmtSoles(venta.total)}.`,
      confirmLabel: 'Sí, ya cobré',
    })
    if (!ok) return
    const res = await fetch(`/api/ventas/${venta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'COMPLETADA' }),
    })
    if (res.ok) {
      toast.success('Venta completada')
      cargarVentas(0)
    } else {
      toast.error('No se pudo completar la venta')
    }
  }

  async function eliminarVenta(venta: Venta) {
    const ok = await confirmar({
      title: 'Eliminar la venta',
      message: `Se eliminará para siempre la venta de ${venta.persona_nombre} por ${fmtSoles(venta.total)}. No se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      danger: true,
    })
    if (!ok) return
    const res = await fetch(`/api/ventas/${venta.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Venta eliminada')
      cargarVentas(0)
    } else {
      toast.error('No se pudo eliminar')
    }
  }

  /* ------------------------------------------------------------------ */

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / PAGE_SIZE))
  const hayFiltro = Boolean(filtroEstado) || Boolean(busqueda.trim())

  // Cifras que se usan en más de un punto de la vista.
  const porCobrar = resumen?.porCobrar ?? 0

  const conteo = (valor: string) => {
    if (!resumen) return null
    if (valor === '') return (resumen.porEstado.COMPLETADA ?? 0) + (resumen.porEstado.PENDIENTE ?? 0) + (resumen.porEstado.ANULADA ?? 0)
    return resumen.porEstado[valor] ?? 0
  }

  if (loading && ventas.length === 0) return <Esqueleto />

  return (
    <div className="space-y-4">
      {/* =================================================================
          FRANJA SUPERIOR: la primera versión, sin tocar
          ================================================================= */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-tori-700 via-tori-600 to-tori-700 shadow-lg shadow-tori-700/20">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-tori-300/20 blur-3xl" aria-hidden />

        <div className="relative px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[1.5px] text-tori-200">
                Tus ventas
              </p>
              <h2 className="mt-1 text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">
                Vendido
                {resumen ? ` ${fmtMontoCorto(resumen.monto, true)}` : ''}
              </h2>
              <p className="mt-1.5 text-[11px] leading-relaxed text-tori-100">
                {hayFiltro
                  ? 'Cifras de lo que estás viendo ahora, no del total.'
                  : 'Todo lo que has facturado, sin contar ventas anuladas.'}
              </p>
            </div>

            <button
              data-tour="ventas-nueva"
              onClick={() => setShowNueva(true)}
              className="btn-shine flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-tori-700 shadow-lg shadow-black/10 transition-all hover:shadow-xl hover:shadow-black/15 active:scale-[0.98]"
            >
              <Plus size={17} /> Nueva venta
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Kpi
              icono={Wallet}
              etiqueta="Facturado"
              valor={fmtSoles(resumen?.monto ?? 0)}
              ayuda={resumen ? `${resumen.ventas} ventas` : 'Cargando'}
            />
            <Kpi
              icono={Receipt}
              etiqueta="Por cobrar"
              valor={fmtSoles(resumen?.porCobrar ?? 0)}
              ayuda={porCobrar > 0 ? 'Te falta cobrar esto' : 'Todo cobrado'}
              destacado={porCobrar > 0}
            />
            <Kpi
              icono={Package}
              etiqueta="Ventas"
              valor={fmtMontoCorto(resumen?.ventas ?? 0, true)}
              ayuda={resumen ? `${resumen.porEstado.PENDIENTE ?? 0} pendientes` : 'Cargando'}
            />
            <Kpi
              icono={TrendingUp}
              etiqueta="Ticket promedio"
              valor={fmtSoles(resumen?.ticketPromedio ?? 0)}
              ayuda="Por venta"
            />
          </div>

          {resumen?.truncado && (
            <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[10.5px] leading-relaxed text-tori-50">
              <AlertTriangle size={13} className="mt-px shrink-0" />
              Tienes más de 5.000 ventas, así que estas cifras consideran las más
              recientes.
            </p>
          )}
        </div>
      </section>

      {/* =================================================================
          BUSCADOR Y FILTROS
          ================================================================= */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, DNI, teléfono, producto, pago o estado…"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-tori-400 focus:ring-[3px] focus:ring-tori-400/15"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div data-tour="ventas-filtros" className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTROS.map((f) => {
            const activo = filtroEstado === f.valor
            const n = conteo(f.valor)
            return (
              <button
                key={f.valor || 'todas'}
                onClick={() => {
                  setFiltroEstado(f.valor)
                  setPagina(0)
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all ${
                  activo
                    ? 'bg-tori-600 text-white shadow-md shadow-tori-600/25'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-tori-300 hover:text-tori-700'
                }`}
              >
                {f.etiqueta}
                {n != null && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                      activo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* =================================================================
          LISTA
          ================================================================= */}
      {ventas.length === 0 ? (
        <Vacio hayFiltro={hayFiltro} onLimpiar={() => { setFiltroEstado(''); setBusqueda('') }} onNueva={() => setShowNueva(true)} />
      ) : (
        <>
          {/* --- Escritorio: tabla --- */}
          <div
            data-tour="ventas-tabla"
            className="hidden overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm lg:block"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5 text-left">Cliente</th>
                  <th className="px-3 py-3.5 text-left">Contacto</th>
                  <th className="px-3 py-3.5 text-right">Productos</th>
                  <th className="px-3 py-3.5 text-right">Total</th>
                  {muestraGanancia && <th className="px-3 py-3.5 text-right">Ganancia</th>}
                  <th className="px-3 py-3.5 text-left">Pago</th>
                  <th className="px-3 py-3.5 text-left">Estado</th>
                  <th className="px-3 py-3.5 text-left">Envío</th>
                  <th className="px-3 py-3.5 text-left">Fecha</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventas.map((v, i) => {
                  const r = resumenVenta(v)
                  const f = fechaVenta(v.created_at)

                  // Sin animación de layout en la fila: Framer aplica un
                  // transform, y eso la mueve físicamente bajo el cursor
                  // cuando la tabla se reordena. Con el mouse encima la fila
                  // se escapaba y la burbuja de productos se cerraba sola.
                  return (
                    <tr
                      key={v.id}
                      className="cursor-pointer transition-colors hover:bg-tori-50/40"
                      onClick={() => setVentaDetalle(v)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="block max-w-[190px] truncate text-sm font-bold text-slate-900">
                          {v.persona_nombre}
                        </span>
                        {v.persona_dni && (
                          <span className="block font-mono text-[10px] text-slate-400">{v.persona_dni}</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5">
                        {v.persona_telefono ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(String(v.persona_telefono))
                              toast.success('Número copiado')
                            }}
                            title="Copiar número"
                            className="group/copy flex items-center gap-1 rounded-md px-1 py-0.5 text-left font-mono text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-tori-700"
                          >
                            {v.persona_telefono}
                            <Copy size={12} className="opacity-0 transition-opacity group-hover/copy:opacity-100" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <span onClick={(e) => e.stopPropagation()}>
                          <ItemsVentaConBurbuja venta={v} />
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-right">
                        <span className="block text-sm font-extrabold tabular-nums text-slate-900">
                          {fmtSoles(v.total)}
                        </span>
                        {r.debe > 0 && (
                          <span className="block text-[10px] font-bold tabular-nums text-warning-600">
                            debe {fmtSoles(r.debe)}
                          </span>
                        )}
                      </td>

                      {muestraGanancia && (
                        <td className="px-3 py-3.5 text-right">
                          <span
                            className={`block text-sm font-bold tabular-nums ${
                              r.ganancia >= 0 ? 'text-success-600' : 'text-error-600'
                            }`}
                          >
                            {r.ganancia >= 0 ? '' : '−'}
                            {fmtSoles(Math.abs(r.ganancia))}
                          </span>
                          <span className="block text-[10px] tabular-nums text-slate-400">
                            {r.ganancia >= 0 ? '' : '−'}
                            {Math.abs(Math.round(r.pctGanancia))}%
                          </span>
                        </td>
                      )}

                      <td className="px-3 py-3.5">
                        <Chip tono={tonoPago(v.metodo_pago)}>{etiquetaPago(v.metodo_pago)}</Chip>
                      </td>

                      <td className="px-3 py-3.5">
                        <Chip tono={tonoEstado(v.estado)}>{etiquetaEstado(v.estado)}</Chip>
                      </td>

                      <td className="px-3 py-3.5">
                        <Chip tono={tonoEnvio(v.estado_envio)}>{etiquetaEnvio(v.estado_envio)}</Chip>
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          title={f.Relative}
                          className={`text-xs tabular-nums ${f.esHoy ? 'font-bold text-tori-600' : 'text-slate-400'}`}
                        >
                          {f.dia}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Solo la primera fila lleva el ancla del tour: si se
                              repitiera en todas, querySelector siempre
                              resaltaría la misma y el paso parecería roto. */}
                          <BotonFila
                            icono={Eye}
                            titulo="Ver detalle"
                            onClick={() => setVentaDetalle(v)}
                            dataTour={i === 0 ? 'ventas-detalle' : undefined}
                          />
                          {v.estado === 'PENDIENTE' && (
                            <BotonFila icono={Check} titulo="Marcar como cobrada" tono="ok" onClick={() => confirmarVenta(v)} />
                          )}
                          {v.estado === 'COMPLETADA' && (
                            <BotonFila icono={RotateCcw} titulo="Anular" tono="malo" onClick={() => anularVenta(v)} />
                          )}
                          {v.estado !== 'COMPLETADA' && (
                            <BotonFila icono={Trash2} titulo="Eliminar" tono="malo" onClick={() => eliminarVenta(v)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* --- Móvil: tarjetas --- */}
          <div data-tour="ventas-tabla-movil" className="space-y-2.5 lg:hidden">
            {ventas.map((v) => {
              const r = resumenVenta(v)
              const f = fechaVenta(v.created_at)
              const abierta = itemsAbiertos === v.id
              return (
                <motion.article
                  key={v.id}
                  layout="position"
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    onClick={() => setVentaDetalle(v)}
                    className="w-full px-4 py-3.5 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{v.persona_nombre}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {[v.persona_dni, v.persona_telefono].filter(Boolean).join(' · ') || 'Sin contacto'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-black leading-none tabular-nums text-slate-900">
                          {fmtSoles(v.total)}
                        </p>
                        {r.debe > 0 && (
                          <p className="mt-1 text-[10px] font-bold tabular-nums text-warning-600">
                            debe {fmtSoles(r.debe)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Chip tono={tonoEstado(v.estado)}>{etiquetaEstado(v.estado)}</Chip>
                      <Chip tono={tonoPago(v.metodo_pago)}>{etiquetaPago(v.metodo_pago)}</Chip>
                      <Chip tono={tonoEnvio(v.estado_envio)}>{etiquetaEnvio(v.estado_envio)}</Chip>
                      <span className={`ml-auto text-[10px] font-bold tabular-nums ${f.esHoy ? 'text-tori-600' : 'text-slate-400'}`}>
                        {f.dia}
                      </span>
                    </div>

                    {muestraGanancia && (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Ganancia{' '}
                        <b
                          className={`tabular-nums ${r.ganancia >= 0 ? 'text-success-600' : 'text-error-600'}`}
                        >
                          {fmtSoles(r.ganancia)}
                        </b>{' '}
                        · {r.items} {r.items === 1 ? 'ítem' : 'ítems'} · {r.unidades} unidades
                      </p>
                    )}
                  </button>

                  <button
                    onClick={() => setItemsAbiertos(abierta ? null : v.id)}
                    className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-[11px] font-bold text-tori-600"
                  >
                    {abierta ? 'Ocultar' : 'Ver'} los {r.items} {r.items === 1 ? 'ítem' : 'ítems'}
                    <ChevronRight size={13} className={`transition-transform ${abierta ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {abierta && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100 bg-slate-50"
                      >
                        <div className="divide-y divide-slate-100 px-4">
                          {(v.items ?? []).length === 0 ? (
                            <p className="py-3 text-xs text-slate-400">Sin productos registrados.</p>
                          ) : (
                            (v.items ?? []).map((it, i) => (
                              <div key={it.id || i} className="flex items-center justify-between gap-3 py-2.5">
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
                                  {it.producto_nombre}
                                </span>
                                <span className="shrink-0 text-[11px] tabular-nums text-slate-400">×{it.cantidad}</span>
                                <span className="shrink-0 text-xs font-bold tabular-nums text-slate-900">
                                  {fmtSoles(subtotalItem(it))}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-1.5 border-t border-slate-100 px-3 py-2">
                    <BotonGrande icono={Eye} etiqueta="Ver" onClick={() => setVentaDetalle(v)} />
                    {v.estado === 'PENDIENTE' && (
                      <BotonGrande icono={Check} etiqueta="Cobrada" tono="ok" onClick={() => confirmarVenta(v)} />
                    )}
                    {v.estado === 'COMPLETADA' && (
                      <BotonGrande icono={RotateCcw} etiqueta="Anular" tono="malo" onClick={() => anularVenta(v)} />
                    )}
                    {v.estado !== 'COMPLETADA' && (
                      <BotonGrande icono={Trash2} etiqueta="Eliminar" tono="malo" onClick={() => eliminarVenta(v)} />
                    )}
                  </div>
                </motion.article>
              )
            })}
          </div>
        </>
      )}

      {/* =================================================================
          PAGINACIÓN
          ================================================================= */}
      {totalRegistros > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[11px] font-medium text-slate-400">
            Mostrando <b className="text-slate-600">{ventas.length}</b> de{' '}
            <b className="text-slate-600">{totalRegistros}</b>{' '}
            {totalRegistros === 1 ? 'venta' : 'ventas'}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => irAPagina(pagina - 1)}
              disabled={pagina === 0 || navegando}
              className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <span className="px-2 text-xs font-bold tabular-nums text-slate-500">
              {pagina + 1} / {totalPaginas}
            </span>
            <button
              onClick={() => irAPagina(pagina + 1)}
              disabled={(pagina + 1) * PAGE_SIZE >= totalRegistros || navegando}
              className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          MODALES
          ================================================================= */}
      <ModalNuevaVenta
        abierto={showNueva}
        onCerrar={() => setShowNueva(false)}
        onCreada={() => cargarVentas(0)}
        userId={userId}
        plan={plan}
      />

      <ModalDetalleVenta
        venta={ventaDetalle}
        onCerrar={() => setVentaDetalle(null)}
        onGuardar={(v) => {
          if (v) setVentaDetalle(v)
          cargarVentas(0)
        }}
        plan={plan}
        userId={userId}
      />
    </div>
  )
}

/* ===================================================================== */
/* Piezas                                                               */
/* ===================================================================== */

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
  ayuda,
  destacado,
}: {
  icono: typeof Wallet
  etiqueta: string
  valor: string
  ayuda: string
  destacado?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 backdrop-blur-sm transition-colors ${
        destacado ? 'border-warning-300/40 bg-warning-400/15' : 'border-white/15 bg-white/10'
      }`}
    >
      <span className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-tori-200">
        <Icono size={11} /> {etiqueta}
      </span>
      <p
        className={`mt-1.5 text-xl font-black leading-none tabular-nums tracking-tight ${
          destacado ? 'text-warning-100' : 'text-white'
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-[10px] leading-tight text-tori-100/80">{ayuda}</p>
    </div>
  )
}

function Chip({ tono, children }: { tono: Tono; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[10.5px] font-bold ${TONO_BADGE[tono]}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONO_PUNTO[tono]}`} />
      {children}
    </span>
  )
}

function BotonFila({
  icono: Icono,
  titulo,
  onClick,
  tono = 'neutro',
  dataTour,
}: {
  icono: typeof Eye
  titulo: string
  onClick: () => void
  tono?: Tono
  dataTour?: string
}) {
  const hover =
    tono === 'ok'
      ? 'hover:bg-success-50 hover:text-success-600'
      : tono === 'malo'
        ? 'hover:bg-error-50 hover:text-error-600'
        : 'hover:bg-tori-50 hover:text-tori-600'
  return (
    <button
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      data-tour={dataTour}
      className={`grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition-colors ${hover}`}
    >
      <Icono size={15} />
    </button>
  )
}

function BotonGrande({
  icono: Icono,
  etiqueta,
  onClick,
  tono = 'neutro',
}: {
  icono: typeof Eye
  etiqueta: string
  onClick: () => void
  tono?: Tono
}) {
  const estilo =
    tono === 'ok'
      ? 'bg-success-50 text-success-700'
      : tono === 'malo'
        ? 'bg-error-50 text-error-600'
        : 'bg-tori-50 text-tori-700'
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-bold transition-opacity active:opacity-70 ${estilo}`}
    >
      <Icono size={14} />
      {etiqueta}
    </button>
  )
}

function Vacio({
  hayFiltro,
  onLimpiar,
  onNueva,
}: {
  hayFiltro: boolean
  onLimpiar: () => void
  onNueva: () => void
}) {
  return (
    <div
      data-tour="ventas-vacio"
      className="grid place-items-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center"
    >
      <div className="max-w-sm">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-tori-50 text-tori-500">
          <Inbox size={28} />
        </span>
        <h3 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
          {hayFiltro ? 'Nada coincide' : 'Todavía no hay ventas'}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {hayFiltro
            ? 'Prueba con otro término o quita los filtros para ver todas tus ventas.'
            : 'Registra tu primera venta en segundos. Después vas a ver aquí cuánto vendes y cuánto te falta cobrar.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {hayFiltro ? (
            <button
              onClick={onLimpiar}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Quitar filtros
            </button>
          ) : (
            <button
              onClick={onNueva}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-tori-600 to-tori-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-tori-600/25 transition-all hover:shadow-xl"
            >
              <Plus size={16} /> Nueva venta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Esqueleto() {
  return (
    <div className="space-y-4">
      <div className="h-44 animate-pulse rounded-[28px] bg-gradient-to-br from-slate-200 to-slate-100" />
      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="space-y-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  )
}
