import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/operations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { success: false, error: '缺少文章URL' },
        { status: 400 }
      )
    }

    // 从数据库获取文章详情
    const article = await prisma.wechatArticle.findFirst({
      where: {
        OR: [
          { url: url },
          { externalId: url }
        ]
      }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      )
    }

    // 格式化返回数据
    const formattedArticle = {
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

    return NextResponse.json({
      success: true,
      data: formattedArticle
    })

  } catch (error) {
    console.error('通过URL获取文章详情失败:', error)
    return NextResponse.json(
      { success: false, error: '获取文章详情失败' },
      { status: 500 }
    )
  }
}