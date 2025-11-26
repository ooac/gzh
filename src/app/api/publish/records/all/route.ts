import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitStr = searchParams.get('limit') || '50'
    const limit = Math.max(1, Math.min(parseInt(limitStr || '50'), 200))
    const records = await prisma.publishRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { article: true }
    })
    const items = records.map(r => ({
      id: r.id,
      articleId: r.articleId,
      articleTitle: r.article?.title || '未命名文章',
      platform: r.platform === 'XIAOHONGSHU' ? '小红书' : '公众号',
      status: r.status.toLowerCase(),
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      platformId: r.platformId || null
    }))
    return NextResponse.json({ success: true, data: { items } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}