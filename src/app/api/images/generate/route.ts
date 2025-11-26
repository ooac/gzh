import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import Jimp from 'jimp'
import { uploadToR2 } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompts: { prompt: string, segmentIndex?: number }[] = Array.isArray(body.prompts) ? body.prompts : []
    const countPerPrompt: number = Math.min(Math.max(parseInt(body.countPerPrompt || '1'), 1), 4)
    const model: string = body.model || 'Kwai-Kolors/Kolors'
    const articleId: string | undefined = body.articleId || undefined
    if (prompts.length === 0) return NextResponse.json({ success: false, error: '缺少提示词' }, { status: 400 })

    const apiCfg = await prisma.aPIConfig.findFirst({ where: { service: 'siliconflow-image', isActive: true } })
    if (!apiCfg?.apiKey) return NextResponse.json({ success: false, error: '未配置硅基流动生图API密钥' }, { status: 400 })
    const base = (apiCfg.apiUrl || '').trim() || 'https://api.siliconflow.cn/v1'
    const endpoint = `${base.replace(/\/$/, '')}/images/generations`

    const ratio: string | undefined = body.ratio
    const pickSize = (r?: string): string | undefined => {
      if (!r) return undefined
      const m = String(r).trim().match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/)
      if (!m) return undefined
      const w = parseFloat(m[1])
      const h = parseFloat(m[2])
      if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return undefined
      const ar = w / h
      if (Math.abs(ar - 2.35) < 0.02) return '1880x800'
      if (Math.abs(ar - (16 / 9)) < 0.02) return '1664x928'
      if (Math.abs(ar - 1.0) < 0.02) return '1024x1024'
      if (Math.abs(ar - (3 / 2)) < 0.02) return '1584x1056'
      if (Math.abs(ar - (2 / 3)) < 0.02) return '1056x1584'
      if (Math.abs(ar - (4 / 3)) < 0.02) return '1472x1140'
      if (Math.abs(ar - (3 / 4)) < 0.02) return '1140x1472'
      return '1664x928'
    }
    const imageSize = pickSize(ratio)
    const genTasks: Array<Promise<{ url: string, prompt: string, segmentIndex?: number } | null>> = []
    for (const p of prompts) {
      for (let i = 0; i < countPerPrompt; i++) {
        genTasks.push((async () => {
          const payload: any = { model, prompt: p.prompt }
          if (imageSize) payload.image_size = imageSize
          const r = await fetch(endpoint, { method: 'POST', headers: { 'Authorization': `Bearer ${apiCfg.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          if (!r.ok) return null
          const json = await r.json()
          const url = json?.images?.[0]?.url || ''
          if (!url) return null
          return { url, prompt: p.prompt, segmentIndex: p.segmentIndex }
        })())
      }
    }
    const genResults = await Promise.all(genTasks)
    const valid = genResults.filter(Boolean) as Array<{ url: string, prompt: string, segmentIndex?: number }>
    if (valid.length === 0) return NextResponse.json({ success: false, error: '生图失败' }, { status: 400 })
    const out: { url: string, alt: string, segmentIndex?: number, localPath?: string }[] = []
    const dlTasks = valid.map(async (v) => {
      let localPath: string | undefined = undefined
      let finalUrl = v.url
      let source: 'LOCAL' | 'EXTERNAL' = 'LOCAL'

      try {
        const imgRes = await fetch(v.url)
        const buf = Buffer.from(await imgRes.arrayBuffer())
        const ct = imgRes.headers.get('content-type') || 'image/jpeg'
        const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg'
        const name = createHash('md5').update(v.url).digest('hex') + '.' + ext
        const dir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(dir, { recursive: true })
        let image = await Jimp.read(buf)
        // 若传入 ratio，则进行居中裁剪到严格比例
        if (ratio && image.getWidth() > 0 && image.getHeight() > 0) {
          const m = String(ratio).trim().match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/)
          if (m) {
            const rw = parseFloat(m[1])
            const rh = parseFloat(m[2])
            if (isFinite(rw) && isFinite(rh) && rw > 0 && rh > 0) {
              const targetAr = rw / rh
              const ow = image.getWidth()
              const oh = image.getHeight()
              let tw = ow
              let th = Math.round(tw / targetAr)
              if (th > oh) { th = oh; tw = Math.round(th * targetAr) }
              const x = Math.max(0, Math.floor((ow - tw) / 2))
              const y = Math.max(0, Math.floor((oh - th) / 2))
              image = image.crop(x, y, tw, th)
            }
          }
        }

        // 尝试上传到 Cloudflare R2
        let r2Url: string | null = null
        try {
          const mime = ext === 'png' ? Jimp.MIME_PNG : ext === 'webp' ? 'image/webp' : Jimp.MIME_JPEG
          const processedBuf = await image.getBufferAsync(mime)
          r2Url = await uploadToR2(processedBuf, name, ct)
        } catch (e) {
          console.error('[Generate] R2 upload failed:', e)
        }

        if (r2Url) {
          finalUrl = r2Url
          source = 'EXTERNAL'
        } else {
          // 回退到本地存储
          const full = path.join(dir, name)
          await image.writeAsync(full)
          localPath = '/uploads/' + name
          finalUrl = localPath
          source = 'LOCAL'
        }
      } catch { }
      out.push({ url: finalUrl, alt: v.prompt, segmentIndex: v.segmentIndex, localPath })
      try {
        await prisma.image.create({
          data: {
            url: finalUrl,
            alt: v.prompt,
            source: source === 'EXTERNAL' ? 'EXTERNAL' : 'LOCAL',
            localPath: localPath || null,
            articleId: articleId || null
          }
        })
      } catch { }
    })
    await Promise.all(dlTasks)
    return NextResponse.json({ success: true, data: { images: out } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '生成图片失败' }, { status: 500 })
  }
}