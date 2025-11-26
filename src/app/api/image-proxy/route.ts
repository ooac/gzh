import { NextRequest, NextResponse } from 'next/server'

const NEED_REFERER = ['mmbiz.qpic.cn', 'qpic.cn', 'wx.qlogo.cn']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const src = searchParams.get('url') || ''

  if (!src) return new NextResponse('Missing url', { status: 400 })

  try {
    const u = new URL(src)
    // Allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(u.protocol)) {
      return new NextResponse('Invalid protocol', { status: 400 })
    }

    console.log(`[Proxy] Fetching: ${src}`)

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36'
    }

    // Handle specific referer requirements
    if (NEED_REFERER.some(w => u.hostname.endsWith(w))) {
      headers['Referer'] = 'https://mp.weixin.qq.com/'
    } else {
      // For others (like Qiniu), try sending no referer or the origin
      // Some buckets block localhost referer, so we omit it or set to empty
      headers['Referer'] = ''
    }

    const r = await fetch(src, {
      method: 'GET',
      headers,
      // Disable cache to ensure fresh fetch
      cache: 'no-store'
    })

    if (!r.ok) {
      console.error(`[Proxy] Fetch failed: ${r.status} ${r.statusText} for ${src}`)
      return new NextResponse(`Proxy failed: ${r.statusText}`, { status: r.status })
    }

    const body = await r.arrayBuffer()
    const ct = r.headers.get('content-type') || 'image/jpeg'

    console.log(`[Proxy] Success: ${src} (${body.byteLength} bytes, ${ct})`)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*' // Allow usage in canvas/frontend
      }
    })
  } catch (e: any) {
    console.error(`[Proxy] Error: ${e.message} for ${src}`)
    return new NextResponse(`Proxy error: ${e.message}`, { status: 500 })
  }
}