'use client'

import { useState } from 'react'
import { createClient } from 'app/f/[slug]/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ToriMascot from '@/components/ToriMascot'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50  p-4 gap-8">
      <div className="hidden lg:flex flex-col items-center gap-4">
        <ToriMascot variant="guide" size={120} animate />
        <p className="text-sm text-slate-400  max-w-[200px] text-center">
          Tu ayudante fiel te espera
        </p>
      </div>
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white  border border-slate-200  rounded-2xl p-8 space-y-5 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 ">
            Iniciar sesión
          </h1>
          <p className="text-sm text-slate-500  mt-1">
            Accede a tu panel de Tori
          </p>
        </div>

        {error && (
          <div className="bg-red-50  border border-red-200  rounded-xl px-4 py-3 text-sm text-red-700 ">
            {error}
          </div>
        )}

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

        <p className="text-center text-sm text-slate-500 ">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-sky-600  hover:underline font-semibold">
            Regístrate
          </Link>
        </p>
      </form>
    </main>
  )
}