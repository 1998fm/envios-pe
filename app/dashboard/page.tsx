'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { exportarShalom } from 'app/f/[slug]/lib/shalomExport'
import { toast } from 'sonner'
import { obtenerConfiguracionLogistica } from '@/lib/logistica/guardarConfiguracionLogistica'
import { sincronizarVentasEnviadas } from '@/lib/sincronizarVentasEnviadas'

import EtiquetasImpresion from '../../src/components/EtiquetasImpresion'
import ModalEtiquetas from '@/components/ModalEtiquetas'

import ModalCambioMasivo from '@/components/ModalCambioMasivo'
import ModalDetalle from '@/components/ModalDetalle'
import ModalExportShalom from '@/components/ModalExportShalom'
import ModalConfiguracion from '@/components/ModalConfiguracion'
import DashboardTopBar from '@/components/DashboardTopBar'
import DashboardMenu from '@/components/DashboardMenu'
import FilterBar from '@/components/FilterBar'
import EnvioGroupedList from '@/components/EnvioGroupedList'
import LoadingSpinner from '@/components/LoadingSpinner'

import Toast from '@/components/Toast'
import FloatingChat from '@/components/FloatingChat'
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
import PanelResumen from '@/components/PanelResumen'
import { ConfigState, initialConfigState } from '@/types/config'
import type { Envio } from '@/types/envio'
import SeccionProductos from '@/components/SeccionProductos'
import SeccionVentas from '@/components/SeccionVentas'
import SeccionCompras from '@/components/SeccionCompras'
import SeccionGastos from '@/components/SeccionGastos'
import { UPGRADE_EVENT, computeEffectivePlan } from '@/lib/planGating'
import { useOnboarding } from '@/context/OnboardingContext'
import {
  tourDone,
  clearAllTours,
  getTrayectoIndex,
  setTrayectoIndex,
  trayectoDone,
  markTrayectoDone,
  TRAYECTO_INICIAL,
  TOUR_TAB,
  type TourId,
} from '@/lib/tours'

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { startTour, active } = useOnboarding()

  const [envios, setEnvios] = useState<Envio[]>([])
const [userId, setUserId] = useState<string | null>(null)
const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [filtrosEstado, setFiltrosEstado] = useState<string[]>(['NO_EMPACADO', 'EMPACADO'])
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
const [shalomUso, setShalomUso] = useState<{ used: number; max: number | null }>({ used: 0, max: null })
const [mostrarUpgrade, setMostrarUpgrade] = useState(false)
const [agruparPor, setAgruparPor] = useState<'programada' | 'registro'>('programada')
const [pestañaActiva, setPestañaActiva] = useState<'resumen' | 'envios' | 'productos' | 'ventas' | 'compras' | 'gastos'>('resumen')
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

  useEffect(() => {
    if (envioDetalle && trayectoDone() && !tourDone('modal-detalle-envio')) {
      const t = setTimeout(() => startTour('modal-detalle-envio'), 400)
      return () => clearTimeout(t)
    }
  }, [envioDetalle, startTour])

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

  config.metodoRecojo && {
    value: 'RECOJO',
    label: 'Recojo en tienda',
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

const copiarDatosLocked =
  plan === 'basic' &&
  enviosMotoSeleccionados.length > 50

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
      redirect_message_image,

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
  metodo_recojo,
  mensaje_recojo,
 logistica_moto_dias,
 logistica_moto_hora_corte,
 logistica_moto_usa_hora_corte,
 logistica_moto_anticipacion,
 logistica_moto_limitar,
 logistica_moto_cupo,

 logistica_agencias_dias,
 logistica_agencias_hora_corte,
 logistica_agencias_usa_hora_corte,
 logistica_agencias_anticipacion,
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
  redirectMessageImage: profile?.redirect_message_image || '',
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
  metodoRecojo: profile?.metodo_recojo ?? false,
  mensajeRecojo: profile?.mensaje_recojo || 'Recoge tu pedido en nuestra tienda. Te esperamos!',
  logisticaMotoDias: profile?.logistica_moto_dias ?? ['MONDAY'],
  logisticaMotoHoraCorte: profile?.logistica_moto_hora_corte ?? '18:00',
  logisticaMotoUsaHoraCorte: profile?.logistica_moto_usa_hora_corte ?? false,
  logisticaMotoAnticipacion: profile?.logistica_moto_anticipacion ?? 1,
  logisticaMotoLimitar: profile?.logistica_moto_limitar ?? false,
  logisticaMotoCupo: profile?.logistica_moto_cupo ?? 0,
  logisticaAgenciasDias: profile?.logistica_agencias_dias ?? ['MONDAY'],
  logisticaAgenciasHoraCorte: profile?.logistica_agencias_hora_corte ?? '18:00',
  logisticaAgenciasUsaHoraCorte: profile?.logistica_agencias_usa_hora_corte ?? false,
  logisticaAgenciasAnticipacion: profile?.logistica_agencias_anticipacion ?? 1,
  logisticaAgenciasLimitar: profile?.logistica_agencias_limitar ?? false,
  logisticaAgenciasCupo: profile?.logistica_agencias_cupo ?? 0,
  tarifas: tarifasObj,
}))

setSlugEmpresa(
  profile?.slug || ''
)

const planEfectivo = computeEffectivePlan(profile ?? {})
setPlan(planEfectivo.plan)
setDiasRestantes(planEfectivo.diasRestantes)
setUserId(user.id)
setLoading(false)
    }

    cargar()
  }, [router, supabase])

  // ========================================
  // TRAYECTO GUIADO DE BIENVENIDA
  // Inicia en Resumen (tab por defecto al cargar)
  // y recorre las secciones en orden hasta completar.
  // ========================================

  const [trayectoIdx, setTrayectoIdx] = useState(() => getTrayectoIndex())
  const trayectoProgramado = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tour') === 'start') {
      clearAllTours()
      setTrayectoIdx(0)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (loading || active || trayectoProgramado.current) return
    if (trayectoDone()) return

    const tourId = TRAYECTO_INICIAL[trayectoIdx]
    if (!tourId) {
      markTrayectoDone()
      return
    }

    const tab = TOUR_TAB[tourId]
    if (tab && tab !== pestañaActiva) {
      setPestañaActiva(tab)
      return
    }

    trayectoProgramado.current = true
    const timer = setTimeout(() => {
      trayectoProgramado.current = false
      startTour(tourId, (mode) => {
        if (mode === 'saltado') {
          markTrayectoDone()
          return
        }
        const next = trayectoIdx + 1
        setTrayectoIndex(next)
        setTrayectoIdx(next)
        if (next >= TRAYECTO_INICIAL.length) markTrayectoDone()
      })
    }, 600)

    return () => clearTimeout(timer)
  }, [loading, active, pestañaActiva, trayectoIdx, startTour])

  // Abrir modal de upgrade desde cualquier componente
  useEffect(() => {
    function handleUpgrade() {
      setMostrarUpgrade(true)
    }
    window.addEventListener(UPGRADE_EVENT, handleUpgrade)
    return () => window.removeEventListener(UPGRADE_EVENT, handleUpgrade)
  }, [])

  // Uso mensual de exportaciones Shalom (solo visible en básico)
  useEffect(() => {
    if (!userId || plan !== 'basic') return
    fetch(`/api/usage/shalom?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.used === 'number') setShalomUso({ used: d.used, max: d.max ?? null })
      })
      .catch(() => {})
  }, [userId, plan])

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

  const fetchEnviosRef = useRef(fetchEnviosPage)
  useEffect(() => { fetchEnviosRef.current = fetchEnviosPage })

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('envios-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'envios' },
        (payload) => {
          if ((payload.new as any)?.user_id === userId) {
            fetchEnviosRef.current(0).then((result) => {
              setEnvios(result.data)
              setHasMore(result.hasMore)
            })
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

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

  if (plan === 'basic' && userId) {

    const res = await fetch(
      '/api/usage/shalom',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          cantidad: enviosExportar.length,
        }),
      }
    )

    if (!res.ok) {

      const data = await res.json().catch(() => ({}))
      toast.error(
        data.error ||
          'Límite de exportaciones a Shalom alcanzado.'
      )
      setMostrarUpgrade(true)
      return

    } else {

      const data = await res.json().catch(() => ({}))
      if (data && typeof data.used === 'number') {
        setShalomUso({ used: data.used, max: data.max ?? null })
      }

    }

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

  sincronizarVentasEnviadas(ids)

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

  if (estadoDestinoMasivo === 'ENVIADO') {
    sincronizarVentasEnviadas(ids)
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

  let nuevaMsgImagen = config.redirectMessageImage

  if (config.redirectMessageImageFile) {

    const extension =
      config.redirectMessageImageFile.name
        .split('.')
        .pop()

    const filePath =
      `${user.id}/mensaje-exito.${extension}`

    const {
      error: uploadError,
    } = await supabase.storage
      .from('logos')
      .upload(
        filePath,
        config.redirectMessageImageFile,
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

    nuevaMsgImagen =
      data.publicUrl

    setConfig(prev => ({...prev, redirectMessageImage: nuevaMsgImagen}))
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

        redirect_message_image:
          nuevaMsgImagen,

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

metodo_recojo:
  config.metodoRecojo,

mensaje_recojo:
  config.mensajeRecojo,

  ...obtenerConfiguracionLogistica({

  logisticaMotoDias: config.logisticaMotoDias,
  logisticaMotoUsaHoraCorte: plan === 'basic' ? false : config.logisticaMotoUsaHoraCorte,
  logisticaMotoHoraCorte: plan === 'basic' ? '18:00' : config.logisticaMotoHoraCorte,
  logisticaMotoAnticipacion: plan === 'basic' ? 1 : config.logisticaMotoAnticipacion,
  logisticaMotoLimitar: plan === 'basic' ? false : config.logisticaMotoLimitar,
  logisticaMotoCupo: plan === 'basic' ? 0 : config.logisticaMotoCupo,

  logisticaAgenciasDias: config.logisticaAgenciasDias,
  logisticaAgenciasUsaHoraCorte: plan === 'basic' ? false : config.logisticaAgenciasUsaHoraCorte,
  logisticaAgenciasHoraCorte: plan === 'basic' ? '18:00' : config.logisticaAgenciasHoraCorte,
  logisticaAgenciasAnticipacion: plan === 'basic' ? 1 : config.logisticaAgenciasAnticipacion,
  logisticaAgenciasLimitar: plan === 'basic' ? false : config.logisticaAgenciasLimitar,
  logisticaAgenciasCupo: plan === 'basic' ? 0 : config.logisticaAgenciasCupo,

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
    className="min-h-screen bg-slate-50  p-4 sm:p-6 lg:p-8"
  >
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
      onUpgrade={() => setMostrarUpgrade(true)}
      onLogout={async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }}
    />

    <DashboardMenu
      plan={plan}
      tieneShalom={config.metodoShalom}
      showCopiarDatos={mostrarBotonCopiar}
      copiarDatosLocked={copiarDatosLocked}
      shalomUso={shalomUso}
      pestañaActiva={pestañaActiva}
      onNavegar={setPestañaActiva}
      onExportShalom={exportarSeleccionados}
      onCambioMasivo={() => setMostrarModalEstado(true)}
      onGenerarEtiquetas={async () => {
        if (seleccionados.length === 0) {
          toast.error('Selecciona al menos un envío')
          return
        }
        const pedidos = envios.filter((envio) =>
          seleccionados.includes(envio.id)
        )

        const { data: ventas, error: ventasError } = await supabase
          .from('ventas')
          .select('envio_id, items:venta_items(producto_nombre, cantidad)')
          .in('envio_id', seleccionados)

        if (ventasError) {
          toast.error('Error al leer los productos: ' + ventasError.message)
          return
        }

        const productosPorEnvio = new Map<string, { nombre: string; cantidad: number }[]>()
        for (const venta of ventas || []) {
          for (const item of venta.items || []) {
            const lista = productosPorEnvio.get(venta.envio_id) || []
            const existente = lista.find((p) => p.nombre === item.producto_nombre)
            if (existente) existente.cantidad += item.cantidad
            else lista.push({ nombre: item.producto_nombre, cantidad: item.cantidad })
            productosPorEnvio.set(venta.envio_id, lista)
          }
        }

        setEnviosEtiquetas(
          pedidos.map((envio) => ({
            ...envio,
            productos: productosPorEnvio.get(envio.id) || [],
          }))
        )
        setMostrarEtiquetas(true)
      }}
      onCopiarDatos={abrirModalCopiar}
      onConfig={() => setMostrarConfig(true)}
    />

    {userId && pestañaActiva === 'resumen' && <PanelResumen userId={userId} onNavegar={setPestañaActiva} />}

    {pestañaActiva === 'envios' && (
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
       </div>
    )}


       {/* CONTENIDO POR PESTAÑA */}

       {pestañaActiva === 'envios' && (
         <>
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
                 className="px-6 py-3 rounded-xl text-sm font-semibold bg-white  border border-slate-200  text-slate-700  hover:border-sky-500 hover:text-sky-700 :text-sky-300 transition-all duration-200"
               >
                 Cargar más envíos
               </button>
             </div>
           )}
         </>
       )}

       {pestañaActiva === 'productos' && <SeccionProductos userId={userId || ''} />}
       {pestañaActiva === 'ventas' && <SeccionVentas userId={userId || ''} />}
       {pestañaActiva === 'compras' && <SeccionCompras userId={userId || ''} />}
       {pestañaActiva === 'gastos' && <SeccionGastos userId={userId || ''} />}

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
  onDelete={(id) =>
    setEnvios((prev) => prev.filter((e) => e.id !== id))
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

<FloatingChat />
    </main>
  )
}
