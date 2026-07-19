import { NextRequest, NextResponse } from 'next/server'

const TARGET = 'https://pro.shalom.pe'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const targetPath = url.searchParams.get('path') || ''
  const targetUrl = targetPath ? `${TARGET}/${targetPath}` : `${TARGET}/home`

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
      },
    })

    const html = await response.text()

    const modified = html
      .replace(/(href|src|action)=(["'])\//g, `$1=$2${TARGET}/`)
      .replace(/(href|src|action)=(["'])(?!https?:\/\/|\/\/|data:|#|javascript:)/g, `$1=$2${TARGET}/`)
      .replace(/<base\s[^>]*>/gi, '')
      .replace(/X-Frame-Options/gi, 'X-Frame-Options-Disabled')
      .replace(/frame-ancestors\s[^;]+;/gi, '')
      .replace(/<\/head>/i, '<base href="https://pro.shalom.pe/" />\n</head>')

    return new NextResponse(modified, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex',
        'X-Frame-Options-Disabled': 'true',
      },
    })
  } catch (error) {
    return new NextResponse('Error al cargar Shalom Pro', { status: 502 })
  }
}
