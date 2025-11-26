import { NextRequest, NextResponse } from 'next/server'
import { saveAnalysisReport } from '@/lib/db/operations'

// Mock AI分析结果
function generateMockAnalysis(articles: any[], keyword: string) {
  // 计算互动率 (点赞数 / 阅读数)
  const articlesWithEngagement = articles.map(article => ({
    ...article,
    engagementRate: article.readCount > 0 ? (article.likeCount / article.readCount * 100).toFixed(2) : 0
  }))

  // 按点赞数排序
  const topLikedArticles = [...articlesWithEngagement]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5)

  // 按互动率排序
  const topEngagementArticles = [...articlesWithEngagement]
    .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))
    .slice(0, 5)

  // 生成词云数据
  const wordCloud = [
    { word: keyword, count: 15 },
    { word: '技术', count: 12 },
    { word: '开发', count: 10 },
    { word: '实践', count: 8 },
    { word: '趋势', count: 7 },
    { word: '方法', count: 6 },
    { word: '分析', count: 5 },
    { word: '应用', count: 5 },
    { word: '工具', count: 4 },
    { word: '优化', count: 4 }
  ]

  // 生成选题洞察
  const insights = [
    `关于"${keyword}"主题的内容在近期表现活跃，用户参与度较高`,
    `技术类文章更容易获得高阅读量，但需要保持内容的实用性`,
    `案例分析和实践分享类内容互动率明显偏高`,
    `建议结合当前热点趋势，增加内容的时效性和话题性`,
    `深度技术解析文章虽然阅读量相对较少，但用户粘性和专业性更强`
  ]

  return {
    keyword,
    totalArticles: articles.length,
    topLikedArticles,
    topEngagementArticles,
    wordCloud,
    insights,
    generatedAt: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { articles, keyword, searchHistoryId, aiProvider = 'openai' } = await request.json()

    if (!articles || !Array.isArray(articles) || !keyword) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 模拟AI分析延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    const analysisResult = generateMockAnalysis(articles, keyword)

    // 如果提供了searchHistoryId，将分析结果保存到数据库
    if (searchHistoryId) {
      try {
        await saveAnalysisReport({
          searchHistoryId,
          analysisData: analysisResult,
          wordCloudData: analysisResult.wordCloud,
          insightsData: analysisResult.insights
        })
        console.log(`已保存分析报告到数据库，searchHistoryId: ${searchHistoryId}`)
      } catch (dbError) {
        console.error('保存分析报告失败:', dbError)
        // 即使保存失败，也返回分析结果
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analysisResult,
        aiProvider,
        analysisType: 'topic_insight',
        searchHistoryId
      }
    })

  } catch (error) {
    console.error('AI analysis API error:', error)
    return NextResponse.json(
      { success: false, error: 'AI分析失败，请重试' },
      { status: 500 }
    )
  }
}