'use client'

import { useEffect, useState } from 'react'
import { api, ErrorApi, obtenerSesion } from '@/lib/clienteApi'
import { useRouter } from 'next/navigation'
import ToriMascot from '@/components/ToriMascot'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [sesionValida, setSesionValida] = useState(false)

  // El enlace del correo pasa por /auth/callback, que ya dejó la sesión lista en
  // el servidor. Aquí solo se comprueba que exista.
  useEffect(() => {
    obtenerSesion()
      .then((sesion) => {
        if (!sesion) setError('El enlace venció o no es válido. Pide uno nuevo desde "¿Olvidaste tu contraseña?".')
        else setSesionValida(true)
      })
      .catch(() => setError('No se pudo verificar el enlace.'))
      .finally(() => setVerificando(false))
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await api('/api/auth/password', { method: 'POST', json: { password } })
    } catch (e) {
      setLoading(false)
      setError(e instanceof ErrorApi ? e.message : 'No se pudo actualizar la contraseña')
      return
    }

    setLoading(false)
    setListo(true)
  }

  if (verificando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3">
          <ToriMascot variant="loading" size={56} animate />
          <p className="text-sm text-slate-500">Verificando...</p>
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
            {listo ? 'Contraseña actualizada' : 'Nueva contraseña'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {listo
              ? 'Tu contraseña se ha actualizado correctamente.'
              : 'Ingresa tu nueva contraseña'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {listo ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all"
          >
            Ir al dashboard
          </button>
        ) : !sesionValida ? (
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all"
          >
            Volver al inicio de sesión
          </button>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Nueva contraseña
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">
                Confirmar contraseña
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200 disabled:opacity-60"
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
