'use client'

import { useState } from 'react'
import { api, ErrorApi } from '@/lib/clienteApi'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToriMascot from '@/components/ToriMascot'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mostrarReset, setMostrarReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [enviandoReset, setEnviandoReset] = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api('/api/auth/login', { method: 'POST', json: { email, password } })
    } catch (e) {
      setLoading(false)
      setError(e instanceof ErrorApi ? e.message : 'No se pudo iniciar sesión')
      return
    }

    setLoading(false)
    router.push('/dashboard')
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setEnviandoReset(true)
    setError('')

    try {
      await api('/api/auth/forgot', { method: 'POST', json: { email: resetEmail } })
    } catch (e) {
      setEnviandoReset(false)
      setError(e instanceof ErrorApi ? e.message : 'No se pudo enviar el correo')
      return
    }

    setEnviandoReset(false)
    setResetEnviado(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50  p-4 gap-8">
      <div className="hidden lg:flex flex-col items-center gap-4">
        <ToriMascot variant="guide" size={120} animate />
        <p className="text-sm text-slate-400  max-w-[200px] text-center">
          Tu ayudante fiel te espera
        </p>
      </div>
      <div className="w-full max-w-sm bg-white  border border-slate-200  rounded-2xl p-8 space-y-5 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 ">
            {mostrarReset ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h1>
          <p className="text-sm text-slate-500  mt-1">
            {mostrarReset ? 'Te enviaremos un enlace a tu correo' : 'Accede a tu panel de Tori'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50  border border-red-200  rounded-xl px-4 py-3 text-sm text-red-700 ">
            {error}
          </div>
        )}

        {/* Dos formularios hermanos (no anidados): un <form> dentro de otro es HTML
            inválido y hacía que "Enviar enlace" también disparara el inicio de sesión. */}
        {mostrarReset ? (
          <form onSubmit={handleResetPassword} className="space-y-3">
            {resetEnviado ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
                Revisa tu correo. Te hemos enviado un enlace para restablecer tu contraseña.
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
                />
                <button
                  type="submit"
                  disabled={enviandoReset}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200 disabled:opacity-60"
                >
                  {enviandoReset ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMostrarReset(false); setResetEnviado(false); setError('') }}
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-200  rounded-xl px-4 py-3 bg-white  text-slate-900  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200 disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => { setMostrarReset(true); setError('') }}
              className="w-full text-center text-sm text-sky-600 hover:text-sky-700 hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 ">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-sky-600  hover:underline font-semibold">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  )
}