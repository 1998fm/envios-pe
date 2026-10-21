'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ToriMascot from '@/components/ToriMascot'

type Info = {
  email: string
  empresa: string
  rol: string | null
  expirada: boolean
}

export default function PaginaInvitacion({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const supabase = createClient()
  const router = useRouter()

  const [info, setInfo] = useState<Info | null>(null)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)
  const [conSesion, setConSesion] = useState<boolean | null>(null)

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    let vivo = true

    async function cargar() {
      // ¿La persona ya tiene sesión (ya estaba registrada)?
      const { data } = await supabase.auth.getSession()
      if (!vivo) return
      setConSesion(!!data.session)

      try {
        const res = await fetch(`/api/roles/accept?token=${token}`)
        const json = await res.json()
        if (!vivo) return
        if (!res.ok) {
          setErrorInfo(json?.error || 'La invitación no es válida')
          return
        }
        setInfo(json)
      } catch {
        if (vivo) setErrorInfo('No se pudo cargar la invitación')
      }
    }

    void cargar()
    return () => {
      vivo = false
    }
  }, [supabase, token])

  async function aceptar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setCargando(true)

    try {
      const res = await fetch('/api/roles/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          empresa: nombre.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json?.error || 'No se pudo completar la invitación')
        setCargando(false)
        return
      }

      // Si la cuenta ya existía, hay que iniciar sesión.
      if (!conSesion && json.requiereLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: json.email,
          password,
        })
        if (loginError) {
          setError('Tu cuenta ya existe. Inicia sesión con tu contraseña.')
          setCargando(false)
          return
        }
      }

      setListo(true)
      setCargando(false)
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch {
      setError('No se pudo completar la invitación')
      setCargando(false)
    }
  }

  if (errorInfo) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-sm text-center">
          <ToriMascot variant="guide" size={56} animate />
          <h1 className="text-xl font-extrabold text-slate-900">Invitación no válida</h1>
          <p className="text-sm text-slate-500">{errorInfo}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </main>
    )
  }

  if (!info || conSesion === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3">
          <ToriMascot variant="loading" size={56} animate />
          <p className="text-sm text-slate-500">Cargando invitación...</p>
        </div>
      </main>
    )
  }

  if (info.expirada) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-sm text-center">
          <ToriMascot variant="guide" size={56} animate />
          <h1 className="text-xl font-extrabold text-slate-900">La invitación expiró</h1>
          <p className="text-sm text-slate-500">
            Pide a {info.empresa} que te envíe una nueva invitación.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
        <div className="text-center">
          <ToriMascot variant="guide" size={56} animate />
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3">
            {listo ? '¡Listo!' : conSesion ? 'Crea tu contraseña' : 'Únete al negocio'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {listo ? (
              'Ya tienes acceso. Te llevamos al dashboard...'
            ) : (
              <>
                {info.empresa} te invitó
                {info.rol ? ` como ${info.rol}` : ''}.
              </>
            )}
          </p>
          {!listo && (
            <p className="mt-1 text-xs text-slate-400">
              Correo: {info.email}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {listo ? (
          <div className="text-center text-sm font-semibold text-emerald-600">
            ¡Bienvenido al equipo!
          </div>
        ) : (
          <form onSubmit={aceptar} className="space-y-4">
            {!conSesion && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  Tu nombre o negocio
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Contraseña</label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Repite la contraseña
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                minLength={6}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200 disabled:opacity-60"
            >
              {cargando
                ? 'Entrando...'
                : conSesion
                  ? 'Crear contraseña y entrar'
                  : 'Crear mi cuenta y entrar'}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Al entrar solo verás lo que {info.empresa} te haya permitido.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
