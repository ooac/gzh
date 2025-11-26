'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Plus, Settings, TestTube, AlertCircle, Layers, Cog } from 'lucide-react'
import { llmAdapterFactory } from '@/lib/llm-adapters'

interface LLMConfig {
  id: string
  name?: string // 改为可选，因为后端自动生成
  provider: string
  apiKey?: string
  apiEndpoint?: string
  temperature?: number
  maxTokens?: number
  isActive: boolean
  isDefault: boolean
  selectedModel?: string
  createdAt: string
  updatedAt: string
  usageStats?: {
    usageCount: number
    lastUsedAt?: string
  }
  availableModels?: string
}

interface LLMConfigManagerProps {
  onConfigSelect?: (config: LLMConfig) => void
  selectedConfigId?: string
}

const defaultConfigs = {
  modelscope: {
    name: 'ModelScope 默认配置',
    provider: 'modelscope',
    apiEndpoint: 'https://api-inference.modelscope.cn/v1/',
    selectedModel: 'qwen2.5-7b-instruct',
    apiKey: 'ms-cc61d2d0-e6ba-42ec-8578-8c5c4222f6c3'
  },
  siliconflow: {
    name: '硅基流动 默认配置',
    provider: 'siliconflow',
    apiEndpoint: 'https://api.siliconflow.cn',
    selectedModel: 'deepseek-chat',
    apiKey: 'sk-avheuxkykgwfwwucphcualpdbjcnpdluvgrdmmacsqzfvexi'
  },
  zhipu: {
    name: '智谱 默认配置',
    provider: 'zhipu',
    apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    selectedModel: 'glm-4',
    apiKey: 'fc6b4b170c1b463fbabac70973ab9902.Ls8T9PyGeXP9yJI8'
  },
  minimax: {
    name: 'MiniMax 默认配置',
    provider: 'minimax',
    apiEndpoint: 'https://api.minimax.chat/v1/',
    selectedModel: 'abab6.5s-chat',
    apiKey: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLmtbfonrrnlKjmiLdfMzE4MjE0MTgyNTIwMDI1MDg5IiwiVXNlck5hbWUiOiLmtbfonrrnlKjmiLdfMzE4MjE0MTgyNTIwMDI1MDg5IiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5Mjc5MTg3NDY0MDQzOTczMDEiLCJQaG9uZSI6IjE3NzIwMjgwMDAzIiwiR3JvdXBJRCI6IjE5Mjc5MTg3NDYzOTYwMDg2OTMiLCJQYWdlTmFtZSI6IiIsIk1haWwiOiIiLCJDcmVhdGVUaW1lIjoiMjAyNS0xMC0yOCAxMzo0MToxNyIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.mUQsbrYu5FEzWNRkWrXZgWeoQAOqHKs5wPniHd05J_3-Lv1IUY3oMlravmLWgwlofjJN7Lbn8WkVC4OfKOGS1RtdGuSeX8g-MJpLnKTEULSRWMcKrB9HCygFA_GYkA3VWChK3YvAHbKj73zh68vjzc1_IzPHFkXN4XQCFcsSHyRfQMA9ePpUCbQOgY03EISUGGJKjzaqkfCOv9EaDRfdw4mVeSwmUROu6_dGKpf9EO-xmt3ju3CfvVm2JK2TY3dmiLvLFVG5hgLk-YDJVzHYfM6y_ZMiGtJlQkRbNj7YZYR2t4qPHtLO7gD_DjbOMycUtHr622GiTv7c_B_vE4EYhg'
  },
  openrouter: {
    name: 'OpenRouter 默认配置',
    provider: 'openrouter',
    apiEndpoint: 'https://openrouter.ai/api/v1/',
    selectedModel: 'anthropic/claude-3.5-sonnet',
    apiKey: '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'
  },
  aihubmix: {
    name: 'AiHubMix 默认配置',
    provider: 'aihubmix',
    apiEndpoint: 'https://aihubmix.com',
    selectedModel: 'gpt-4',
    apiKey: 'sk-UnkQ0vnPIfIdVlIA313fA5Ac39704dFdA37618F0A538E36e'
  }
}

export default function LLMConfigManager({ onConfigSelect, selectedConfigId }: LLMConfigManagerProps) {
  const [configs, setConfigs] = useState<LLMConfig[]>([])
  const [availableProviders, setAvailableProviders] = useState<{ provider: string; name: string }[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [managingModels, setManagingModels] = useState<LLMConfig | null>(null)
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [testingConfig, setTestingConfig] = useState<string | null>(null)

  // 获取模型的显示名称
  const getModelDisplayName = (provider: string, modelName: string) => {
    const model = availableModels.find(m => m.provider === provider && m.modelName === modelName)
    return model ? model.displayName : modelName
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/llm-configs')
      const data = await response.json()

      if (data.success) {
        // 适配新的API数据结构
        const providerConfigs = data.data.providerConfigs || data.data.configs || []
        setConfigs(providerConfigs)
        setAvailableProviders(data.data.availableProviders || [])
        setAvailableModels(data.data.availableModels || [])
      } else {
        console.error('获取LLM配置失败:', data.error)
      }
    } catch (error) {
      console.error('获取LLM配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (configData: Partial<LLMConfig>) => {
    try {
      console.log('保存配置数据:', configData)
      const url = editingConfig ? `/api/llm-configs/${editingConfig.id}` : '/api/llm-configs'
      const method = editingConfig ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchConfigs()

        // 如果是模型管理对话框的保存，更新managingModels状态
        if (isModelDialogOpen && managingModels && configData.id === managingModels.id) {
          // 更新managingModels为最新的配置数据
          setManagingModels(prev => prev ? { ...prev, ...configData } : null)
        }

        setIsDialogOpen(false)
        setEditingConfig(null)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('保存LLM配置失败:', error)
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const deleteConfig = async (configId: string) => {
    if (!confirm('确定要删除这个配置吗？')) return

    try {
      const response = await fetch(`/api/llm-configs/${configId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchConfigs()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('删除LLM配置失败:', error)
      alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const testConfig = async (config: LLMConfig) => {
    setTestingConfig(config.id)
    try {
      // 这里可以实现一个简单的测试API调用
      const response = await fetch('/api/llm-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId: config.id }),
      })

      const data = await response.json()
      if (data.success) {
        alert('✅ 测试成功！' + (data.message ? ` ${data.message}` : ''))
      } else {
        // 检查是否是特殊的错误类型
        if (data.data?.isRateLimitError) {
          alert('⚠️ ' + data.error)
          // 对于频率限制，显示更多信息
          console.log('🎯 好消息：连接成功！只是遇到了频率限制。')
        } else if (data.data?.isAuthError) {
          alert('🔑 ' + data.error)
        } else {
          throw new Error(data.error)
        }
      }
    } catch (error) {
      console.error('测试LLM配置失败:', error)

      // 显示更友好的错误信息
      let errorMsg = '测试失败: ' + (error instanceof Error ? error.message : '未知错误')

      // 如果是网络错误，提供更好的建议
      if (errorMsg.includes('fetch')) {
        errorMsg += '\n\n💡 建议：请检查网络连接或API地址配置'
      }

      alert('❌ ' + errorMsg)
    } finally {
      setTestingConfig(null)
    }
  }

  const createDefaultConfig = async (provider: string) => {
    const defaultConfig = defaultConfigs[provider as keyof typeof defaultConfigs]
    if (!defaultConfig) return

    setEditingConfig({
      id: '',
      provider: defaultConfig.provider,
      apiKey: defaultConfig.apiKey,
      apiEndpoint: defaultConfig.apiEndpoint,
      selectedModel: defaultConfig.selectedModel,
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString()
    } as LLMConfig)
    setIsDialogOpen(true)
  }

  const handleConfigClick = (config: LLMConfig) => {
    if (onConfigSelect) {
      onConfigSelect(config)
    }
  }

  // 管理模型按钮点击事件
  const handleManageModels = (config: LLMConfig, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setManagingModels(config)
    setIsModelDialogOpen(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">大模型配置</h2>
        <p className="text-muted-foreground">管理和配置AI分析使用的大模型供应商和模型</p>
      </div>

      {/* 快速添加默认配置 - 只在没有配置任何供应商时显示 */}
      {configs.length === 0 && (
        <Card className="border-dashed border-2 border-border bg-muted/30">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">快速开始</h3>
              <p className="text-muted-foreground mb-6">选择一个供应商，快速添加默认配置</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
                {Object.keys(defaultConfigs).map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    onClick={() => createDefaultConfig(provider)}
                    className="h-auto p-3 flex flex-col hover:border-primary/50 hover:bg-muted transition-colors"
                  >
                    <div className="text-sm font-medium text-foreground">
                      {llmAdapterFactory.getAdapter(provider).name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {defaultConfigs[provider as keyof typeof defaultConfigs].selectedModel}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 配置列表 */}
      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">暂无配置，请添加大模型配置</p>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card
              key={config.id}
              className={`transition-all hover:shadow-md ${selectedConfigId === config.id ? 'ring-2 ring-primary' : ''
                }`}
              onClick={() => handleConfigClick(config)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{llmAdapterFactory.getAdapter(config.provider).name}</h3>
                      {config.isDefault && (
                        <Badge variant="default" className="text-xs">
                          默认
                        </Badge>
                      )}
                      {config.isActive ? (
                        <Badge variant="secondary" className="text-xs">
                          激活
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          未激活
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span>{config.selectedModel ? getModelDisplayName(config.provider, config.selectedModel) : '未配置模型'}</span>
                      {config.usageStats && (
                        <>
                          <span>•</span>
                          <span>使用 {config.usageStats.usageCount} 次</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        testConfig(config)
                      }}
                      disabled={testingConfig === config.id}
                    >
                      {testingConfig === config.id ? (
                        '测试中...'
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-1" />
                          测试
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleManageModels(config, e)
                      }}
                    >
                      <Cog className="w-4 h-4 mr-1" />
                      管理
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 模型管理对话框 */}
      <ModelManagementDialog
        config={managingModels}
        isOpen={isModelDialogOpen}
        onClose={() => setIsModelDialogOpen(false)}
        availableModels={availableModels}
        onSave={saveConfig}
        getModelDisplayName={getModelDisplayName}
      />
    </div>
  )
}

// 模型管理对话框组件
function ModelManagementDialog({
  config,
  isOpen,
  onClose,
  availableModels,
  onSave,
  getModelDisplayName
}: {
  config: LLMConfig | null
  isOpen: boolean
  onClose: () => void
  availableModels: any[]
  onSave: (config: Partial<LLMConfig>) => void
  getModelDisplayName: (provider: string, modelName: string) => string
}) {
  const [newModelName, setNewModelName] = useState('')
  const [newModelDisplayName, setNewModelDisplayName] = useState('')
  const [newModelDescription, setNewModelDescription] = useState('')
  const [isAddingModel, setIsAddingModel] = useState(false)
  const [isEditingConfig, setIsEditingConfig] = useState(false)
  const [editableConfig, setEditableConfig] = useState<LLMConfig | null>(null)

  // 初始化可编辑配置
  useEffect(() => {
    if (config) {
      setEditableConfig({ ...config })
    }
  }, [config])

  if (!config) return null

  // 获取当前供应商的所有模型
  const filteredModels = availableModels.filter(model => model.provider === config.provider)

  // 获取当前配置的availableModels数组
  const currentAvailableModels = config.availableModels ? JSON.parse(config.availableModels) : []

  // 添加模型
  const handleAddModel = () => {
    if (!newModelName.trim() || !newModelDisplayName.trim()) {
      alert('请输入模型名称和显示名称')
      return
    }

    // 检查是否已存在
    if (currentAvailableModels.some((model: any) => model.modelName === newModelName)) {
      alert('该模型已存在')
      return
    }

    const newModel = {
      modelName: newModelName.trim(),
      displayName: newModelDisplayName.trim(),
      description: newModelDescription.trim()
    }

    const updatedModels = [...currentAvailableModels, newModel]

    // 保存配置 - 确保包含所有必要字段
    const saveData = {
      ...config,
      availableModels: JSON.stringify(updatedModels),
      provider: config.provider, // 确保包含provider字段
      apiKey: config.apiKey || '',
      apiEndpoint: config.apiEndpoint || '',
      selectedModel: config.selectedModel || ''
    }
    console.log('添加模型保存数据:', saveData)
    onSave(saveData)

    // 重置表单
    setNewModelName('')
    setNewModelDisplayName('')
    setNewModelDescription('')
    setIsAddingModel(false)
  }

  // 删除模型
  const handleDeleteModel = (modelName: string) => {
    if (!confirm(`确定要删除模型 "${modelName}" 吗？`)) {
      return
    }

    const updatedModels = currentAvailableModels.filter((model: any) => model.modelName !== modelName)

    // 如果删除的是当前选中的模型，需要重置selectedModel
    const updatedConfig = {
      ...config,
      availableModels: JSON.stringify(updatedModels),
      provider: config.provider, // 确保包含provider字段
      apiKey: config.apiKey || '',
      apiEndpoint: config.apiEndpoint || '',
      selectedModel: config.selectedModel || ''
    }

    if (config.selectedModel === modelName) {
      updatedConfig.selectedModel = updatedModels.length > 0 ? updatedModels[0].modelName : ''
    }

    console.log('删除模型保存数据:', updatedConfig)
    onSave(updatedConfig)
  }

  const handleEditConfig = () => {
    setIsEditingConfig(true)
  }

  const handleSaveConfig = () => {
    if (editableConfig) {
      onSave(editableConfig)
      setIsEditingConfig(false)
    }
  }

  const handleCancelEdit = () => {
    setEditableConfig({ ...config })
    setIsEditingConfig(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>管理厂商 - {config.name}</DialogTitle>
          <DialogDescription>
            配置 {config.provider} 供应商的API信息和模型列表
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 厂商配置编辑 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">厂商配置</h4>
              {!isEditingConfig ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditConfig}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  编辑配置
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleSaveConfig}
                  >
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    取消
                  </Button>
                </div>
              )}
            </div>

            <div className={`space-y-3 p-4 border rounded-lg ${isEditingConfig ? 'bg-card' : 'bg-muted/30'}`}>
              <div>
                <Label>供应商</Label>
                {isEditingConfig ? (
                  <div className="p-2 bg-muted rounded-md text-sm text-foreground">
                    {llmAdapterFactory.getAdapter(config.provider).name}
                  </div>
                ) : (
                  <div className="p-2 bg-card rounded-md text-sm">
                    {llmAdapterFactory.getAdapter(config.provider).name}
                  </div>
                )}
              </div>
              <div>
                <Label>API密钥</Label>
                {isEditingConfig && editableConfig ? (
                  <Input
                    type="password"
                    value={editableConfig.apiKey || ''}
                    onChange={(e) => setEditableConfig({ ...editableConfig, apiKey: e.target.value })}
                    placeholder="输入API密钥"
                    className="text-sm"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md text-sm font-mono text-foreground">
                    {config.apiKey ? '••••••••••••••••' + config.apiKey.slice(-4) : '未配置'}
                  </div>
                )}
              </div>
              <div>
                <Label>API地址</Label>
                {isEditingConfig && editableConfig ? (
                  <Input
                    value={editableConfig.apiEndpoint || ''}
                    onChange={(e) => setEditableConfig({ ...editableConfig, apiEndpoint: e.target.value })}
                    placeholder="输入API地址"
                    className="text-sm"
                  />
                ) : (
                  <div className="p-2 bg-muted rounded-md text-sm break-all text-foreground">
                    {config.apiEndpoint || '未配置'}
                  </div>
                )}
              </div>
              {isEditingConfig && editableConfig ? (
                <Select
                  value={editableConfig.selectedModel || 'no-selection'}
                  onValueChange={(value) => setEditableConfig({ ...editableConfig, selectedModel: value === 'no-selection' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-selection">无</SelectItem>
                    {currentAvailableModels.map((model: any) => (
                      <SelectItem key={model.modelName} value={model.modelName}>
                        {model.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-muted rounded-md text-sm text-foreground">
                  {config.selectedModel ? getModelDisplayName(config.provider, config.selectedModel) : '未选择'}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-primary' : 'bg-muted'}`} />
                <span className="text-sm">{config.isActive ? '已启用' : '已禁用'}</span>
              </div>
              {config.isDefault && (
                <Badge variant="default" className="text-xs">默认配置</Badge>
              )}
            </div>
          </div>
        </div>

        {/* 模型管理 */}
        <div className="space-y-4">
          {/* 添加新模型 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">添加新模型</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingModel(!isAddingModel)}
              >
                {isAddingModel ? '取消' : '添加模型'}
              </Button>
            </div>

            {isAddingModel && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label htmlFor="modelName">模型名称 *</Label>
                  <Input
                    id="modelName"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="例如: gpt-4-turbo"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">显示名称 *</Label>
                  <Input
                    id="displayName"
                    value={newModelDisplayName}
                    onChange={(e) => setNewModelDisplayName(e.target.value)}
                    placeholder="例如: GPT-4 Turbo"
                  />
                </div>
                <div>
                  <Label htmlFor="description">描述（可选）</Label>
                  <Input
                    id="description"
                    value={newModelDescription}
                    onChange={(e) => setNewModelDescription(e.target.value)}
                    placeholder="模型描述信息"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddModel}>
                    添加模型
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 当前模型列表 */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentAvailableModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无模型，请添加新模型</p>
            ) : (
              currentAvailableModels.map((model: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{model.displayName}</div>
                    <div className="text-sm text-muted-foreground">{model.modelName}</div>
                    {model.description && (
                      <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {config.selectedModel === model.modelName && (
                      <Badge variant="default" className="text-xs">当前选中</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteModel(model.modelName)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LLMConfigForm({
  config,
  availableProviders,
  availableModels,
  onSave,
  onCancel
}: {
  config: LLMConfig
  availableProviders: { provider: string; name: string }[]
  availableModels: any[]
  onSave: (config: Partial<LLMConfig>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(config)

  // 根据当前选择的供应商过滤模型
  const filteredModels = availableModels.filter(model => model.provider === formData.provider && formData.provider)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 处理自定义模型的情况
    const saveData = {
      ...formData,
      selectedModel: formData.selectedModel === 'custom' ? '' : formData.selectedModel
    }
    onSave(saveData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="provider">供应商</Label>
        {config.id ? (
          // 编辑模式下显示只读文本
          <div className="p-2 bg-muted rounded-md text-sm text-foreground">
            {availableProviders.find(p => p.provider === config.provider)?.name || config.provider}
          </div>
        ) : (
          // 新增模式下显示可选择下拉框
          <Select
            value={formData.provider}
            onValueChange={(value) => setFormData({ ...formData, provider: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="选择供应商" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((provider) => (
                <SelectItem key={provider.provider} value={provider.provider}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <Label htmlFor="apiKey">API密钥</Label>
        <Input
          id="apiKey"
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          placeholder="输入API密钥"
          required
        />
      </div>

      <div>
        <Label htmlFor="apiEndpoint">API地址</Label>
        <Input
          id="apiEndpoint"
          value={formData.apiEndpoint}
          onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
          placeholder="输入API地址"
          required
        />
      </div>

      <div>
        <Label htmlFor="selectedModel">模型名称</Label>
        <Select
          value={formData.selectedModel || 'custom'}
          onValueChange={(value) => setFormData({ ...formData, selectedModel: value === 'custom' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择模型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">自定义模型</SelectItem>
            {filteredModels.map((model) => (
              <SelectItem key={model.modelName} value={model.modelName}>
                {model.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">启用配置</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isDefault"
            checked={formData.isDefault}
            onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
          />
          <Label htmlFor="isDefault">设为默认</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          保存
        </Button>
      </div>
    </form>
  )
}