import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const searchHistoryId = searchParams.get('searchHistoryId') || undefined
    const keyword = searchParams.get('keyword') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = (searchParams.get('sortBy') || 'publishTime') as 'publishTime' | 'createdAt' | 'readCount' | 'likeCount'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const where: any = {}
    if (searchHistoryId) where.searchHistoryId = searchHistoryId
    if (keyword) where.title = { contains: keyword }

    const orderBy: any = (() => {
      if (sortBy === 'publishTime') return { publishTime: sortOrder }
      if (sortBy === 'createdAt') return { createdAt: sortOrder }
      if (sortBy === 'readCount') return { readCount: sortOrder }
      if (sortBy === 'likeCount') return { likeCount: sortOrder }
      return { publishTime: sortOrder }
    })()

    const total = await prisma.wechatArticle.count({ where })
    const articles = await prisma.wechatArticle.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit))
        }
      }
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '获取文章失败' }, { status: 500 })
  }
}