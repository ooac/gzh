import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const { searchParams, pathname } = new URL(req.url)
    const id = params.id || searchParams.get('id') || pathname.split('/').pop() || ''
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })

    // 首先尝试从 WechatArticle 表查询(选题分析的文章)
    let article = await prisma.wechatArticle.findUnique({ where: { id } })

    if (article) {
      // 格式化 WechatArticle 数据为统一格式
      return NextResponse.json({
        success: true,
        data: {
          id: article.id,
          title: article.title,
          content: article.content,
          author: article.author,
          readCount: article.readCount,
          likeCount: article.likeCount,
          lookingCount: article.lookingCount,
          engagementRate: article.engagementRate,
          publishTime: article.publishTime,
          url: article.url
        }
      })
    }

    // 如果 WechatArticle 表没找到,尝试从 Article 表查询(用户创建的文章)
    const userArticle = await prisma.article.findUnique({ where: { id } })
    if (!userArticle) return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 })

    return NextResponse.json({ success: true, data: userArticle as any })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json({ success: false, error: '获取文章失败' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const id = params.id
    const body = await req.json()
    const { title, content, summary, keywords, status, imagePrompts } = body

    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        content,
        summary,
        status,
        theme: body.theme || 'hammer',
        keywords: Array.isArray(keywords) ? keywords.join(',') : (keywords || ''),
        imagePrompts: imagePrompts ? JSON.stringify(imagePrompts) : null,
        updatedAt: new Date()
      } as any
    })
    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json({ success: false, error: 'Failed to update article' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const id = params.id
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })

    await prisma.article.delete({ where: { id } })
    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 })
  }
}
