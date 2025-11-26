'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Brain, CheckCircle, Settings, Loader2 } from 'lucide-react'
import ThemeIcon from '@/components/ThemeIcon'

interface LLMProviderConfig {
  id: string
  provider: string
  name: string
  selectedModel?: string
  isActive: boolean
  usageStats?: {
    usageCount: number
  }
}

interface LLMModelInfo {
  id: string
  modelName: string
  displayName: string
  provider: string
  isActive: boolean
}

interface Props {
  independent?: boolean
  onSelect?: (config: LLMProviderConfig | null) => void
  storageKey?: string
  feature?: string
  className?: string
}

export default function LLMModelSelector({ independent = false, onSelect, storageKey = 'llm_selection', feature, className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<LLMProviderConfig | null>(null)
  const [availableConfigs, setAvailableConfigs] = useState<LLMProviderConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/llm-configs')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.providerConfigs) {
          const configs = data.data.providerConfigs
          setAvailableConfigs(configs)

          if (independent) {
            let saved: LLMProviderConfig | null = null
            if (feature) {
              try {
                const r = await fetch(`/api/llm-selection?feature=${encodeURIComponent(feature)}`)
                if (r.ok) {
                  const j = await r.json()
                  if (j.success && j.data && j.data.providerConfigId) saved = configs.find((c: LLMProviderConfig) => c.id === j.data.providerConfigId) || null
                }
              } catch { }
            }
            if (!saved) {
              let savedId: string | null = null
              try { savedId = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null } catch { }
              saved = savedId ? configs.find((c: LLMProviderConfig) => c.id === savedId) || null : null
            }
            setCurrentConfig(saved || configs[0] || null)
            if (onSelect) onSelect(saved || configs[0] || null)
          } else {
            const activeConfig = configs.find((config: LLMProviderConfig) => config.isActive)
            setCurrentConfig(activeConfig || configs[0] || null)
          }
        }
      }
    } catch (error) {
      console.error('获取LLM配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchConfig = async (configId: string) => {
    try {
      if (independent) {
        const next = availableConfigs.find(c => c.id === configId) || null
        setCurrentConfig(next)
        try { if (typeof window !== 'undefined' && next) window.localStorage.setItem(storageKey, next.id) } catch { }
        if (feature && next) {
          try { await fetch('/api/llm-selection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feature, providerConfigId: next.id, selectedModel: next.selectedModel }) }) } catch { }
        }
        setIsOpen(false)
        if (onSelect) onSelect(next)
        return
      }

      setSwitching(configId)
      const response = await fetch('/api/llm-configs/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await loadCurrentConfig()
          setIsOpen(false)
          console.log('LLM配置切换成功')
          if (onSelect) onSelect(currentConfig)
        }
      }
    } catch (error) {
      console.error('切换LLM配置失败:', error)
    } finally {
      setSwitching(null)
    }
  }

  const getProviderName = (provider: string) => {
    const providerNames: { [key: string]: string } = {
      'modelscope': 'ModelScope',
      'siliconflow': '硅基流动',
      'zhipu': '智谱AI',
      'minimax': 'MiniMax',
      'openrouter': 'OpenRouter',
      'aihubmix': 'AiHubMix'
    }
    return providerNames[provider] || provider
  }

  const getProviderColor = (provider: string) => {
    // Unified style for all providers to ensure theme consistency
    return 'bg-primary/10 text-primary border-primary/20'
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        加载中...
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          <ThemeIcon
            icon={Brain}
            variant="secondary"
            size="sm"
            className="w-6 h-6 rounded-md bg-primary/10 border-none"
            iconClassName="w-3.5 h-3.5 text-primary"
          />
          <span className="hidden sm:inline text-muted-foreground">
            {currentConfig ? (independent ? (currentConfig.selectedModel || currentConfig.name) : currentConfig.name) : '选择模型'}
          </span>
        </Button>
      </DialogTrigger>


      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            选择大模型
          </DialogTitle>
          <DialogDescription>
            选择用于分析的大模型供应商和配置
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availableConfigs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">暂无可用的大模型配置</p>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  // 跳转到LLM设置页面
                  window.location.href = '/settings/llm'
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                前往设置
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {availableConfigs.map((config) => (
                <div
                  key={config.id}
                  className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${currentConfig?.id === config.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                    }
                    `}
                  onClick={() => handleSwitchConfig(config.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
                        }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{config.name}</h3>
                          <Badge variant="outline" className={`${getProviderColor(config.provider)} border`}>
                            {getProviderName(config.provider)}
                          </Badge>
                          {currentConfig?.id === config.id && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              当前
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          模型: {config.selectedModel || '未指定'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          使用次数: {config.usageStats?.usageCount || 0}
                        </p>
                      </div>
                    </div>
                    {switching === config.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  window.location.href = '/settings/llm'
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                管理配置
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                取消
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  )
}