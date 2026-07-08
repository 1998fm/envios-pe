'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useRouter } from 'next/navigation'
import EstadoSelect from '@/components/EstadoSelect'
import TamanoSelect from '@/components/TamanoSelect'
import { exportarShalom } from 'app/f/[slug]/lib/shalomExport'
import { toast } from 'sonner'
import agenciasShalom
from '@/data/agencias-shalom.json'
import ConfiguracionLogistica
from '@/components/ConfiguracionLogistica'
import SelectorDias
from '@/components/SelectorDias'
import ConfiguracionMetodo from '@/components/ConfiguracionMetodo'

import { obtenerConfiguracionLogistica } from '@/lib/logistica/guardarConfiguracionLogistica'


import EtiquetasImpresion from '../../src/components/EtiquetasImpresion'
import ModalEtiquetas from '@/components/ModalEtiquetas'

import ModalCambioMasivo from '@/components/ModalCambioMasivo'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
/* ========================================
   COPIAR DATOS
======================================== */

import {

  ModalCopiarDatos

} from '@/components/copiar-datos'
/*======================================== */
import distritosMoto
from '@/data/distritos-moto.json'

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

const [mensajeToast, setMensajeToast] =
  useState('')

  const [tarifas, setTarifas] =
  useState<
    Record<string, string>
  >({})

  
// ========================================
// VISTA CONFIGURACION
// ========================================

const [vistaConfig,
  setVistaConfig] =
  useState('EMPRESA')
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

const [
  mostrarModalCopiar,
  setMostrarModalCopiar
] = useState(false)

/* ========================================
   COBRAR ENVÍOS
======================================== */

const [

  cobrarEnvios,

  setCobrarEnvios

] = useState<{

  [id:number]: boolean

}>({})
/*======================================== */

/* ========================================
   CAMBIAR COBRO
======================================== */
/* ========================================
   ABRIR MODAL COPIAR DATOS
======================================== */

function abrirModalCopiar() {

  const estadoInicial: Record<number, boolean> = {}

  enviosMotoSeleccionados.forEach((envio) => {

    estadoInicial[envio.id] = false

  })

  setCobrarEnvios(estadoInicial)

  setMostrarModalCopiar(true)

}
/*======================================== */
function cambiarCobro(

  id:number

){

  setCobrarEnvios(

    anterior => ({

      ...anterior,

      [id]:
      !anterior[id]

    })

  )

}
/*======================================== */

/* ========================================
   EXPORTAR
======================================== */

function exportarDatos(){

}
/*======================================== */

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
// ========================================
// DATOS DE EMPRESA
// ========================================

const [empresa, setEmpresa] =
  useState('')

const [telefonoEmpresa,
  setTelefonoEmpresa] =
  useState('')

const [direccionEmpresa,
  setDireccionEmpresa] =
  useState('')

const [slugEmpresa,
  setSlugEmpresa] =
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
] = useState(false)

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

/* ========================================
   MÉTODOS DE ENVÍO
======================================== */

const [

  metodoMotorizado,

  setMetodoMotorizado

] = useState(true)

const [

  metodoShalom,

  setMetodoShalom

] = useState(true)

const [

  metodoOlva,

  setMetodoOlva

] = useState(false)

const [

  metodoMarvisur,

  setMetodoMarvisur

] = useState(false)

const [

  metodoFlores,

  setMetodoFlores

] = useState(false)

const [

  metodoOtro,

  setMetodoOtro

] = useState(false)

const [

  nombreMetodoOtro,

  setNombreMetodoOtro

] = useState('')

/* ========================================
   CONFIGURACIÓN LOGÍSTICA
======================================== */

const diasSemana = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const [
  logisticaMotoDias,
  setLogisticaMotoDias,
] = useState<string[]>(['MONDAY'])

const [
  logisticaMotoHoraCorte,
  setLogisticaMotoHoraCorte,
] = useState('18:00')

const [
  logisticaMotoLimitar,
  setLogisticaMotoLimitar,
] = useState(false)

const [
  logisticaMotoCupo,
  setLogisticaMotoCupo,
] = useState(0)

const [
  logisticaAgenciasDias,
  setLogisticaAgenciasDias,
] = useState<string[]>(['MONDAY'])

const [
  logisticaAgenciasHoraCorte,
  setLogisticaAgenciasHoraCorte,
] = useState('18:00')

const [
  logisticaMotoUsaHoraCorte,
  setLogisticaMotoUsaHoraCorte,
] = useState(false)

const [
  logisticaAgenciasUsaHoraCorte,
  setLogisticaAgenciasUsaHoraCorte,
] = useState(false)

const [
  logisticaAgenciasLimitar,
  setLogisticaAgenciasLimitar,
] = useState(false)

const [
  logisticaAgenciasCupo,
  setLogisticaAgenciasCupo,
] = useState(0)

const metodosDisponibles = [

  metodoShalom && {
    value: 'SHALOM',
    label: 'Shalom',
  },

  metodoOlva && {
    value: 'OLVA',
    label: 'Olva',
  },

  metodoMotorizado && {
    value: 'MOTORIZADO',
    label: 'Motorizado',
  },

  metodoMarvisur && {
    value: 'MARVISUR',
    label: 'Marvisur',
  },

  metodoFlores && {
    value: 'FLORES',
    label: 'Flores',
  },

  metodoOtro &&
nombreMetodoOtro.trim() && {
  value: nombreMetodoOtro,
  label: nombreMetodoOtro,
},

].filter(
  (
    item
  ): item is {
    value: string
    label: string
  } => Boolean(item)
)

/* ========================================
   VARIABLES DERIVADAS
======================================== */

const hayAgenciasActivas =
  metodoShalom ||
  metodoOlva ||
  metodoMarvisur ||
  metodoFlores ||
  metodoOtro
/* ========================================
   ENVÍOS MOTO SELECCIONADOS
======================================== */

const enviosMotoSeleccionados =
  envios.filter(
    (envio) =>
      seleccionados.includes(envio.id) &&
      envio.metodo === 'MOTORIZADO'
  )
  /* ========================================
   MOSTRAR BOTÓN COPIAR DATOS
======================================== */

const mostrarBotonCopiar =
  enviosMotoSeleccionados.length > 0 &&
  enviosMotoSeleccionados.length ===
    seleccionados.length

  useEffect(() => {
    async function cargar() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }
// ========================================
// CREAR PERFIL AUTOMÁTICO
// ========================================

const { error: crearPerfilError } =
  await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
      },
      {
        onConflict: 'id',
      }
    )

if (crearPerfilError) {

  console.error(
    'Error creando perfil:',
    crearPerfilError
  )

}
  const { data: profile } =
  await supabase
    .from('profiles')
    .select(`
      empresa,
      slug,
      telefono,
      direccion,

      origen_shalom,
      logo_url,
      redirect_url,
      redirect_message,

      instagram_url,
      facebook_url,
      tiktok_url,
      web_url,
      whatsapp_url,
      metodo_motorizado,
metodo_shalom,
metodo_olva,
metodo_marvisur,
metodo_flores,
metodo_otro,
nombre_metodo_otro,
logistica_moto_dias,
logistica_moto_hora_corte,
logistica_moto_usa_hora_corte,
logistica_moto_limitar,
logistica_moto_cupo,

logistica_agencias_dias,
logistica_agencias_hora_corte,
logistica_agencias_usa_hora_corte,
logistica_agencias_limitar,
logistica_agencias_cupo
    `)
    .eq('id', user.id)
    .maybeSingle()

// ========================================
// CARGAR TARIFAS
// ========================================

const {
  data: tarifasData
} = await supabase
  .from('tarifas_moto')
  .select(`
    distrito,
    precio
  `)
  .eq(
    'profile_id',
    user.id
  )

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

// ========================================
// SET TARIFAS
// ========================================

if (tarifasData) {

  const tarifasObj =
    tarifasData.reduce(
      (
        acc,
        item
      ) => {

        acc[
          item.distrito
        ] =
          String(
            item.precio
          )

        return acc

      },

      {} as Record<
        string,
        string
      >
    )

  setTarifas(
    tarifasObj
  )

}

setEmpresa(
  profile?.empresa || ''
)

setTelefonoEmpresa(
  profile?.telefono || ''
)

setDireccionEmpresa(
  profile?.direccion || ''
)

setSlugEmpresa(
  profile?.slug || ''
)
setMetodoMotorizado(
  profile?.metodo_motorizado ?? true
)

setMetodoShalom(
  profile?.metodo_shalom ?? true
)

setMetodoOlva(
  profile?.metodo_olva ?? false
)

setMetodoMarvisur(
  profile?.metodo_marvisur ?? false
)

setMetodoFlores(
  profile?.metodo_flores ?? false
)

setMetodoOtro(
  profile?.metodo_otro ?? false
)

setNombreMetodoOtro(
  profile?.nombre_metodo_otro || ''
)

/* ========================================
   CONFIGURACIÓN LOGÍSTICA
======================================== */

setLogisticaMotoDias(
  profile?.logistica_moto_dias ?? ['MONDAY']
)

setLogisticaMotoHoraCorte(
  profile?.logistica_moto_hora_corte ?? '18:00'
)

setLogisticaMotoUsaHoraCorte(
  profile?.logistica_moto_usa_hora_corte ?? false
)

setLogisticaMotoLimitar(
  profile?.logistica_moto_limitar ?? false
)

setLogisticaMotoCupo(
  profile?.logistica_moto_cupo ?? 0
)

setLogisticaAgenciasDias(
  profile?.logistica_agencias_dias ?? ['MONDAY']
)

setLogisticaAgenciasHoraCorte(
  profile?.logistica_agencias_hora_corte ?? '18:00'
)

setLogisticaAgenciasUsaHoraCorte(
  profile?.logistica_agencias_usa_hora_corte ?? false
)

setLogisticaAgenciasLimitar(
  profile?.logistica_agencias_limitar ?? false
)

setLogisticaAgenciasCupo(
  profile?.logistica_agencias_cupo ?? 0
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

  toast.success(
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

         empresa: empresa,

         telefono: telefonoEmpresa,

         direccion: direccionEmpresa,

         slug:
         empresa
         .toLowerCase()
         .trim()
         .replaceAll(' ', '-'),

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

          metodo_motorizado:
  metodoMotorizado,

metodo_shalom:
  metodoShalom,

metodo_olva:
  metodoOlva,

metodo_marvisur:
  metodoMarvisur,

metodo_flores:
  metodoFlores,

metodo_otro:
  metodoOtro,

nombre_metodo_otro:
  nombreMetodoOtro,

  ...obtenerConfiguracionLogistica({

  logisticaMotoDias,
  logisticaMotoUsaHoraCorte,
  logisticaMotoHoraCorte,
  logisticaMotoLimitar,
  logisticaMotoCupo,

  logisticaAgenciasDias,
  logisticaAgenciasUsaHoraCorte,
  logisticaAgenciasHoraCorte,
  logisticaAgenciasLimitar,
  logisticaAgenciasCupo,

}),

      })
      .eq(
        'id',
        user.id
      )

  if (error) {
    alert(error.message)
    return
  }

  
// ========================================
// GUARDAR TARIFAS
// ========================================

const tarifasParaGuardar =
  Object.entries(
    tarifas
  )
    .filter(
      ([_, precio]) =>
        precio !== ''
    )
    .map(
      ([distrito, precio]) => ({
        profile_id:
          user.id,

        distrito,

        precio:
          Number(precio),
      })
    )

if (
  tarifasParaGuardar.length > 0
) {

  const {
    error: tarifasError,
  } = await supabase
    .from(
      'tarifas_moto'
    )
    .upsert(
      tarifasParaGuardar,
      {
        onConflict:
          'profile_id,distrito',
      }
    )

  if (tarifasError) {

    console.error(
      tarifasError
    )

    setMensajeToast(
      'Error guardando tarifas'
    )

    return

  }

}

  setOrigenShalom(
    nuevoOrigen
  )

 setMensajeToast(
        'Configuración guardada'
      )

      setTimeout(() => {
        setMensajeToast('')
      }, 1500)

  setMostrarConfig(false)

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

    const metodoEnvio =
      envio.nombre_metodo || envio.metodo

    const coincideMetodo =
      filtroMetodo === 'TODOS'
        ? true
        : metodoEnvio === filtroMetodo

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

// ========================================
// AGRUPAR POR FECHA PROGRAMADA
// ========================================

const enviosAgrupados = enviosFiltrados.reduce(
  (acc, envio) => {

    const fecha =
      envio.fecha_programada
        ? new Date(envio.fecha_programada)
            .toISOString()
            .split('T')[0]
        : 'SIN_FECHA'

    if (!acc[fecha]) {
      acc[fecha] = []
    }

    acc[fecha].push(envio)

    return acc

  },
  {} as Record<string, typeof enviosFiltrados>
)

const fechasAgrupadas = Object.keys(
  enviosAgrupados
).sort(
  (a, b) => {

    if (a === 'SIN_FECHA') return 1
    if (b === 'SIN_FECHA') return -1

    return (
      new Date(a).getTime() -
      new Date(b).getTime()
    )

  }
)

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
    mb-5
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
 

 <div
  className="
    flex
    justify-end
    gap-5
  "
>
<button
    onClick={() => {

      navigator.clipboard.writeText(
        `${window.location.origin}/f/${slugEmpresa}`
      )

      setMensajeToast(
        '✅ Formulario copiado'
      )

      setTimeout(() => {
        setMensajeToast('')
      }, 1500)

    }}
   className="
bg-white
border
border-gray-200

text-gray-700

px-6
py-3

rounded-2xl

font-semibold

shadow-sm

transition-all
duration-300
ease-in-out

hover:bg-gradient-to-r
hover:from-cyan-600
hover:to-blue-600
hover:text-white
hover:border-transparent
hover:shadow-lg
hover:scale-[1.02]
"
  >
    Compartir formulario
  </button>

  <button
    onClick={() =>
      setMostrarConfig(true)
    }
    className="
bg-white
border
border-gray-200

text-gray-700

px-6
py-3

rounded-2xl

font-semibold

shadow-sm

transition-all
duration-300
ease-in-out

hover:bg-gradient-to-r
hover:from-cyan-600
hover:to-blue-600
hover:text-white
hover:border-transparent
hover:shadow-lg
hover:scale-[1.02]
"
  >
    ⚙ Configuración
  </button>

</div>
</div>


  <div
  className="
    bg-white
    border
    border-gray-100
    rounded-[32px]
    shadow-2xl
    p-8
    space-y-6
    mb-8
  "
>

  <div
  className="
    flex
    gap-4
    flex-wrap
    items-center
  "
>

    <Input
  type="text"
  placeholder="Buscar nombre, DNI o teléfono..."
  value={busqueda}
  onChange={(e) =>
    setBusqueda(e.target.value)
  }
  className="
    flex-1
    min-w-[320px]
  "
/>

    <select
      value={filtroEstado}
      onChange={(e) =>
        setFiltroEstado(e.target.value)
      }
     className="
bg-gray-50
border
border-gray-200

rounded-2xl

px-5
py-4

focus:outline-none
focus:ring-2
focus:ring-cyan-500

transition
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
    bg-gray-50
    border
    border-gray-200
    rounded-2xl
    px-5
    py-4
    focus:outline-none
    focus:ring-2
    focus:ring-cyan-500
    transition
  "
>

  <option value="TODOS">
    Todos los métodos
  </option>

  {metodosDisponibles.map((metodo) => (

    <option
      key={metodo.value}
      value={metodo.value}
    >
      {metodo.label}
    </option>

  ))}

</select>

  </div>

</div>

 
<div
 className="
  flex
  items-center
  gap-4
  mb-6
  flex-wrap
"
>


  <button
    onClick={exportarSeleccionados}
    className="
bg-white
border
border-gray-200

text-gray-700

px-6
py-3

rounded-2xl

font-semibold

shadow-sm

transition-all
duration-300
ease-in-out

hover:bg-gradient-to-r
hover:from-cyan-600
hover:to-blue-600
hover:text-white
hover:border-transparent
hover:shadow-lg
hover:scale-[1.02]
"
  >
    Exportar Shalom
  </button>

  <button
    onClick={() =>
      setMostrarModalEstado(true)
    }
  className="
bg-white
border
border-gray-200

text-gray-700

px-6
py-3

rounded-2xl

font-semibold

shadow-sm

transition-all
duration-300
ease-in-out

hover:bg-gradient-to-r
hover:from-cyan-600
hover:to-blue-600
hover:text-white
hover:border-transparent
hover:shadow-lg
hover:scale-[1.02]
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
bg-white
border
border-gray-200

text-gray-700

px-6
py-3

rounded-2xl

font-semibold

shadow-sm

transition-all
duration-300
ease-in-out

hover:bg-gradient-to-r
hover:from-cyan-600
hover:to-blue-600
hover:text-white
hover:border-transparent
hover:shadow-lg
hover:scale-[1.02]
"
  >
    Generar etiquetas
  </button>


{
  mostrarBotonCopiar && (

<button
  onClick={abrirModalCopiar}


className="
bg-white
border
border-gray-200

text-gray-700

px-6
py-3

rounded-2xl

font-semibold

shadow-sm

transition-all
duration-300
ease-in-out

hover:bg-gradient-to-r
hover:from-cyan-600
hover:to-blue-600
hover:text-white
hover:border-transparent
hover:shadow-lg
hover:scale-[1.02]
"

>

📋 Copiar datos

</button>

)
}
</div> 


<div
  className="
    overflow-x-auto
  "
>

  <div
    className="
      bg-white
      rounded-[32px]
      border
      border-gray-100
      shadow-2xl
      overflow-hidden
    "
  >

    {/* ========================================
        CABECERA
    ======================================== */}

    <div
      className="
        flex
        justify-between
        items-center
        px-8
        py-4
        border-b
        border-gray-100
        bg-white
      "
    >

      <div
        className="
          flex
          items-center
          gap-3
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
          onChange={toggleSeleccionTodos}
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
            font-semibold
            text-gray-700
          "
        >
          Seleccionar todos
        </span>

        <span
          className="
            text-xs
            text-gray-500
          "
        >
          ({seleccionados.length} seleccionados)
        </span>

      </div>

    </div>

{/* VISTA ESTILO TARJETA */}


 <div
  className="
  flex
  flex-col
  gap-5
  p-5
"
>

{fechasAgrupadas.map((fecha) => (
  <div key={fecha} className="space-y-4 mb-10">

    <div className="flex items-center gap-3">

      <div className="text-xl font-bold text-gray-800">
        {fecha === 'SIN_FECHA'
          ? 'Sin fecha programada'
          : new Date(fecha).toLocaleDateString(
              'es-PE',
              {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }
            )}
      </div>

      <div className="h-px flex-1 bg-gray-200" />

    </div>

    {enviosAgrupados[fecha].map(
       (
    envio: (typeof enviosFiltrados)[number]
  ) => {

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
            rounded-[28px]
            border
            border-gray-100
            border-l-4
            ${colorEstado}
            p-6
            cursor-pointer
            hover:shadow-xl
            hover:border-cyan-200
            transition-all
            duration-300
            flex
            items-center
            justify-between
            gap-8
          `}
        >

       {/* CLIENTE */}

<div
  className="
    flex
    items-center
    gap-4
    min-w-[340px]
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
    rounded-2xl

    bg-gradient-to-r
    from-cyan-600
    to-blue-600

    text-white

    flex
    items-center
    justify-center

    font-bold
    shadow-md
  "
>
  {envio.nombre
    ?.charAt(0)
    ?.toUpperCase()}
</div>

          <div>

            <div
             className="
  text-xl
font-extrabold
tracking-tight
"
            >
              {envio.nombre}
            </div>

            <div
              className="
                text-sm
                text-gray-600
              "
            >
              DNI {envio.dni}
            </div>

            <div
              className="
                text-sm
                text-gray-600
              "
            >
             TLF {envio.telefono}
            </div>

          </div>

        </div>

        {/* INFORMACION*/}

        <div
          className="
           flex-1
    space-y-3
          "
        >

          <div>

  <div
    className="
      text-xs
      uppercase
      tracking-wider
      font-semibold
      text-gray-500
      mb-1
    "
  >
    Destino
  </div>

  <div
    className="
      text-gray-800
      leading-6
    "
  >
    {envio.detalle}
  </div>

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
tracking-wider
font-semibold
text-gray-500
mb-2
            "
          >
            Método
          </div>

          <div
            className="
  inline-flex
  items-center
  justify-center

  px-3
  py-1

  rounded-full

  bg-gray-100
text-gray-700

  text-xs
  font-semibold
"
          >
            {envio.nombre_metodo || envio.metodo}
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
tracking-wider
font-semibold
text-gray-500
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
tracking-wider
font-semibold
text-gray-500
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
    min-w-[120px]
    text-center
  "
>

  <div
    className="
      text-xs
      uppercase
      tracking-wider
      font-semibold
      text-gray-500
      mb-2
    "
  >
    Registro
  </div>

  <div
    className="
      text-sm
      text-gray-600
      whitespace-nowrap
    "
  >
    {new Date(
      envio.fecha_registro
    ).toLocaleDateString(
      'es-PE'
    )}
  </div>

</div>

        {/* BOTON */}

        <button
          onClick={(e) => {
            e.stopPropagation()
            setEnvioDetalle(envio)
          }}
          className="
  px-5
  py-2.5

  rounded-2xl

  bg-white
  border
  border-gray-200

  text-gray-700
  font-semibold

  hover:bg-gray-50

  transition-all
"
        >
          Ver
        </button>

      </div>

       )

    })}

  </div>
))}

  </div>


</div>

  </div>


{/* MODAL DE CONFIGURACION */}

<Modal
  open={mostrarConfig}
  maxWidth="max-w-4xl"
>

<div
  className="
    flex
    flex-col
    h-[90vh]
  "
>

 <div
  className="
    p-6
    border-b
    shrink-0
    bg-white
  "
>

  <h2
    className="
      text-2xl
      font-bold
    "
  >
    Configuración
  </h2>

</div>



{/* ========================================
    MENU CONFIGURACION
======================================== */}
<div
  className="
    flex-1
    overflow-y-auto
    p-6
  "
>

<div
  className="
    flex
    gap-2
    mb-6
    bg-slate-100
    p-2
    rounded-2xl
  "
>

  <button
    onClick={() =>
      setVistaConfig(
        'EMPRESA'
      )
    }
    className={`
      flex-1
      py-2
      rounded-xl
      font-medium
      transition

      ${
        vistaConfig ===
        'EMPRESA'
          ? 'bg-white shadow'
          : ''
      }
    `}
  >
    🏢 Empresa
  </button>

  <button
    onClick={() =>
      setVistaConfig(
        'LOGISTICA'
      )
    }
    className={`
      flex-1
      py-2
      rounded-xl
      font-medium
      transition

      ${
        vistaConfig ===
        'LOGISTICA'
          ? 'bg-white shadow'
          : ''
      }
    `}
  >
    🚚 Logística
  </button>

  <button
    onClick={() =>
      setVistaConfig(
        'TARIFAS'
      )
    }
    className={`
      flex-1
      py-2
      rounded-xl
      font-medium
      transition

      ${
        vistaConfig ===
        'TARIFAS'
          ? 'bg-white shadow'
          : ''
      }
    `}
  >
    💰 Tarifas
  </button>

</div>

    {/* ========================================
    DATOS DE EMPRESA
======================================== */}
{
  vistaConfig ===
  'EMPRESA' && (

    <>
<div
  className="
    mb-8
    p-5
    border
    rounded-2xl
    bg-slate-50
  "
>

  <h3
    className="
      text-lg
      font-bold
      mb-4
    "
  >
    Datos de empresa
  </h3>

  <input
    type="text"
    placeholder="Nombre empresa"
    value={empresa}
    onChange={(e) =>
      setEmpresa(
        e.target.value
      )
    }
    className="
      w-full
      border
      rounded-xl
      px-4
      py-3
      mb-3
    "
  />

  <input
    type="text"
    placeholder="Teléfono empresa"
    value={telefonoEmpresa}
    onChange={(e) =>
      setTelefonoEmpresa(
        e.target.value
      )
    }
    className="
      w-full
      border
      rounded-xl
      px-4
      py-3
      mb-3
    "
  />

  <input
    type="text"
    placeholder="Dirección empresa"
    value={direccionEmpresa}
    onChange={(e) =>
      setDireccionEmpresa(
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
 </>

  )
}

{
  vistaConfig ===
  'LOGISTICA' && (

    <div
      className="
        space-y-6
      "
    >


  <div
  className="
    space-y-8
  "
>

  <div
    className="
      bg-white
      border
      rounded-3xl
      p-8
      shadow-sm
    "
  >

    <h2
      className="
        text-xl
        font-bold
      "
    >
      Métodos de envío
    </h2>

    <p
      className="
        text-sm
        text-gray-500
        mt-2
      "
    >
      Activa los métodos que ofrecerás a tus clientes y
      configura su comportamiento.
    </p>

    <div
  className="
    mt-8
    space-y-6
  "
>

  {/* MOTORIZADO */}

  <label
    className="
      flex
      items-center
      gap-3
      cursor-pointer
    "
  >

    <input
      type="checkbox"
      checked={metodoMotorizado}
      onChange={(e)=>

        setMetodoMotorizado(
          e.target.checked
        )

      }
    />

    <span
      className="
        font-semibold
        text-lg
      "
    >
      Motorizado
    </span>

  </label>

{metodoMotorizado && (

  <ConfiguracionMetodo

  dias={logisticaMotoDias}
  setDias={setLogisticaMotoDias}

  usaHora={logisticaMotoUsaHoraCorte}
  setUsaHora={setLogisticaMotoUsaHoraCorte}

  hora={logisticaMotoHoraCorte}
  setHora={setLogisticaMotoHoraCorte}

  limitar={logisticaMotoLimitar}
  setLimitar={setLogisticaMotoLimitar}

  cupo={logisticaMotoCupo}
  setCupo={setLogisticaMotoCupo}

/>

)}

 

  {/* AGENCIAS */}

 <p
  className="
    mt-8
    mb-4
    font-semibold
    text-lg
  "
>
  Agencias
</p>

<div
  className="
    ml-4
    space-y-4
  "
>

 {/* SHALOM */}

  <label
    className="
      flex
      items-center
      gap-3
      cursor-pointer
    "
  >

    <input
      type="checkbox"
      checked={metodoShalom}
      onChange={(e)=>

        setMetodoShalom(
          e.target.checked
        )

      }
    />

    <span
      className="
        font-semibold
        text-lg
      "
    >
      Shalom
    </span>

  </label>

{metodoShalom && (

  <div
    className="
      ml-8
      mt-4
      rounded-2xl
      border
      bg-slate-50
      p-6
    "
  >

    <label
      className="
        block
        font-semibold
        mb-3
      "
    >
      Agencia de origen
    </label>

    <select

  value={nuevoOrigen}

  onChange={(e)=>

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
    bg-white
  "

>

  <option value="">
    Selecciona una agencia
  </option>

  {agenciasShalom.map((agencia) => (

    <option

      key={agencia}

      value={agencia}

    >

      {agencia}

    </option>

  ))}

</select>
  </div>

)}
  <label
    className="
      flex
      items-center
      gap-3
      cursor-pointer
    "
  >

    <input
      type="checkbox"
      checked={metodoOlva}
      onChange={(e)=>

        setMetodoOlva(
          e.target.checked
        )

      }
    />

    <span>Olva</span>

  </label>

  <label
    className="
      flex
      items-center
      gap-3
      cursor-pointer
    "
  >

    <input
      type="checkbox"
      checked={metodoMarvisur}
      onChange={(e)=>

        setMetodoMarvisur(
          e.target.checked
        )

      }
    />

    <span>Marvisur</span>

  </label>

  <label
    className="
      flex
      items-center
      gap-3
      cursor-pointer
    "
  >

    <input
      type="checkbox"
      checked={metodoFlores}
      onChange={(e)=>

        setMetodoFlores(
          e.target.checked
        )

      }
    />

    <span>Flores</span>

  </label>

  <label
    className="
      flex
      items-center
      gap-3
      cursor-pointer
    "
  >

    <input
      type="checkbox"
      checked={metodoOtro}
      onChange={(e)=>

        setMetodoOtro(
          e.target.checked
        )

      }
    />

    <span>Otro método</span>

  </label>

{metodoOtro && (

  <div
    className="
      ml-8
      mt-4
      mb-6
      rounded-2xl
      border
      bg-slate-50
      p-6
    "
  >

    <label
      className="
        block
        font-semibold
        mb-3
      "
    >
      Nombre del método
    </label>

    <input
      type="text"
      value={nombreMetodoOtro}
      onChange={(e)=>
        setNombreMetodoOtro(
          e.target.value
        )
      }
      placeholder="Ej. Cruz del Sur"
      className="
        w-full
        border
        rounded-xl
        px-4
        py-3
        bg-white
      "
    />

  </div>

)}

</div>

{hayAgenciasActivas && (

  <ConfiguracionMetodo

  dias={logisticaAgenciasDias}
  setDias={setLogisticaAgenciasDias}

  usaHora={logisticaAgenciasUsaHoraCorte}
  setUsaHora={setLogisticaAgenciasUsaHoraCorte}

  hora={logisticaAgenciasHoraCorte}
  setHora={setLogisticaAgenciasHoraCorte}

  limitar={logisticaAgenciasLimitar}
  setLimitar={setLogisticaAgenciasLimitar}

  cupo={logisticaAgenciasCupo}
  setCupo={setLogisticaAgenciasCupo}

  nombreMetodoOtro={nombreMetodoOtro}
  setNombreMetodoOtro={setNombreMetodoOtro}
  mostrarNombreMetodo={metodoOtro}

/>

)}

</div>

  </div>

</div>
    </div>

  )
}
{
  vistaConfig ===
  'TARIFAS' && (

    <div
      className="
        p-5
        border
        rounded-2xl
        bg-slate-50
      "
    >

      <h3
        className="
          text-lg
          font-bold
          mb-2
        "
      >
        Tarifas motorizado
      </h3>

      <p
        className="
          text-sm
          text-gray-500
          mb-6
        "
      >
        Define cuánto cobrar
        por cada distrito.
      </p>

      <div
        className="
          space-y-3
        "
      >

        {distritosMoto.map(
          (distrito) => (

            <div
              key={distrito}
              className="
                flex
                items-center
                justify-between
                gap-4

                bg-white
                border
                rounded-xl

                px-4
                py-3
              "
            >

              <div
                className="
                  font-medium
                  text-gray-700
                "
              >
                {distrito}
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <span
                  className="
                    text-gray-500
                    text-sm
                  "
                >
                  S/
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={
                    tarifas[
                      distrito
                    ] || ''
                  }
                  onChange={(e) =>
                    setTarifas(
                      {
                        ...tarifas,

                        [distrito]:
                          e.target.value,
                      }
                    )
                  }
                  className="
                    w-24
                    border
                    rounded-lg
                    px-3
                    py-2
                    text-right
                  "
                />

              </div>

            </div>

          )
        )}

      </div>

    </div>

  )
}
</div>

  <div
  className="
    border-t
    bg-white
    p-6
    shrink-0
    flex
    justify-end
    gap-3
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
    onClick={guardarConfiguracion}
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

</Modal>



{/* MODAL DE export */}

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
    w-full
    max-w-2xl
    max-h-[90vh]
    flex
    flex-col
    shadow-xl
    overflow-hidden
  "
>
      <div
        className="
          p-8
          border-b
          border-gray-100
        "
      >
        <h2
          className="
            text-4xl
            font-extrabold
            text-slate-900
          "
        >
          Exportar Shalom
        </h2>

        <p
          className="
            mt-3
            text-gray-750
            whitespace-pre-line
          "
        >
          {mensajeExportar}
        </p>
      </div>

      <div
        className="
          p-8
          space-y-6
        "
      >
        <div
          className="
            bg-slate-50
            border
            border-gray-200
            rounded-2xl
            p-6
          "
        >
          <div
            className="
              text-sm
              uppercase
              tracking-wider
              text-gray-500
              font-semibold
            "
          >
            Envíos a exportar
          </div>

          <div
            className="
              text-5xl
              font-extrabold
              text-slate-900
              mt-2
              mb-5
            "
          >
            {enviosExportar.length}
          </div>

          <div
            className="
              space-y-2
              text-sm
              text-gray-600
            "
          >
            <div>
              <span className="font-semibold text-gray-800">
                Método:
              </span>{" "}
              SHALOM
            </div>

            <div>
              <span className="font-semibold text-gray-800">
                Origen:
              </span>{" "}
              {origenShalom}
            </div>
          </div>
        </div>

        <div
          className="
            flex
            items-center
            gap-4
            bg-slate-50
            border
            border-gray-200
            rounded-2xl
            p-5
          "
        >
          <input
            type="checkbox"
            checked={marcarComoEnviado}
            onChange={(e) =>
              setMarcarComoEnviado(e.target.checked)
            }
            className="
              w-5
              h-5
              accent-cyan-600
              cursor-pointer
            "
          />

          <label
            className="
              text-sm
              text-gray-700
              select-none
              leading-relaxed
            "
          >
            Marcar automáticamente los pedidos como{" "}
            <span
              className="
                font-semibold
                text-green-700
              "
            >
              ENVIADO
            </span>{" "}
            después de exportarlos.
          </label>
        </div>
      </div>

      <div
        className="
          border-t
          border-gray-100
          p-6
          flex
          justify-end
          gap-4
        "
      >
        <button
          onClick={() => setMostrarModalExportar(false)}
          className="
            px-7
            py-3
            rounded-2xl
            border
            border-gray-300
            font-semibold
            hover:bg-gray-100
            transition-all
          "
        >
          Cancelar
        </button>

        <button
          onClick={confirmarExportacion}
          className="
            bg-black
            text-white
            px-7
            py-3
            rounded-2xl
            font-semibold
            hover:bg-gray-900
            transition-all
          "
        >
          {marcarComoEnviado
            ? "Exportar y enviar"
            : "Exportar"}
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
  bg-black/50
  backdrop-blur-sm
  flex
  items-center
  justify-center
  z-50
  p-4
"
  >

    <div
      className="
  bg-white
  rounded-[33px]
  border
  border-gray-150
  shadow-2xl
  overflow-hidden
  w-full
  max-w-xl
"
    >

      <div
  className="
    border-b
    border-gray-100
    px-8
    py-6
  "
>

  <h2
    className="
      text-3xl
      font-extrabold
      tracking-tight
      text-gray-900
    "
  >
    Detalle del pedido
  </h2>

  <p
    className="
      mt-2
      text-gray-500
    "
  >
    Información completa del envío seleccionado.
  </p>

</div>

    <div
  className="
      bg-gray-50
    rounded-2xl
    p-7
    mb-2
  "
>

        <div>

  <div
    className="
      text-xs
      uppercase
      tracking-wider
      text-gray-500
      font-bold
      mb-2
    "
  >
    Cliente
  </div>

  <div
    className="
      text-3xl
      font-extrabold
      tracking-tight
      text-gray-900
      mb-8
    "
  >
    {envioDetalle.nombre}
  </div>

</div>

        <div
  className="
    grid
    grid-cols-2
    gap-4
  "
>

  <div
    className="
      bg-gray-50
      rounded-2xl
      p-4
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wider
        text-gray-500
        font-bold
        mb-1
      "
    >
      Documento
    </p>

    <p className="font-semibold">
      {envioDetalle.dni}
    </p>
  </div>

  <div
    className="
      bg-gray-50
      rounded-2xl
      p-4
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wider
        text-gray-500
        font-bold
        mb-1
      "
    >
      Teléfono
    </p>

    <p className="font-semibold">
      {envioDetalle.telefono}
    </p>
  </div>

  <div
    className="
      bg-gray-50
      rounded-2xl
      p-4
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wider
        text-gray-500
        font-bold
        mb-1
      "
    >
      Método
    </p>

    <p className="font-semibold">
      {envioDetalle.metodo}
    </p>
  </div>

  <div
    className="
      bg-gray-50
      rounded-2xl
      p-4
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wider
        text-gray-500
        font-bold
        mb-1
      "
    >
      Estado
    </p>

    <p className="font-semibold">
      {envioDetalle.estado}
    </p>
  </div>

  <div
    className="
      bg-gray-50
      rounded-2xl
      p-4
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wider
        text-gray-500
        font-bold
        mb-1
      "
    >
      Tamaño
    </p>

    <p className="font-semibold">
      {envioDetalle.tamano}
    </p>
  </div>

  <div
    className="
      bg-gray-50
      rounded-2xl
      p-4
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wider
        text-gray-500
        font-bold
        mb-1
      "
    >
      Registro
    </p>

    <p className="font-semibold">
      {new Date(
        envioDetalle.fecha_registro
      ).toLocaleString('es-PE')}
    </p>
  </div>

</div>
        <div>

          <div
  className="
    bg-gray-50
    rounded-2xl
    p-5
  "
>

  <p
    className="
      text-xs
      uppercase
      tracking-wider
      text-gray-500
      font-bold
      mb-3
    "
  >
    Destino
  </p>

  <div
    className="
      text-gray-800
      leading-relaxed
      whitespace-pre-line
    "
  >
    {envioDetalle.detalle}
  </div>

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

       <div
  className="
    border-t
    border-gray-100
    p-6
  "
>

  <button
  onClick={() =>
    setEnvioDetalle(null)
  }
  className="
    bg-black
    hover:bg-gray-900

    text-white

    px-8
    py-3

    rounded-2xl

    font-semibold

    transition-colors
  "
>
  Cerrar
</button>
</div>

      </div>

    </div>

  </div>

)}

{/* MODAL PARA CAMBIO DE ESTADOS  */}

<ModalCambioMasivo
  abierto={mostrarModalEstado}

  metodoMasivo={metodoMasivo}
  setMetodoMasivo={setMetodoMasivo}

  estadoOrigenMasivo={estadoOrigenMasivo}
  setEstadoOrigenMasivo={setEstadoOrigenMasivo}

  estadoDestinoMasivo={estadoDestinoMasivo}
  setEstadoDestinoMasivo={setEstadoDestinoMasivo}

  soloSeleccionados={soloSeleccionados}
  setSoloSeleccionados={setSoloSeleccionados}

  seleccionados={seleccionados}

  metodosDisponibles={metodosDisponibles}

  aplicarCambioMasivo={aplicarCambioMasivo}

  onCerrar={() =>
    setMostrarModalEstado(false)
  }
/>

{/* =======================================
   <ModalEtiquetas Y <EtiquetasImpresion
======================================= */}

<ModalEtiquetas
  abierto={mostrarEtiquetas}
  tipoEtiqueta={tipoEtiqueta}
  onCambiarTipo={setTipoEtiqueta}
  onCerrar={() => setMostrarEtiquetas(false)}
/>


<EtiquetasImpresion
  tipoEtiqueta={tipoEtiqueta}
  gruposEtiquetas={gruposEtiquetas}
  enviosEtiquetas={enviosEtiquetas}
  logoUrl={logoUrl}
/>

{mensajeToast && (

  <div
  className="
    fixed
    top-5
    left-1/2
    -translate-x-1/2

    z-50

    bg-white
    text-gray-900

    border
    border-gray-200

    px-5
    py-3

    rounded-2xl
    shadow-xl

    font-medium
  "
>
  {mensajeToast}
</div>

)}

<ModalCopiarDatos

  abierto={mostrarModalCopiar}

  envios={enviosMotoSeleccionados}

  tarifas={Object.entries(tarifas).map(

    ([distrito, precio]) => ({

      distrito,

      precio: Number(precio)

    })

  )}

  cobrarEnvios={cobrarEnvios}

  setCobrarEnvios={setCobrarEnvios}

  onCerrar={() =>

    setMostrarModalCopiar(false)

  }

  onCambiarCobro={

    cambiarCobro

  }

/>
    </main>
  )
}
