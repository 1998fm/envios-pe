'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Gasto } from '@/types/inventario'
import { CATEGORIAS_GASTO, CATEGORIA_GASTO_LABEL, CATEGORIA_GASTO_STYLE } from '@/types/inventario'
import { useConfirm } from '@/components/ConfirmDialog'

type Props = { userId: string }

const CATEGORIAS_FILTRO = ['TODAS', ...CATEGORIAS_GASTO]

const fmtSoles = (n: number) => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formVacio = { categoria: 'OTROS', concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0], notas: '' }

export default function SeccionGastos({ userId }: Props) {
  const confirmar = useConfirm()
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Gasto | null>(null)
  const [form, setForm] = useState(formVacio)
  const [guardando, setGuardando] = useState(false)

  async function cargarGastos() {
    const params = new URLSearchParams({ user_id: userId })
    if (filtroCategoria !== 'TODAS') params.set('categoria', filtroCategoria)
    const res = await fetch(`/api/gastos?${params}`)
    const json = await res.json()
    if (res.ok) setGastos(json.data || [])
    setLoading(false)
  }

  useEffect(() => { cargarGastos() }, [userId, filtroCategoria])

  const totalMes = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0)

  function abrirNuevo() {
    setEditando(null)
    setForm(formVacio)
    setShowModal(true)
  }

  function abrirEdicion(g: Gasto) {
    setEditando(g)
    setForm({
      categoria: g.categoria,
      concepto: g.concepto,
      monto: String(g.monto),
      fecha: g.fecha,
      notas: g.notas || '',
    })
    setShowModal(true)
  }

  function cerrarModal() {
    setShowModal(false)
    setEditando(null)
    setForm(formVacio)
  }

  async function guardar() {
    if (!form.concepto.trim()) { toast.error('Ingresa el concepto del gasto'); return }
    const monto = Number(form.monto)
    if (isNaN(monto) || monto < 0) { toast.error('Ingresa un monto válido'); return }

    setGuardando(true)
    const payload = {
      categoria: form.categoria,
      concepto: form.concepto.trim(),
      monto,
      fecha: form.fecha,
      notas: form.notas.trim() || null,
    }

    const res = editando
      ? await fetch(`/api/gastos/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/gastos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, user_id: userId }),
        })

    if (res.ok) {
      toast.success(editando ? 'Gasto actualizado' : 'Gasto registrado')
      cerrarModal()
      cargarGastos()
    } else {
      toast.error('Error al guardar el gasto')
    }
    setGuardando(false)
  }

  async function eliminarGasto(g: Gasto) {
    if (!(await confirmar({ message: '¿Eliminar este gasto definitivamente?', danger: true, confirmLabel: 'Sí, eliminar' }))) return
    const res = await fetch(`/api/gastos/${g.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Gasto eliminado')
      cargarGastos()
    } else {
      toast.error('Error al eliminar')
    }
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando gastos...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200"
        >
          <Plus size={16} /> Registrar gasto
        </button>

        <div className="flex gap-1 flex-wrap">
          {CATEGORIAS_FILTRO.map((c) => (
            <button
              key={c}
              onClick={() => setFiltroCategoria(filtroCategoria === c ? 'TODAS' : c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filtroCategoria === c
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c === 'TODAS' ? 'Todas' : CATEGORIA_GASTO_LABEL[c] || c}
            </button>
          ))}
        </div>
      </div>

      {gastos.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Total de la lista</p>
          <p className="text-lg font-extrabold text-slate-900">{fmtSoles(totalMes)}</p>
        </div>
      )}

      {gastos.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-semibold text-slate-500">No hay gastos</p>
          <p className="text-sm mt-1">Registra materiales, pasajes o delivery</p>
        </div>
      )}

      {gastos.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gastos.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORIA_GASTO_STYLE[g.categoria] || 'bg-slate-100 text-slate-600'}`}>
                      {CATEGORIA_GASTO_LABEL[g.categoria] || g.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{g.concepto}</p>
                    {g.notas && <p className="text-xs text-slate-400 truncate max-w-md">{g.notas}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{fmtSoles(g.monto)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirEdicion(g)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => eliminarGasto(g)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                        <X size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 p-6 pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editando ? 'Editar gasto' : 'Registrar gasto'}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {CATEGORIAS_GASTO.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, categoria: c })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        form.categoria === c
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {CATEGORIA_GASTO_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Concepto</label>
                <input
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  placeholder="Ej: Cinta adhesiva, Pasajes a Miraflores, Delivery cliente"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto (S/)</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas (opcional)</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                  rows={2}
                  placeholder="Detalle adicional"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 p-4 flex gap-3">
              <button onClick={cerrarModal} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.concepto.trim()}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
