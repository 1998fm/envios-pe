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
import { obtenerConfiguracionLogistica } from '@/lib/logistica/guardarConfiguracionLogistica'

import EtiquetasImpresion from '../../src/components/EtiquetasImpresion'
import ModalEtiquetas from '@/components/ModalEtiquetas'

import ModalCambioMasivo from '@/components/ModalCambioMasivo'
import ModalDetalle from '@/components/ModalDetalle'
import ModalExportShalom from '@/components/ModalExportShalom'
import ModalConfiguracion from '@/components/ModalConfiguracion'
import DashboardTopBar from '@/components/DashboardTopBar'
import FilterBar from '@/components/FilterBar'
import DashboardActions from '@/components/DashboardActions'
import EnvioGroupedList from '@/components/EnvioGroupedList'
import LoadingSpinner from '@/components/LoadingSpinner'
import Toast from '@/components/Toast'
/* ========================================
   COPIAR DATOS
======================================== */

import {

  ModalCopiarDatos

} from '@/components/copiar-datos'
/*======================================== */
import distritosMoto
from '@/data/distritos-moto.json'
import ModalUpgrade from '@/components/ModalUpgrade'
import EstadisticasDashboard from '@/components/EstadisticasDashboard'
import { ConfigState, initialConfigState } from '@/types/config'
import type { Envio } from '@/types/envio'
import DashboardOnboarding from '@/components/DashboardOnboarding'

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [envios, setEnvios] = useState<Envio[]>([])
const [userId, setUserId] = useState<string | null>(null)
const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [filtrosEstado, setFiltrosEstado] = useState<string[]>([])
  const [filtrosMetodo, setFiltrosMetodo] = useState<string[]>([])

  const [seleccionados, setSeleccionados] =
    useState<string[]>([])

    const [
  marcarComoEnviado,
  setMarcarComoEnviado,
] = useState(true)

const [mensajeToast, setMensajeToast] =
  useState('')

  const [config, setConfig] =
  useState<ConfigState>(initialConfigState)
const [plan, setPlan] = useState('basic')
const [diasRestantes, setDiasRestantes] = useState<number | null>(null)
const [mostrarUpgrade, setMostrarUpgrade] = useState(false)
const [agruparPor, setAgruparPor] = useState<'programada' | 'registro'>('programada')
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
] = useState<Envio[]>([])

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

] = useState<Record<string, boolean>>({})
/*======================================== */

/* ========================================
   CAMBIAR COBRO
======================================== */
/* ========================================
   ABRIR MODAL COPIAR DATOS
======================================== */

function abrirModalCopiar() {

  const estadoInicial: Record<string, boolean> = {}

  enviosMotoSeleccionados.forEach((envio) => {

    estadoInicial[envio.id] = false

  })

  setCobrarEnvios(estadoInicial)

  setMostrarModalCopiar(true)

}
/*======================================== */
function cambiarCobro(

  id:string

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

    function toggleSeleccionTodos() {

  const idsVisibles =
    envios.map(
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
  nuevoEstado: Envio['estado']
) {

  if (
    seleccionados.length === 0
  ) {
    toast.error(
      'Selecciona al menos un envío'
    )
    return
  }

  const { error } =
    await supabase
      .from('envios')
      .update({
        estado: nuevoEstado,
      })
      .in('id', seleccionados)

  if (error) {
    toast.error(error.message)
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

  toast.success(
    `${seleccionados.length} envíos actualizados`
  )
}

    const [origenShalom, setOrigenShalom] =
  useState('')
const [slugEmpresa,
  setSlugEmpresa] =
  useState('')

const [mostrarConfig, setMostrarConfig] =
  useState(false)

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
] = useState<Envio['estado']>('EMPACADO')

const [
  estadoDestinoMasivo,
  setEstadoDestinoMasivo,
] = useState<Envio['estado']>('ENVIADO')

const [
  soloSeleccionados,
  setSoloSeleccionados,
] = useState(false)

const [envioDetalle, setEnvioDetalle] =
  useState<Envio | null>(null)

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
] = useState<Envio[]>([])

const metodosDisponibles = [

  config.metodoShalom && {
    value: 'SHALOM',
    label: 'Shalom',
  },

  config.metodoOlva && {
    value: 'OLVA',
    label: 'Olva',
  },

  config.metodoMotorizado && {
    value: 'MOTORIZADO',
    label: 'Motorizado',
  },

  config.metodoMarvisur && {
    value: 'MARVISUR',
    label: 'Marvisur',
  },

  config.metodoFlores && {
    value: 'FLORES',
    label: 'Flores',
  },

  config.metodoOtro &&
config.nombreMetodoOtro.trim() && {
  value: config.nombreMetodoOtro,
  label: config.nombreMetodoOtro,
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
      plan,
      trial_end,
      pro_until,
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

const tarifasObj =
  tarifasData
    ? tarifasData.reduce(
        (acc, item) => {
          acc[item.distrito] = String(item.precio)
          return acc
        },
        {} as Record<string, string>
      )
    : {}

setConfig(prev => ({
  ...prev,
  empresa: profile?.empresa || '',
  telefonoEmpresa: profile?.telefono || '',
  direccionEmpresa: profile?.direccion || '',
  nuevoOrigen: profile?.origen_shalom || '',
  logoUrl: profile?.logo_url || '',
  redirectUrl: profile?.redirect_url || '',
  redirectMessage: profile?.redirect_message || '',
  instagramUrl: profile?.instagram_url || '',
  facebookUrl: profile?.facebook_url || '',
  tiktokUrl: profile?.tiktok_url || '',
  webUrl: profile?.web_url || '',
  whatsappUrl: profile?.whatsapp_url || '',
  metodoMotorizado: profile?.metodo_motorizado ?? true,
  metodoShalom: profile?.metodo_shalom ?? true,
  metodoOlva: profile?.metodo_olva ?? false,
  metodoMarvisur: profile?.metodo_marvisur ?? false,
  metodoFlores: profile?.metodo_flores ?? false,
  metodoOtro: profile?.metodo_otro ?? false,
  nombreMetodoOtro: profile?.nombre_metodo_otro || '',
  logisticaMotoDias: profile?.logistica_moto_dias ?? ['MONDAY'],
  logisticaMotoHoraCorte: profile?.logistica_moto_hora_corte ?? '18:00',
  logisticaMotoUsaHoraCorte: profile?.logistica_moto_usa_hora_corte ?? false,
  logisticaMotoLimitar: profile?.logistica_moto_limitar ?? false,
  logisticaMotoCupo: profile?.logistica_moto_cupo ?? 0,
  logisticaAgenciasDias: profile?.logistica_agencias_dias ?? ['MONDAY'],
  logisticaAgenciasHoraCorte: profile?.logistica_agencias_hora_corte ?? '18:00',
  logisticaAgenciasUsaHoraCorte: profile?.logistica_agencias_usa_hora_corte ?? false,
  logisticaAgenciasLimitar: profile?.logistica_agencias_limitar ?? false,
  logisticaAgenciasCupo: profile?.logistica_agencias_cupo ?? 0,
  tarifas: tarifasObj,
}))

setSlugEmpresa(
  profile?.slug || ''
)

setPlan(profile?.plan || 'basic')

const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : null
const dias = trialEnd && trialEnd > new Date()
  ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  : null
setDiasRestantes(dias)
setUserId(user.id)
setLoading(false)
    }

    cargar()
  }, [router, supabase])

  // Manejar retorno de MercadoPago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
      toast.success('¡Pago exitoso! Bienvenido a Pro')
      window.history.replaceState({}, '', '/dashboard')
    } else if (paymentStatus === 'failure') {
      toast.error('El pago no pudo completarse. Intenta de nuevo.')
      window.history.replaceState({}, '', '/dashboard')
    } else if (paymentStatus === 'pending') {
      toast.info('Pago pendiente. Te notificaremos cuando se confirme.')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  async function fetchEnviosPage(offset: number): Promise<{ data: Envio[]; hasMore: boolean }> {
    if (!userId) return { data: [], hasMore: false }
    const params = new URLSearchParams({
      user_id: userId,
      offset: String(offset),
      limit: '50',
      busqueda,
      estados: filtrosEstado.join(','),
      metodos: filtrosMetodo.join(','),
    })
    const res = await fetch(`/api/envios?${params}`)
    const json = await res.json()
    if (!res.ok) return { data: [], hasMore: false }
    return { data: json.data || [], hasMore: (json.offset + json.limit) < json.total }
  }

  useEffect(() => {
    if (!userId) return
    fetchEnviosPage(0).then((result) => {
      setEnvios(result.data)
      setHasMore(result.hasMore)
    })
  }, [userId, busqueda, filtrosEstado, filtrosMetodo])

  async function cargarMas() {
    const result = await fetchEnviosPage(envios.length)
    if (result.data.length > 0) {
      setEnvios((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
    }
  }

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

  let lista: Envio[] = []

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
      toast.error(error.message)
      return
    }

    lista = data || []

    setMensajeExportar(
      'No hay envíos seleccionados.\n\n¿Desea exportar todos los envíos SHALOM empacados?'
    )

  }

  if (lista.length === 0) {

    toast.error(
      'No existen envíos SHALOM para exportar.'
    )

    return
  }

  setEnviosExportar(lista)

  setMostrarModalExportar(true)

}

async function confirmarExportacion() {

  if (!origenShalom) {

    toast.error(
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

      toast.error(
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

    toast.error(
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

    toast.error(error.message)

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

  let nuevaLogoUrl = config.logoUrl

  if (config.logoFile) {

    const extension =
      config.logoFile.name
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
        config.logoFile,
        {
          upsert: true,
        }
      )

    if (uploadError) {
      toast.error(
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

    setConfig(prev => ({...prev, logoUrl: nuevaLogoUrl}))
  }

  const nuevoSlug =
    config.empresa
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const { data: slugExistente } = await supabase
    .from('profiles')
    .select('slug')
    .eq('slug', nuevoSlug)
    .neq('id', user.id)
    .maybeSingle()

  if (slugExistente) {
    toast.error('Ya existe otro negocio con ese nombre. Elige un nombre diferente.')
    return
  }

  const { error } =
    await supabase
      .from('profiles')
      .update({

         empresa: config.empresa,

         telefono: config.telefonoEmpresa,

         direccion: config.direccionEmpresa,

         slug: nuevoSlug,

        origen_shalom:
          config.nuevoOrigen,

        logo_url:
          nuevaLogoUrl,

        redirect_url:
          config.redirectUrl,

        redirect_message:
          config.redirectMessage,

        instagram_url:
          config.instagramUrl,

        facebook_url:
          config.facebookUrl,

        tiktok_url:
          config.tiktokUrl,

        web_url:
          config.webUrl,

        whatsapp_url:
          config.whatsappUrl,

          metodo_motorizado:
  config.metodoMotorizado,

metodo_shalom:
  config.metodoShalom,

metodo_olva:
  config.metodoOlva,

metodo_marvisur:
  config.metodoMarvisur,

metodo_flores:
  config.metodoFlores,

metodo_otro:
  config.metodoOtro,

nombre_metodo_otro:
  config.nombreMetodoOtro,

  ...obtenerConfiguracionLogistica({

  logisticaMotoDias: config.logisticaMotoDias,
  logisticaMotoUsaHoraCorte: config.logisticaMotoUsaHoraCorte,
  logisticaMotoHoraCorte: config.logisticaMotoHoraCorte,
  logisticaMotoLimitar: config.logisticaMotoLimitar,
  logisticaMotoCupo: config.logisticaMotoCupo,

  logisticaAgenciasDias: config.logisticaAgenciasDias,
  logisticaAgenciasUsaHoraCorte: config.logisticaAgenciasUsaHoraCorte,
  logisticaAgenciasHoraCorte: config.logisticaAgenciasHoraCorte,
  logisticaAgenciasLimitar: config.logisticaAgenciasLimitar,
  logisticaAgenciasCupo: config.logisticaAgenciasCupo,

}),

      })
      .eq(
        'id',
        user.id
      )

  if (error) {
    toast.error(error.message)
    return
  }

  setOrigenShalom(
    config.nuevoOrigen
  )

  
// ========================================
// GUARDAR TARIFAS
// ========================================

const tarifasParaGuardar =
  Object.entries(
    config.tarifas
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
    config.nuevoOrigen
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

// ========================================
// AGRUPAR POR FECHA
// ========================================

const enviosAgrupados = envios.reduce(
  (acc, envio) => {

    const fechaCampo = agruparPor === 'registro' ? envio.fecha_registro : envio.fecha_programada

    const fecha =
      fechaCampo
        ? new Date(fechaCampo)
            .toISOString()
            .split('T')[0]
        : 'SIN_FECHA'

    if (!acc[fecha]) {
      acc[fecha] = []
    }

    acc[fecha].push(envio)

    return acc

  },
  {} as Record<string, Envio[]>
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
    <LoadingSpinner />
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
  const tieneEnvios = envios.length > 0

  return (
  <main id="dashboard-content"
    className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8"
  >
    <DashboardOnboarding tieneEnvios={tieneEnvios} />

    <DashboardTopBar
      logoUrl={config.logoUrl}
      plan={plan}
      diasRestantes={diasRestantes}
      onCompartir={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/f/${slugEmpresa}`
        )
        setMensajeToast('✅ Formulario copiado')
        setTimeout(() => setMensajeToast(''), 1500)
      }}
      onConfig={() => setMostrarConfig(true)}
      onUpgrade={() => setMostrarUpgrade(true)}
    />

    {userId && <EstadisticasDashboard userId={userId} />}

    <div className="space-y-4 mb-8">
      <FilterBar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtrosEstado={filtrosEstado}
        onFiltrosEstadoChange={setFiltrosEstado}
        filtrosMetodo={filtrosMetodo}
        onFiltrosMetodoChange={setFiltrosMetodo}
        metodosDisponibles={metodosDisponibles}
      />

      <DashboardActions
        plan={plan}
        onExportShalom={exportarSeleccionados}
        onCambioMasivo={() => setMostrarModalEstado(true)}
        onGenerarEtiquetas={() => {
          if (seleccionados.length === 0) {
            toast.error('Selecciona al menos un envío')
            return
          }
          const pedidos = envios.filter((envio) =>
            seleccionados.includes(envio.id)
          )
          setEnviosEtiquetas(pedidos)
          setMostrarEtiquetas(true)
        }}
        onCopiarDatos={abrirModalCopiar}
        showCopiarDatos={mostrarBotonCopiar}
        tieneShalom={true}
      />
    </div> 


    {/* TABLE / CARD LIST */}

    <EnvioGroupedList
      fechasAgrupadas={fechasAgrupadas}
      enviosAgrupados={enviosAgrupados}
      seleccionados={seleccionados}
      onToggleSeleccionTodos={toggleSeleccionTodos}
      onToggleSeleccion={toggleSeleccion}
      onDoubleClick={setEnvioDetalle}
      mostrarFechaProgramada={agruparPor === 'registro'}
      agruparPor={agruparPor}
      onCambiarAgruparPor={setAgruparPor}
    />

    {hasMore && (
      <div className="flex justify-center pt-4 pb-8">
        <button
          onClick={cargarMas}
          className="px-6 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition-all duration-200"
        >
          Cargar más envíos
        </button>
      </div>
    )}


<ModalConfiguracion
  abierto={mostrarConfig}
  onCerrar={() => setMostrarConfig(false)}
  config={config}
  setConfig={setConfig}
  distritosMoto={distritosMoto}
  guardarConfiguracion={guardarConfiguracion}
  plan={plan}
  onUpgrade={() => setMostrarUpgrade(true)}
/>



{/* MODAL DE export */}

<ModalExportShalom
  abierto={mostrarModalExportar}
  mensaje={mensajeExportar}
  envios={enviosExportar}
  origen={origenShalom}
  marcarEnviado={marcarComoEnviado}
  onCambiarMarcarEnviado={setMarcarComoEnviado}
  onCerrar={() => setMostrarModalExportar(false)}
  onConfirmar={confirmarExportacion}
/>

<ModalDetalle
  envio={envioDetalle}
  onCerrar={() => setEnvioDetalle(null)}
  onUpdate={(actualizado) =>
    setEnvios((prev) =>
      prev.map((e) => (e.id === actualizado.id ? actualizado : e))
    )
  }
/>

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
  logoUrl={config.logoUrl}
/>

<Toast mensaje={mensajeToast} />

<ModalCopiarDatos

  abierto={mostrarModalCopiar}

  envios={enviosMotoSeleccionados}

  tarifas={Object.entries(config.tarifas).map(

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

<ModalUpgrade
  abierto={mostrarUpgrade}
  onCerrar={() => setMostrarUpgrade(false)}
  planActual={plan}
  nombreEmpresa={config.empresa}
  userId={userId}
/>
    </main>
  )
}
