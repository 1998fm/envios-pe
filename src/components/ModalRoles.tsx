'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ConfirmDialog'
import {
  PERMISOS_GANANCIA,
  PERMISOS_NINGUNO,
  PERMISOS_TODOS,
  PERMISOS_VISTA,
  PRESET_ROLES,
  VISTAS_DASHBOARD,
  esVistaValida,
  normalizarPermisos,
  type PermisoKey,
  type PermisosRol,
  type VistaDashboard,
} from '@/lib/roles'

type Rol = {
  id: string
  nombre: string
  vista_default: string
  permisos: unknown
  creado_en?: string
}

type Miembro = {
  user_id: string
  role_id: string
  email: string | null
  empresa: string | null
  disabled: boolean
}

type Invitacion = {
  id: string
  email: string
  role_id: string
  link: string
  creado_en: string
  expira_en: string
}

type Props = {
  abierto: boolean
  onCerrar: () => void
  onCambio?: () => void
  plan?: string
  maxMiembros?: number
  puedeUsarRoles?: boolean
}

const FORMULARIO_VACIO = {
  nombre: '',
  vista: 'resumen' as VistaDashboard,
  permisos: { ...PERMISOS_TODOS } as PermisosRol,
}

export default function ModalRoles({
  abierto,
  onCerrar,
  onCambio,
  maxMiembros = 4,
  puedeUsarRoles = false,
}: Props) {
  const confirmar = useConfirm()

  const [roles, setRoles] = useState<Rol[]>([])
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [errorBase, setErrorBase] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...FORMULARIO_VACIO })
  // 'lista'   → se ven usuarios + roles
  // 'crear'   → se abre el editor para un rol nuevo
  // 'editar'  → se abre el editor con un rol existente
  const [modo, setModo] = useState<'lista' | 'crear' | 'editar'>('lista')

  const [emailMiembro, setEmailMiembro] = useState('')
  const [rolMiembroId, setRolMiembroId] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [linkParaCopiar, setLinkParaCopiar] = useState<string | null>(null)

  // El editor sustituye a la lista: al abrirlo se vuelve arriba del todo.
  const contenidoRef = useRef<HTMLDivElement>(null)
  const nombreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    contenidoRef.current?.scrollTo({ top: 0 })
    if (modo === 'crear') {
      setTimeout(() => nombreRef.current?.focus(), 120)
    }
  }, [modo])

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorBase(null)
    try {
      const res = await fetch('/api/roles')
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErrorBase(json?.error || 'No se pudieron cargar los roles')
        setRoles([])
        setMiembros([])
        return
      }

      setRoles(Array.isArray(json.roles) ? json.roles : [])
      setMiembros(Array.isArray(json.members) ? json.members : [])

      // Las invitaciones pendientes viven en otra tabla: si aún no
      // existe, se ignora sin romper el modal.
      try {
        const resInv = await fetch('/api/roles/invitations')
        if (resInv.ok) {
          const jsonInv = await resInv.json()
          setInvitaciones(Array.isArray(jsonInv.invitaciones) ? jsonInv.invitaciones : [])
        } else {
          setInvitaciones([])
        }
      } catch {
        setInvitaciones([])
      }
    } catch {
      setErrorBase('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!abierto) return
    // Carga de roles y miembros al abrir el modal: el setState ocurre
    // después del await, no de forma síncrona en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [abierto, cargar])

  // ========================================
  // EDICIÓN DE ROL
  // ========================================

  function empezarNuevo() {
    if (!puedeUsarRoles) {
      toast.error('Roles disponibles solo en Business Plus')
      return
    }
    setEditandoId(null)
    setForm({ ...FORMULARIO_VACIO })
    setModo('crear')
  }

  function editarRol(rol: Rol) {
    setEditandoId(rol.id)
    setForm({
      nombre: rol.nombre,
      vista: esVistaValida(rol.vista_default) ? rol.vista_default : 'resumen',
      permisos: normalizarPermisos(rol.permisos),
    })
    setModo('editar')
  }

  function volverALista() {
    setModo('lista')
    setEditandoId(null)
    setForm({ ...FORMULARIO_VACIO })
  }

  // Cierra el modal dejando el editor limpio para la próxima apertura.
  function cerrar() {
    volverALista()
    onCerrar()
  }

  function alternarPermiso(key: PermisoKey) {
    setForm((prev) => ({
      ...prev,
      permisos: { ...prev.permisos, [key]: !prev.permisos[key] },
    }))
  }

  function aplicarPreset(nombrePreset: string) {
    const preset = PRESET_ROLES.find((p) => p.nombre === nombrePreset)
    if (!preset) return
    setForm((prev) => ({
      ...prev,
      nombre: prev.nombre.trim() ? prev.nombre : preset.nombre,
      vista: preset.vista_default,
      permisos: { ...preset.permisos },
    }))
  }

  async function guardarRol() {
    if (!form.nombre.trim()) {
      toast.error('Ponle un nombre al rol')
      return
    }

    setGuardando(true)
    try {
      const esNuevo = editandoId === null
      const res = await fetch('/api/roles', {
        method: esNuevo ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          esNuevo
            ? {
                nombre: form.nombre.trim(),
                vista_default: form.vista,
                permisos: form.permisos,
              }
            : {
                id: editandoId,
                nombre: form.nombre.trim(),
                vista_default: form.vista,
                permisos: form.permisos,
              }
        ),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'No se pudo guardar el rol')
        return
      }

      toast.success(esNuevo ? 'Rol creado' : 'Rol actualizado')
      setEditandoId(null)
      setForm({ ...FORMULARIO_VACIO })
      setModo('lista')
      await cargar()
      onCambio?.()
    } catch {
      toast.error('No se pudo guardar el rol')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarRol(rol: Rol) {
    const ok = await confirmar({
      title: 'Eliminar rol',
      message: `Se eliminará el rol "${rol.nombre}" y sus miembros dejarán de tener acceso al negocio.`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return

    try {
      const res = await fetch('/api/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rol.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'No se pudo eliminar el rol')
        return
      }
      toast.success('Rol eliminado')
      if (editandoId === rol.id) volverALista()
      await cargar()
    } catch {
      toast.error('No se pudo eliminar el rol')
    }
  }

  // ========================================
  // MIEMBROS
  // ========================================

  async function agregarMiembro() {
    if (!emailMiembro.trim()) {
      toast.error('Escribe el email del usuario')
      return
    }
    if (!rolMiembroId) {
      toast.error('Elige el rol del usuario')
      return
    }
    if (!puedeUsarRoles) {
      toast.error('Roles disponibles solo en Business Plus')
      return
    }
    if (miembros.length >= maxMiembros) {
      toast.error(`Límite de ${maxMiembros} miembros alcanzado en Business Plus`)
      return
    }

    setAgregando(true)
    try {
      const res = await fetch('/api/roles/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailMiembro.trim(), role_id: rolMiembroId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'No se pudo agregar al usuario')
        return
      }

      if (json.invitacion) {
        // No tenía cuenta: se genera un link de invitación con su rol listo.
        setEmailMiembro('')
        await cargar()
        if (json.link) setLinkParaCopiar(json.link)
        toast.success('Invitación creada: comparte el link')
        return
      }

      toast.success('Usuario agregado al negocio')
      setEmailMiembro('')
      await cargar()
    } catch {
      toast.error('No se pudo agregar al usuario')
    } finally {
      setAgregando(false)
    }
  }

  async function cambiarRolMiembro(userId: string, roleId: string) {
    try {
      const res = await fetch('/api/roles/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role_id: roleId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'No se pudo cambiar el rol')
        return
      }
      toast.success('Rol actualizado')
      await cargar()
      onCambio?.()
    } catch {
      toast.error('No se pudo cambiar el rol')
    }
  }

  async function quitarMiembro(userId: string) {
    const ok = await confirmar({
      title: 'Quitar acceso',
      message: 'El usuario perderá el acceso a este negocio.',
      confirmLabel: 'Quitar',
      danger: true,
    })
    if (!ok) return

    try {
      const res = await fetch('/api/roles/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'No se pudo quitar al usuario')
        return
      }
      toast.success('Acceso revocado')
      await cargar()
    } catch {
      toast.error('No se pudo quitar al usuario')
    }
  }

  // ========================================
  // INVITACIONES
  // ========================================

  async function copiarLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado')
    } catch {
      setLinkParaCopiar(link)
      toast.info('Copia el link manualmente')
    }
  }

  async function generarLinkNuevo(inv: Invitacion) {
    const ok = await confirmar({
      title: 'Generar un link nuevo',
      message: `El link actual de ${inv.email} dejará de funcionar.`,
      confirmLabel: 'Generar nuevo',
    })
    if (!ok) return

    try {
      const res = await fetch('/api/roles/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inv.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json?.error || 'No se pudo generar el link nuevo')
        return
      }
      if (json.link) setLinkParaCopiar(json.link)
      toast.success('Link nuevo generado')
      await cargar()
    } catch {
      toast.error('No se pudo generar el link nuevo')
    }
  }

  async function cancelarInvitacion(inv: Invitacion) {
    const ok = await confirmar({
      title: 'Cancelar invitación',
      message: `${inv.email} ya no podrá unirse con este enlace.`,
      confirmLabel: 'Cancelar invitación',
      danger: true,
    })
    if (!ok) return

    try {
      const res = await fetch('/api/roles/invitations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inv.id }),
      })
      if (!res.ok) {
        toast.error('No se pudo cancelar la invitación')
        return
      }
      toast.success('Invitación cancelada')
      await cargar()
    } catch {
      toast.error('No se pudo cancelar la invitación')
    }
  }

  if (!abierto) return null

  const rolEditando = editandoId ? roles.find((r) => r.id === editandoId) : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Roles y permisos
            </h2>
            <p className="text-xs text-slate-500">
              Controla qué ve cada persona de tu negocio
            </p>
          </div>
          <button
            onClick={cerrar}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div ref={contenidoRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {errorBase && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">{errorBase}</p>
              <p className="mt-1 text-amber-700">
                Ejecuta <code className="rounded bg-amber-100 px-1">supabase/roles-negocio.sql</code>{' '}
                en el SQL Editor de Supabase y vuelve a abrir esta ventana.
              </p>
            </div>
          )}

          {!puedeUsarRoles && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4">
              <p className="font-semibold text-amber-800">Roles disponibles solo en Business Plus</p>
              <p className="text-sm text-amber-700 mt-1">
                Actualiza tu plan para gestionar miembros y permisos.
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade'))}
                className="mt-2 text-sm underline hover:text-amber-900"
              >
                Ver planes
              </button>
            </div>
          )}

          {modo === 'lista' ? (
            <>
          {/* ================= USUARIOS ================= */}
          {cargando && roles.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm text-slate-400">
              Cargando roles…
            </p>
          )}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Usuarios con acceso
            </h3>

            <div className="mb-3 rounded-2xl bg-slate-50 p-3">
              <p className="mb-2 text-xs text-slate-500">
                Escribe el correo. Si la persona todavía no tiene cuenta, se
                genera un link de invitación para que lo comparta con ella.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={emailMiembro}
                  onChange={(e) => setEmailMiembro(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <select
                  value={rolMiembroId}
                  onChange={(e) => setRolMiembroId(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Elige un rol</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={agregarMiembro}
                  disabled={agregando || !emailMiembro.trim() || !rolMiembroId}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {agregando ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </div>

            {miembros.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm text-slate-400">
                Todavía no hay usuarios con acceso a este negocio.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                {miembros.map((m) => (
                  <li key={m.user_id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {m.email || m.user_id.slice(0, 8)}
                        {m.empresa ? (
                          <span className="ml-2 font-normal text-slate-400">{m.empresa}</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role_id}
                        onChange={(e) => cambiarRolMiembro(m.user_id, e.target.value)}
                        className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-sky-500"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => quitarMiembro(m.user_id)}
                        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {linkParaCopiar && (
              <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-xs font-semibold text-sky-800">
                  Link de invitación (cópialo y compártelo por WhatsApp)
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    readOnly
                    value={linkParaCopiar}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs text-slate-600"
                  />
                  <button
                    onClick={() => copiarLink(linkParaCopiar)}
                    className="shrink-0 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={() => setLinkParaCopiar(null)}
                    className="shrink-0 rounded-xl px-2 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-white/60"
                  >
                    X
                  </button>
                </div>
              </div>
            )}

            {invitaciones.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Invitaciones pendientes
                </p>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-amber-200">
                  {invitaciones.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-col gap-2 bg-amber-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {inv.email}
                        </p>
                        <p className="text-xs text-slate-500">
                          Rol: {roles.find((r) => r.id === inv.role_id)?.nombre ?? '—'} ·
                          expira {new Date(inv.expira_en).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => copiarLink(inv.link)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                        >
                          Copiar link
                        </button>
                        <button
                          onClick={() => generarLinkNuevo(inv)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          Nuevo link
                        </button>
                        <button
                          onClick={() => cancelarInvitacion(inv)}
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ================= ROLES ================= */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Roles del negocio
              </h3>
              <button
                onClick={empezarNuevo}
                disabled={!puedeUsarRoles}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: puedeUsarRoles ? '#1e293b' : '#94a3b8' }}
              >
                + Nuevo rol
              </button>
            </div>

            {roles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center">
                <p className="text-sm text-slate-400">
                  Todavía no hay roles. Crea el primero para repartir permisos.
                </p>
              </div>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => editarRol(r)}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                    >
                      {r.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-slate-400">
              Crea un rol, define qué ve y luego asígnaselo a alguien desde
              “Usuarios con acceso”.
            </p>
          </section>
        </>
      ) : (
        <>
          {/* ================= EDITOR ================= */}
          <section className="rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <button
                onClick={volverALista}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-sky-600"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Volver
              </button>
              <h3 className="text-sm font-bold text-slate-800">
                {modo === 'editar' ? 'Editar rol' : 'Nuevo rol'}
              </h3>
              <span className="w-14 text-right text-xs text-slate-400">
                {modo === 'editar' ? (roles.find((r) => r.id === editandoId)?.nombre ?? '') : ''}
              </span>
            </div>

            <div className="space-y-5 px-4 py-4">
              <div>
                <label htmlFor="rol-nombre" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre del rol
                </label>
                <input
                  id="rol-nombre"
                  ref={nombreRef}
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Vendedor, Encargado"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRESET_ROLES.map((p) => (
                    <button
                      key={p.nombre}
                      onClick={() => aplicarPreset(p.nombre)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Vista inicial del dashboard
                </label>
                <div className="flex flex-wrap gap-2">
                  {VISTAS_DASHBOARD.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setForm((p) => ({ ...p, vista: v.value }))}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        form.vista === v.value
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 text-slate-500 hover:border-sky-300'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Secciones visibles</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PERMISOS_VISTA.map((p) => (
                    <label
                      key={p.key}
                      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-2 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={form.permisos[p.key] === true}
                        onChange={() => alternarPermiso(p.key)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-700">{p.label}</span>
                        <span className="block text-xs text-slate-400">{p.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Cifras del negocio</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PERMISOS_GANANCIA.map((p) => (
                    <label
                      key={p.key}
                      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={form.permisos[p.key] === true}
                        onChange={() => alternarPermiso(p.key)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-700">{p.label}</span>
                        <span className="block text-xs text-slate-400">{p.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setForm((p) => ({ ...p, permisos: { ...PERMISOS_TODOS } }))}
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  Todo permitido
                </button>
                <button
                  onClick={() => setForm((p) => ({ ...p, permisos: { ...PERMISOS_NINGUNO } }))}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Todo bloqueado
                </button>
              </div>
            </div>
          </section>
        </>
      )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <div>
            {modo === 'editar' && rolEditando ? (
              <button
                onClick={() => eliminarRol(rolEditando)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                Eliminar rol
              </button>
            ) : modo === 'crear' ? (
              <p className="text-xs text-slate-400">
                {form.nombre.trim()
                  ? 'El rol se guardará con estos permisos.'
                  : 'Escribe un nombre arriba para habilitar el botón.'}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                {roles.length} rol{roles.length === 1 ? '' : 'es'} · {miembros.length} usuario
                {miembros.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {modo === 'lista' ? (
              <button
                onClick={cerrar}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cerrar
              </button>
            ) : (
              <>
                <button
                  onClick={volverALista}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarRol}
                  disabled={guardando || !form.nombre.trim()}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : modo === 'editar' ? 'Guardar cambios' : 'Crear rol'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
