'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Brain } from 'lucide-react'

interface LLMAnalysisButtonProps {
  searchHistoryId?: string
  onAnalysisComplete?: () => void
}

export default function LLMAnalysisButton({ searchHistoryId, onAnalysisComplete }: LLMAnalysisButtonProps) {
  const [llmAnalyzing, setLLMAnalyzing] = useState(false)

  const handleLLMAnalysis = async () => {
    if (!searchHistoryId) {
      alert('请先进行搜索分析')
      return
    }

    setLLMAnalyzing(true)

    try {
      // 获取LLM配置
      const llmConfigsResponse = await fetch('/api/llm-configs')
      if (!llmConfigsResponse.ok) {
        throw new Error('获取LLM配置失败')
      }

      const llmConfigsData = await llmConfigsResponse.json()
      if (!llmConfigsData.success || !llmConfigsData.data || !llmConfigsData.data.providerConfigs || llmConfigsData.data.providerConfigs.length === 0) {
        throw new Error('没有可用的LLM配置，请先在设置中配置LLM')
      }

      // 使用第一个激活的LLM配置
      const activeConfig = llmConfigsData.data.providerConfigs.find((config: any) => config.isActive) || llmConfigsData.data.providerConfigs[0]
      const configId = activeConfig.id

      // 调用LLM分析API
      const articlesResponse = await fetch(`/api/search-history/latest`)
      if (!articlesResponse.ok) {
        throw new Error('获取文章数据失败')
      }

      const articlesData = await articlesResponse.json()
      if (!articlesData.success || !articlesData.data.articles) {
        throw new Error('没有可分析的文章数据')
      }

      const { articles, keyword } = articlesData.data

      console.log('🚀 开始LLM分析')
      console.log('📊 文章数量:', articles.length, '关键词:', keyword)
      console.log('🔧 使用LLM配置:', activeConfig.name)

      // 调用LLM分析API
      const analysisResponse = await fetch('/api/llm-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articles,
          keyword,
          configId,
          searchHistoryId: searchHistoryId
        })
      })

      if (analysisResponse.ok) {
        const data = await analysisResponse.json()
        if (data.success) {
          console.log('✅ LLM分析完成')
          alert('大模型分析完成！页面将自动刷新显示新结果。')

          // 通知父组件分析完成
          if (onAnalysisComplete) {
            onAnalysisComplete()
          }

          // 延迟刷新页面以显示新的分析结果
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          throw new Error(data.error || 'LLM分析失败')
        }
      } else {
        throw new Error(`HTTP ${analysisResponse.status}: ${analysisResponse.statusText}`)
      }
    } catch (error) {
      console.error('LLM分析失败:', error)
      alert('LLM分析失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setLLMAnalyzing(false)
    }
  }

  return (
    <Button
      onClick={handleLLMAnalysis}
      variant="outline"
      size="sm"
      className="flex items-center"
      disabled={llmAnalyzing || !searchHistoryId}
    >
      <Brain className="h-4 w-4 mr-2" />
      {llmAnalyzing ? '分析中...' : '大模型分析'}
    </Button>
  )
}