'use client'

import { useState } from 'react'
import type { ConfigState } from '@/types/config'
import { normalizarDistrito } from '@/lib/normalizarDistrito'
import { Search, DollarSign, Plus, Trash2, MapPin } from 'lucide-react'

type Props = {
  config: ConfigState
  upd: <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => void
  distritosMoto: string[]
}

export default function TarifasEditor({ config, upd, distritosMoto }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [nuevoDistrito, setNuevoDistrito] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [precioUnico, setPrecioUnico] = useState('')
  const [error, setError] = useState('')

  const esProvincia = config.motoRegion === 'provincia'

  const listaOrdenada = Object.entries(config.tarifas)
    .map(([nombre, precio]) => ({ nombre, precio }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const filtrados = distritosMoto.filter((d: string) =>
    d.toLowerCase().includes(busqueda.toLowerCase())
  )

  function aplicarPrecioUnico() {
    const val = parseFloat(precioUnico)
    if (isNaN(val) || val <= 0) return
    const claves = esProvincia
      ? Object.keys(config.tarifas)
      : distritosMoto
    const nuevas: Record<string, string> = { ...config.tarifas }
    claves.forEach((d) => { nuevas[d] = String(val) })
    upd('tarifas', nuevas)
    setPrecioUnico('')
  }

  function agregarDistrito() {
    const nombre = nuevoDistrito.trim()
    const precio = parseFloat(nuevoPrecio)
    if (!nombre) {
      setError('Escribe el nombre del distrito.')
      return
    }
    if (isNaN(precio) || precio <= 0) {
      setError('Escribe un precio válido (mayor a 0).')
      return
    }
    const norm = normalizarDistrito(nombre)
    const duplicado = Object.keys(config.tarifas).some(
      (k) => normalizarDistrito(k) === norm
    )
    if (duplicado) {
      setError('Ya existe ese distrito. Edítalo en la lista.')
      return
    }
    upd('tarifas', { ...config.tarifas, [nombre]: String(precio) })
    setNuevoDistrito('')
    setNuevoPrecio('')
    setError('')
  }

  function eliminarDistrito(nombre: string) {
    const nuevas = { ...config.tarifas }
    delete nuevas[nombre]
    upd('tarifas', nuevas)
  }

  const inputNumber =
    'w-24 border border-slate-200 rounded-lg px-3 py-2 text-right bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50'

  return (
    <div className="space-y-5">
      {/* Selector región */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          ¿Dónde realizas tus envíos motorizados?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => upd('motoRegion', 'lima')}
            className={`flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
              !esProvincia
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-transparent shadow'
                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-200'
            }`}
          >
            Lima
          </button>
          <button
            type="button"
            onClick={() => upd('motoRegion', 'provincia')}
            className={`flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
              esProvincia
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-transparent shadow'
                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-200'
            }`}
          >
            Provincia
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {esProvincia
            ? 'Agrega manualmente los distritos donde entregas y su precio. En tu formulario solo aparecerán esos distritos.'
            : 'Usamos la lista oficial de distritos de Lima Metropolitana. Asigna un precio a cada uno.'}
        </p>
      </div>

      {!esProvincia && (
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-sky-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Precio único para todos</p>
              <p className="text-xs text-slate-500">Si cobras lo mismo en todos los distritos de Lima.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              min="0"
              step="0.50"
              value={precioUnico}
              onChange={(e) => setPrecioUnico(e.target.value)}
              placeholder="S/ 10.00"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <button
              type="button"
              onClick={aplicarPrecioUnico}
              disabled={!precioUnico}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white disabled:opacity-50 hover:shadow-lg transition-all duration-200"
            >
              Aplicar a todos
            </button>
          </div>
        </div>
      )}

      {!esProvincia ? (
        <div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar distrito..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>
          <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {filtrados.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin resultados</p>
            ) : (
              filtrados.map((distrito: string) => (
                <div
                  key={distrito}
                  className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-slate-300 transition-colors"
                >
                  <span className="font-medium text-slate-700 text-sm">{distrito}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-sm">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={config.tarifas[distrito] || ''}
                      onChange={(e) =>
                        upd('tarifas', { ...config.tarifas, [distrito]: e.target.value })
                      }
                      className={inputNumber}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {filtrados.length} de {distritosMoto.length} distritos
          </p>
        </div>
      ) : (
        <div>
          {/* Agregar distrito */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              <Plus size={15} className="text-sky-600" /> Agregar distrito
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={nuevoDistrito}
                  onChange={(e) => setNuevoDistrito(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarDistrito() } }}
                  placeholder="Nombre del distrito (ej: Cajamarca, El Porvenir)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">S/</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarDistrito() } }}
                  placeholder="Precio"
                  className="w-24 border border-slate-200 rounded-xl px-4 py-2.5 text-right bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
                <button
                  type="button"
                  onClick={agregarDistrito}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg transition-all duration-200"
                >
                  Agregar
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs font-medium text-red-600 mt-2">{error}</p>
            )}
          </div>

          {/* Lista de distritos configurados */}
          <div className="mt-4 space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {listaOrdenada.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                <MapPin size={16} className="mx-auto mb-1 text-slate-300" />
                Aún no has agregado distritos. Empieza arriba.
              </p>
            ) : (
              listaOrdenada.map(({ nombre, precio }) => (
                <div
                  key={nombre}
                  className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-slate-300 transition-colors"
                >
                  <span className="font-medium text-slate-700 text-sm">{nombre}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-sm">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={precio}
                      onChange={(e) =>
                        upd('tarifas', { ...config.tarifas, [nombre]: e.target.value })
                      }
                      className={inputNumber}
                    />
                    <button
                      type="button"
                      onClick={() => eliminarDistrito(nombre)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar distrito"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {listaOrdenada.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              {listaOrdenada.length} distrito(s) · aparecerán en tu formulario.
            </p>
          )}
        </div>
      )}
    </div>
  )
}