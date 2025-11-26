import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 获取最新的搜索历史，包含文章和分析报告
    const latestSearchHistory = await prisma.searchHistory.findFirst({
      orderBy: { searchDate: 'desc' },
      include: {
        articles: {
          orderBy: { publishTime: 'desc' },
          take: 50 // 限制文章数量
        },
        reports: {
          orderBy: { generatedAt: 'desc' },
          take: 1 // 只获取最新的分析报告
        }
      }
    })

    if (!latestSearchHistory) {
      return NextResponse.json({
        success: false,
        error: '暂无搜索历史'
      }, { status: 404 })
    }

    // 转换文章数据格式
    const articles = latestSearchHistory.articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      author: article.author,
      readCount: article.readCount,
      likeCount: article.likeCount,
      lookingCount: article.lookingCount,
      publishTime: article.publishTime,
      url: article.url,
      engagementRate: article.engagementRate,
      originalData: article.originalData ? JSON.parse(article.originalData) : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        keyword: latestSearchHistory.keyword,
        articles,
        searchHistoryId: latestSearchHistory.id,
        totalArticles: articles.length,
        report: latestSearchHistory.reports[0] || null
      }
    })

  } catch (error) {
    console.error('获取最新搜索历史失败:', error)
    return NextResponse.json(
      { success: false, error: '获取搜索历史失败' },
      { status: 500 }
    )
  }
}