import { revalidateTag, unstable_cache } from 'next/cache'
import { supabaseAdmin } from 'app/f/[slug]/lib/supabase/admin'
import agenciasOlvaRespaldo from '@/data/agencias-olva.json'
import agenciasShalomRespaldo from '@/data/agencias-shalom.json'

// ============================================================
// Cachés del servidor (Data Cache de Next, compartido entre peticiones).
//
// Cada lectura aquí es egress de Supabase. Lo que casi nunca cambia (perfil
// público, agencias, planes) se lee una vez y se reutiliza hasta que algo lo
// invalide. Las rutas que lo modifican llaman a las funciones `invalidar*`.
// ============================================================

const TAG_FORMULARIOS = 'formularios-publicos'
const TAG_AGENCIAS_OLVA = 'agencias-olva'
const TAG_AGENCIAS_SHALOM = 'agencias-shalom'
const TAG_PLANES = 'plan-features'

const SEMANA = 7 * 24 * 3600

/** Expira ya (no "sirve lo viejo mientras refresca"): el cambio se ve en la siguiente visita. */
function expirar(tag: string) {
  revalidateTag(tag, { expire: 0 })
}

/* --------------------------------------------------------------------- */
/* Formulario público /f/[slug]                                           */
/* --------------------------------------------------------------------- */

/**
 * Perfil del negocio (+ distritos de moto para provincia) que muestra el
 * formulario. Se guarda 2 minutos; guardar la configuración, el onboarding, un
 * pago o un cambio de admin lo invalidan al instante. La hora de corte y el
 * plan efectivo NO se cachean: se calculan en cada visita con estos datos.
 */
export const leerDatosFormulario = (slug: string) =>
  unstable_cache(
    async () => {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (!profile) return null

      let tarifas: Record<string, unknown> | null = null
      if ((profile.moto_region ?? 'lima') === 'provincia') {
        const { data } = await supabaseAdmin
          .from('tarifas_moto')
          .select('tarifas')
          .eq('profile_id', profile.id)
          .maybeSingle()
        tarifas = (data?.tarifas as Record<string, unknown> | undefined) ?? null
      }
      return { profile, tarifas }
    },
    ['formulario-publico', slug],
    { revalidate: 120, tags: [TAG_FORMULARIOS] }
  )()

export function invalidarFormularios() {
  expirar(TAG_FORMULARIOS)
}

/* --------------------------------------------------------------------- */
/* Agencias Olva / Shalom (se sincronizan una vez por semana)             */
/* --------------------------------------------------------------------- */

export const leerAgenciasOlva = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('agencias_olva')
      .select('office_id, nombres, direccion, department, province, district, office_type, lat, lng')
      .eq('activa', true)
      .order('nombres', { ascending: true })
    if (!error && Array.isArray(data) && data.length > 0) return { origen: 'bd', agencias: data }
    // Respaldo: el JSON empaquetado (el sistema nunca se queda sin lista).
    return { origen: 'fallback', agencias: agenciasOlvaRespaldo as unknown[] }
  },
  ['agencias-olva'],
  { revalidate: SEMANA, tags: [TAG_AGENCIAS_OLVA] }
)

export const leerAgenciasShalom = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('agencias_shalom')
      .select('etiqueta')
      .eq('activa', true)
      .eq('recibe', true)
      .order('etiqueta', { ascending: true })
    if (!error && Array.isArray(data) && data.length > 0) {
      return { origen: 'bd', agencias: data.map((r) => r.etiqueta).filter(Boolean) as unknown[] }
    }
    return { origen: 'fallback', agencias: agenciasShalomRespaldo as unknown[] }
  },
  ['agencias-shalom'],
  { revalidate: SEMANA, tags: [TAG_AGENCIAS_SHALOM] }
)

export function invalidarAgenciasOlva() {
  expirar(TAG_AGENCIAS_OLVA)
}
export function invalidarAgenciasShalom() {
  expirar(TAG_AGENCIAS_SHALOM)
}

/* --------------------------------------------------------------------- */
/* Límites por plan                                                       */
/* --------------------------------------------------------------------- */

export function invalidarPlanes() {
  expirar(TAG_PLANES)
}
export const TAG_PLAN_FEATURES = TAG_PLANES
