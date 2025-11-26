import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureCoreTables } from '@/lib/init-db'

// 排序函数
function applySorting(articles: any[], sortBy: string, sortOrder: 'asc' | 'desc') {
  return articles.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'readCount':
        aValue = a.readCount || 0
        bValue = b.readCount || 0
        break
      case 'likeCount':
        aValue = a.likeCount || 0
        bValue = b.likeCount || 0
        break
      case 'engagementRate':
        aValue = parseFloat(a.engagementRate) || 0
        bValue = parseFloat(b.engagementRate) || 0
        break
      case 'publishTime':
      default:
        aValue = new Date(a.publishTime).getTime()
        bValue = new Date(b.publishTime).getTime()
        break
    }

    if (sortOrder === 'desc') {
      return bValue - aValue
    } else {
      return aValue - bValue
    }
  })
}

// 分页函数
function applyPagination(articles: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  return articles.slice(startIndex, endIndex)
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreTables(prisma)
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'publishedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const where: any = {}
    if (keyword) where.title = { contains: keyword }
    if (status) {
      const map: Record<string, string> = { '草稿': 'DRAFT', '待发布': 'PENDING', '已发布': 'PUBLISHED' }
      const s = (map[status] || status).toUpperCase()
      if (['DRAFT', 'PENDING', 'PUBLISHED'].includes(s)) where.status = s
    }

    let total = 0
    try {
      total = await prisma.article.count({ where })
    } catch { }

    const orderByClause = sortBy === 'updatedAt' ? { updatedAt: sortOrder } : (sortBy === 'publishedAt' ? { publishedAt: sortOrder } : { createdAt: sortOrder })
    let articles: any[] = []
    try {
      articles = await prisma.article.findMany({
        where,
        orderBy: orderByClause,
        skip: (page - 1) * limit,
        take: limit,
        include: { coverImage: true }
      })
    } catch {
      try {
        articles = await prisma.article.findMany({
          where,
          orderBy: orderByClause,
          skip: (page - 1) * limit,
          take: limit
        })
      } catch {
        articles = await prisma.article.findMany({
          where,
          orderBy: { createdAt: sortOrder },
          skip: (page - 1) * limit,
          take: limit
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch articles: ' + (error?.message || String(error)) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreTables(prisma)
    const body = await request.json()
    const { title, content, summary, keywords, status = 'DRAFT', imagePrompts } = body || {}
    if (!title || !content) {
      return NextResponse.json({ success: false, error: '缺少标题或内容' }, { status: 400 })
    }
    console.log('Creating article with data:', { title, status, theme: body.theme })
    const article = await prisma.article.create({
      data: {
        title,
        content,
        summary: summary || null,
        status,
        theme: body.theme || 'hammer',
        keywords: Array.isArray(keywords) ? keywords.join(',') : (keywords || ''),
        imagePrompts: imagePrompts ? JSON.stringify(imagePrompts) : null
      } as any
    })
    return NextResponse.json({ success: true, data: article })
  } catch (error: any) {
    console.error('Error creating article:', error)
    return NextResponse.json({ success: false, error: error?.message || '保存失败' }, { status: 500 })
  }
}
