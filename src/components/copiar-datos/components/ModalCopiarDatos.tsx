/* ========================================
   COMPONENTES
======================================== */

import TarjetaEnvio from './TarjetaEnvio'

import ResumenCopiarDatos from './ResumenCopiarDatos'

import BotonesModal from './BotonesModal'

import {

  buscarTarifa

} from '../utils/buscarTarifa'

import {

  generarTextoMoto

} from '../utils/generarTextoMoto'

import { useState } from 'react'

import {

  exportarExcelMoto

} from '../utils/exportarExcelMoto'

/* ========================================
   TIPOS
======================================== */

import type {

  ModalCopiarDatosProps

} from '../types'

/* ========================================
   MODAL
======================================== */

export default function ModalCopiarDatos({

  abierto,

  envios,

  tarifas,

  cobrarEnvios,

setCobrarEnvios,

  onCerrar,

  onCambiarCobro,


}: ModalCopiarDatosProps) {

  if (!abierto) return null

  /* ========================================
   ESTADO COPIADO
======================================== */

const [

  copiado,

  setCopiado

] = useState(false)

  const total = envios.length

  const cobrar = envios.filter(

    envio => cobrarEnvios[envio.id]

  ).length

  const noCobrar = total - cobrar

  /* ========================================
   COBRAR TODOS
======================================== */

const cobrarTodos =

  total > 0 &&

  cobrar === total

/* ========================================
   CAMBIAR TODOS
======================================== */

function cambiarTodos() {

  const nuevoEstado: Record<number, boolean> = {}

  envios.forEach((envio) => {

    nuevoEstado[envio.id] = !cobrarTodos

  })

  setCobrarEnvios(nuevoEstado)

}

/* ========================================
   COPIAR DATOS
======================================== */

async function copiarDatos() {

  const texto = generarTextoMoto(

    envios,

    tarifas,

    cobrarEnvios

  )

  await navigator.clipboard.writeText(

    texto

  )

  setCopiado(true)

  setTimeout(() => {

    setCopiado(false)

  }, 2000)

}

/* ========================================
   EXPORTAR EXCEL
======================================== */

function exportarExcel() {

  exportarExcelMoto(

    envios,

    tarifas,

    cobrarEnvios

  )

}


  return (

    <div
  className="
    fixed
    inset-0
    bg-black/60
    backdrop-blur-sm
    flex
    justify-center
    items-center
    z-50
    p-6
  "
>

      <div
  className="
    relative
    overflow-hidden
    bg-white
    rounded-[32px]
    border
    border-gray-100
    shadow-2xl
    w-full
    max-w-6xl
    h-[90vh]
    flex
    flex-col
  "
>

<div
  className="
    absolute
    top-0
    left-0
    right-0
    h-2
    bg-gradient-to-r
    from-cyan-500
    via-blue-500
    to-purple-500
  "
/>

        {/* ========================================
            CABECERA
        ======================================== */}

      <div
  className="
    px-8
    pt-10
    pb-6
    border-b
    border-gray-100
  "
>

          <h2
className="
text-4xl
font-extrabold
tracking-tight
text-gray-900
"
>
            Copiar datos para Motorizado
          </h2>
<p
  className="
    mt-2
    text-gray-500
  "
>
  Revisa los envíos antes de copiar o exportar la información.
</p>
        </div>

        {/* ========================================
            CONTENIDO
        ======================================== */}

        <div
className="
flex-1
overflow-y-auto
p-8
space-y-6
"
>

          <ResumenCopiarDatos

            total={total}

            cobrar={cobrar}

            noCobrar={noCobrar}

          />

          <div
            className="
              grid
              gap-4
            "
          >

            {

              envios.map((envio) => {

  const tarifa = buscarTarifa(

    envio.destino,

    tarifas

  )

  return (

    <TarjetaEnvio

                    key={envio.id}

                    envio={envio}

                    cobrar={
                 cobrarEnvios[
                envio.id
                 ] ?? false
                 }
                    
                     tarifa={tarifa}
                  

                    onCambiarCobro={() =>

                      onCambiarCobro(
                        envio.id
                      )

                    }

                  />

                )

              })

            }

          </div>

        </div>

        {/* ========================================
    COBRAR TODOS
======================================== */}

<div
className="
bg-gray-50
border
border-gray-200
rounded-2xl
p-5
flex
items-center
justify-between
"
>

  <span
className="
font-semibold
text-gray-700
"
>
    Cobrar todos los envíos
  </span>

 <input
type="checkbox"
checked={cobrarTodos}
onChange={cambiarTodos}
className="
h-5
w-5
rounded
accent-cyan-600
cursor-pointer
"
/>

</div>

        {/* ========================================
            BOTONES
        ======================================== */}



<div
  className="
    border-t
    border-gray-100
    px-8
    py-6
  "
>

  <BotonesModal
    onCerrar={onCerrar}
    onCopiar={copiarDatos}
    onExportar={exportarExcel}
    copiado={copiado}
  />

</div>
      </div>

    </div>

  )

}