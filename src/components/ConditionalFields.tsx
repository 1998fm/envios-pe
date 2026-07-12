'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import AutocompleteInput from '@/components/AutocompleteInput'
import agenciasShalom from '@/data/agencias-shalom.json'
import provinciasOlva from '@/data/provincias-olva.json'
import distritosMoto from '@/data/distritos-moto.json'

type Props = {
  metodo: string
  agencia: string
  setAgencia: (v: string) => void
  provincia: string
  setProvincia: (v: string) => void
  distrito: string
  setDistrito: (v: string) => void
  direccion: string
  setDireccion: (v: string) => void
  referencia: string
  setReferencia: (v: string) => void
  tarifaMotorizado: number | null
  cargandoTarifa: boolean
}

const inputClass = `
  w-full px-4 py-3.5
  bg-white dark:bg-slate-900/50
  border border-slate-200 dark:border-slate-700
  rounded-xl
  text-slate-900 dark:text-slate-100
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500
  transition-all duration-200
  text-sm
`

function FieldsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="space-y-3"
    >
      {children}
    </motion.div>
  )
}

export default function ConditionalFields(props: Props) {
  return (
    <AnimatePresence mode="wait">
      {props.metodo === 'SHALOM' && (
        <FieldsWrapper key="shalom">
          <AutocompleteInput
            value={props.agencia}
            onChange={props.setAgencia}
            options={agenciasShalom}
            placeholder="Buscar agencia Shalom"
          />
        </FieldsWrapper>
      )}

      {['OLVA', 'MARVISUR', 'FLORES', 'OTRO'].includes(props.metodo) && (
        <FieldsWrapper key="provincia">
          <AutocompleteInput
            value={props.provincia}
            onChange={props.setProvincia}
            options={provinciasOlva}
            placeholder="Provincia"
          />
          <input
            placeholder="Dirección exacta"
            value={props.direccion}
            onChange={(e) => props.setDireccion(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Referencia (opcional)"
            value={props.referencia}
            onChange={(e) => props.setReferencia(e.target.value)}
            className={inputClass}
          />
        </FieldsWrapper>
      )}

      {props.metodo === 'MOTORIZADO' && (
        <FieldsWrapper key="motorizado">
          <AutocompleteInput
            value={props.distrito}
            onChange={props.setDistrito}
            options={distritosMoto}
            placeholder="Distrito"
          />

          {props.distrito && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Costo del envío
              </span>
              {props.cargandoTarifa ? (
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  Consultando...
                </span>
              ) : props.tarifaMotorizado !== null ? (
                <span className="text-lg font-bold text-sky-700 dark:text-sky-400">
                  S/ {Number(props.tarifaMotorizado).toFixed(2)}
                </span>
              ) : (
                <span className="text-sm font-medium text-red-500 dark:text-red-400">
                  Sin tarifa
                </span>
              )}
            </div>
          )}

          <input
            placeholder="Dirección exacta"
            value={props.direccion}
            onChange={(e) => props.setDireccion(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Referencia (opcional)"
            value={props.referencia}
            onChange={(e) => props.setReferencia(e.target.value)}
            className={inputClass}
          />
        </FieldsWrapper>
      )}
    </AnimatePresence>
  )
}
