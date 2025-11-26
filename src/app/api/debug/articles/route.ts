import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const articleId = searchParams.get('id')

    if (!articleId) {
      // 获取最新的几篇文章列表
      const articles = await prisma.wechatArticle.findMany({
        take: 5,
        orderBy: { publishTime: 'desc' },
        select: {
          id: true,
          title: true,
          author: true,
          publishTime: true,
          readCount: true,
          likeCount: true
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          articles,
          message: '请提供文章ID参数来查看详细信息'
        }
      })
    }

    // 获取指定文章的详细信息，包括原始数据
    const article = await prisma.wechatArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      )
    }

    // 解析原始数据
    let originalData = null
    try {
      originalData = JSON.parse(article.originalData || '{}')
    } catch (e) {
      originalData = { error: '无法解析原始数据' }
    }

    // 检查内容中是否包含图片URL
    const content = article.content
    const imageRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp)/gi
    const wechatImageRegex = /mmbiz\.qpic\.cn|wx\.qlogo\.cn/gi
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi

    const foundImages = content.match(imageRegex) || []
    const wechatImages = content.match(wechatImageRegex) || []
    const markdownImages = []
    let match

    while ((match = markdownImageRegex.exec(content)) !== null) {
      markdownImages.push({
        alt: match[1],
        url: match[2]
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.title,
          author: article.author,
          publishTime: article.publishTime,
          readCount: article.readCount,
          likeCount: article.likeCount,
          url: article.url,
          contentLength: article.content.length,
          contentPreview: article.content.substring(0, 500) + '...'
        },
        originalData,
        imageAnalysis: {
          hasContent: !!content,
          contentLength: content.length,
          foundImageUrls: foundImages,
          wechatImageDomains: wechatImages,
          markdownImages: markdownImages,
          hasAnyImages: foundImages.length > 0 || wechatImages.length > 0 || markdownImages.length > 0
        }
      }
    })

  } catch (error) {
    console.error('调试API错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: '调试失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}