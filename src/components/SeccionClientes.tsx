'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Pencil, Copy, Check, X, Users, Phone, Tag, ShoppingCart, Truck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { tourDone, trayectoDone } from '@/lib/tours'
import { useOnboarding } from '@/context/OnboardingContext'
import TourHelpButton from '@/components/TourHelpButton'
import { useConfirm } from '@/components/ConfirmDialog'

type Cliente = {
  id: string
  clave: string
  ids: string[]
  nombre: string
  dni: string | null
  telefono: string | null
  ventas: number
  totalVentas: number
  envios: number
  ultimaActividad: string | null
  created_at: string
}

type Props = {
  userId: string
}

export default function SeccionClientes({ userId }: Props) {
  const { startTour } = useOnboarding()
  const confirmar = useConfirm()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [editForm, setEditForm] = useState<{ nombre: string; dni: string; telefono: string }>({
    nombre: '',
    dni: '',
    telefono: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [ultimoCopiado, setUltimoCopiado] = useState<string | null>(null)

  async function cargarClientes() {
    setLoading(true)
    const params = new URLSearchParams({ user_id: userId })
    if (busquedaAplicada) params.set('busqueda', busquedaAplicada)
    const res = await fetch(`/api/clientes?${params}`)
    const json = await res.json()
    if (res.ok) setClientes(json.data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarClientes()
  }, [userId, busquedaAplicada])

  useEffect(() => {
    if (editando && trayectoDone() && !tourDone('modal-editar-cliente')) {
      const t = setTimeout(() => startTour('modal-editar-cliente'), 400)
      return () => clearTimeout(t)
    }
  }, [editando, startTour])

  function iniciarEdicion(c: Cliente) {
    setEditando(c)
    setEditForm({ nombre: c.nombre, dni: c.dni || '', telefono: c.telefono || '' })
  }

  async function guardarEdicion() {
    if (!editando) return
    if (!editForm.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setGuardando(true)
    const res = await fetch(`/api/clientes/${editando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        telefono: String(editForm.telefono).replace(/\s+/g, ''),
        user_id: userId,
        ids: editando.ids,
      }),
    })
    setGuardando(false)
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success('Cliente actualizado')
      setEditando(null)
      cargarClientes()
    } else {
      toast.error(json.error || 'Error al guardar')
    }
  }

  async function copiarTelefono(telefono: string | null) {
    if (!telefono) return
    try {
      await navigator.clipboard.writeText(telefono)
      setUltimoCopiado(telefono)
      toast.success('Teléfono copiado')
      setTimeout(() => setUltimoCopiado(null), 1500)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  async function eliminarCliente(c: Cliente) {
    if (!(await confirmar({ message: `¿Eliminar a ${c.nombre}? Se quitará de tu lista de clientes.`, danger: true, confirmLabel: 'Sí, eliminar' }))) return
    const res = await fetch(`/api/clientes/${c.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ids: c.ids }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success('Cliente eliminado')
      cargarClientes()
    } else {
      toast.error(json.error || 'Error al eliminar')
    }
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.dni || '').toLowerCase().includes(q) ||
        (c.telefono || '').toLowerCase().includes(q)
    )
  }, [busqueda, clientes])

  function formatFecha(fecha: string | null) {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando clientes...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div data-tour="clientes-buscar" className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, DNI o teléfono... (Enter para buscar)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setBusquedaAplicada(busqueda.trim())
                setLoading(true)
              }
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
        <div className="flex gap-2 text-sm text-slate-500">
          <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 font-semibold">
            <Users size={15} /> {filtrados.length} cliente{filtrados.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {filtrados.length === 0 && (
        <div data-tour="clientes-vacio" className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">No hay clientes</p>
          <p className="text-sm mt-1">
            Aquí aparecen tus clientes: los que compran en tus ventas o solicitan envíos.
          </p>
        </div>
      )}

      {filtrados.length > 0 && (
        <div data-tour="clientes-tabla" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1"><ShoppingCart size={13} /> Ventas</span></th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1"><Truck size={13} /> Envíos</span></th>
                <th className="px-4 py-3">Última actividad</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((c) => (
                <tr key={c.clave} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-sky-700 shrink-0">
                        {c.nombre.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{c.nombre}</p>
                        {c.dni ? <p className="text-xs text-slate-400 font-mono">{c.dni}</p> : <p className="text-xs text-slate-400">Sin DNI</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.telefono ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-slate-700 font-mono text-xs">
                          <Phone size={12} className="text-slate-400" />
                          {c.telefono}
                        </span>
                        <button
                          onClick={() => copiarTelefono(c.telefono)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Copiar teléfono"
                        >
                          {ultimoCopiado === c.telefono ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${c.ventas > 0 ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                      {c.ventas}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {c.totalVentas > 0 ? `S/ ${c.totalVentas.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${c.envios > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                      {c.envios}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatFecha(c.ultimaActividad)}</td>
                  <td className="px-4 py-3 text-right">
                    <div data-tour="clientes-botones" className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => iniciarEdicion(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Editar cliente"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => eliminarCliente(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag size={18} className="text-sky-600" /> Editar cliente
              </h3>
              <TourHelpButton tourId="modal-editar-cliente" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
              <input
                data-tour="editar-cliente-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DNI</label>
              <input
                data-tour="editar-cliente-dni"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(editForm.dni)}
                onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                placeholder="Opcional"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</label>
              <input
                data-tour="editar-cliente-telefono"
                inputMode="tel"
                value={String(editForm.telefono)}
                onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                placeholder="Opcional"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Los cambios también se actualizan en sus ventas y envíos anteriores.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditando(null)}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                <X size={15} /> Cancelar
              </button>
              <button
                data-tour="editar-cliente-guardar"
                onClick={guardarEdicion}
                disabled={guardando}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 transition-all"
              >
                <Check size={15} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}