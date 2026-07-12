'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import EstadisticasCards from './EstadisticasCards'
import EstadisticasGraficos from './EstadisticasGraficos'
import ToriMascot from '@/components/ToriMascot'

type StatsData = {
  hoy: number
  semana: number
  mes: number
  metodoPopular: { metodo: string; count: number } | null
  tendenciaDiaria: { fecha: string; count: number }[]
  distribucionMetodo: { metodo: string; count: number }[]
  distribucionEstado: { estado: string; count: number }[]
}

type Props = {
  userId: string
}

const presets = [
  { label: '7d', days: 7 },
  { label: '15d', days: 15 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function EstadisticasDashboard({ userId }: Props) {
  const [mostrarGraficos, setMostrarGraficos] = useState(false)
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState(30)
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')

  const fetchStats = useCallback(async (desde: string, hasta: string) => {
    setLoading(true)
    const params = new URLSearchParams({ user_id: userId, desde, hasta })
    const res = await fetch(`/api/estadisticas?${params}`)
    if (res.ok) {
      const json = await res.json()
      setData(json)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    const ahora = new Date()
    const hasta = ahora.toISOString().split('T')[0]
    const desde = new Date(ahora.getTime() - preset * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    setCustomDesde('')
    setCustomHasta('')
    fetchStats(desde, hasta)
  }, [preset, fetchStats])

  function aplicarCustom() {
    if (customDesde && customHasta) {
      fetchStats(customDesde, customHasta)
    }
  }

  const portal = typeof document !== 'undefined'
    ? document.getElementById('stats-portal')
    : null

  return (
    <>
      {portal && data && createPortal(
        <EstadisticasCards
          hoy={data.hoy}
          semana={data.semana}
          mes={data.mes}
          metodoPopular={data.metodoPopular}
          mostrarGraficos={mostrarGraficos}
          onToggleGraficos={() => setMostrarGraficos(!mostrarGraficos)}
        />,
        portal
      )}

      <div className="mb-5 space-y-2">
        {mostrarGraficos && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPreset(p.days)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    preset === p.days && !customDesde
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="date"
                  value={customDesde}
                  onChange={(e) => { setCustomDesde(e.target.value); setPreset(0) }}
                  className="w-24 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400"
                />
                <span className="text-[10px] text-slate-300">→</span>
                <input
                  type="date"
                  value={customHasta}
                  onChange={(e) => { setCustomHasta(e.target.value); setPreset(0) }}
                  className="w-24 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400"
                />
                <button
                  onClick={aplicarCustom}
                  disabled={!customDesde || !customHasta}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium text-sky-600 dark:text-sky-400 disabled:opacity-30"
                >
                  ir
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarGraficos && (
          loading ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data ? (
            <EstadisticasGraficos
              tendenciaDiaria={data.tendenciaDiaria}
              distribucionMetodo={data.distribucionMetodo}
              distribucionEstado={data.distribucionEstado}
            />
          ) : !loading && !data ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <ToriMascot variant="empty" size={48} animate />
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No hay datos estadísticos en este período.
              </p>
            </div>
          ) : null
        )}
      </div>
    </>
  )
}
