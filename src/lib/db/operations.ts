import { PrismaClient } from '@prisma/client'
import type {
  SearchHistory,
  WechatArticleDB,
  AnalysisReportDB,
  WechatArticleData
} from '@/types'

const prisma = new PrismaClient()

// 搜索历史操作
export async function createSearchHistory(data: {
  keyword: string
  totalArticles: number
  apiCost: number
  apiInfo?: any
}): Promise<SearchHistory> {
  const searchHistory = await prisma.searchHistory.create({
    data: {
      keyword: data.keyword,
      totalArticles: data.totalArticles,
      apiCost: data.apiCost,
      apiInfo: data.apiInfo ? JSON.stringify(data.apiInfo) : null,
    },
    include: {
      articles: true,
      reports: true,
    }
  })

  return {
    ...searchHistory,
    apiInfo: searchHistory.apiInfo ? JSON.parse(searchHistory.apiInfo) : undefined,
    articles: searchHistory.articles.map(article => ({
      ...article,
      viewCount: article.lookingCount
    })),
    reports: searchHistory.reports.map(report => ({
      ...report,
      analysisData: JSON.parse(report.analysisData),
      wordCloudData: JSON.parse(report.wordCloudData),
      insightsData: JSON.parse(report.insightsData),
      exportedAt: report.exportedAt || undefined
    }))
  }
}

export async function getSearchHistoryList(limit: number = 10): Promise<SearchHistory[]> {
  const histories = await prisma.searchHistory.findMany({
    orderBy: { searchDate: 'desc' },
    take: limit,
    include: {
      articles: true,
      reports: true,
    }
  })

  return histories.map(history => ({
    ...history,
    apiInfo: history.apiInfo ? JSON.parse(history.apiInfo) : undefined,
    articles: history.articles.map(article => ({
      ...article,
      viewCount: article.lookingCount
    })),
    reports: history.reports.map(report => ({
      ...report,
      analysisData: JSON.parse(report.analysisData),
      wordCloudData: JSON.parse(report.wordCloudData),
      insightsData: JSON.parse(report.insightsData),
      exportedAt: report.exportedAt || undefined
    }))
  }))
}

export async function getSearchHistoryById(id: string): Promise<SearchHistory | null> {
  const history = await prisma.searchHistory.findUnique({
    where: { id },
    include: {
      articles: true,
      reports: true,
    }
  })

  if (!history) return null

  return {
    ...history,
    apiInfo: history.apiInfo ? JSON.parse(history.apiInfo) : undefined,
    articles: history.articles.map(article => ({
      ...article,
      viewCount: article.lookingCount
    })),
    reports: history.reports.map(report => ({
      ...report,
      analysisData: JSON.parse(report.analysisData),
      wordCloudData: JSON.parse(report.wordCloudData),
      insightsData: JSON.parse(report.insightsData),
      exportedAt: report.exportedAt || undefined
    }))
  }
}

export async function deleteSearchHistory(id: string): Promise<void> {
  await prisma.searchHistory.delete({
    where: { id }
  })
}

// 文章操作
export async function saveArticles(
  searchHistoryId: string,
  articles: WechatArticleData[]
): Promise<WechatArticleDB[]> {
  const savedArticles = await Promise.all(
    articles.map(async (article) => {
      return await prisma.wechatArticle.upsert({
        where: { externalId: article.short_link || article.url },
        update: {
          // 更新 searchHistoryId 以确保文章关联到最新的搜索
          searchHistoryId,
          // 也可以更新其他可能变化的字段
          readCount: article.read || 0,
          likeCount: article.praise || 0,
          lookingCount: article.looking || 0,
          engagementRate: article.read > 0 ? ((article.praise / article.read) * 100).toFixed(2) : '0',
        },
        create: {
          externalId: article.short_link || article.url,
          title: article.title,
          content: article.content,
          author: article.wx_name,
          readCount: article.read || 0,
          likeCount: article.praise || 0,
          lookingCount: article.looking || 0,
          publishTime: new Date(article.publish_time * 1000),
          url: article.url,
          engagementRate: article.read > 0 ? ((article.praise / article.read) * 100).toFixed(2) : '0',
          originalData: JSON.stringify(article),
          searchHistoryId,
        }
      })
    })
  )

  return savedArticles
}

export async function getArticlesBySearchHistory(
  searchHistoryId: string,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'publishTime',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ articles: WechatArticleDB[], total: number }> {
  const skip = (page - 1) * limit

  const orderBy: any = {}
  switch (sortBy) {
    case 'readCount':
      orderBy.readCount = sortOrder
      break
    case 'likeCount':
      orderBy.likeCount = sortOrder
      break
    case 'engagementRate':
      orderBy.engagementRate = sortOrder
      break
    case 'publishTime':
    default:
      orderBy.publishTime = sortOrder
      break
  }

  const [articles, total] = await Promise.all([
    prisma.wechatArticle.findMany({
      where: { searchHistoryId },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.wechatArticle.count({
      where: { searchHistoryId }
    })
  ])

  return { articles, total }
}

export async function searchArticles(
  keyword: string,
  searchHistoryId?: string,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'publishTime',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ articles: WechatArticleDB[], total: number }> {
  const skip = (page - 1) * limit

  const orderBy: any = {}
  switch (sortBy) {
    case 'readCount':
      orderBy.readCount = sortOrder
      break
    case 'likeCount':
      orderBy.likeCount = sortOrder
      break
    case 'engagementRate':
      orderBy.engagementRate = sortOrder
      break
    case 'publishTime':
    default:
      orderBy.publishTime = sortOrder
      break
  }

  const where: any = {}

  if (searchHistoryId) {
    // 如果指定了搜索历史ID，只按历史记录过滤，不进行关键词搜索
    where.searchHistoryId = searchHistoryId
  } else if (keyword) {
    // 如果没有指定历史记录ID，才进行关键词搜索
    where.OR = [
      { title: { contains: keyword } },
      { content: { contains: keyword } },
      { author: { contains: keyword } }
    ]
  }

  const [articles, total] = await Promise.all([
    prisma.wechatArticle.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.wechatArticle.count({ where })
  ])

  return { articles, total }
}

// 分析报告操作
export async function saveAnalysisReport(data: {
  searchHistoryId: string
  analysisData: any
  wordCloudData: Array<{ word: string; count: number }>
  insightsData: string[]
}): Promise<AnalysisReportDB> {
  const report = await prisma.analysisReport.create({
    data: {
      searchHistoryId: data.searchHistoryId,
      analysisData: JSON.stringify(data.analysisData),
      wordCloudData: JSON.stringify(data.wordCloudData),
      insightsData: JSON.stringify(data.insightsData),
    }
  })

  return {
    ...report,
    analysisData: JSON.parse(report.analysisData),
    wordCloudData: JSON.parse(report.wordCloudData),
    insightsData: JSON.parse(report.insightsData),
    exportedAt: report.exportedAt || undefined
  }
}

export async function getAnalysisReports(
  page: number = 1,
  limit: number = 10
): Promise<{ reports: AnalysisReportDB[], total: number }> {
  const skip = (page - 1) * limit

  const [reports, total] = await Promise.all([
    prisma.analysisReport.findMany({
      orderBy: { generatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        searchHistory: true
      }
    }),
    prisma.analysisReport.count()
  ])

  const formattedReports = reports.map(report => ({
    ...report,
    analysisData: JSON.parse(report.analysisData),
    wordCloudData: JSON.parse(report.wordCloudData),
    insightsData: JSON.parse(report.insightsData),
    exportedAt: report.exportedAt || undefined,
    searchHistory: report.searchHistory ? {
      ...report.searchHistory,
      apiInfo: report.searchHistory.apiInfo ? JSON.parse(report.searchHistory.apiInfo) : undefined
    } : undefined
  }))

  return { reports: formattedReports, total }
}

export async function updateExportTime(reportId: string): Promise<void> {
  await prisma.analysisReport.update({
    where: { id: reportId },
    data: { exportedAt: new Date() }
  })
}

// 获取统计数据
export async function getDashboardStats(): Promise<{
  totalSearches: number
  totalArticles: number
  totalCost: number
  recentSearches: string[]
}> {
  const [totalSearches, totalArticles, totalCost, recentSearches] = await Promise.all([
    prisma.searchHistory.count(),
    prisma.wechatArticle.count(),
    prisma.searchHistory.aggregate({
      _sum: { apiCost: true }
    }),
    prisma.searchHistory.findMany({
      orderBy: { searchDate: 'desc' },
      take: 5,
      select: { keyword: true }
    })
  ])

  return {
    totalSearches,
    totalArticles,
    totalCost: totalCost._sum.apiCost || 0,
    recentSearches: recentSearches.map(s => s.keyword)
  }
}

export default prisma