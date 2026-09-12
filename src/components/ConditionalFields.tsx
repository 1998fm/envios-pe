'use client'

import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import AutocompleteInput from '@/components/AutocompleteInput'
import provinciasOlva from '@/data/provincias-olva.json'
import distritosMoto from '@/data/distritos-moto.json'

type Props = {
  metodo: string
  agenciasShalom: string[]
  agencia: string
  setAgencia: (v: string) => void
  tipoEntrega: 'AGENCIA' | 'DOMICILIO'
  setTipoEntrega: (v: 'AGENCIA' | 'DOMICILIO') => void
  provincia: string
  setProvincia: (v: string) => void
  agenciaOlva: string
  setAgenciaOlva: (v: string) => void
  agenciasOlvaProvincia: string[]
  distrito: string
  setDistrito: (v: string) => void
  direccion: string
  setDireccion: (v: string) => void
  referencia: string
  setReferencia: (v: string) => void
  tarifaMotorizado: number | null
  cargandoTarifa: boolean
  distritosMotorizado?: string[]
}

const inputClass = `
  w-full px-4 py-3.5
  bg-white 
  border border-slate-200 
  rounded-xl
  text-slate-900 
  placeholder:text-slate-400 :text-slate-500
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

export default memo(function ConditionalFields(props: Props) {

  return (
    <AnimatePresence mode="wait">
      {props.metodo === 'SHALOM' && (
        <FieldsWrapper key="shalom">
          <AutocompleteInput
            value={props.agencia}
            onChange={props.setAgencia}
            options={props.agenciasShalom}
            placeholder="Buscar agencia Shalom"
            requireSelection
            errorMessage="Selecciona una agencia Shalom de la lista."
          />
        </FieldsWrapper>
      )}

      {['OLVA', 'MARVISUR', 'FLORES', 'OTRO'].includes(props.metodo) && (
        <FieldsWrapper key="provincia">
          {props.metodo === 'OLVA' && (
            <div>
              <div className="mb-1.5 text-sm font-medium text-slate-600">
                ¿Cómo deseas recibir tu pedido?
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'AGENCIA' as const, label: 'Recojo en agencia', icon: '🏢' },
                  { value: 'DOMICILIO' as const, label: 'Domicilio', icon: '🏠' },
                ]).map((opcion) => (
                  <button
                    key={opcion.value}
                    type="button"
                    onClick={() => props.setTipoEntrega(opcion.value)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors ${
                      props.tipoEntrega === opcion.value
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{opcion.icon}</span>
                    {opcion.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {props.tipoEntrega === 'AGENCIA'
                  ? 'El pedido quedará en la agencia Olva de tu provincia para que lo recojas.'
                  : 'El pedido se enviará a la dirección que completes abajo.'}
              </p>
            </div>
          )}
          <AutocompleteInput
            value={props.provincia}
            onChange={props.setProvincia}
            options={provinciasOlva}
            placeholder="Provincia"
            requireSelection
            errorMessage="Selecciona una provincia de la lista."
          />
          {props.metodo === 'OLVA' && props.tipoEntrega === 'AGENCIA' && (
            props.agenciasOlvaProvincia.length > 0 ? (
              <AutocompleteInput
                value={props.agenciaOlva}
                onChange={props.setAgenciaOlva}
                options={props.agenciasOlvaProvincia}
                placeholder="Agencia Olva (recojo)"
                requireSelection
                errorMessage="Selecciona una agencia Olva de la lista."
              />
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                No encontramos agencias Olva de recojo en esta provincia. Elige{' '}
                <strong>Domicilio</strong> o cambia de provincia.
              </p>
            )
          )}
          {!(props.metodo === 'OLVA' && props.tipoEntrega === 'AGENCIA') && (
            <>
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
            </>
          )}
        </FieldsWrapper>
      )}

      {props.metodo === 'MOTORIZADO' && (
        <FieldsWrapper key="motorizado">
          <AutocompleteInput
            value={props.distrito}
            onChange={props.setDistrito}
            options={props.distritosMotorizado ?? (distritosMoto as string[])}
            placeholder="Distrito"
            requireSelection
            errorMessage="Selecciona un distrito de la lista."
          />

          {props.distrito && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white  border border-slate-200 ">
              <span className="text-sm text-slate-500  font-medium">
                Costo del envío
              </span>
              {props.cargandoTarifa ? (
                <span className="text-sm text-slate-500  flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  Consultando...
                </span>
              ) : props.tarifaMotorizado !== null ? (
                <span className="text-lg font-bold text-sky-700 ">
                  S/ {Number(props.tarifaMotorizado).toFixed(2)}
                </span>
              ) : (
                <span className="text-sm font-medium text-red-500 ">
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
})
