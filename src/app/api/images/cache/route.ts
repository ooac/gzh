import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile, stat } from 'fs/promises'
import { createHash } from 'crypto'
import path from 'path'

const NEED_REFERER = ['mmbiz.qpic.cn','qpic.cn','wx.qlogo.cn']

async function cacheOne(id: string, url: string) {
  try {
    let u = new URL(url)
    if (u.protocol === 'http:') u = new URL(`https://${u.hostname}${u.pathname}${u.search}${u.hash}`)
    const host = u.hostname.toLowerCase()
    const r = await fetch(u.toString(), {
      method: 'GET',
      headers: {
        ...(NEED_REFERER.some(w => host.endsWith(w)) ? { Referer: 'https://mp.weixin.qq.com/' } : {}),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36'
      }
    })
    if (!r.ok) return { ok: false, error: `HTTP_${r.status}` }
    const buf = Buffer.from(await r.arrayBuffer())
    const ct = r.headers.get('content-type') || 'image/jpeg'
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg'
    const name = createHash('md5').update(url).digest('hex') + '.' + ext
    const dir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(dir, { recursive: true })
    const full = path.join(dir, name)
    try { await stat(full) } catch { await writeFile(full, buf) }
    const localPath = '/uploads/' + name
    await prisma.image.update({ where: { id }, data: { localPath, source: 'LOCAL' } })
    return { ok: true, localPath }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'fetch_error' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const limit = Math.max(1, Math.min(parseInt(body?.limit || '100'), 1000))
    const images = await prisma.image.findMany({ where: { source: 'EXTERNAL', OR: [{ localPath: null }, { localPath: '' }] }, take: limit })
    let succeeded = 0
    let failed = 0
    const samples: string[] = []
    for (const img of images) {
      const res = await cacheOne(img.id, img.url)
      if (res.ok) { succeeded++; if (samples.length < 5 && res.localPath) samples.push(res.localPath) } else { failed++ }
    }
    return NextResponse.json({ success: true, data: { total: images.length, succeeded, failed, samples } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '批量缓存失败' }, { status: 500 })
  }
}