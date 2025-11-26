import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { createHash } from 'crypto'
import { uploadToR2 } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const articleId = (form.get('articleId') as string) || undefined
    if (!file) return NextResponse.json({ success: false, error: '未提供文件' }, { status: 400 })

    const arrayBuf = await file.arrayBuffer()
    const buf = Buffer.from(arrayBuf)
    const ct = file.type || 'image/jpeg'
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('jpeg') ? 'jpg' : (file.name?.split('.').pop() || 'jpg')
    const name = createHash('md5').update(buf).digest('hex') + '.' + ext

    let finalUrl = ''
    let source: 'LOCAL' | 'EXTERNAL' = 'LOCAL'

    // 尝试上传到 Cloudflare R2
    try {
      const r2Url = await uploadToR2(buf, name, ct)
      if (r2Url) {
        finalUrl = r2Url
        source = 'EXTERNAL' // 使用 EXTERNAL 标记 R2 资源
      }
    } catch (e) {
      console.log('[Upload] R2上传失败,回退到本地存储')
    }

    // 如果 R2 上传失败,保存到本地
    if (!finalUrl) {
      const dir = path.join(process.cwd(), 'public', 'uploads')
      await mkdir(dir, { recursive: true })
      const full = path.join(dir, name)
      await writeFile(full, buf)
      finalUrl = '/uploads/' + name
      source = 'LOCAL'
    }

    // 保存到数据库
    const image = await prisma.image.create({
      data: {
        url: finalUrl,
        localPath: source === 'LOCAL' ? finalUrl : null,
        source: source === 'EXTERNAL' ? 'EXTERNAL' : 'LOCAL', // 映射到枚举
        alt: file.name || '',
        articleId: articleId || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: image.id,
        url: finalUrl,
        localPath: source === 'LOCAL' ? finalUrl : null,
        source
      }
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '上传失败' }, { status: 500 })
  }
}