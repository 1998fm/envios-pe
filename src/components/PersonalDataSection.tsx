'use client'

import { User, Fingerprint, Phone } from 'lucide-react'
import { motion } from 'framer-motion'

type Props = {
  nombre: string
  setNombre: (v: string) => void
  dni: string
  setDni: (v: string) => void
  telefono: string
  setTelefono: (v: string) => void
}

const inputClass = `
  w-full pl-10 pr-4 py-3.5
  bg-white 
  border border-slate-200 
  rounded-xl
  text-slate-900 
  placeholder:text-slate-400 :text-slate-500
  focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500
  transition-all duration-200
  text-sm
`

const iconClass = `
  absolute left-3.5 top-1/2 -translate-y-1/2
  text-slate-400 
  pointer-events-none
`

export default function PersonalDataSection({
  nombre, setNombre,
  dni, setDni,
  telefono, setTelefono,
}: Props) {
  const fields = [
    { id: 'nombre', icon: User, placeholder: 'Nombre completo', value: nombre, onChange: setNombre },
    { id: 'dni', icon: Fingerprint, placeholder: 'DNI', value: dni, onChange: setDni },
    { id: 'telefono', icon: Phone, placeholder: 'Teléfono', value: telefono, onChange: setTelefono },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
    >
      <h2 className="text-xs uppercase tracking-widest text-slate-400  font-semibold mb-3">
        Datos personales
      </h2>

      <div className="space-y-2.5">
        {fields.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.id} className="relative">
              <Icon size={16} className={iconClass} />
              <input
                id={f.id}
                placeholder={f.placeholder}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className={inputClass}
              />
            </div>
          )
        })}
      </div>

      <p className="text-xs text-amber-600  mt-2 flex items-center gap-1.5">
        <span>Usa el mismo número con el que realizaste tu compra por WhatsApp.</span>
      </p>
    </motion.div>
  )
}
