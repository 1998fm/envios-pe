import { NextRequest, NextResponse } from 'next/server'

const TARGET = 'https://pro.shalom.pe'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  return proxy(req, slug)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  return proxy(req, slug)
}

async function proxy(req: NextRequest, slug?: string[]) {
  const url = new URL(req.url)
  const targetPath = slug ? '/' + slug.join('/') : '/'
  const targetUrl = `${TARGET}${targetPath}${url.search}`

  try {
    const reqHeaders = new Headers()
    const forwardHeaders = ['cookie', 'accept', 'accept-language', 'content-type', 'x-requested-with', 'origin', 'referer', 'user-agent', 'cache-control', 'pragma']

    for (const h of forwardHeaders) {
      const val = req.headers.get(h)
      if (val) reqHeaders.set(h, val)
    }

    if (!reqHeaders.has('user-agent')) {
      reqHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    }

    const fetchOpts: RequestInit = {
      method: req.method,
      headers: reqHeaders,
      redirect: 'manual',
    }

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const body = await req.clone().text()
        if (body) fetchOpts.body = body
      } catch {}
    }

    const response = await fetch(targetUrl, fetchOpts)

    const resHeaders = new Headers()

    const cookies: string[] = []
    try { cookies.push(...response.headers.getSetCookie()) } catch {}
    if (cookies.length === 0) {
      const raw = response.headers.get('set-cookie')
      if (raw) cookies.push(raw)
    }

    for (const cookie of cookies) {
      const cleaned = cookie
        .replace(/;\s*Domain\s*=[^;]+/gi, '')
        .replace(/;\s*SameSite\s*=[^;]+/gi, '; SameSite=None; Secure')
      resHeaders.append('set-cookie', cleaned)
    }

    // Handle all other headers
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (lower === 'x-frame-options') return
      if (lower === 'set-cookie') return
      if (lower === 'content-security-policy') {
        value = value.replace(/frame-ancestors\s[^;]+;?/gi, '')
        if (value.trim()) resHeaders.set(key, value)
        return
      }
      if (lower === 'location') {
        if (value.startsWith(TARGET)) {
          resHeaders.set(key, value.replace(TARGET, ''))
        } else if (value.startsWith('/')) {
          resHeaders.set(key, `/api/proxy/shalom${value}`)
        } else {
          resHeaders.set(key, value)
        }
        return
      }
      if (lower === 'content-encoding' || lower === 'transfer-encoding' || lower === 'content-length') return
      resHeaders.set(key, value)
    })

    resHeaders.set('x-frame-options-disabled', 'true')

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('text/html')) {
      let text = await response.text()
      text = text
        .replace(/<base\s[^>]*>/gi, '')
        .replace(/(href|src|action)=(["'])(?!https?:\/\/|\/\/|data:|#|mailto:|tel:|javascript:)/gi, (m, attr, quote) => {
          return `${attr}=${quote}${TARGET}/`
        })
        .replace(/(href|src|action)=(["'])\//g, (m, attr, quote) => {
          return `${attr}=${quote}${TARGET}/`
        })
        .replace(/<\/head>/i, '<base href="https://pro.shalom.pe/">\n</head>')

      return new NextResponse(text, {
        status: response.status,
        headers: resHeaders,
      })
    }

    // Non-HTML: passthrough as buffer
    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh;">
        <div style="text-align:center;background:white;padding:40px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:400px;">
          <h2 style="color:#1e293b;margin:0 0 8px;">No se pudo conectar con Shalom Pro</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 16px;">${msg}</p>
          <button onclick="location.reload()" style="background:#0284c7;color:white;border:none;padding:8px 24px;border-radius:8px;cursor:pointer;font-size:14px;">Reintentar</button>
        </div>
      </body></html>`,
      {
        status: 502,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }
    )
  }
}
