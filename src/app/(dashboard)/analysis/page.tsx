'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageCircle,
  BarChart3,
  Download,
  FileText,
  History,
  List,
  Calendar,
  Clock
} from 'lucide-react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { saveScrollPosition, getScrollPosition } from '@/lib/scroll-position'
import WordCloud from '@/components/WordCloud'
import ReadCountDistribution from '@/components/charts/ReadCountDistribution'
import PublishTimeDistribution from '@/components/charts/PublishTimeDistribution'
import EngagementRateScatter from '@/components/charts/EngagementRateScatter'
import LikeCountHistogram from '@/components/charts/LikeCountHistogram'
import APIConfigButton from '@/components/APIConfig'
import LLMAnalysisButton from '@/components/LLMAnalysisButton'
import LLMModelSelector from '@/components/LLMModelSelector'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import { useAnalysisContextStore } from '@/store/analysisContext'
import type {
  WechatArticle,
  AnalysisResult,
  SearchHistory,
  ChartData,
  TimeSeriesData,
  ScatterData
} from '@/types'

// 搜索结果组件
function SearchResultsTab() {
  const [keyword, setKeyword] = useState('')
  const [recentKeywords, setRecentKeywords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [articles, setArticles] = useState<WechatArticle[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [searchLimit, setSearchLimit] = useState(20) // 新增：搜索结果条数选择
  const [notice, setNotice] = useState('')

  // 添加历史记录相关状态
  const [searchHistoryList, setSearchHistoryList] = useState<SearchHistory[]>([])
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const setContext = useAnalysisContextStore((s) => s.setContext)

  // 添加一个ref来跟踪最后处理的historyId，避免重复处理
  const lastProcessedHistoryId = useRef<string>('')

  // 加载历史关键词和检查URL参数
  useEffect(() => {
    console.log('🚀 SearchResultsTab: 组件挂载，开始初始化')
    const initializePage = async () => {
      // 首先加载历史关键词
      await loadRecentKeywords()

      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search)
      const historyId = urlParams.get('historyId')

      console.log('🔍 URL参数检查:', { historyId })

      if (historyId) {
        // 如果有historyId参数，直接加载
        console.log('✅ 从URL参数加载历史数据:', historyId)
        loadHistoryData(historyId)
      } else {
        // 尝试从localStorage恢复上一次的搜索状态
        const savedState = localStorage.getItem('analysisSearchState')
        console.log('🔍 localStorage状态:', savedState ? 'exists' : 'empty')

        if (savedState) {
          try {
            const state = JSON.parse(savedState)
            // 检查状态是否过期（24小时）
            const timestamp = new Date(state.timestamp)
            const now = new Date()
            const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)

            console.log('🔍 localStorage状态详情:', { keyword: state.keyword, hoursDiff, expired: hoursDiff >= 24 })

            if (hoursDiff < 24 && state.keyword && state.searchHistoryId) {
              console.log('✅ 从localStorage恢复状态:', state.searchHistoryId)
              setKeyword(state.keyword)
              loadHistoryData(state.searchHistoryId)
              return // 成功恢复状态,直接返回
            } else {
              // 状态过期，清理localStorage
              console.log('⚠️ localStorage状态已过期，清理')
              localStorage.removeItem('analysisSearchState')
            }
          } catch (error) {
            console.error('❌ 恢复状态失败:', error)
            localStorage.removeItem('analysisSearchState')
          }
        }

        // 如果没有URL参数也没有valid localStorage，加载最近的一次搜索
        console.log('📥 尝试加载最近的搜索记录')
        try {
          const response = await fetch('/api/analysis/history?limit=1')
          const data = await response.json()
          console.log('🔍 最近搜索记录响应:', { success: data.success, dataLength: data.data?.length })

          if (data.success && data.data.length > 0) {
            const latestSearch = data.data[0]
            console.log('✅ 自动加载最近的搜索:', { keyword: latestSearch.keyword, id: latestSearch.id })
            setKeyword(latestSearch.keyword)
            loadHistoryData(latestSearch.id)
          }
        } catch (error) {
          console.error('❌ 加载最近搜索失败:', error)
        }
      }
    }

    initializePage()
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(t)
  }, [notice])

  // 专门监听URL参数变化，用于处理来自ArticlesListTab的同步请求
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const historyId = urlParams.get('historyId')
      const tabParam = urlParams.get('tab')

      // 只处理search标签页的URL变化
      if (tabParam === 'search') {
        // 检查是否有新的historyId或者historyId被移除（表示选择"所有文章"）
        const hasHistoryId = historyId !== null
        const lastHadHistoryId = lastProcessedHistoryId.current !== ''
        const historyIdChanged = historyId !== lastProcessedHistoryId.current

        console.log('SearchResultsTab: 检测到URL参数变化', {
          historyId,
          hasHistoryId,
          lastProcessed: lastProcessedHistoryId.current,
          lastHadHistoryId,
          historyIdChanged
        })

        // 只有当historyId确实发生变化时才处理
        if (historyIdChanged) {
          if (hasHistoryId) {
            // 有historyId参数，加载特定历史记录
            console.log('SearchResultsTab: 加载特定历史记录', historyId)
            lastProcessedHistoryId.current = historyId
            loadHistoryData(historyId)
          } else {
            // 没有historyId参数，表示选择了"所有文章"，清空显示
            console.log('SearchResultsTab: 清空显示（所有文章）')
            lastProcessedHistoryId.current = ''
            setKeyword('')
            setArticles([])
            setAnalysisResult(null)
            setError('')
          }
        }
      }
    }

    // 监听popstate事件（浏览器前进后退）
    window.addEventListener('popstate', handleUrlChange)

    // 也监听pushState/replaceState（需要重写这些方法）
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      originalPushState.apply(history, args)
      setTimeout(handleUrlChange, 0)
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args)
      setTimeout(handleUrlChange, 0)
    }

    // 监听 setSearchKeyword 事件
    const handleSetKeyword = (event: CustomEvent) => {
      const { keyword } = event.detail
      setKeyword(keyword)
    }
    window.addEventListener('setSearchKeyword', handleSetKeyword as EventListener)

    return () => {
      window.removeEventListener('popstate', handleUrlChange)
      window.removeEventListener('setSearchKeyword', handleSetKeyword as EventListener)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [])

  const exportToMarkdown = async () => {
    if (!analysisResult?.searchHistoryId) {
      alert('无法导出：缺少搜索历史ID')
      return
    }

    try {
      const response = await fetch('/api/analysis/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchHistoryId: analysisResult.searchHistoryId })
      })

      if (!response.ok) {
        throw new Error('导出失败')
      }

      // 创建下载链接
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${analysisResult.keyword}_分析报告_${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Markdown报告导出成功！')
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    }
  }

  const loadRecentKeywords = async () => {
    try {
      const response = await fetch('/api/analysis/history?limit=5')
      const data = await response.json()
      if (data.success) {
        const keywords = data.data.map((h: SearchHistory) => h.keyword)
        setRecentKeywords(keywords)
        setSearchHistoryList(data.data)
      }
    } catch (error) {
      console.error('加载历史关键词失败:', error)
    }
  }

  const loadHistoryData = async (historyId: string) => {
    console.log('loadHistoryData: 开始加载历史数据', { historyId })
    try {
      setIsLoading(true)
      setError('')

      // 获取历史记录的详细数据
      console.log('loadHistoryData: 发送API请求', { historyId })
      const response = await fetch(`/api/analysis/history?id=${historyId}`)
      const data = await response.json()
      console.log('loadHistoryData: API响应', { success: data.success, data: data.data })

      if (data.success) {
        const historyData = data.data
        console.log('loadHistoryData: 历史数据获取成功', {
          keyword: historyData.keyword,
          articlesCount: historyData.articles?.length || 0,
          reportsCount: historyData.reports?.length || 0
        })
        console.log('🔍 完整历史数据:', historyData)
        console.log('🔍 reports字段详情:', historyData.reports)

        // 设置关键词
        console.log('loadHistoryData: 设置关键词', { oldKeyword: keyword, newKeyword: historyData.keyword })
        setKeyword(historyData.keyword)

        // 设置历史记录ID，用于后续API调用
        setSelectedHistoryId(historyId)
        setSearchKeyword('')
        setCurrentPage(1)

        // 同步上下文（关键词、文章数量）
        setContext({ currentKeyword: historyData.keyword, currentHistoryId: historyId, articleCount: historyData.articles?.length || 0 })

        // 设置文章数据
        if (historyData.articles && historyData.articles.length > 0) {
          setArticles(historyData.articles)
        } else {
          // 如果历史记录没有关联文章，但分析报告中有文章数据，则使用分析报告中的数据
          if (historyData.reports && historyData.reports.length > 0) {
            const report = historyData.reports[0]
            try {
              const reportAnalysisData = JSON.parse(report.analysisData)
              if (reportAnalysisData.topLikedArticles && reportAnalysisData.topLikedArticles.length > 0) {
                // 将分析报告中的文章数据转换为文章列表需要的格式
                const reportArticles = reportAnalysisData.topLikedArticles.map((article: any) => ({
                  id: article.id,
                  title: article.title,
                  content: article.content,
                  author: article.author,
                  readCount: article.readCount || 0,
                  likeCount: article.likeCount || 0,
                  lookingCount: article.viewCount || 0,
                  publishTime: article.publishTime,
                  engagementRate: article.engagementRate || '0',
                  url: article.url,
                  searchHistoryId: historyId
                }))
                console.log(`从分析报告中加载了 ${reportArticles.length} 篇文章`)
                setArticles(reportArticles)
              } else {
                setArticles([])
                console.warn(`历史记录 ${historyId} 没有关联的文章，分析报告中也没有文章数据`)
              }
            } catch (parseError) {
              console.error('解析分析报告数据失败:', parseError)
              setArticles([])
            }
          } else {
            // 如果历史记录没有关联文章，也没有分析报告，清空文章列表并让用户知道
            setArticles([])
            console.warn(`历史记录 ${historyId} 没有关联的文章`)
          }
        }

        // 创建文章URL到数据库ID的映射，用于后续转换AI报告中的文章ID
        const articleIdMap = new Map()
        if (historyData.articles && historyData.articles.length > 0) {
          historyData.articles.forEach((article: any) => {
            if (article.url && article.id) {
              articleIdMap.set(article.url, article.id)
            }
          })
        }

        // 构造分析结果数据，模拟搜索结果
        const analysisData: any = {
          keyword: historyData.keyword,
          totalArticles: historyData.totalArticles,
          apiCost: historyData.apiCost,
          apiInfo: historyData.apiInfo,
          searchHistoryId: historyData.id,
          topLikedArticles: historyData.articles?.slice(0, 5).map((article: any) => ({
            ...article,
            engagementRate: article.readCount > 0 ? ((article.likeCount / article.readCount) * 100).toFixed(2) : '0'
          })) || [],
          topEngagementArticles: historyData.articles?.slice(0, 5).map((article: any) => ({
            ...article,
            engagementRate: article.readCount > 0 ? ((article.likeCount / article.readCount) * 100).toFixed(2) : '0'
          })) || [],
          wordCloud: [], // 初始化为空数组
          insights: []   // 初始化为空数组
        }

        // 如果有分析报告数据，也加载出来
        if (historyData.reports && historyData.reports.length > 0) {
          const report = historyData.reports[0]
          try {
            // 注意: getSearchHistoryById 已经 JSON.parse 过了,这里直接使用
            const reportAnalysisData = report.analysisData
            const wordCloudData = report.wordCloudData
            const insightsData = report.insightsData

            console.log('📊 加载分析报告数据:', {
              hasAnalysisData: !!reportAnalysisData,
              hasWordCloud: !!wordCloudData,
              wordCloudLength: Array.isArray(wordCloudData) ? wordCloudData.length : 0,
              hasInsights: !!insightsData,
              insightsLength: Array.isArray(insightsData) ? insightsData.length : 0
            })

            // 辅助函数：将文章数据中的URL格式ID转换为数据库ID
            const convertArticleIds = (articles: any[] = []) => {
              return articles.map(article => {
                if (!article) return null

                // 如果ID已经是数据库ID格式（以cm开头），直接返回
                if (article.id && typeof article.id === 'string' && article.id.startsWith('cm')) {
                  return article
                }

                // 如果ID是URL格式，尝试从映射中查找数据库ID
                if (article.url && articleIdMap.has(article.url)) {
                  const dbId = articleIdMap.get(article.url)
                  return { ...article, id: dbId }
                }

                // 如果无法找到对应的数据库ID，返回null（将被过滤掉）
                console.warn('无法找到文章对应的数据库ID:', article.url || article.id)
                return null
              }).filter(Boolean) // 过滤掉null值
            }

            // 使用保存的分析数据，但转换文章ID格式
            analysisData.topLikedArticles = convertArticleIds(reportAnalysisData.topLikedArticles) || analysisData.topLikedArticles
            analysisData.topEngagementArticles = convertArticleIds(reportAnalysisData.topEngagementArticles) || analysisData.topEngagementArticles
            analysisData.wordCloud = wordCloudData
            analysisData.insights = insightsData
            analysisData.generatedAt = reportAnalysisData.generatedAt
          } catch (parseError) {
            console.error('解析分析报告数据失败:', parseError)
            // 保持默认的空数组
          }
        } else {
          // 如果没有报告数据,尝试自动触发一次分析
          console.log('⚠️ 该搜索历史没有分析报告,尝试自动生成...')

          if (historyData.articles && historyData.articles.length > 0) {
            try {
              // 获取LLM配置
              const configsResponse = await fetch('/api/llm-configs')
              const configsData = await configsResponse.json()
              const activeConfig = configsData.data?.providerConfigs?.find((c: any) => c.isDefault || c.isActive)

              if (activeConfig) {
                console.log('✅ 找到活跃的LLM配置,开始分析...')
                const analysisResponse = await fetch('/api/llm-analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    articles: historyData.articles,
                    keyword: historyData.keyword,
                    searchHistoryId: historyId,
                    configId: activeConfig.id
                  })
                })

                const analysisResult = await analysisResponse.json()
                if (analysisResult.success && analysisResult.data) {
                  console.log('✅ 自动分析完成,更新数据')
                  analysisData.wordCloud = analysisResult.data.wordCloud || []
                  analysisData.insights = analysisResult.data.insights || []
                  analysisData.topLikedArticles = analysisResult.data.topLikedArticles || analysisData.topLikedArticles
                  analysisData.topEngagementArticles = analysisResult.data.topEngagementArticles || analysisData.topEngagementArticles
                  analysisData.generatedAt = analysisResult.data.generatedAt
                } else {
                  console.log('❌ 自动分析失败:', analysisResult.error)
                }
              } else {
                console.log('⚠️ 没有找到活跃的LLM配置')
              }
            } catch (autoAnalysisError) {
              console.error('❌ 自动分析失败:', autoAnalysisError)
            }
          } else {
            console.log('⚠️ 没有文章数据,无法进行分析')
          }
        }

        // 设置分析结果
        setAnalysisResult(analysisData)

        // 更新URL参数，确保ArticlesListTab能够同步
        const url = new URL(window.location.href)
        url.searchParams.set('historyId', historyId)
        url.searchParams.set('tab', 'search')
        window.history.pushState({}, '', url.toString())
        console.log('loadHistoryData: 更新URL参数', {
          historyId,
          keyword: historyData.keyword
        })

        // 保存状态到localStorage
        localStorage.setItem('analysisSearchState', JSON.stringify({
          keyword: historyData.keyword,
          searchHistoryId: historyData.id,
          timestamp: new Date().toISOString()
        }))
      }
    } catch (error) {
      console.error('加载历史数据失败:', error)
      setError('加载历史数据失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理历史记录按钮点击
  const handleHistoryButtonClick = (history: SearchHistory) => {
    console.log('SearchResultsTab: 点击历史记录按钮', {
      historyId: history.id,
      keyword: history.keyword
    })

    // 设置选中的历史记录ID
    setSelectedHistoryId(history.id)
    setKeyword(history.keyword)

    // 加载历史数据（不重新请求API）
    loadHistoryData(history.id)
  }

  // 监听来自历史报告的事件
  useEffect(() => {
    const handleLoadHistoryData = (event: CustomEvent) => {
      const { historyId } = event.detail
      loadHistoryData(historyId)
    }

    window.addEventListener('loadHistoryData', handleLoadHistoryData as EventListener)

    // 监听来自 ArticlesListTab 的历史记录选择变化
    const handleHistorySelectChanged = (event: CustomEvent) => {
      console.log('SearchResultsTab: handleHistorySelectChanged 被调用', event)
      const { historyId } = event.detail
      console.log('SearchResultsTab: 收到历史记录选择变化', { historyId, currentKeyword: keyword })
      console.log('SearchResultsTab: 开始调用 loadHistoryData')
      loadHistoryData(historyId)
    }

    console.log('SearchResultsTab: 注册 historySelectChanged 事件监听器')
    window.addEventListener('historySelectChanged', handleHistorySelectChanged as EventListener)

    return () => {
      window.removeEventListener('loadHistoryData', handleLoadHistoryData as EventListener)
      window.removeEventListener('historySelectChanged', handleHistorySelectChanged as EventListener)
    }
  }, [])

  const handleSearch = async (searchKeyword?: string) => {
    const searchValue = searchKeyword || keyword
    if (!searchValue.trim()) {
      setError('请输入关键词')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 搜索公众号文章，使用选择的条数
      const savedCfg = typeof window !== 'undefined' ? localStorage.getItem('apiConfig') : null
      let override: any = {}
      if (savedCfg) {
        try {
          const cfg = JSON.parse(savedCfg)
          if (cfg && cfg.apiKey && cfg.apiUrl) {
            override.apiKey = cfg.apiKey
            override.apiUrl = cfg.apiUrl
          }
        } catch { }
      }
      const searchResponse = await fetch('/api/wechat/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchValue, limit: searchLimit, ...override })
      })

      const searchResult = await searchResponse.json()

      if (!searchResult.success) {
        throw new Error(searchResult.error || '搜索失败')
      }

      // 检查是否找到了文章
      if (searchResult.data.articles.length === 0) {
        setError(searchResult.data.message || '未找到相关文章，请尝试其他关键词')
        return
      }

      setArticles(searchResult.data.articles)

      let configId: string | null = null
      try {
        const localCfg = (window as any).__analysisLLM
        if (localCfg?.id) configId = localCfg.id
        if (!configId) {
          const r = await fetch('/api/llm-selection?feature=analysis')
          const j = await r.json()
          if (j.success && j.data?.providerConfigId) configId = j.data.providerConfigId
        }
        if (!configId) {
          const r2 = await fetch('/api/llm-configs')
          const j2 = await r2.json()
          if (j2.success) {
            const active = (j2.data.providerConfigs || []).find((c: any) => c.isActive)
            configId = active?.id || null
          }
        }
      } catch { }

      const analysisResponse = await fetch(configId ? '/api/llm-analyze' : '/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: searchResult.data.articles,
          keyword: searchValue,
          searchHistoryId: searchResult.data.searchHistoryId,
          ...(configId ? { configId } : {})
        })
      })

      const analysisData = await analysisResponse.json()

      if (!analysisData.success) {
        throw new Error(analysisData.error || '分析失败')
      }

      // 合并API信息到分析结果中
      setAnalysisResult({
        ...analysisData.data,
        apiInfo: searchResult.data.apiInfo,
        searchHistoryId: searchResult.data.searchHistoryId
      })

      // 同步上下文（关键词、文章数量）
      setContext({ currentKeyword: searchValue, currentHistoryId: searchResult.data.searchHistoryId, articleCount: searchResult.data.articles?.length || 0 })

      // 更新URL参数，确保ArticlesListTab能够同步
      if (searchResult.data.searchHistoryId) {
        const url = new URL(window.location.href)
        url.searchParams.set('historyId', searchResult.data.searchHistoryId)
        url.searchParams.set('tab', 'search')
        window.history.pushState({}, '', url.toString())
        console.log('SearchResultsTab: 更新URL参数', {
          historyId: searchResult.data.searchHistoryId,
          keyword: searchValue
        })
      }

      // 保存状态到localStorage
      localStorage.setItem('analysisSearchState', JSON.stringify({
        keyword: searchValue,
        searchHistoryId: searchResult.data.searchHistoryId,
        timestamp: new Date().toISOString()
      }))

      // 重新加载历史关键词
      await loadRecentKeywords()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析过程中出现错误'
      console.error('搜索分析错误:', err)
      try {
        const latestRes = await fetch('/api/search-history/latest')
        const latestData = await latestRes.json()
        if (latestData.success && latestData.data && latestData.data.articles && latestData.data.articles.length > 0) {
          setArticles(latestData.data.articles)
          let configId: string | null = null
          try {
            const localCfg = (window as any).__analysisLLM
            if (localCfg?.id) configId = localCfg.id
            if (!configId) {
              const r = await fetch('/api/llm-selection?feature=analysis')
              const j = await r.json()
              if (j.success && j.data?.providerConfigId) configId = j.data.providerConfigId
            }
            if (!configId) {
              const r2 = await fetch('/api/llm-configs')
              const j2 = await r2.json()
              if (j2.success) {
                const active = (j2.data.providerConfigs || []).find((c: any) => c.isActive)
                configId = active?.id || null
              }
            }
          } catch { }

          const analysisResponse = await fetch(configId ? '/api/llm-analyze' : '/api/ai/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              articles: latestData.data.articles,
              keyword: latestData.data.keyword,
              searchHistoryId: latestData.data.searchHistoryId,
              ...(configId ? { configId } : {})
            })
          })
          const analysisData = await analysisResponse.json()
          if (analysisData.success) {
            setAnalysisResult({
              ...analysisData.data,
              apiInfo: {
                cost_money: 0,
                remain_money: 0,
                total_page: 0,
                current_page: 1
              },
              searchHistoryId: latestData.data.searchHistoryId
            })
            setContext({ currentKeyword: latestData.data.keyword, currentHistoryId: latestData.data.searchHistoryId, articleCount: latestData.data.articles?.length || 0 })
            const url = new URL(window.location.href)
            url.searchParams.set('historyId', latestData.data.searchHistoryId)
            url.searchParams.set('tab', 'search')
            window.history.pushState({}, '', url.toString())
            localStorage.setItem('analysisSearchState', JSON.stringify({
              keyword: latestData.data.keyword,
              searchHistoryId: latestData.data.searchHistoryId,
              timestamp: new Date().toISOString()
            }))
            await loadRecentKeywords()
            setError('')
            setNotice('外部搜索暂不可用，已使用最近一次数据生成，可稍后重试')
          } else {
            setError(analysisData.error || '分析失败，请稍后重试')
          }
        } else {
          setError(errorMessage)
        }
      } catch (fallbackErr) {
        console.error('回退生成失败:', fallbackErr)
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 准备图表数据
  const prepareChartData = () => {
    if (!articles.length) return { readData: [], timeData: [], scatterData: [], likeData: [] }

    // 阅读量分布
    const readRanges = [
      { name: '0-1K', min: 0, max: 1000 },
      { name: '1K-10K', min: 1000, max: 10000 },
      { name: '10K-50K', min: 10000, max: 50000 },
      { name: '50K-100K', min: 50000, max: 100000 },
      { name: '100K+', min: 100000, max: Infinity }
    ]

    const readData: ChartData[] = readRanges.map(range => ({
      name: range.name,
      value: articles.filter(a => a.readCount >= range.min && a.readCount < range.max).length
    }))

    // 发布时间分布
    const timeMap = new Map<string, number>()
    articles.forEach(article => {
      const date = new Date(article.publishTime).toLocaleDateString('zh-CN')
      timeMap.set(date, (timeMap.get(date) || 0) + 1)
    })

    const timeData: TimeSeriesData[] = Array.from(timeMap.entries())
      .map(([date, count]) => ({ date, count, value: count }))
      .slice(-7) // 最近7天

    // 互动率散点图
    const scatterData: ScatterData[] = articles.map(article => ({
      x: article.readCount,
      y: parseFloat(article.engagementRate || '0'),
      title: article.title,
      author: article.author
    }))

    // 点赞量分布
    const likeRanges = [
      { name: '0-100', min: 0, max: 100 },
      { name: '100-500', min: 100, max: 500 },
      { name: '500-1000', min: 500, max: 1000 },
      { name: '1000-5000', min: 1000, max: 5000 },
      { name: '5000+', min: 5000, max: Infinity }
    ]

    const likeData: ChartData[] = likeRanges.map(range => ({
      name: range.name,
      value: articles.filter(a => a.likeCount >= range.min && a.likeCount < range.max).length
    }))

    return { readData, timeData, scatterData, likeData }
  }

  const { readData, timeData, scatterData, likeData } = prepareChartData()

  return (
    <div className="space-y-8 animate-fade-in">
      {notice && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
          <div className="px-4 py-3 rounded-md shadow-md bg-popover text-popover-foreground border border-border text-sm">
            {notice}
          </div>
        </div>
      )}
      {/* 搜索区域 */}
      <Card className="glass-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-foreground" />
            <span>关键词搜索</span>
          </CardTitle>
          <CardDescription>
            输入您想要分析的主题关键词，系统将搜索相关公众号文章并生成分析报告
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="输入关键词，如：AI技术、产品经理、React开发..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                {/* 条数选择器 */}
                <Select
                  value={String(searchLimit)}
                  onValueChange={(v) => setSearchLimit(Number(v))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="条数" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20条</SelectItem>
                    <SelectItem value="40">40条</SelectItem>
                    <SelectItem value="60">60条</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleSearch()}
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      分析中...
                    </div>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      开始分析
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 搜索提示信息 */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
              <span>系统将搜索微信公众号文章并进行AI分析</span>
              <span>当前设置: 搜索 {searchLimit} 条文章</span>
            </div>

            {/* 历史搜索按钮 */}
            {searchHistoryList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">历史搜索:</span>
                <div className="flex items-center gap-2">
                  {recentKeywords.map((k, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => {
                        const history = searchHistoryList.find(h => h.keyword === k)
                        if (history) {
                          handleHistoryButtonClick(history)
                        } else {
                          setKeyword(k)
                          handleSearch(k)
                        }
                      }}
                    >
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive/20 text-destructive font-bold">!</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 分析结果展示 */}
      {articles.length > 0 && (
        <div className="space-y-8 animate-fade-in mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">分析报告</h2>
              <p className="text-muted-foreground mt-1">
                基于 {articles.length} 篇相关文章的深度分析
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToMarkdown}>
                <Download className="mr-2 h-4 w-4" />
                导出报告
              </Button>
            </div>
          </div>

          {/* 新版数据仪表盘 */}
          <AnalysisDashboard articles={articles} analysisResult={analysisResult} />

          {/* AI 洞察报告 (保留) */}
          {analysisResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 词云分析 */}
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>热门关键词</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    {(() => {
                      console.log('🔍 热门关键词 Debug:', {
                        hasAnalysisResult: !!analysisResult,
                        hasWordCloud: !!analysisResult?.wordCloud,
                        wordCloudLength: analysisResult?.wordCloud?.length,
                        wordCloudSample: analysisResult?.wordCloud?.slice(0, 3)
                      })
                      return null
                    })()}
                    {analysisResult.wordCloud && analysisResult.wordCloud.length > 0 ? (
                      <WordCloud
                        words={analysisResult.wordCloud.map((item: any) => ({
                          text: item.word || item.text,
                          value: item.count || item.value
                        }))}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">暂无词云数据</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 核心洞察 */}
              <Card className="glass-card border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <span>核心洞察</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      console.log('🔍 核心洞察 Debug:', {
                        hasAnalysisResult: !!analysisResult,
                        hasInsights: !!analysisResult?.insights,
                        insightsLength: analysisResult?.insights?.length,
                        insightsSample: analysisResult?.insights?.slice(0, 2)
                      })
                      return null
                    })()}
                    {(() => {
                      // 处理洞察数据，支持自动拆分###分隔的内容
                      const rawInsights = analysisResult?.insights || []
                      let processedInsights: string[] = []

                      rawInsights.forEach((insight: any) => {
                        const insightText = typeof insight === 'string' ? insight : insight.description

                        // 检查是否包含 ### 标记（多个洞察合并在一起的情况）
                        if (insightText && insightText.includes('###')) {
                          // 按 ### 分割
                          const parts = insightText.split(/###\s+/).filter((part: string) => part.trim())
                          processedInsights.push(...parts)
                        } else if (insightText) {
                          processedInsights.push(insightText)
                        }
                      })

                      if (processedInsights.length === 0) {
                        return <div className="text-center text-muted-foreground py-8">暂无洞察数据</div>
                      }

                      return processedInsights.map((insight, index) => (
                        <div key={index} className="p-4 bg-card rounded-lg border border-border">
                          <h4 className="font-medium text-foreground mb-2">洞察 {index + 1}</h4>
                          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {insight.trim()}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 历史报告组件
function HistoryTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [histories, setHistories] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SearchHistory | null>(null)

  useEffect(() => {
    loadHistories()
  }, [])

  const loadHistories = async () => {
    try {
      const response = await fetch('/api/analysis/history?limit=50')
      const data = await response.json()
      if (data.success) {
        setHistories(data.data)
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/analysis/history?id=${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setHistories(histories.filter(h => h.id !== id))
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const exportHistory = async (history: SearchHistory) => {
    try {
      const response = await fetch('/api/analysis/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchHistoryId: history.id })
      })

      if (!response.ok) {
        throw new Error('导出失败')
      }

      // 创建下载链接
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${history.keyword}_分析报告_${new Date(history.searchDate).toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Markdown报告导出成功！')
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    }
  }

  const viewReport = (history: SearchHistory) => {
    // 切换到搜索结果标签页并使用URL参数传递历史记录ID
    setActiveTab('search')

    // 使用URL参数来标识要查看的历史记录
    const url = new URL(window.location.href)
    url.searchParams.set('historyId', history.id)
    url.searchParams.set('tab', 'search')
    window.history.pushState({}, '', url.toString())

    // 触发自定义事件来通知SearchResultsTab加载历史数据
    window.dispatchEvent(new CustomEvent('loadHistoryData', {
      detail: { historyId: history.id }
    }))

    // 同时通知ArticlesListTab组件更新历史记录状态
    window.dispatchEvent(new CustomEvent('selectHistory', {
      detail: { historyId: history.id }
    }))
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">历史报告</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            今天
          </Button>
          <Button variant="outline" size="sm">
            本周
          </Button>
          <Button variant="outline" size="sm">
            本月
          </Button>
          <Button variant="outline" size="sm">
            全部
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {histories.map((history) => (
          <Card
            key={history.id}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => viewReport(history)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(history.searchDate).toLocaleString('zh-CN')}
                    </span>
                    <Badge variant="secondary">
                      🔍 {history.keyword}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>📊 找到 {history.totalArticles.toLocaleString()} 篇文章</span>
                    <span>💰 花费: ¥{history.apiCost.toFixed(2)}</span>
                    {history.apiInfo && (
                      <span>📈 API余额: ¥{history.apiInfo.remain_money.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      viewReport(history)
                    }}
                  >
                    查看报告
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // 重新分析功能
                      setActiveTab('search')
                      window.dispatchEvent(new CustomEvent('setSearchKeyword', {
                        detail: { keyword: history.keyword }
                      }))
                    }}
                  >
                    重新分析
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      exportHistory(history)
                    }}
                  >
                    导出
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(history)
                      setConfirmOpen(true)
                    }}
                    className="text-destructive hover:text-destructive/90"
                  >
                    删除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {histories.length === 0 && (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无历史记录</p>
        </div>
      )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>删除历史报告</DialogTitle>
            <DialogDescription>确定删除该历史记录？此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteTarget) { setConfirmOpen(false); return }
              await deleteHistory(deleteTarget.id)
              setConfirmOpen(false)
              setDeleteTarget(null)
            }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 文章列表组件
function ArticlesListTab() {
  const [articles, setArticles] = useState<any[]>([])
  const [searchHistoryList, setSearchHistoryList] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmArticle, setConfirmArticle] = useState<any | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [sortBy, setSortBy] = useState('publishTime')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)  // 增加默认每页显示数量
  const [totalPages, setTotalPages] = useState(0)
  const [totalArticles, setTotalArticles] = useState(0)

  // 使用 useRef 存储最新的状态值，避免闭包问题
  const selectedHistoryIdRef = useRef(selectedHistoryId)
  const searchKeywordRef = useRef(searchKeyword)
  const currentPageRef = useRef(currentPage)
  const isManuallySelecting = useRef(false) // 防止循环触发的标志

  // 更新 ref 值
  useEffect(() => {
    selectedHistoryIdRef.current = selectedHistoryId
  }, [selectedHistoryId])

  useEffect(() => {
    searchKeywordRef.current = searchKeyword
  }, [searchKeyword])

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    const initializeHistory = async () => {
      await loadSearchHistory()

      // 检查URL参数中是否有historyId
      const urlParams = new URLSearchParams(window.location.search)
      const historyId = urlParams.get('historyId')
      if (historyId) {
        setSelectedHistoryId(historyId)
        setSearchKeyword('')
        setCurrentPage(1)
      }
    }

    initializeHistory()
  }, [])

  useEffect(() => {
    loadArticles()
  }, [selectedHistoryId, searchKeyword, sortBy, sortOrder, currentPage, pageSize])

  // 监听URL参数变化和事件
  useEffect(() => {
    const handleUrlChange = () => {
      // 如果用户正在手动选择，则忽略URL参数变化
      if (isManuallySelecting.current) {
        console.log('ArticlesListTab: 用户正在手动选择，忽略URL参数变化')
        return
      }

      const urlParams = new URLSearchParams(window.location.search)
      const historyId = urlParams.get('historyId')
      const tabParam = urlParams.get('tab')

      // 只处理articles标签页的URL变化
      if (tabParam === 'articles') {
        console.log('ArticlesListTab: 检测到articles标签页URL变化', {
          historyId,
          currentSelected: selectedHistoryIdRef.current
        })

        if (historyId && historyId !== selectedHistoryIdRef.current) {
          console.log('ArticlesListTab: URL参数变化，更新历史记录', { historyId })
          setSelectedHistoryId(historyId)
          setSearchKeyword('')
          setCurrentPage(1)
          selectedHistoryIdRef.current = historyId
          searchKeywordRef.current = ''
          currentPageRef.current = 1
          // 立即加载文章
          setTimeout(() => loadArticles(), 0)
        }
      }
    }

    // 监听loadHistoryData和selectHistory事件（从历史记录点击）
    const handleHistoryEvent = (event: CustomEvent) => {
      const { historyId } = event.detail
      console.log('ArticlesListTab: 收到历史事件', { historyId, currentSelected: selectedHistoryIdRef.current })
      // 直接更新状态，并立即触发文章加载
      console.log('ArticlesListTab: 更新历史记录状态', { from: selectedHistoryIdRef.current, to: historyId })
      setSelectedHistoryId(historyId)
      setSearchKeyword('')
      setCurrentPage(1)

      // 立即更新 ref 值并触发文章加载
      selectedHistoryIdRef.current = historyId
      searchKeywordRef.current = ''
      currentPageRef.current = 1

      // 立即加载文章，不等待状态更新
      setTimeout(() => {
        loadArticles()
      }, 0)
    }

    // 添加事件监听器
    window.addEventListener('popstate', handleUrlChange)
    window.addEventListener('loadHistoryData', handleHistoryEvent as EventListener)
    window.addEventListener('selectHistory', handleHistoryEvent as EventListener)

    // 立即检查当前URL参数
    handleUrlChange()

    return () => {
      window.removeEventListener('popstate', handleUrlChange)
      window.removeEventListener('loadHistoryData', handleHistoryEvent as EventListener)
      window.removeEventListener('selectHistory', handleHistoryEvent as EventListener)
    }
  }, [])

  const loadSearchHistory = async () => {
    try {
      const response = await fetch('/api/analysis/history?limit=20')
      const data = await response.json()
      if (data.success) {
        setSearchHistoryList(data.data)

        // 如果当前没有选中任何历史记录，且历史记录列表不为空，选择第一个
        if (!selectedHistoryIdRef.current && data.data.length > 0) {
          const firstHistoryId = data.data[0].id
          console.log('ArticlesListTab: 自动选择第一个历史记录', firstHistoryId)
          setSelectedHistoryId(firstHistoryId)
          selectedHistoryIdRef.current = firstHistoryId
        }
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  }

  const loadArticles = async () => {
    setLoading(true)
    try {
      // 使用 ref 值确保获取最新的状态
      const currentHistoryId = selectedHistoryIdRef.current
      const currentKeyword = searchKeywordRef.current
      const currentCurrentPage = currentPageRef.current

      const params = new URLSearchParams({
        page: currentCurrentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      })

      if (currentHistoryId) {
        params.append('searchHistoryId', currentHistoryId)
        console.log('ArticlesListTab: 加载历史记录文章', { historyId: currentHistoryId })
      } else if (currentKeyword) {
        params.append('keyword', currentKeyword)
        console.log('ArticlesListTab: 搜索关键词文章', { keyword: currentKeyword })
      }

      const response = await fetch(`/api/analysis/articles?${params}`)
      const data = await response.json()

      if (data.success) {
        console.log('ArticlesListTab: 成功加载文章', { count: data.data.articles.length })
        setArticles(data.data.articles)
        setTotalPages(data.data.pagination.totalPages)
        setTotalArticles(data.data.pagination.total)
      }
    } catch (error) {
      console.error('加载文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSelectedHistoryId('')
    setCurrentPage(1)
  }

  const handleHistorySelect = (historyId: string) => {
    console.log('ArticlesListTab: handleHistorySelect 开始', {
      historyId,
      previousHistoryId: selectedHistoryId,
      searchKeyword
    })

    // 设置手动选择标志，防止URL参数监听器覆盖
    isManuallySelecting.current = true

    setSelectedHistoryId(historyId)
    setSearchKeyword('')
    setCurrentPage(1)

    // 同时更新 ref 值，确保状态同步
    selectedHistoryIdRef.current = historyId
    searchKeywordRef.current = ''
    currentPageRef.current = 1

    console.log('ArticlesListTab: 状态已更新，准备发送事件', {
      newHistoryId: historyId,
      refHistoryId: selectedHistoryIdRef.current
    })

    // 通知 SearchResultsTab 组件同步更新 - 使用URL参数方式
    console.log('ArticlesListTab: 更新URL参数来同步状态', {
      historyId: selectedHistoryIdRef.current
    })

    // 直接更新URL参数，让SearchResultsTab通过URL监听器自动同步
    const url = new URL(window.location.href)
    url.searchParams.set('historyId', historyId)
    console.log('ArticlesListTab: 选择历史记录', historyId)

    url.searchParams.set('tab', 'search')
    window.history.pushState({}, '', url.toString())

    // 延长延迟时间后清除手动选择标志
    setTimeout(() => {
      console.log('ArticlesListTab: 清除手动选择标志')
      isManuallySelecting.current = false
    }, 2000)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const formatNumber = (val: unknown) => {
    const num = Number(val)
    if (!isFinite(num) || isNaN(num)) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return String(Math.round(num))
  }

  const formatEngagementRate = (rate: unknown) => {
    const num = parseFloat(String(rate ?? '0'))
    return !isFinite(num) || isNaN(num) ? '0%' : `${num.toFixed(2)}%`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        {/* 标题和搜索历史选择 */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <h2 className="text-2xl font-bold text-foreground">文章列表</h2>

          {/* 搜索历史选择 */}
          <Select
            value={selectedHistoryId}
            onValueChange={(v) => handleHistorySelect(v)}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="选择历史记录" />
            </SelectTrigger>
            <SelectContent>
              {searchHistoryList.map((history) => {
                const isLatest = history.id === searchHistoryList[0]?.id
                return (
                  <SelectItem
                    key={history.id}
                    value={history.id}
                    className={isLatest ? 'font-bold text-destructive' : ''}
                  >
                    {history.keyword} ({history.totalArticles}篇){isLatest ? ' - 最新' : ''}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {/* 每页显示数量选择器 */}
          <Select
            value={String(pageSize)}
            onValueChange={(v) => handlePageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="每页条数" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20条/页</SelectItem>
              <SelectItem value="50">50条/页</SelectItem>
              <SelectItem value="100">100条/页</SelectItem>
              <SelectItem value="200">200条/页</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 右侧控制区域 */}
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* 搜索框 */}
          <div className="flex space-x-2">
            <Input
              placeholder="搜索文章标题、作者或内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-64"
            />
            <Button onClick={handleSearch} disabled={loading}>
              搜索
            </Button>
          </div>

          {/* 排序选择 */}
          <div className="flex space-x-2">
            <Button
              variant={sortBy === 'publishTime' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('publishTime')}
            >
              发布时间 {sortBy === 'publishTime' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant={sortBy === 'readCount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('readCount')}
            >
              阅读量 {sortBy === 'readCount' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant={sortBy === 'likeCount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('likeCount')}
            >
              点赞数 {sortBy === 'likeCount' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant={sortBy === 'engagementRate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('engagementRate')}
            >
              互动率 {sortBy === 'engagementRate' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {totalArticles > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-6 text-sm">
              <span className="font-medium text-primary">
                共找到 {totalArticles.toLocaleString()} 篇文章
              </span>
              <span className="text-muted-foreground">
                当前显示: 第 {Math.min((currentPage - 1) * pageSize + 1, totalArticles)} - {Math.min(currentPage * pageSize, totalArticles)} 条
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-muted-foreground">
                平均阅读量: {formatNumber(Math.round(articles.reduce((sum, a) => sum + Number(a.readCount || 0), 0) / Math.max(articles.length, 1)))}
              </span>
              <span className="text-muted-foreground">
                平均点赞数: {formatNumber(Math.round(articles.reduce((sum, a) => sum + Number(a.likeCount || 0), 0) / Math.max(articles.length, 1)))}
              </span>
              <span className="text-muted-foreground">
                平均互动率: {formatEngagementRate(articles.reduce((sum, a) => sum + parseFloat(String(a.engagementRate || '0')), 0) / Math.max(articles.length, 1))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">已选择 {selectedIds?.length || 0} 项</span>
            <Button variant="outline" size="sm" onClick={() => {
              const all = articles.map((a: any) => a.id)
              setSelectedIds((selectedIds && selectedIds.length === articles.length) ? [] : all)
            }}>全选/取消</Button>
            <Button variant="destructive" size="sm" onClick={() => { if (!selectedIds || selectedIds.length === 0) return; setBatchConfirmOpen(true) }}>删除已选</Button>
          </div>
          {articles.map((article) => (
            <Card key={article.id} className="premium-card hover:shadow-md transition-all cursor-pointer group border-border/50 hover:border-primary/30">
              <div className="flex items-center px-4 pt-3">
                <input type="checkbox" className="mr-2" checked={selectedIds?.includes(article.id) || false} onChange={(e) => {
                  const id = article.id
                  setSelectedIds((prev) => {
                    const current = prev || []
                    return e.target.checked ? Array.from(new Set([...current, id])) : current.filter((x: any) => x !== id)
                  })
                }} onClick={(e) => e.stopPropagation()} />
              </div>
              <Link href={`/analysis/article/${article.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground mb-2 line-clamp-2">
                        {article.content.substring(0, 200)}...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                          {article.author}
                        </span>
                        <span>{new Date(article.publishTime || article.createdAt || article.updatedAt || Date.now()).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          {formatNumber(article.readCount || 0)}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                          {formatNumber(article.likeCount || 0)}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                          {formatEngagementRate(article.engagementRate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
              {/* 原文链接按钮 - 移到Link外部避免嵌套 */}
              <div className="px-4 pb-4 pt-0 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="group-hover:bg-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    原文链接
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/create?tab=rewrite&from=wechat&id=${article.id}` }}>
                  改写文章
                </Button>
                <Button className="ml-auto" variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmArticle(article); setConfirmOpen(true) }}>
                  删除
                </Button>
              </div>
            </Card>
          ))}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>

              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {selectedHistoryId || searchKeyword ? '未找到相关文章' : '请先进行搜索以查看文章列表'}
          </p>
        </div>
      )}
      {/* 顶部提示 */}
      {notice && (
        <div className="fixed inset-0 flex items-start justify-center mt-24 pointer-events-none z-50">
          <div className="bg-popover/90 text-popover-foreground text-sm px-4 py-2 rounded-full shadow border border-border">{notice}</div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>删除文章</DialogTitle>
            <DialogDescription>确定删除该文章？此操作不可恢复。</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={async () => {
              if (!confirmArticle) { setConfirmOpen(false); return }
              try {
                const r = await fetch(`/api/wechat/articles/${confirmArticle.id}`, { method: 'DELETE' })
                const j = await r.json()
                if (j.success) {
                  setArticles(prev => prev.filter(a => a.id !== confirmArticle.id))
                  setTotalArticles(prev => Math.max(0, prev - 1))
                  setTotalPages(prev => Math.max(1, Math.ceil(Math.max(0, totalArticles - 1) / pageSize)))
                  if (currentPage > Math.ceil(Math.max(0, totalArticles - 1) / pageSize)) setCurrentPage(Math.max(1, currentPage - 1))
                  setNotice('已删除')
                  setTimeout(() => setNotice(''), 3000)
                } else {
                  setNotice(j.error || '删除失败')
                  setTimeout(() => setNotice(''), 3000)
                }
              } catch {
                setNotice('删除失败')
                setTimeout(() => setNotice(''), 3000)
              } finally {
                setConfirmOpen(false)
                setConfirmArticle(null)
              }
            }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>删除所选文章</DialogTitle>
            <DialogDescription>删除后不可恢复，确认删除？</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBatchConfirmOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                const removed = (selectedIds || []).length
                for (const id of (selectedIds || [])) { try { await fetch(`/api/wechat/articles/${encodeURIComponent(id)}`, { method: 'DELETE' }) } catch { } }
                setArticles(prev => prev.filter((a: any) => !(selectedIds || []).includes(a.id)))
                setTotalArticles(prev => Math.max(0, prev - removed))
                const newTotal = Math.max(0, totalArticles - removed)
                setTotalPages(Math.max(1, Math.ceil(newTotal / pageSize)))
                if (currentPage > Math.ceil(newTotal / pageSize)) setCurrentPage(Math.max(1, currentPage - 1))
                setSelectedIds([])
                setBatchConfirmOpen(false)
                setNotice('已删除所选')
                setTimeout(() => setNotice(''), 2000)
              } catch { setNotice('删除失败'); setTimeout(() => setNotice(''), 2000) }
            }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AnalysisPageContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'search')

  // 当URL参数变化时更新activeTab
  useEffect(() => {
    if (tabParam && ['search', 'history', 'articles'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // 滚动位置管理
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      saveScrollPosition(activeTab, scrollTop)
    }

    // 恢复滚动位置 - 增强逻辑
    const restoreScrollPosition = () => {
      const savedScrollTop = getScrollPosition(activeTab)
      if (savedScrollTop > 0) {
        // 使用更长的延迟确保DOM完全渲染
        setTimeout(() => {
          window.scrollTo({
            top: savedScrollTop,
            behavior: 'instant' // 使用instant避免动画效果
          })
        }, 300)
      }
    }

    // 立即恢复滚动位置
    restoreScrollPosition()

    // 添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true })

    // 监听页面可见性变化，确保从其他页面返回时也能恢复位置
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        restoreScrollPosition()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeTab])

  // 专门处理从文章详情页返回的滚动位置恢复
  useEffect(() => {
    const handleFocus = () => {
      // 当页面重新获得焦点时（从文章详情页返回），恢复滚动位置
      setTimeout(() => {
        const savedScrollTop = getScrollPosition(activeTab)
        if (savedScrollTop > 0) {
          window.scrollTo({
            top: savedScrollTop,
            behavior: 'instant'
          })
        }
      }, 100)
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      // 当页面显示时（包括从缓存恢复），恢复滚动位置
      if (event.persisted) {
        setTimeout(() => {
          const savedScrollTop = getScrollPosition(activeTab)
          if (savedScrollTop > 0) {
            window.scrollTo({
              top: savedScrollTop,
              behavior: 'instant'
            })
          }
        }, 100)
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [activeTab])

  const tabs = [
    { id: 'search', label: '搜索结果', icon: Search },
    { id: 'articles', label: '文章列表', icon: List },
    { id: 'history', label: '历史报告', icon: History }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">选题<span className="text-gradient">分析</span></h1>
          <p className="text-muted-foreground mt-2">
            输入关键词搜索公众号文章，获取AI驱动的选题洞察
          </p>
        </div>
        {/* API配置按钮和LLM模型选择器 */}
        <div className="flex items-center gap-2">
          <LLMModelSelector independent storageKey="llm_selection_analysis" feature="analysis" onSelect={(cfg: any) => { (window as any).__analysisLLM = cfg }} />
          <APIConfigButton />
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="mt-8 mb-6">
        <div className="inline-flex items-center p-1 rounded-xl bg-muted/50 border border-border/60 shadow-sm backdrop-blur-md">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="mt-8">
        {activeTab === 'search' && <SearchResultsTab />}
        {activeTab === 'history' && <HistoryTab setActiveTab={setActiveTab} />}
        {activeTab === 'articles' && <ArticlesListTab />}
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <AnalysisPageContent />
    </Suspense>
  )
}
