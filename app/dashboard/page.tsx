'use client'

import { DISTRITO_SIN_COBERTURA, distritosConCobertura } from '@/lib/coberturaMoto'

import { useEffect, useRef, useState } from 'react'
import { api, cerrarSesion, ErrorApi, obtenerSesion } from '@/lib/clienteApi'
import { guardarConfiguracionServidor } from '@/lib/configuracionCliente'
import { usePolling } from '@/hooks/usePolling'
import { useRouter } from 'next/navigation'
import { exportarShalom, MAX_ENVIOS_POR_ARCHIVO } from 'app/f/[slug]/lib/shalomExport'
import { toast } from 'sonner'
import { obtenerConfiguracionLogistica } from '@/lib/logistica/guardarConfiguracionLogistica'

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
import { normalizarDistrito } from '@/lib/normalizarDistrito'
import ModalUpgrade from '@/components/ModalUpgrade'
import PanelResumen from '@/components/PanelResumen'
import { ConfigState, initialConfigState } from '@/types/config'
import type { Envio } from '@/types/envio'
import { useRolActual } from '@/hooks/useRolActual'
import {
  PERMISOS_NINGUNO,
  PERMISOS_TODOS,
  puedeVerVista,
  type PermisosRol,
  type VistaDashboard,
} from '@/lib/roles'
import SeccionProductos from '@/components/SeccionProductos'
import SeccionVentas from '@/components/SeccionVentas'
import SeccionFormulario from '@/components/SeccionFormulario'
import SeccionCompras from '@/components/SeccionCompras'
import SeccionGastos from '@/components/SeccionGastos'
import SeccionClientes from '@/components/SeccionClientes'
import ModalRoles from '@/components/ModalRoles'
import { UPGRADE_EVENT, computeEffectivePlan, puedeUsarSeccion, openUpgrade } from '@/lib/planGating'
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
  const router = useRouter()
  const { startTour, active } = useOnboarding()

  const [envios, setEnvios] = useState<Envio[]>([])
const [userId, setUserId] = useState<string | null>(null)
const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [filtrosEstado, setFiltrosEstado] = useState<string[]>(['NO_EMPACADO', 'EMPACADO', 'EN_OBSERVACION'])
  const [filtrosMetodo, setFiltrosMetodo] = useState<string[]>([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

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
const [planFeatures, setPlanFeatures] = useState<{ max_metodos?: number | null; max_pedidos_copiar?: number | null; max_envios?: number | null; max_miembros?: number | null } | null>(null)
const [maxMiembros, setMaxMiembros] = useState(0)
const [puedeUsarRoles, setPuedeUsarRoles] = useState(false)
const [mostrarBannerTrial, setMostrarBannerTrial] = useState(false)
const [mostrarModalRoles, setMostrarModalRoles] =
  useState(false)
const [mostrarUpgrade, setMostrarUpgrade] = useState(false)
const [agruparPor, setAgruparPor] = useState<'programada' | 'registro'>('programada')
const PESTANAS = ['resumen', 'envios', 'productos', 'ventas', 'compras', 'gastos', 'clientes', 'formulario'] as const
type PESTANA = typeof PESTANAS[number]

// La pestaña activa se restaura desde el URL (?v=...) al recargar o
// compartir un enlace. Va en un efecto (y no en el inicializador) para que
// el HTML del servidor y el del cliente coincidan.
const [pestañaActiva, setPestañaActiva] = useState<PESTANA>('envios')

// ========================================
// ROL Y PERMISOS
// El dueño administra los roles de su negocio; un miembro entra con
// los permisos de su rol y ve la data del negocio de su dueño.
// ========================================
const {
  esOwner,
  rol,
  loading: cargandoRol,
  refrescar: refrescarRol,
} = useRolActual()

const permisos: PermisosRol = esOwner ? PERMISOS_TODOS : (rol?.permisos ?? PERMISOS_NINGUNO)

const pestanasPermitidas = PESTANAS.filter((p) =>
  puedeVerVista(permisos, p as VistaDashboard) && puedeUsarSeccion(plan, p)
)

const puedeVerGananciasVenta = esOwner || permisos.ver_ganancia_venta
const puedeVerGananciasProducto = esOwner || permisos.ver_ganancia_producto
const puedeVerKpisVenta = esOwner || permisos.ver_kpis_venta

// Restaura la pestaña activa desde el URL (?v=...) al recargar o compartir enlace.
useEffect(() => {
  const v = new URLSearchParams(window.location.search).get('v')
  if (v && (PESTANAS as readonly string[]).includes(v)) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPestañaActiva(v as PESTANA)
  }
}, [])

const cambiarPestaña = (tab: PESTANA) => {
  if (!puedeUsarSeccion(plan, tab)) { openUpgrade(); return }
  if (!puedeVerVista(permisos, tab as VistaDashboard)) return
  setPestañaActiva(tab)
  const url = tab === 'resumen' ? '/dashboard' : `/dashboard?v=${tab}`
  window.history.replaceState({}, '', url)
}

// Si la pestaña activa no está permitida para el rol del usuario, se cae a la
// vista inicial del rol (o a la primera sección permitida).
const pestanasPermitidasKey = pestanasPermitidas.join(',')
useEffect(() => {
  if (loading || cargandoRol) return
  if (pestanasPermitidas.length === 0) return
  if (pestanasPermitidas.includes(pestañaActiva)) return

  const vistaRol = rol?.vista_default
  const destino =
    vistaRol && pestanasPermitidas.includes(vistaRol)
      ? vistaRol
      : pestanasPermitidas[0]

  // eslint-disable-next-line react-hooks/set-state-in-effect
  setPestañaActiva(destino as PESTANA)
  const url = destino === 'resumen' ? '/dashboard' : `/dashboard?v=${destino}`
  window.history.replaceState({}, '', url)
}, [loading, cargandoRol, pestanasPermitidasKey, pestañaActiva, rol?.vista_default])
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
  if (plan === 'basic') { openUpgrade(); return }

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
  value: 'OTRO',
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

const copiarDatosLocked = plan === 'basic'

  useEffect(() => {
    async function cargar() {
      // Una sola llamada al servidor: sesión, negocio (dueño o miembro), perfil y tarifas.
      // Si es miembro de otro negocio, los datos que ve son los de su dueño.
      const sesion = await obtenerSesion().catch(() => null)

      if (!sesion) {
        router.push('/login')
        return
      }

      const ownerId = sesion.negocio.ownerId
      const profile = sesion.profile
      const tarifasData = { tarifas: sesion.tarifas }

setOrigenShalom(
  profile?.origen_shalom || ''
)

const tarifasCrudas: Record<string, unknown> =
  tarifasData?.tarifas ?? {}

// Unifica las claves guardadas de LIMA con los nombres actuales del JSON de
// distritos (coincidencia normalizada). Para PROVINCIA las claves son distritos
// personalizados del usuario y se respetan tal cual.
const esProvincia = profile?.moto_region === 'provincia'

const mapaNormalizado = new Map<string, string>()
for (const d of distritosMoto) {
  const n = normalizarDistrito(d)
  if (!mapaNormalizado.has(n)) mapaNormalizado.set(n, d)
}

const tarifasObj: Record<string, string> = esProvincia
  ? Object.fromEntries(
      Object.entries(tarifasCrudas).map(([distrito, precio]) => [
        distrito,
        String(precio),
      ])
    )
  : Object.fromEntries(
      Object.entries(tarifasCrudas).map(([distrito, precio]) => {
        const claveJson = mapaNormalizado.get(normalizarDistrito(distrito))
        return [claveJson ?? distrito, String(precio)]
      })
    )

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
  logisticaMotoAnticipacionSoloHabiles: profile?.logistica_moto_anticipacion_solo_habiles ?? false,
  logisticaMotoLimitar: profile?.logistica_moto_limitar ?? false,
  logisticaMotoCupo: profile?.logistica_moto_cupo ?? 0,
  logisticaAgenciasDias: profile?.logistica_agencias_dias ?? ['MONDAY'],
  logisticaAgenciasHoraCorte: profile?.logistica_agencias_hora_corte ?? '18:00',
  logisticaAgenciasUsaHoraCorte: profile?.logistica_agencias_usa_hora_corte ?? false,
  logisticaAgenciasAnticipacion: profile?.logistica_agencias_anticipacion ?? 1,
  logisticaAgenciasAnticipacionSoloHabiles: profile?.logistica_agencias_anticipacion_solo_habiles ?? false,
  logisticaAgenciasLimitar: profile?.logistica_agencias_limitar ?? false,
  logisticaAgenciasCupo: profile?.logistica_agencias_cupo ?? 0,
  solicitarCantidadProductos: profile?.solicitar_cantidad_productos ?? false,
  mostrarEscogerFecha: profile?.mostrar_escoger_fecha ?? true,
  mostrarTracking: profile?.mostrar_tracking ?? true,
  cerrarFormulario: profile?.cerrar_formulario ?? false,
  cerradoFormularioMensaje: profile?.cerrar_formulario_mensaje ?? '',
  cerrarFormularioDias: profile?.cerrar_formulario_dias ?? [],
  motoRegion: (profile?.moto_region ?? 'lima') as 'lima' | 'provincia',
  colorPrimario: profile?.color_formulario_primario ?? '#0284c7',
  colorSecundario: profile?.color_formulario_secundario ?? '#4f46e5',
  tarifas: tarifasObj,
}))

setSlugEmpresa(
  profile?.slug || ''
)

const planEfectivo = computeEffectivePlan(profile ?? {})
setPlan(planEfectivo.plan)
if (!new URLSearchParams(window.location.search).get('v')) {
  setPestañaActiva(planEfectivo.plan === 'basic' ? 'envios' : 'resumen')
}
setDiasRestantes(planEfectivo.diasRestantes)
setUserId(ownerId)
setLoading(false)
    }

    cargar()
  }, [router])

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
    if (tab && !puedeUsarSeccion(plan, tab)) { markTrayectoDone(); return }
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

  // Límites por plan (métodos, copiar datos, miembros) desde la base de datos
  useEffect(() => {
    if (!userId) return
    fetch(`/api/plan/features?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.plan) {
          setPlanFeatures(d)
          setMaxMiembros(d.max_miembros ?? 0)
          // Roles: Plus vigente, también durante la prueba gratuita
          setPuedeUsarRoles(d.plan === 'business_plus')
        }
      })
      .catch(() => {})
  }, [userId])

  // Banner de trial vencido (Plus expirado)
  useEffect(() => {
    if (plan === 'business_plus' && diasRestantes !== null && diasRestantes <= 0) {
      setMostrarBannerTrial(true)
    } else {
      setMostrarBannerTrial(false)
    }
  }, [plan, diasRestantes])



  // Manejar retorno de MercadoPago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
      toast.success('¡Pago exitoso! Bienvenido a Plus')
      window.history.replaceState({}, '', '/dashboard')
    } else if (paymentStatus === 'failure') {
      toast.error('El pago no pudo completarse. Intenta de nuevo.')
      window.history.replaceState({}, '', '/dashboard')
    } else if (paymentStatus === 'pending') {
      toast.info('Pago pendiente. Te notificaremos cuando se confirme.')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  async function fetchEnviosPage(offset: number, limite = 50): Promise<{ data: Envio[]; hasMore: boolean }> {
    if (!userId) return { data: [], hasMore: false }
    ultimoFetchEnviosRef.current = Date.now()
    const params = new URLSearchParams({
      user_id: userId,
      offset: String(offset),
      limit: String(limite),
      busqueda,
      estados: filtrosEstado.join(','),
      metodos: filtrosMetodo.join(','),
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    })
    const res = await fetch(`/api/envios?${params}`)
    const json = await res.json()
    if (!res.ok) return { data: [], hasMore: false }
    return { data: json.data || [], hasMore: json.hasMore === true }
  }

  useEffect(() => {
    if (!userId) return
    fetchEnviosPage(0).then((result) => {
      setEnvios(result.data)
      setHasMore(result.hasMore)
    })
  }, [userId, busqueda, filtrosEstado, filtrosMetodo, fechaDesde, fechaHasta])

  const fetchEnviosRef = useRef(fetchEnviosPage)
  useEffect(() => { fetchEnviosRef.current = fetchEnviosPage })
  const ultimoFetchEnviosRef = useRef(0)

  useEffect(() => {
    const limpiar = () => setEnviosEtiquetas([])
    window.addEventListener('afterprint', limpiar)
    return () => window.removeEventListener('afterprint', limpiar)
  }, [])

  // Si otra sesión crea o cambia pedidos, la lista se actualiza: el navegador
  // consulta al servidor cada pocos segundos mientras la pestaña está visible
  // (antes abría una conexión en tiempo real directo contra la base).
  const enviosRef = useRef<Envio[]>([])
  useEffect(() => {
    enviosRef.current = envios
  })
  const firmaEnvios = (lista: Envio[]) =>
    lista.map((e) => `${e.id}|${e.estado}|${e.tamano ?? ''}|${e.fecha_programada ?? ''}|${e.observaciones ?? ''}`).join(';')

  usePolling(() => {
    // Evita dobles recargas cuando la acción la hizo el mismo usuario en esta
    // pestaña (que ya ha actualizado el estado localmente al guardar).
    if (Date.now() - ultimoFetchEnviosRef.current < 1500) return
    const cargados = enviosRef.current.length
    // Se piden tantos como ya hay en pantalla para no perder las páginas cargadas.
    fetchEnviosRef.current(0, Math.min(200, Math.max(50, cargados))).then((result) => {
      if (firmaEnvios(result.data) === firmaEnvios(enviosRef.current)) return
      setEnvios(result.data)
      setHasMore(result.hasMore)
    })
  }, 10_000, Boolean(userId))

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
  if (plan === 'basic') { openUpgrade(); return }

  if (!userId) return

  let lista: Envio[] = []

  try {
    // El servidor devuelve solo pedidos SHALOM ya empacados del propio negocio.
    const ids = seleccionados.length > 0 ? `?ids=${encodeURIComponent(seleccionados.join(','))}` : ''
    const { data } = await api<{ data: Envio[] }>(`/api/envios/export${ids}`)
    lista = data || []
  } catch (e) {
    toast.error(e instanceof ErrorApi ? e.message : 'No se pudo preparar la exportación')
    return
  }

  if (seleccionados.length > 0) {
    const descartados = seleccionados.length - lista.length
    if (descartados > 0) {
      toast.warning(
        `${descartados} envío(s) descartados (ya no están empacados o no son SHALOM).`
      )
    }

    setMensajeExportar(
      `¿Está seguro que desea exportar los ${lista.length} envíos seleccionados?`
    )
  } else {
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

async function confirmarExportacion(seleccion: boolean[]) {

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
  origenShalom,
  seleccion
)

if (marcarComoEnviado) {

  const ids =
    enviosExportar.map(
      (e) => e.id
    )

  try {
    // El servidor cambia el estado y pasa a COMPLETADO las ventas ligadas.
    await api('/api/envios/bulk', { method: 'PATCH', json: { ids, estado: 'ENVIADO' } })
    const recarga = await fetchEnviosPage(0, 200)
    setEnvios(recarga.data)
    setHasMore(recarga.hasMore)
  } catch {
    // si falla, la lista queda como estaba y el usuario puede reintentar
  }

}

setSeleccionados([])

setMostrarModalExportar(false)

  const archivosDescargar = seleccion.filter(Boolean).length
  const totalPendientes = Math.ceil(enviosExportar.length / MAX_ENVIOS_POR_ARCHIVO)
  toast.success(
    totalPendientes > 1
      ? `${archivosDescargar} de ${totalPendientes} archivos descargados`
      : `${enviosExportar.length} envíos exportados`
  )
}

async function aplicarCambioMasivo() {
  if (plan === 'basic') { openUpgrade(); return }

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

  try {
    // El servidor también pasa a COMPLETADO las ventas ligadas si el destino es ENVIADO.
    await api('/api/envios/bulk', {
      method: 'PATCH',
      json: { ids, estado: estadoDestinoMasivo },
    })
  } catch (e) {
    toast.error(e instanceof ErrorApi ? e.message : 'No se pudo actualizar')
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

async function guardarConfiguracion(overrides: Partial<ConfigState> = {}) {

  // Si se pasa directo como onClick llega el evento del clic, no un objeto de cambios.
  const cambios = overrides && Object.getPrototypeOf(overrides) === Object.prototype ? overrides : {}
  const cfg = { ...config, ...cambios }

  // El servidor valida, sube las imágenes, comprueba el nombre del negocio, aplica
  // los límites del plan y guarda todo en una sola operación.
  const r = await guardarConfiguracionServidor(cfg)

  if (r.error) {
    toast.error(r.error)
    return
  }

  setConfig(prev => ({
    ...prev,
    logoUrl: r.logoUrl ?? prev.logoUrl,
    redirectMessageImage: r.redirectMessageImage ?? prev.redirectMessageImage,
    logoFile: null,
    redirectMessageImageFile: null,
  }))

  if (r.slug) setSlugEmpresa(r.slug)

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

// Ambos planes muestran todos los pedidos recibidos.
const enviosVisibles = envios

const enviosAgrupados = enviosVisibles.reduce(
  (acc, envio) => {

    const fechaCampo = agruparPor === 'registro' ? envio.fecha_registro : envio.fecha_programada

    // fecha_programada es una columna date ("YYYY-MM-DD", neutral a zona horaria).
    // fecha_registro es timestamptz: se convierte a la fecha local del usuario.
    // Convertir una date con new Date() la trata como medianoche UTC y, al
    // formatear en Lima (UTC-5), retrocede al día anterior.
    const fecha =
      fechaCampo
        ? /^\d{4}-\d{2}-\d{2}$/.test(fechaCampo)
          ? fechaCampo
          : new Date(fechaCampo).toLocaleDateString('en-CA')
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

if (loading || cargandoRol) {
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
    className="min-h-screen bg-slate-50 p-3 pb-28 sm:p-6 md:pb-6 lg:p-8"
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
        await cerrarSesion()
        router.push('/login')
      }}
    />

    {mostrarBannerTrial && (
      <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-red-800">Tu prueba de Plus ha terminado</p>
            <p className="text-sm text-red-700 mt-1">
              Ahora estás en Básico. Tus productos y ventas se conservan; las herramientas de Plus y el acceso del equipo requieren renovar.
              <span className="font-medium"> Renueva tu plan</span> para restaurar su acceso.
            </p>
          </div>
          <button
            onClick={() => setMostrarUpgrade(true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700"
          >
            Renovar Plus
          </button>
        </div>
      </div>
    )}
    <DashboardMenu
      plan={plan}
      tieneShalom={config.metodoShalom}
      showCopiarDatos={mostrarBotonCopiar}
      copiarDatosLocked={copiarDatosLocked}
      shalomUso={shalomUso}
      pestañaActiva={pestañaActiva}
      visibles={pestanasPermitidas}
      puedeConfigurar={esOwner}
      onNavegar={cambiarPestaña}
      onExportShalom={exportarSeleccionados}
      onCambioMasivo={() => plan === 'basic' ? openUpgrade() : setMostrarModalEstado(true)}
      onGenerarEtiquetas={async () => {
        if (plan === 'basic') { openUpgrade(); return }
        if (seleccionados.length === 0) {
          toast.error('Selecciona al menos un envío')
          return
        }
        const pedidos = envios.filter((envio) =>
          seleccionados.includes(envio.id)
        )

        let productosPorEnvio = new Map<string, { nombre: string; cantidad: number }[]>()
        try {
          const { data } = await api<{ data: Record<string, { nombre: string; cantidad: number }[]> }>(
            `/api/envios/productos?ids=${encodeURIComponent(seleccionados.join(','))}`
          )
          productosPorEnvio = new Map(Object.entries(data))
        } catch (e) {
          toast.error('Error al leer los productos: ' + (e instanceof Error ? e.message : ''))
          return
        }

        setEnviosEtiquetas(
          pedidos.map((envio) => ({
            ...envio,
            productos: productosPorEnvio.get(envio.id) || [],
          }))
        )
        setMostrarEtiquetas(true)
      }}
      puedeUsarRoles={puedeUsarRoles}
      maxMiembros={maxMiembros}
      onCopiarDatos={abrirModalCopiar}
      onConfig={() => setMostrarConfig(true)}
      onVerRoles={() => setMostrarModalRoles(true)}
      esOwner={esOwner}
    />

    {userId && pestañaActiva === 'resumen' && puedeUsarSeccion(plan, 'resumen') && (
      <PanelResumen
        userId={userId}
        onNavegar={cambiarPestaña}
        onConfig={() => setMostrarConfig(true)}
        config={config}
      />
    )}

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
          fechaDesde={fechaDesde}
          onFechaDesdeChange={setFechaDesde}
          fechaHasta={fechaHasta}
          onFechaHastaChange={setFechaHasta}
        />
       </div>
    )}


       {/* CONTENIDO POR PESTAÑA */}

       {pestañaActiva === 'envios' && (
         <>
           {plan === 'basic' && (
             <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
               Básico · solicitudes ilimitadas y gestión individual. <button onClick={() => setMostrarUpgrade(true)} className="font-semibold text-tori-600">Ver herramientas de Plus</button>
             </div>
           )}

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

        {pestañaActiva === 'productos' && puedeUsarSeccion(plan, 'productos') && (
          <SeccionProductos
            userId={userId || ''}
            plan={plan}
            puedeVerGanancias={puedeVerGananciasProducto}
          />
        )}
        {pestañaActiva === 'ventas' && puedeUsarSeccion(plan, 'ventas') && (
          <SeccionVentas
            userId={userId || ''}
            plan={plan}
            puedeVerGanancias={puedeVerGananciasVenta}
            puedeVerKpis={puedeVerKpisVenta}
          />
        )}
        {pestañaActiva === 'compras' && puedeUsarSeccion(plan, 'compras') && <SeccionCompras userId={userId || ''} />}
        {pestañaActiva === 'gastos' && puedeUsarSeccion(plan, 'gastos') && <SeccionGastos userId={userId || ''} />}
        {pestañaActiva === 'clientes' && puedeUsarSeccion(plan, 'clientes') && <SeccionClientes userId={userId || ''} />}
       {pestañaActiva === 'formulario' && (
         <SeccionFormulario
           userId={userId || ''}
           config={config}
           setConfig={setConfig}
           guardarConfiguracion={guardarConfiguracion}
           plan={plan}
           onUpgrade={() => setMostrarUpgrade(true)}
           distritosMotorizado={distritosConCobertura(config.tarifas, config.motoRegion === 'provincia' ? Object.keys(config.tarifas) : distritosMoto)}
         />
       )}

<ModalConfiguracion
  abierto={mostrarConfig}
  onCerrar={() => setMostrarConfig(false)}
  config={config}
  setConfig={setConfig}
  distritosMoto={distritosMoto}
  guardarConfiguracion={guardarConfiguracion}
  plan={plan}
  maxMetodos={planFeatures?.max_metodos ?? null}
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
  onConfirmar={(seleccion) => confirmarExportacion(seleccion)}
/>

<ModalDetalle
  plan={plan}
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

  tarifas={Object.entries(config.tarifas).filter(([, precio]) => precio !== DISTRITO_SIN_COBERTURA).map(

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
  puedeGestionar={esOwner}
  abierto={mostrarUpgrade}
  onCerrar={() => setMostrarUpgrade(false)}
  planActual={plan}
  nombreEmpresa={config.empresa}
  userId={userId}
/>

<ModalRoles
  abierto={mostrarModalRoles}
  onCerrar={() => setMostrarModalRoles(false)}
  onCambio={refrescarRol}
  plan={plan}
  maxMiembros={maxMiembros}
  puedeUsarRoles={puedeUsarRoles}
/>

<FloatingChat />
    </main>
  )
}
