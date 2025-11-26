import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '50'), 200))
    const query = (searchParams.get('query') || '').trim()
    const used = (searchParams.get('used') || 'ALL').toUpperCase() // ALL | USED | UNUSED

    const where: any = {}
    if (query) {
      where.OR = [
        { alt: { contains: query } },
        { url: { contains: query } },
        { localPath: { contains: query } }
      ]
    }
    if (used === 'USED') where.articleId = { not: null }
    if (used === 'UNUSED') where.articleId = null

    const [total, items] = await Promise.all([
      prisma.image.count({ where }),
      prisma.image.findMany({
        where,
        include: { article: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ])

    const data = items.map((img) => ({
      id: img.id,
      url: img.url,
      localPath: img.localPath || '',
      alt: img.alt || '',
      createdAt: img.createdAt?.toISOString?.() || null,
      articleId: img.articleId || null,
      articleTitle: (img as any).article?.title || null,
    }))

    return NextResponse.json({ success: true, data: { total, page, limit, images: data } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}