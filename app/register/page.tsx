'use client'

import { useState } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToriMascot from '@/components/ToriMascot'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, empresa }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al registrar')
      setLoading(false)
      return
    }

    // Iniciar sesión automáticamente
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Cuenta creada. Intenta iniciar sesión.')
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 gap-8">
      <div className="hidden lg:flex flex-col items-center gap-4">
        <ToriMascot variant="onboard" size={120} animate />
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-[200px] text-center">
          Empieza a ordenar tus envíos
        </p>
      </div>
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 space-y-5 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Crear cuenta
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registra tu negocio en Tori
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre del negocio
          </label>
          <input
            type="text"
            placeholder="Ej. Mi Tienda"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            required
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-200 disabled:opacity-60"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-sky-600 dark:text-sky-400 hover:underline font-semibold">
            Inicia sesión
          </Link>
        </p>
      </form>
    </main>
  )
}
