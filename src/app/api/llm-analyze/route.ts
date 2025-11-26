import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { llmAdapterFactory, type LLMConfig } from '@/lib/llm-adapters'
import { buildComprehensiveAnalysisPrompt, type AnalysisContext } from '@/lib/llm-prompts'
import { generateEnhancedWordCloud } from '@/lib/text-analysis'
import { saveAnalysisReport } from '@/lib/db/operations'

// 更新使用统计（使用新的schema）
async function updateUsageStats(providerConfigId: string) {
  try {
    const stats = await prisma.lLMUsageStats.findUnique({
      where: { providerConfigId }
    })

    if (stats) {
      await prisma.lLMUsageStats.update({
        where: { providerConfigId },
        data: {
          usageCount: stats.usageCount + 1,
          lastUsedAt: new Date()
        }
      })
    } else {
      await prisma.lLMUsageStats.create({
        data: {
          providerConfigId,
          usageCount: 1,
          lastUsedAt: new Date()
        }
      })
    }
  } catch (error) {
    console.error('更新使用统计失败:', error)
  }
}

// 获取使用次数（使用新的schema）
async function getUsageCount(providerConfigId: string): Promise<number> {
  try {
    const stats = await prisma.lLMUsageStats.findUnique({
      where: { providerConfigId }
    })
    return stats?.usageCount || 0
  } catch (error) {
    console.error('获取使用次数失败:', error)
    return 0
  }
}

// 解析LLM响应
function parseLLMResponse(response: string): any {
  try {
    // 尝试直接解析JSON
    return JSON.parse(response)
  } catch (error) {
    console.error('JSON解析失败，尝试提取JSON内容:', error)

    // 尝试从响应中提取JSON内容
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (extractError) {
        console.error('JSON提取解析失败:', extractError)
      }
    }

    throw new Error('无法解析LLM响应为有效的JSON格式')
  }
}

// 调用LLM API
async function callLLMAPI(prompt: string, config: LLMConfig): Promise<any> {
  const adapter = llmAdapterFactory.getAdapter(config.provider)

  console.log(`🤖 调用${adapter.name}进行分析...`)

  const response = await adapter.callAPI(prompt, config)
  const result = adapter.formatResponse(response)

  console.log(`✅ ${adapter.name}分析完成`)
  return result
}

// 构建分析上下文
function buildAnalysisContext(articles: any[], keyword: string): AnalysisContext {
  const totalArticles = articles.length
  const avgReadCount = Math.round(
    articles.reduce((sum, article) => sum + (article.readCount || 0), 0) / totalArticles
  )
  const avgLikeCount = Math.round(
    articles.reduce((sum, article) => sum + (article.likeCount || 0), 0) / totalArticles
  )

  return {
    articles,
    keyword,
    totalArticles,
    avgReadCount,
    avgLikeCount
  }
}

// 格式化LLM分析结果为系统标准格式
function formatLLMResult(llmResult: any, keyword: string, articles: any[]): any {
  // 计算互动率
  const articlesWithEngagement = articles.map(article => ({
    ...article,
    engagementRate: article.readCount > 0
      ? (article.likeCount / article.readCount * 100).toFixed(2)
      : '0'
  }))

  // 按点赞数排序
  const topLikedArticles = [...articlesWithEngagement]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5)

  // 按互动率排序
  const topEngagementArticles = [...articlesWithEngagement]
    .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))
    .slice(0, 5)

  // 处理词云数据
  let wordCloud = []
  if (llmResult.wordCloud && Array.isArray(llmResult.wordCloud) && llmResult.wordCloud.length > 0) {
    wordCloud = llmResult.wordCloud.map((item: any) => ({
      word: item.word,
      count: item.count || 1
    }))
  } else {
    // 如果LLM没有返回词云数据，使用本地算法生成
    console.log('⚠️ LLM未返回有效词云数据，使用本地算法生成')
    wordCloud = generateRealWordCloud(articles, keyword)
  }

  // 处理洞察数据
  let insights = []
  if (llmResult.insights && Array.isArray(llmResult.insights)) {
    insights = llmResult.insights
  } else if (typeof llmResult.insights === 'string') {
    insights = [llmResult.insights]
  }

  // 如果没有洞察，生成基础洞察
  if (insights.length === 0) {
    insights = [
      `基于${keyword}主题的${articles.length}篇文章分析完成`,
      `文章平均阅读量为${Math.round(articles.reduce((sum, a) => sum + (a.readCount || 0), 0) / articles.length)}`,
      `词云分析显示了该话题的主要关注点`,
      `建议结合分析结果进行内容创作优化`
    ]
  }

  return {
    keyword,
    totalArticles: articles.length,
    topLikedArticles,
    topEngagementArticles,
    wordCloud,
    insights,
    contentStrategy: llmResult.contentStrategy || null,
    qualityMetrics: llmResult.qualityMetrics || null,
    analysisSummary: llmResult.analysisSummary || null,
    generatedAt: new Date().toISOString(),
    analysisType: 'llm'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { articles, keyword, configId, searchHistoryId } = await request.json()

    // 验证输入参数
    if (!articles || !Array.isArray(articles) || !keyword || !configId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：articles、keyword、configId' },
        { status: 400 }
      )
    }

    console.log(`🚀 开始LLM分析，关键词: ${keyword}，文章数量: ${articles.length}`)

    // 获取LLM供应商配置
    const providerConfig = await prisma.lLMProviderConfig.findUnique({
      where: { id: configId },
      include: {
        usageStats: true,
      }
    })

    if (!providerConfig) {
      throw new Error('未找到指定的LLM配置')
    }

    if (!providerConfig.isActive) {
      throw new Error('指定的LLM配置已被禁用')
    }

    // 获取选中的模型信息
    let selectedModelInfo = null
    if (providerConfig.selectedModel) {
      selectedModelInfo = await prisma.lLMModel.findUnique({
        where: { id: providerConfig.selectedModel }
      })
    }

    // 构建适配器所需的配置格式（简化版本，移除温度和maxTokens参数）
    const config = {
      id: providerConfig.id,
      provider: providerConfig.provider,
      name: providerConfig.name,
      apiKey: providerConfig.apiKey || undefined,
      apiEndpoint: providerConfig.apiEndpoint || undefined,
      selectedModel: selectedModelInfo?.modelName || 'default'
    }

    console.log(`📋 使用配置: ${config.provider} - ${selectedModelInfo?.displayName || config.selectedModel}`)

    // 更新使用统计
    await updateUsageStats(configId)

    try {
      // 构建分析上下文
      const analysisContext = buildAnalysisContext(articles, keyword)

      // 构建LLM提示词
      const prompt = buildComprehensiveAnalysisPrompt(analysisContext)

      console.log('📝 已构建分析提示词，开始调用LLM...')

      // 调用LLM API
      const llmResult = await callLLMAPI(prompt, config)

      console.log('✅ LLM分析完成，正在格式化结果...')
      console.log('🔍 LLM原始返回:', JSON.stringify(llmResult, null, 2))
      console.log('🔍 wordCloud字段:', llmResult.wordCloud)
      console.log('🔍 insights字段:', llmResult.insights)

      // 格式化LLM结果为系统标准格式
      const analysisResult = formatLLMResult(llmResult, keyword, articles)

      // 保存分析结果到数据库（完全替换）
      if (searchHistoryId) {
        try {
          await saveAnalysisReport({
            searchHistoryId,
            analysisData: analysisResult,
            wordCloudData: analysisResult.wordCloud,
            insightsData: analysisResult.insights,
            analysisType: 'llm',
            llmProvider: config.provider,
            llmModel: selectedModelInfo?.displayName || config.selectedModel || 'unknown'
          } as any)
          console.log(`💾 LLM分析结果已保存到数据库，searchHistoryId: ${searchHistoryId}`)
        } catch (dbError) {
          console.error('保存LLM分析结果失败:', dbError)
          // 即使保存失败，也返回分析结果
        }
      }

      // 获取使用次数
      const usageCount = await getUsageCount(configId)

      console.log(`🎉 LLM分析完成，使用次数: ${usageCount}`)

      return NextResponse.json({
        success: true,
        data: analysisResult,
        usageCount,
        llmInfo: {
          provider: config.provider,
          modelName: config.selectedModel,
          adapterName: llmAdapterFactory.getAdapter(config.provider).name
        }
      })

    } catch (llmError) {
      console.error('❌ LLM分析失败，降级到原有算法:', llmError)

      // 降级到原有算法
      console.log('🔄 降级到原有分析算法...')
      const fallbackResult: any = generateRealAnalysis(articles, keyword)
      fallbackResult.analysisType = 'mock' // 标记为降级结果

      return NextResponse.json({
        success: true,
        data: fallbackResult,
        fallback: true,
        fallbackReason: llmError instanceof Error ? llmError.message : 'LLM分析失败'
      })
    }

  } catch (error) {
    console.error('LLM分析API错误:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'LLM分析失败',
        fallback: true
      },
      { status: 500 }
    )
  }
}

/**
 * 生成真实的词云数据（降级使用）
 */
function generateRealWordCloud(articles: any[], keyword: string): Array<{ word: string; count: number }> {
  try {
    console.log(`🔍 开始生成词云数据，文章数量: ${articles.length}`)

    // 使用真实的文本分析算法
    const wordCloudData = generateEnhancedWordCloud(articles, keyword, {
      minWordLength: 2,
      maxWords: 50,
      includeEnglish: true,
      weightByLength: true
    })

    console.log(`✅ 词云数据生成完成，词汇数量: ${wordCloudData.length}`)
    console.log('📊 前10个高频词:', wordCloudData.slice(0, 10).map(w => `${w.word}(${w.count})`).join(', '))

    return wordCloudData

  } catch (error) {
    console.error('❌ 词云数据生成失败:', error)

    // 降级到基础模拟数据
    return [
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
  }
}

/**
 * 基于真实数据生成选题洞察（降级使用）
 */
function generateRealInsights(articles: any[], keyword: string, wordCloudData: Array<{ word: string; count: number }>): string[] {
  const insights: string[] = []

  // 1. 基本数据洞察
  const totalArticles = articles.length
  const avgReadCount = Math.round(articles.reduce((sum, article) => sum + (article.readCount || 0), 0) / totalArticles)
  const avgLikeCount = Math.round(articles.reduce((sum, article) => sum + (article.likeCount || 0), 0) / totalArticles)
  const avgEngagementRate = avgReadCount > 0 ? ((avgLikeCount / avgReadCount) * 100).toFixed(1) : '0'

  // 2. 基于关键词的洞察
  insights.push(`关于"${keyword}"主题的${totalArticles}篇文章分析显示，平均阅读量${avgReadCount}，互动率${avgEngagementRate}%`)

  // 3. 基于高频词的洞察
  if (wordCloudData.length > 3) {
    const topWords = wordCloudData.slice(1, 5).map(w => w.word).join('、')
    insights.push(`除了核心关键词"${keyword}"，相关高频词包括：${topWords}，反映了该话题的主要讨论方向`)

    // 检查是否有技术相关词汇
    const techWords = wordCloudData.filter(w => ['技术', '开发', '系统', '算法', '应用', '软件'].includes(w.word))
    if (techWords.length > 0) {
      insights.push(`技术类词汇出现频率较高，建议深入技术实现细节`)
    }

    // 检查是否有趋势相关词汇
    const trendWords = wordCloudData.filter(w => ['趋势', '未来', '发展', '前景', '方向'].includes(w.word))
    if (trendWords.length > 0) {
      insights.push(`趋势类词汇占比较高，读者对行业发展前景较为关注`)
    }
  }

  // 4. 内容建议
  if (avgEngagementRate !== '0' && parseFloat(avgEngagementRate) < 2) {
    insights.push(`互动率相对较低（${avgEngagementRate}%），建议增加互动性内容或优化话题切入点`)
  } else if (parseFloat(avgEngagementRate) > 10) {
    insights.push(`互动率较高（${avgEngagementRate}%），该话题具有较强的用户参与度`)
  }

  // 5. 基于文章质量的洞察
  const highQualityArticles = articles.filter(article => article.readCount > avgReadCount)
  if (highQualityArticles.length > 0) {
    insights.push(`${highQualityArticles.length}篇文章表现优于平均水平，可分析其成功要素`)
  }

  return insights
}

/**
 * 降级分析函数（当LLM分析失败时使用）
 */
function generateRealAnalysis(articles: any[], keyword: string) {
  console.log(`🚀 开始降级数据分析，关键词: ${keyword}，文章数量: ${articles.length}`)

  // 1. 计算互动率
  const articlesWithEngagement = articles.map(article => ({
    ...article,
    engagementRate: article.readCount > 0 ? (article.likeCount / article.readCount * 100).toFixed(2) : '0'
  }))

  // 2. 按点赞数排序
  const topLikedArticles = [...articlesWithEngagement]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5)

  // 3. 按互动率排序
  const topEngagementArticles = [...articlesWithEngagement]
    .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))
    .slice(0, 5)

  // 4. 生成真实的词云数据
  const wordCloud = generateRealWordCloud(articles, keyword)

  // 5. 基于真实数据生成选题洞察
  const insights = generateRealInsights(articles, keyword, wordCloud)

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