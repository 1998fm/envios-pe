import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabaseEnv'

// Next 16: este archivo se llama proxy.ts, vive en la raíz del proyecto (junto
// a app/) y exporta `proxy`. El antiguo app/middleware.ts nunca se ejecutaba.
// Es una primera barrera de UX; la autorización real está en cada API route.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims() verifica la firma del JWT (a diferencia de getSession(), que
  // confía en la cookie tal cual) y refresca la sesión si hace falta.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims?.sub ? data.claims : null
  const path = request.nextUrl.pathname

  if (!user && (path.startsWith('/dashboard') || path.startsWith('/admin'))) {
    const login = new URL('/login', request.url)
    if (path.startsWith('/admin')) login.searchParams.set('next', '/admin')
    return NextResponse.redirect(login)
  }

  if (!user && path.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/register', request.url))
  }

  if (user && ['/login', '/register'].includes(path)) {
    const destino = path === '/login' && request.nextUrl.searchParams.get('next') === '/admin'
      ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/onboarding', '/login', '/register'],
}
