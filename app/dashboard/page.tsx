'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import EstadoSelect from '@/components/EstadoSelect'
import TamanoSelect from '@/components/TamanoSelect'
import { exportarShalom } from '@/lib/shalomExport'
import * as XLSX from 'xlsx'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [envios, setEnvios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] =
    useState('TODOS')
  const [filtroMetodo, setFiltroMetodo] =
    useState('TODOS')

  const [seleccionados, setSeleccionados] =
    useState<string[]>([])

    const [
  marcarComoEnviado,
  setMarcarComoEnviado,
] = useState(true)


// ========================================
// ETIQUETAS
// ========================================

const [
  mostrarEtiquetas,
  setMostrarEtiquetas,
] = useState(false)

const [
  tipoEtiqueta,
  setTipoEtiqueta,
] = useState<'A4' | 'INDIVIDUAL'>('A4')

const [
  enviosEtiquetas,
  setEnviosEtiquetas,
] = useState<any[]>([])

/* MODAL COPIAR DATOS */

const [
  mostrarModalCopiar,
  setMostrarModalCopiar,
] = useState(false)

const [
  textoCopiar,
  setTextoCopiar,
] = useState('')

    function toggleSeleccionTodos() {

  const idsVisibles =
    enviosFiltrados.map(
      (envio) => envio.id
    )

  const todosSeleccionados =
    idsVisibles.every(
      (id) =>
        seleccionados.includes(id)
    )

  if (todosSeleccionados) {

    setSeleccionados((prev) =>
      prev.filter(
        (id) =>
          !idsVisibles.includes(id)
      )
    )

  } else {

    setSeleccionados((prev) => [

      ...new Set([
        ...prev,
        ...idsVisibles,
      ]),

    ])

  }

}

async function cambiarEstadoMasivo(
  nuevoEstado: string
) {

  if (
    seleccionados.length === 0
  ) {
    alert(
      'Selecciona al menos un envío'
    )
    return
  }

  setCambiandoEstado(true)

  const { error } =
    await supabase
      .from('envios')
      .update({
        estado: nuevoEstado,
      })
      .in('id', seleccionados)

  setCambiandoEstado(false)

  if (error) {
    alert(error.message)
    return
  }

  setEnvios((prev) =>
    prev.map((envio) => {

      if (
        seleccionados.includes(
          envio.id
        )
      ) {
        return {
          ...envio,
          estado: nuevoEstado,
        }
      }

      return envio
    })
  )

  alert(
    `${seleccionados.length} envíos actualizados`
  )
}


const [cambiandoEstado, setCambiandoEstado] =
  useState(false)


    const [origenShalom, setOrigenShalom] =
  useState('')

const [mostrarConfig, setMostrarConfig] =
  useState(false)

  
const [nuevoOrigen, setNuevoOrigen] =
  useState('')

  const [logoFile, setLogoFile] =
  useState<File | null>(null)

const [logoUrl, setLogoUrl] =
  useState('')

const [redirectUrl, setRedirectUrl] =
  useState('')

  const [
  redirectMessage,
  setRedirectMessage,
] = useState('')

const [instagramUrl, setInstagramUrl] =
  useState('')

const [facebookUrl, setFacebookUrl] =
  useState('')

const [tiktokUrl, setTiktokUrl] =
  useState('')

const [webUrl, setWebUrl] =
  useState('')

const [whatsappUrl, setWhatsappUrl] =
  useState('')

  const [
  mostrarModalExportar,
  setMostrarModalExportar,
] = useState(false)

const [
  mostrarModalEstado,
  setMostrarModalEstado,
] = useState(false)

const [
  metodoMasivo,
  setMetodoMasivo,
] = useState('TODOS')

const [
  estadoOrigenMasivo,
  setEstadoOrigenMasivo,
] = useState('EMPACADO')

const [
  estadoDestinoMasivo,
  setEstadoDestinoMasivo,
] = useState('ENVIADO')

const [
  soloSeleccionados,
  setSoloSeleccionados,
] = useState(true)

const [envioDetalle, setEnvioDetalle] =
  useState<any>(null)

const [
  vistaDashboard,
  setVistaDashboard,
] = useState<'CARDS'>(
  
)
  
const [
  mensajeExportar,
  setMensajeExportar,
] = useState('')

const [
  enviosExportar,
  setEnviosExportar,
] = useState<any[]>([])

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
  .from('profiles')
.select(`
  origen_shalom,
  logo_url,
  redirect_url,
  redirect_message,
  instagram_url,
  facebook_url,
  tiktok_url,
  web_url,
  whatsapp_url
`)
  .eq('id', user.id)
  .single()

setOrigenShalom(
  profile?.origen_shalom || ''
)
setNuevoOrigen(
  profile?.origen_shalom || ''
)

setLogoUrl(
  profile?.logo_url || ''
)

setRedirectUrl(
  profile?.redirect_url || ''
)

setRedirectMessage(
  profile?.redirect_message || ''
)

setInstagramUrl(
  profile?.instagram_url || ''
)

setFacebookUrl(
  profile?.facebook_url || ''
)

setTiktokUrl(
  profile?.tiktok_url || ''
)

setWebUrl(
  profile?.web_url || ''
)

setWhatsappUrl(
  profile?.whatsapp_url || ''
)

      const { data } = await supabase
        .from('envios')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha_registro', {
          ascending: false,
        })

      setEnvios(data || [])
      setLoading(false)
    }

    cargar()
  }, [router, supabase])

useEffect(() => {

  return () => {


  }

}, [])

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter(
          (item) => item !== id
        )
      }

      return [...prev, id]
    })
  }

async function exportarSeleccionados() {

  let lista: any[] = []

  if (seleccionados.length > 0) {

    lista = envios.filter(
      (envio) =>
        seleccionados.includes(
          envio.id
        ) &&
        envio.metodo === 'SHALOM'
    )

    setMensajeExportar(
      `¿Está seguro que desea exportar los ${lista.length} envíos seleccionados?`
    )

  } else {

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } =
      await supabase
        .from('envios')
        .select('*')
        .eq('user_id', user.id)
        .eq('metodo', 'SHALOM')
        .eq('estado', 'EMPACADO')

    if (error) {
      alert(error.message)
      return
    }

    lista = data || []

    setMensajeExportar(
      'No hay envíos seleccionados.\n\n¿Desea exportar todos los envíos SHALOM empacados?'
    )

  }

  if (lista.length === 0) {

    alert(
      'No existen envíos SHALOM para exportar.'
    )

    return
  }

  setEnviosExportar(lista)

  setMostrarModalExportar(true)

}

async function confirmarExportacion() {

  if (!origenShalom) {

    alert(
      'Configura primero tu origen Shalom.'
    )

    return
  }

  exportarShalom(
  enviosExportar,
  origenShalom
)

if (marcarComoEnviado) {

  const ids =
    enviosExportar.map(
      (e) => e.id
    )

  const { error } =
    await supabase
      .from('envios')
      .update({
        estado: 'ENVIADO',
      })
      .in('id', ids)

 if (!error) {

  const {
  data: { user },
} = await supabase.auth.getUser()

const { data: nuevosEnvios } =
  await supabase
    .from('envios')
    .select('*')
    .eq(
      'user_id',
      user?.id
    )
    .order(
      'fecha_registro',
      {
        ascending: false,
      }
    )

setEnvios(
  nuevosEnvios || []
)

}

}

setSeleccionados([])

setMostrarModalExportar(false)
}

async function aplicarCambioMasivo() {

  let ids: string[] = []

  if (soloSeleccionados) {

    if (
      seleccionados.length === 0
    ) {

      alert(
        'Selecciona al menos un envío.'
      )

      return
    }

    ids = seleccionados

  } else {

    ids = envios
      .filter((envio) => {

        const metodoOk =
          metodoMasivo ===
          'TODOS'
            ? true
            : envio.metodo ===
              metodoMasivo

        const estadoOk =
          envio.estado ===
          estadoOrigenMasivo

        return (
          metodoOk &&
          estadoOk
        )
      })
      .map(
        (envio) => envio.id
      )

  }

  if (ids.length === 0) {

    alert(
      'No existen pedidos para actualizar.'
    )

    return
  }

  const { error } =
    await supabase
      .from('envios')
      .update({
        estado:
          estadoDestinoMasivo,
      })
      .in('id', ids)

  if (error) {

    alert(error.message)

    return
  }

  setEnvios((prev) =>
    prev.map((envio) => {

      if (
        ids.includes(
          envio.id
        )
      ) {

        return {
          ...envio,
          estado:
            estadoDestinoMasivo,
        }

      }

      return envio

    })
  )

  setSeleccionados([])

  setMostrarModalEstado(
    false
  )

  alert(
    `${ids.length} pedidos actualizados`
  )

}

async function guardarConfiguracion() {

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  let nuevaLogoUrl = logoUrl

  if (logoFile) {

    const extension =
      logoFile.name
        .split('.')
        .pop()

    const filePath =
      `${user.id}/logo.${extension}`

    const {
      error: uploadError,
    } = await supabase.storage
      .from('logos')
      .upload(
        filePath,
        logoFile,
        {
          upsert: true,
        }
      )

    if (uploadError) {
      alert(
        uploadError.message
      )
      return
    }

    const { data } =
      supabase.storage
        .from('logos')
        .getPublicUrl(
          filePath
        )

    nuevaLogoUrl =
      data.publicUrl

    setLogoUrl(
      nuevaLogoUrl
    )
  }

  const { error } =
    await supabase
      .from('profiles')
      .update({

        origen_shalom:
          nuevoOrigen,

        logo_url:
          nuevaLogoUrl,

        redirect_url:
          redirectUrl,

        redirect_message:
          redirectMessage,

        instagram_url:
          instagramUrl,

        facebook_url:
          facebookUrl,

        tiktok_url:
          tiktokUrl,

        web_url:
          webUrl,

        whatsapp_url:
          whatsappUrl,

      })
      .eq(
        'id',
        user.id
      )

  if (error) {
    alert(error.message)
    return
  }

  setOrigenShalom(
    nuevoOrigen
  )

  alert(
    'Configuración guardada'
  )

  setMostrarConfig(false)

}

/* GENERAR TEXTO PARA MOTORIZADO */

function generarTextoMoto() {

  const texto =
    pedidosSeleccionados
      .map(
        (envio) =>

`${envio.nombre}
${envio.telefono}
${envio.detalle}

*COBRAR () *`
      )
      .join('\n\n')

  setTextoCopiar(texto)

  setMostrarModalCopiar(true)

}
/* COPIAR AL PORTAPAPELES */

async function copiarDatos() {

  await navigator.clipboard.writeText(
    textoCopiar
  )

  alert(
    'Datos copiados'
  )

}

/* EXPORTAR EXCEL MOTORIZADO */

function descargarDatosMoto() {

  const bloques =
    textoCopiar
      .split('\n\n')
      .filter(Boolean)

  const filas =
    bloques.map(
      (bloque) => {

        const lineas =
          bloque
            .split('\n')
            .filter(Boolean)

        const nombre =
          lineas[0] || ''

        const telefono =
          lineas[1] || ''

        const direccion =
          lineas[2] || ''

        const cobrarLinea =
          lineas.find(
            (l) =>
              l.includes(
                'COBRAR'
              )
          ) || ''

        const cobrar =
          cobrarLinea
            .replace(
              '*COBRAR',
              ''
            )
            .replace('*', '')
            .trim()

        return {

          Nombre: nombre,

          Telefono: telefono,

          Distrito:
            direccion
              .split(',')[0]
              ?.trim(),

          Direccion:
            direccion,

          Cobrar:
            cobrar,

        }

      }
    )

  const wb =
    XLSX.utils.book_new()

  const ws =
    XLSX.utils.json_to_sheet(
      filas
    )

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    'Pedidos Moto'
  )

  XLSX.writeFile(
    wb,
    'Pedidos_Motorizado.xlsx'
  )

}
/* VALIDAR SI TODOS LOS SELECCIONADOS SON MOTORIZADO */

const pedidosSeleccionados =
  envios.filter(
    (envio) =>
      seleccionados.includes(
        envio.id
      )
  )

const todosMoto =
  pedidosSeleccionados.length > 0 &&
  pedidosSeleccionados.every(
    (envio) =>
      envio.metodo ===
      'MOTORIZADO'
  )

  const enviosFiltrados = useMemo(() => {
    return envios.filter((envio) => {
      const coincideBusqueda =
        envio.nombre
          ?.toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        envio.dni?.includes(busqueda) ||
        envio.telefono?.includes(busqueda)

      const coincideEstado =
        filtroEstado === 'TODOS'
          ? true
          : envio.estado === filtroEstado

      const coincideMetodo =
        filtroMetodo === 'TODOS'
          ? true
          : envio.metodo === filtroMetodo

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideMetodo
      )
    })
  }, [
    envios,
    busqueda,
    filtroEstado,
    filtroMetodo,
  ])

  if (loading) {
    return (
      <div className="p-10">
        Cargando...
      </div>
    )
  }
const gruposEtiquetas = []

for (
  let i = 0;
  i < enviosEtiquetas.length;
  i += 4
) {
  gruposEtiquetas.push(
    enviosEtiquetas.slice(
      i,
      i + 4
    )
  )
}
  return (
  <main
  className="
    min-h-screen
    bg-slate-50
    p-10
  "
>

   <div
  className="
    flex
    justify-between
    items-center
    mb-4
    px-12
  "
>

  <div>

    {logoUrl ? (

      <img
        src={logoUrl}
        alt="Logo"
        className="
          h-12
          max-w-[180px]
          object-contain
        "
      />

    ) : null}

  </div>

  <button
    onClick={() =>
      setMostrarConfig(true)
    }
    className="
      bg-black
      text-white
      px-4
      py-2
      rounded-xl
      hover:opacity-90
      transition
    "
  >
    ⚙ Configuración
  </button>

</div>

      <div
  className="
    bg-white
    border
    rounded-2xl
    p-5
    shadow-sm
    mb-6
  "
>

  <div
    className="
      flex
      gap-3
      flex-wrap
    "
  >

    <input
      type="text"
      placeholder="Buscar nombre, DNI o teléfono..."
      value={busqueda}
      onChange={(e) =>
        setBusqueda(e.target.value)
      }
      className="
        flex-1
        min-w-[280px]
        border
        rounded-xl
        px-4
        py-3
      "
    />

    <select
      value={filtroEstado}
      onChange={(e) =>
        setFiltroEstado(e.target.value)
      }
      className="
        border
        rounded-xl
        px-4
        py-3
      "
    >
      <option value="TODOS">
        Todos los estados
      </option>

      <option value="NO_EMPACADO">
        No empacado
      </option>

      <option value="EMPACADO">
        Empacado
      </option>

      <option value="ENVIADO">
        Enviado
      </option>

    </select>

    <select
      value={filtroMetodo}
      onChange={(e) =>
        setFiltroMetodo(e.target.value)
      }
      className="
        border
        rounded-xl
        px-4
        py-3
      "
    >
      <option value="TODOS">
        Todos los métodos
      </option>

      <option value="SHALOM">
        Shalom
      </option>

      <option value="OLVA">
        Olva
      </option>

      <option value="MOTORIZADO">
        Motorizado
      </option>

    </select>

  </div>

</div>

 
<div
  className="
    flex
    items-center
    gap-3
    mb-4
    flex-wrap
  "
>


  <button
    onClick={exportarSeleccionados}
    className="
      bg-green-600
      text-white
      px-3
      py-1
      rounded-xl
      font-medium
    "
  >
    Exportar Shalom
  </button>

  <button
    onClick={() =>
      setMostrarModalEstado(true)
    }
    className="
      bg-purple-600
      text-white
      px-3
      py-1
      rounded-xl
      font-medium
      hover:bg-purple-700
      transition
    "
  >
    Cambio Masivo
  </button>

  <button
    onClick={() => {

      if (
        seleccionados.length === 0
      ) {
        alert(
          'Selecciona al menos un envío'
        )
        return
      }

      const pedidos =
        envios.filter(
          (envio) =>
            seleccionados.includes(
              envio.id
            )
        )

      setEnviosEtiquetas(
        pedidos
      )

      setMostrarEtiquetas(true)

    }}
    className="
      bg-blue-600
      text-white
      px-3
      py-1
      rounded-xl
      font-medium
    "
  >
    Generar etiquetas
  </button>{/* COPIAR DATOS MOTO */}

{todosMoto && (

  <button
    onClick={
      generarTextoMoto
    }
    className="
      bg-cyan-600
      text-white
      px-3
      py-1
      rounded-xl
      font-medium
      hover:bg-cyan-700
      transition
    "
  >
    Copiar Datos
  </button>

)}

</div>


<div
  className="
    bg-white
    rounded-2xl
    shadow-sm
    border
    overflow-hidden
  "
>

  <div
    className="
      overflow-x-auto
    "
  >

    <div
  className="
    bg-white
    rounded-3xl
    shadow-lg
    border
    border-gray-200
    overflow-hidden
  "
>

  <div
    className="
      flex
      justify-between
      items-center
      px-6
      py-5
      border-b
      bg-gradient-to-r
      from-white
      to-gray-50
    "
  >

    <div
  className="
    flex
    items-center
    gap-3
    bg-white
    border
    border-gray-200
    rounded-2xl
    px-5
    py-3
  "
>

  <input
    type="checkbox"
    checked={
      enviosFiltrados.length > 0 &&
      enviosFiltrados.every(
        (envio) =>
          seleccionados.includes(
            envio.id
          )
      )
    }
    onChange={
      toggleSeleccionTodos
    }
    className="
      w-5
      h-5
      accent-cyan-500
      cursor-pointer
    "
  />

  <span
    className="
      text-sm
      font-medium
      text-gray-700
    "
  >
    Seleccionar todos
  </span>

  <span
    className="
      text-sm
      text-gray-400
    "
  >
    ({seleccionados.length} envíos)
  </span>

</div>

  </div>

{/* VISTA ESTILO TARJETA */}


 <div
  className="
    flex
    flex-col
    gap-4
  "
>

{enviosFiltrados.map(
  (envio) => {

    const colorEstado =
      envio.estado === 'ENVIADO'
        ? 'border-l-green-500'
        : envio.estado === 'EMPACADO'
        ? 'border-l-yellow-500'
        : 'border-l-red-500'

    return (

      <div
        key={envio.id}
        onDoubleClick={() =>
          setEnvioDetalle(envio)
        }
        className={`
          bg-white
          rounded-2xl
          border
          border-gray-200
          border-l-4
          ${colorEstado}
          p-5
          cursor-pointer
          hover:shadow-lg
          hover:border-blue-300
          transition-all

          flex
          items-center
          justify-between
          gap-6
        `}
      >

       {/* CLIENTE */}

<div
  className="
    flex
    items-center
    gap-4
    min-w-[320px]
  "
>

  <input
    type="checkbox"
    checked={seleccionados.includes(
      envio.id
    )}
    onClick={(e) =>
      e.stopPropagation()
    }
    onChange={() =>
      toggleSeleccion(
        envio.id
      )
    }
    className="
      w-5
      h-5
      shrink-0
      accent-cyan-500
      cursor-pointer
    "
  />


          <div
            className="
              w-12
              h-12
              rounded-xl
              bg-black
              text-white
              flex
              items-center
              justify-center
              font-bold
            "
          >
            {envio.nombre
              ?.charAt(0)
              ?.toUpperCase()}
          </div>

          <div>

            <div
              className="
                font-bold
                text-lg
              "
            >
              {envio.nombre}
            </div>

            <div
              className="
                text-sm
                text-gray-500
              "
            >
              DNI {envio.dni}
            </div>

            <div
              className="
                text-sm
                text-gray-500
              "
            >
             TLF {envio.telefono}
            </div>

          </div>

        </div>

        {/* DESTINO */}

        <div
          className="
            flex-1
          "
        >

          <div
            className="
              text-xs
              uppercase
              text-gray-400
              font-bold
              mb-1
            "
          >
            Destino
          </div>

          <div
            className="
              text-gray-700
            "
          >
            {envio.detalle}
          </div>

        </div>

        {/* METODO */}

        <div
          className="
            min-w-[140px]
            text-center
          "
        >

          <div
            className="
              text-xs
              uppercase
              text-gray-400
              font-bold
              mb-2
            "
          >
            Método
          </div>

          <div
            className="
              px-3
              py-1
              rounded-full
              bg-blue-50
              text-blue-700
              text-sm
              font-semibold
            "
          >
            {envio.metodo}
          </div>

        </div>

       {/* TAMAÑO */}

<div
  className="
    min-w-[140px]
    text-center
  "
  onClick={(e) =>
    e.stopPropagation()
  }
>

  <div
    className="
      text-xs
      uppercase
      text-gray-400
      font-bold
      mb-2
    "
  >
    Tamaño
  </div>

  <TamanoSelect
    envioId={envio.id}
    tamanoActual={
      envio.tamano
    }
  />

</div>

{/* ESTADO */}

<div
  className="
    min-w-[160px]
    text-center
  "
  onClick={(e) =>
    e.stopPropagation()
  }
>

  <div
    className="
      text-xs
      uppercase
      text-gray-400
      font-bold
      mb-2
    "
  >
    Estado
  </div>

  <EstadoSelect
    envioId={envio.id}
    estadoActual={
      envio.estado
    }
  />

</div>

        {/* FECHA */}

        <div
          className="
            text-sm
            text-gray-400
            whitespace-nowrap
          "
        >
          {new Date(
            envio.fecha_registro
          ).toLocaleDateString(
            'es-PE'
          )}
        </div>

        {/* BOTON */}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setEnvioDetalle(envio)
          }}
          className="
            px-4
            py-2
            rounded-xl
            bg-black
            text-white
            text-sm
            font-medium
            hover:opacity-90
          "
        >
          Ver
        </button>

      </div>

    )

  }
)}

  </div>


</div>

  </div>

</div>

{/* MODAL DE CONFIGURACION */}

{mostrarConfig && (

  <div
    className="
      fixed
      inset-0
      bg-black/50
      flex
      items-center
      justify-center
      z-50
    "
  >

    <div
      className="
        bg-white
        rounded-2xl
        p-6
        w-full
        max-w-2xl
max-h-[90vh]
overflow-y-auto
        shadow-xl
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          mb-5
        "
      >
        Configuración
      </h2>

      <label
        className="
          block
          mb-2
          font-medium
        "
      >
        Origen Shalom
      </label>

      <input
        type="text"
        value={nuevoOrigen}
        onChange={(e) =>
          setNuevoOrigen(
            e.target.value
          )
        }
        className="
          w-full
          border
          rounded-xl
          px-4
          py-3
        "
      />

<div className="mt-6">

  <label
    className="
      block
      mb-2
      font-medium
    "
  >
    Logo del negocio
  </label>

  {logoUrl && (

    <img
      src={logoUrl}
      alt="Logo"
      className="
        h-20
        object-contain
        mb-3
        border
        rounded-xl
        p-2
      "
    />

  )}

  <input
    type="file"
    accept="
      image/png,
      image/jpeg,
      image/webp
    "
    onChange={(e) =>
      setLogoFile(
        e.target.files?.[0] || null
      )
    }
    className="
      w-full
      border
      rounded-xl
      px-4
      py-3
    "
  />

</div>

<label
  className="
    block
    mt-4
    mb-2
    font-medium
  "
>
  Mensaje de éxito
</label>

<textarea
  value={redirectMessage}
  onChange={(e) =>
    setRedirectMessage(
      e.target.value
    )
  }
  rows={4}
  className="
    w-full
    border
    rounded-xl
    px-4
    py-3
  "
  placeholder="
Gracias por tu compra.

En unos segundos te llevaremos a nuestro canal oficial.
  "
/>

<div className="mt-6">

  <label
    className="
      block
      mb-2
      font-medium
    "
  >
    URL de redirección
  </label>

  <input
    type="text"
    value={redirectUrl}
    onChange={(e) =>
      setRedirectUrl(
        e.target.value
      )
    }
    placeholder="
      https://mipagina.com
    "
    className="
      w-full
      border
      rounded-xl
      px-4
      py-3
    "
  />

</div>

<div className="mt-6">

  <h3
    className="
      font-semibold
      mb-3
    "
  >
    Redes sociales
  </h3>

  <div className="space-y-3">

    <input
      type="text"
      placeholder="Instagram"
      value={instagramUrl}
      onChange={(e) =>
        setInstagramUrl(
          e.target.value
        )
      }
      className="
        w-full
        border
        rounded-xl
        px-4
        py-3
      "
    />

    <input
      type="text"
      placeholder="Facebook"
      value={facebookUrl}
      onChange={(e) =>
        setFacebookUrl(
          e.target.value
        )
      }
      className="
        w-full
        border
        rounded-xl
        px-4
        py-3
      "
    />

    <input
      type="text"
      placeholder="TikTok"
      value={tiktokUrl}
      onChange={(e) =>
        setTiktokUrl(
          e.target.value
        )
      }
      className="
        w-full
        border
        rounded-xl
        px-4
        py-3
      "
    />

    <input
      type="text"
      placeholder="Página web"
      value={webUrl}
      onChange={(e) =>
        setWebUrl(
          e.target.value
        )
      }
      className="
        w-full
        border
        rounded-xl
        px-4
        py-3
      "
    />

    <input
      type="text"
      placeholder="WhatsApp"
      value={whatsappUrl}
      onChange={(e) =>
        setWhatsappUrl(
          e.target.value
        )
      }
      className="
        w-full
        border
        rounded-xl
        px-4
        py-3
      "
    />

  </div>

</div>


      <div
        className="
          flex
          justify-end
          gap-3
          mt-6
        "
      >

        <button
          onClick={() =>
            setMostrarConfig(false)
          }
          className="
            border
            px-4
            py-2
            rounded-xl
          "
        >
          Cancelar
        </button>

        <button
          onClick={
            guardarConfiguracion
          }
          className="
            bg-black
            text-white
            px-4
            py-2
            rounded-xl
          "
        >
          Guardar
        </button>

      </div>

    </div>

  </div>

)}

{/* MODAL DE CONFIGURACION */}

{mostrarModalExportar && (

  <div
    className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
    "
  >

    <div
      className="
        bg-white
        rounded-2xl
        p-6
        w-full
        max-w-lg
        shadow-xl
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          mb-4
        "
      >
        Exportar Shalom
      </h2>

      <p
        className="
          text-gray-700
          whitespace-pre-line
        "
      >
        {mensajeExportar}
      </p>

      <div
        className="
          mt-4
          p-4
          bg-gray-50
          rounded-xl
          border
        "
      >

        <div className="text-sm">
          Envíos a exportar:
        </div>

        <div className="font-bold text-2xl mt-1">
          {enviosExportar.length}
        </div>

        <div className="text-sm text-gray-500 mt-3">
          Método: SHALOM
        </div>

        <div className="text-sm text-gray-500">
          Origen: {origenShalom}
        </div>

      </div>

      <div
        className="
          mt-4
          flex
          items-center
          gap-3
        "
      >

        <input
          type="checkbox"
          checked={
            marcarComoEnviado
          }
          onChange={(e) =>
            setMarcarComoEnviado(
              e.target.checked
            )
          }
          className="
            w-4
            h-4
          "
        />

        <label
          className="
            text-sm
            text-gray-700
            select-none
          "
        >
          Marcar también como{' '}
          <span
            className="
              font-semibold
              text-green-700
            "
          >
            ENVIADO
          </span>
        </label>

      </div>

      <div
        className="
          flex
          justify-end
          gap-3
          mt-6
        "
      >

        <button
          onClick={() =>
            setMostrarModalExportar(false)
          }
          className="
            border
            px-4
            py-2
            rounded-xl
          "
        >
          Cancelar
        </button>

        <button
          onClick={
            confirmarExportacion
          }
          className="
            bg-green-600
            text-white
            px-4
            py-2
            rounded-xl
            hover:bg-green-700
            transition
          "
        >
          {
            marcarComoEnviado
              ? 'Exportar y enviar'
              : 'Exportar'
          }
        </button>

      </div>

    </div>

  </div>

)}

{/* MODAL DE DETALLES DOBLE CLICK*/}

{envioDetalle && (

  <div
    className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
    "
  >

    <div
      className="
        bg-white
        rounded-2xl
        p-6
        w-full
        max-w-lg
        shadow-xl
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          mb-6
        "
      >
        Detalle del pedido
      </h2>

      <div className="space-y-3">

        <div>
          <span className="font-semibold">
            Nombre:
          </span>{' '}
          {envioDetalle.nombre}
        </div>

        <div>
          <span className="font-semibold">
            Documento:
          </span>{' '}
          {envioDetalle.dni}
        </div>

        <div>
          <span className="font-semibold">
            Teléfono:
          </span>{' '}
          {envioDetalle.telefono}
        </div>

        <div>
          <span className="font-semibold">
            Método:
          </span>{' '}
          {envioDetalle.metodo}
        </div>

        <div>
          <span className="font-semibold">
            Estado:
          </span>{' '}
          {envioDetalle.estado}
        </div>

        <div>
          <span className="font-semibold">
            Tamaño:
          </span>{' '}
          {envioDetalle.tamano}
        </div>

        <div>
          <span className="font-semibold">
            Fecha:
          </span>{' '}
          {new Date(
            envioDetalle.fecha_registro
          ).toLocaleString('es-PE')}
        </div>

        <div>

          <div
            className="
              font-semibold
              mb-2
            "
          >
            Detalle
          </div>

          <div
            className="
              bg-gray-50
              border
              rounded-xl
              p-3
              whitespace-pre-line
            "
          >
            {envioDetalle.detalle}
          </div>

        </div>

      </div>

      <div
        className="
          flex
          justify-end
          mt-6
        "
      >

        <button
          onClick={() =>
            setEnvioDetalle(null)
          }
          className="
            bg-black
            text-white
            px-4
            py-2
            rounded-xl
          "
        >
          Cerrar
        </button>

      </div>

    </div>

  </div>

)}

{/* MODAL PARA CAMBIO DE ESTADOS  */}

{mostrarModalEstado && (

  <div
    className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
    "
  >

    <div
      className="
        bg-white
        rounded-2xl
        p-6
        w-full
        max-w-lg
        shadow-xl
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          mb-6
        "
      >
        Cambio Masivo
      </h2>

      <div className="space-y-4">

        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Método
          </label>

          <select
            value={metodoMasivo}
            onChange={(e) =>
              setMetodoMasivo(
                e.target.value
              )
            }
            disabled={
              soloSeleccionados
            }
            className="
              w-full
              border
              rounded-xl
              px-4
              py-3
            "
          >

            <option value="TODOS">
              Todos
            </option>

            <option value="SHALOM">
              SHALOM
            </option>

            <option value="OLVA">
              OLVA
            </option>

            <option value="MOTORIZADO">
              MOTORIZADO
            </option>

          </select>

        </div>

        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Estado actual
          </label>

          <select
            value={
              estadoOrigenMasivo
            }
            onChange={(e) =>
              setEstadoOrigenMasivo(
                e.target.value
              )
            }
            disabled={
              soloSeleccionados
            }
            className="
              w-full
              border
              rounded-xl
              px-4
              py-3
            "
          >

            <option value="NO_EMPACADO">
              No Empacado
            </option>

            <option value="EMPACADO">
              Empacado
            </option>

            <option value="ENVIADO">
              Enviado
            </option>

          </select>

        </div>

        <div>

          <label
            className="
              block
              text-sm
              font-medium
              mb-2
            "
          >
            Nuevo estado
          </label>

          <select
            value={
              estadoDestinoMasivo
            }
            onChange={(e) =>
              setEstadoDestinoMasivo(
                e.target.value
              )
            }
            className="
              w-full
              border
              rounded-xl
              px-4
              py-3
            "
          >

            <option value="NO_EMPACADO">
              No Empacado
            </option>

            <option value="EMPACADO">
              Empacado
            </option>

            <option value="ENVIADO">
              Enviado
            </option>

          </select>

        </div>

        <div
          className="
            flex
            items-center
            gap-3
            pt-2
          "
        >

          <input
            type="checkbox"
            checked={
              soloSeleccionados
            }
            onChange={(e) =>
              setSoloSeleccionados(
                e.target.checked
              )
            }
            className="
              w-4
              h-4
            "
          />

          <label
            className="
              text-sm
              text-gray-700
              select-none
            "
          >
            Solo cambiar pedidos seleccionados
          </label>

        </div>

        <div
          className="
            bg-gray-50
            border
            rounded-xl
            p-4
            text-sm
            text-gray-600
          "
        >

          {soloSeleccionados ? (

            <>
              Se modificarán
              {' '}
              <span className="font-bold">
                {seleccionados.length}
              </span>
              {' '}
              pedidos seleccionados.
            </>

          ) : (

            <>
              Se modificarán pedidos con:

              <div className="mt-2">
                Método:
                {' '}
                <span className="font-semibold">
                  {metodoMasivo}
                </span>
              </div>

              <div>
                Estado actual:
                {' '}
                <span className="font-semibold">
                  {estadoOrigenMasivo}
                </span>
              </div>

              <div>
                Nuevo estado:
                {' '}
                <span className="font-semibold text-blue-600">
                  {estadoDestinoMasivo}
                </span>
              </div>

            </>

          )}

        </div>

      </div>

      <div
        className="
          flex
          justify-end
          gap-3
          mt-6
        "
      >

        <button
          onClick={() =>
            setMostrarModalEstado(
              false
            )
          }
          className="
            border
            px-4
            py-2
            rounded-xl
          "
        >
          Cancelar
        </button>

        <button
          onClick={
            aplicarCambioMasivo
          }
          className="
            bg-purple-600
            text-white
            px-4
            py-2
            rounded-xl
            hover:bg-purple-700
            transition
          "
        >
          Aplicar cambios
        </button>

      </div>

    </div>

  </div>

)}

{/* =======================================
    MODAL ETIQUETAS
======================================= */}

{mostrarEtiquetas && (

  <div
    className="
      fixed
      inset-0
      bg-black/50
      z-50
      flex
      items-center
      justify-center
      p-4
    "
  >

    <div
      className="
        bg-white
        rounded-2xl
        w-full
        max-w-lg
        shadow-xl
      "
    >

      {/* TÍTULO */}

      <div
        className="
          px-6
          py-5
          border-b
        "
      >

        <h2
          className="
            text-2xl
            font-bold
          "
        >
          Generar etiquetas
        </h2>

        <p
          className="
            text-gray-500
            mt-1
          "
        >
          Selecciona el formato.
        </p>

      </div>

      {/* OPCIONES */}

      <div
        className="
          p-6
          space-y-4
        "
      >

        <label
          className="
            flex
            gap-3
            border
            rounded-xl
            p-4
            cursor-pointer
          "
        >

          <input
            type="radio"
            checked={
              tipoEtiqueta === 'A4'
            }
            onChange={() =>
              setTipoEtiqueta('A4')
            }
          />

          <div>

            <div
              className="
                font-semibold
              "
            >
              4 etiquetas por hoja
            </div>

            <div
              className="
                text-sm
                text-gray-500
              "
            >
              Distribución 2 x 2
            </div>

          </div>

        </label>

        <label
          className="
            flex
            gap-3
            border
            rounded-xl
            p-4
            cursor-pointer
          "
        >

          <input
            type="radio"
            checked={
              tipoEtiqueta ===
              'INDIVIDUAL'
            }
            onChange={() =>
              setTipoEtiqueta(
                'INDIVIDUAL'
              )
            }
          />

          <div>

            <div
              className="
                font-semibold
              "
            >
              Etiqueta individual
            </div>

            <div
              className="
                text-sm
                text-gray-500
              "
            >
              Una etiqueta por página
            </div>

          </div>

        </label>

      </div>

      {/* BOTONES */}

      <div
        className="
          border-t
          px-6
          py-4
          flex
          justify-end
          gap-3
        "
      >

        <button
          onClick={() =>
            setMostrarEtiquetas(false)
          }
          className="
            px-4
            py-2
            rounded-xl
            bg-gray-100
          "
        >
          Cancelar
        </button>

        <button
          onClick={() => {

            setMostrarEtiquetas(
              false
            )

            setTimeout(() => {
              window.print()
            }, 300)

          }}
          className="
            px-5
            py-2
            rounded-xl
            bg-black
            text-white
          "
        >
          Imprimir
        </button>

      </div>

    </div>

  </div>

)}

{/* =======================================
    ZONA DE IMPRESIÓN
======================================= */}

<div
  id="zona-impresion"
   className="fixed -left-[99999px] top-0"
>

  {/* 4 ETIQUETAS POR HOJA */}

  {tipoEtiqueta === 'A4' && (

  <>

    {gruposEtiquetas.map(
      (grupo, pagina) => (

        <div
          key={pagina}
          className="
            grid
            grid-cols-2
            gap-2
            min-h-screen
            break-after-page
            p-2
          "
        >

          {grupo.map(
            (envio) => (

   <div
  key={envio.id}
  className="
  border-2
  border-gray-300
  rounded-xl
  overflow-hidden
  bg-white
  flex
  flex-col
  min-h-[46vh]
"
>

  {/* CABECERA */}

  <div
    className="
      bg-black
      text-white
      text-center
      py-2
      font-bold
      tracking-wide
    "
  >
    {envio.metodo}
  </div>

  <div
    className="
      p-4
      flex
      flex-col
      flex-1
    "
  >

    {/* LOGO */}

    <div
      className="
        flex
        justify-center
        pb-3
        border-b
      "
    >

      {logoUrl && (

        <img
          src={logoUrl}
          alt="Logo"
          className="
            h-12
            object-contain
          "
        />

      )}

    </div>

    {/* CLIENTE */}

    <div className="mt-4">

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
        "
      >
        Cliente
      </div>

      <div
        className="
          text-2xl
          font-bold
          leading-tight
        "
      >
        {envio.nombre}
      </div>

    </div>

    {/* DNI */}

    <div className="mt-3">

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
        "
      >
        DNI
      </div>

      <div
        className="
          font-medium
        "
      >
        {envio.dni}
      </div>

    </div>

    {/* TELÉFONO */}

    <div className="mt-2">

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
        "
      >
        Teléfono
      </div>

      <div
        className="
          font-medium
        "
      >
        {envio.telefono}
      </div>

    </div>

    {/* DETALLE */}

    <div
      className="
        mt-4
        pt-3
        border-t
        flex-1
      "
    >

      <div
        className="
          text-[10px]
          uppercase
          text-gray-500
          font-bold
          mb-2
        "
      >
        Detalle de entrega
      </div>

      <div
        className="
          text-sm
          whitespace-pre-line
          leading-snug
        "
      >
        {envio.detalle}
      </div>

    </div>

  </div>

</div>

)
          )}

        </div>

      )
    )}

  </>

)}

  {/* INDIVIDUAL */}

  {tipoEtiqueta ===
    'INDIVIDUAL' && (

    <div>

      {enviosEtiquetas.map(
        (envio) => (

  <div
  key={envio.id}
  className="
    min-h-screen
    p-4
    break-after-page
    bg-white
  "
>

  <div
    className="
      h-[95vh]
      border-2
      border-gray-300
      rounded-xl
      overflow-hidden
      bg-white
      flex
      flex-col
    "
  >

    {/* CABECERA */}

    <div
      className="
        bg-black
        text-white
        text-center
        py-4
        text-3xl
        font-bold
        tracking-wide
      "
    >
      {envio.metodo}
    </div>

    <div
      className="
        p-8
        flex
        flex-col
        flex-1
      "
    >

      {/* LOGO */}

      <div
        className="
          flex
          justify-center
          pb-6
          border-b
        "
      >

        {logoUrl && (

          <img
            src={logoUrl}
            alt="Logo"
            className="
              h-24
              object-contain
            "
          />

        )}

      </div>

      {/* CLIENTE */}

      <div className="mt-8">

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
          "
        >
          Cliente
        </div>

        <div
          className="
            text-5xl
            font-bold
            leading-tight
          "
        >
          {envio.nombre}
        </div>

      </div>

      {/* DNI */}

      <div className="mt-8">

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
          "
        >
          DNI
        </div>

        <div
          className="
            text-3xl
            font-medium
          "
        >
          {envio.dni}
        </div>

      </div>

      {/* TELÉFONO */}

      <div className="mt-6">

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
          "
        >
          Teléfono
        </div>

        <div
          className="
            text-3xl
            font-medium
          "
        >
          {envio.telefono}
        </div>

      </div>

      {/* DETALLE */}

      <div
        className="
          mt-8
          pt-6
          border-t
          flex-1
        "
      >

        <div
          className="
            text-sm
            uppercase
            text-gray-500
            font-bold
            mb-3
          "
        >
          Detalle de entrega
        </div>

        <div
          className="
            text-2xl
            whitespace-pre-line
            leading-relaxed
          "
        >
          {envio.detalle}
        </div>

      </div>

    </div>

  </div>

</div>

        )
      )}

    </div>

  )}

</div>

{/* MODAL COPIAR DATOS */}

{mostrarModalCopiar && (

<div
  className="
    fixed
    inset-0
    bg-black/50
    flex
    items-center
    justify-center
    z-50
  "
>

  <div
    className="
      bg-white
      rounded-3xl
      w-full
      max-w-4xl
      p-6
    "
  >

    <h2
      className="
        text-2xl
        font-bold
        mb-4
      "
    >
      Datos para Motorizado
    </h2>

    <textarea
      value={textoCopiar}
      onChange={(e) =>
        setTextoCopiar(
          e.target.value
        )
      }
      className="
        w-full
        h-[450px]
        border
        rounded-2xl
        p-4
        font-mono
        text-sm
      "
    />

    <div
      className="
        flex
        justify-end
        gap-3
        mt-4
      "
    >

      <button
        onClick={
          copiarDatos
        }
        className="
          bg-cyan-600
          text-white
          px-5
          py-2
          rounded-xl
        "
      >
        Copiar
      </button>

      <button
        onClick={
          descargarDatosMoto
        }
        className="
          bg-green-600
          text-white
          px-5
          py-2
          rounded-xl
        "
      >
        Descargar Datos
      </button>

      <button
        onClick={() =>
          setMostrarModalCopiar(
            false
          )
        }
        className="
          bg-gray-200
          px-5
          py-2
          rounded-xl
        "
      >
        Cerrar
      </button>

    </div>

  </div>

</div>

)}
    </main>
  )
}