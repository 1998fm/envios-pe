/* ========================================
   PROPS
======================================== */

interface Props {

  onCopiar: () => void

  onExportar: () => void

  onCerrar: () => void

  copiado: boolean

}

/* ========================================
   BOTONES DEL MODAL
======================================== */

export default function BotonesModal({

  onCopiar,

  onExportar,

  onCerrar,

  copiado

}: Props) {

  return (

    <div
  className="
    border-t
    border-gray-100
    px-8
    py-6
    flex
    justify-end
    gap-4
    flex-wrap
  "
>

      {/* ========================================
          COPIAR
      ======================================== */}

      <button

        onClick={onCopiar}

       className="
  bg-gradient-to-r
  from-cyan-600
  to-blue-600
  text-white
  px-6
  py-3
  rounded-2xl
  font-semibold
  shadow-lg
  hover:scale-[1.02]
  transition-all
"

      >

        {

  copiado

    ? '✅ Copiado'

    : '📋 Copiar datos'

}

      </button>

      {/* ========================================
          EXPORTAR
      ======================================== */}

      <button

        onClick={onExportar}

       className="
  bg-gradient-to-r
  from-cyan-600
  to-blue-600
  text-white
  px-6
  py-3
  rounded-2xl
  font-semibold
  shadow-lg
  hover:scale-[1.02]
  transition-all
"

      >

        📊 Exportar Excel

      </button>

      {/* ========================================
          CERRAR
      ======================================== */}

      <button

        onClick={onCerrar}

       className="
  bg-gray-100
  border
  border-gray-200
  text-gray-700
  px-6
  py-3
  rounded-2xl
  font-semibold
  hover:bg-gray-200
  transition-all
"

      >

        Cerrar

      </button>

    </div>

  )

}