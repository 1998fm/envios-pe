'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle, Check } from 'lucide-react'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmContextValue = {
  confirmar: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  const [opciones, setOpciones] = useState<ConfirmOptions & { resolver: (ok: boolean) => void } | null>(null)

  const confirmar = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolver) => {
      setOpciones({ ...options, resolver })
      setAbierto(true)
    })
  }, [])

  function cerrar(resultado: boolean) {
    setAbierto(false)
    opciones?.resolver(resultado)
  }

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}

      {abierto && opciones && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="px-6 pt-6 text-center">
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
                  opciones.danger ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'
                }`}
              >
                {opciones.danger ? <AlertTriangle size={22} /> : <Check size={22} />}
              </div>
              <h3 className="mt-4 text-lg font-extrabold tracking-tight text-slate-900">
                {opciones.title || '¿Estás seguro?'}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{opciones.message}</p>
            </div>
            <div className="flex gap-2 p-6">
              <button
                onClick={() => cerrar(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
              >
                {opciones.cancelLabel || 'Cancelar'}
              </button>
              <button
                onClick={() => cerrar(true)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
                  opciones.danger
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/20'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg hover:shadow-sky-500/20'
                }`}
              >
                {opciones.confirmLabel || 'Sí, continuar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
  return ctx.confirmar
}
