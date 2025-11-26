export interface Article {
  id: string
  title: string
  content: string
  summary?: string
  status: ArticleStatus
  keywords: string[]
  images: Image[]
  publishRecords: PublishRecord[]
  analysisData?: any
  createdAt: Date
  updatedAt: Date
}

export interface Image {
  id: string
  url: string
  alt?: string
  source: ImageSource
  localPath?: string
  articleId?: string
  article?: Article
  createdAt: Date
}

export interface PublishRecord {
  id: string
  articleId: string
  article: Article
  platform: PublishPlatform
  platformId?: string
  status: PublishStatus
  publishedAt?: Date
  errorMessage?: string
  createdAt: Date
}

export interface TopicAnalysis {
  id: string
  keyword: string
  analysisData: any
  aiProvider: string
  createdAt: Date
}

export interface AIConfig {
  id: string
  provider: string
  apiKey?: string
  model: string
  config: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  username: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED'
}

export enum ImageSource {
  UNSPLASH = 'UNSPLASH',
  LOCAL = 'LOCAL',
  EXTERNAL = 'EXTERNAL'
}

export enum PublishPlatform {
  XIAOHONGSHU = 'XIAOHONGSHU',
  WECHAT = 'WECHAT'
}

export enum PublishStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

// 选题分析相关类型
export interface WechatArticle {
  id: string
  title: string
  content: string
  readCount: number
  likeCount: number
  viewCount: number
  publishTime: Date
  author: string
  url?: string
  engagementRate?: string
}

// 真实API响应类型定义
export interface WechatSearchResponse {
  code: number
  cost_money: number
  cut_words: string
  data: WechatArticleData[]
  data_number: number
  msg: string
  page: number
  remain_money: number
  total: number
  total_page: number
  [property: string]: any
}

export interface WechatArticleData {
  /**
   * 封面
   */
  avatar: string
  /**
   * 分类
   */
  classify: string
  /**
   * 正文
   */
  content: string
  /**
   * 原始id
   */
  ghid: string
  /**
   * 发布地址
   */
  ip_wording: string
  /**
   * 是否原创
   */
  is_original: number
  /**
   * 再看数
   */
  looking: number
  /**
   * 点赞数
   */
  praise: number
  /**
   * 发布时间
   */
  publish_time: number
  publish_time_str: string
  /**
   * 阅读数
   */
  read: number
  /**
   * 文章原始短链接
   */
  short_link: string
  /**
   * 文章标题
   */
  title: string
  /**
   * 更新时间
   */
  update_time: number
  update_time_str: string
  /**
   * 文章长连接
   */
  url: string
  /**
   * wxid
   */
  wx_id: string
  /**
   * 公众号名字
   */
  wx_name: string
  [property: string]: any
}

// API请求参数类型
export interface WechatSearchRequest {
  kw: string
  sort_type: number
  mode: number
  period: number
  page: number
  key: string
  any_kw: string
  ex_kw: string
  verifycode: string
  type: number
}

export interface ArticleSummary {
  id: string
  articleId: string
  summary: string
  keyPoints: string[]
  tags: string[]
  aiProvider: string
  createdAt: Date
}

export interface TopicInsight {
  keyword: string
  totalArticles: number
  topLikedArticles: WechatArticle[]
  topEngagementArticles: WechatArticle[]
  wordCloud: Array<{ word: string; count: number }>
  insights: string[]
  createdAt: Date
}

// AI相关类型
export interface AIProvider {
  name: string
  models: string[]
  generateText: (prompt: string, options?: any) => Promise<string>
  generateSummary: (content: string) => Promise<string>
  generateInsight: (data: any) => Promise<string>
}

export interface ContentGenerationRequest {
  topic: string
  style?: string
  length?: number
  keywords?: string[]
  aiProvider?: string
}

export interface ContentGenerationResponse {
  content: string
  title: string
  summary: string
  keywords: string[]
  aiProvider: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// 数据库相关类型
export interface SearchHistory {
  id: string
  keyword: string
  totalArticles: number
  apiCost: number
  apiInfo?: {
    cost_money: number
    remain_money: number
    total_page: number
    current_page: number
  }
  searchDate: Date
  articles?: WechatArticle[]
  reports?: AnalysisReportDB[]
}

export interface WechatArticleDB {
  id: string
  externalId: string
  title: string
  content: string
  author: string
  readCount: number
  likeCount: number
  lookingCount: number
  publishTime: Date
  url: string
  engagementRate: string
  originalData?: any
  createdAt: Date
  searchHistoryId: string
  searchHistory?: SearchHistory
}

export interface AnalysisReportDB {
  id: string
  analysisData: any
  wordCloudData: Array<{ word: string; count: number }>
  insightsData: string[]
  generatedAt: Date
  exportedAt?: Date
  searchHistoryId: string
  searchHistory?: SearchHistory
}

// 图表数据类型
export interface ChartData {
  name: string
  value: number
  count?: number
  [key: string]: any
}

export interface TimeSeriesData {
  date: string
  count: number
  value: number
}

export interface ScatterData {
  x: number
  y: number
  title: string
  author: string
}

export interface AnalysisResult {
  keyword: string
  totalArticles: number
  apiCost: number
  apiInfo?: {
    cost_money: number
    remain_money: number
    total_page: number
    current_page: number
  }
  searchHistoryId: string
  topLikedArticles: WechatArticle[]
  topEngagementArticles: WechatArticle[]
  wordCloud: Array<{ word: string; count: number }>
  insights: string[]
  generatedAt?: Date
}