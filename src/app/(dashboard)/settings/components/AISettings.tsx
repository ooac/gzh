'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Image as ImageIcon, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Copy, Save, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface APIInfo {
    apiKey: string
    apiUrl: string
    balance: number
    currency: string
    totalCost: number
    yesterdayBalance: number
    lastUpdate: string
    warning?: string
}

interface LLMModel {
    id: string
    name: string
    provider: string
    isActive: boolean
}

export default function AISettings() {
    // LLM State
    const [apiInfo, setApiInfo] = useState<APIInfo | null>(null)
    const [loading, setLoading] = useState(false)
    const [editing, setEditing] = useState(false)
    const [newApiKey, setNewApiKey] = useState('')
    const [saveLoading, setSaveLoading] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [passwordError, setPasswordError] = useState('')

    // Model State
    const [availableModels, setAvailableModels] = useState<LLMModel[]>([])
    const [defaultModel, setDefaultModel] = useState<LLMModel | null>(null)

    // Image State
    const [imageApiKey, setImageApiKey] = useState('')
    const [imageApiUrl, setImageApiUrl] = useState('https://api.siliconflow.cn/v1')
    const [imageLoading, setImageLoading] = useState(false)
    const [imageSaving, setImageSaving] = useState(false)

    useEffect(() => {
        loadAPIInfo()
        loadImageConfig()
        loadModels()
    }, [])

    // --- Model Logic ---
    const loadModels = async () => {
        try {
            const response = await fetch('/api/llm-configs')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data && data.data.providerConfigs) {
                    const models = data.data.providerConfigs
                    setAvailableModels(models)

                    // Load saved default model
                    if (typeof window !== 'undefined') {
                        const savedId = localStorage.getItem('llm_selection')
                        if (savedId) {
                            const saved = models.find((m: LLMModel) => m.id === savedId)
                            if (saved) setDefaultModel(saved)
                        } else {
                            // Default to first active model
                            const active = models.find((m: LLMModel) => m.isActive)
                            if (active) setDefaultModel(active)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load models', error)
        }
    }

    const handleSetDefaultModel = (model: LLMModel) => {
        setDefaultModel(model)
        if (typeof window !== 'undefined') {
            localStorage.setItem('llm_selection', model.id)
        }
    }

    // --- LLM Logic ---
    const loadAPIInfo = async () => {
        setLoading(true)
        try {
            const savedConfig = localStorage.getItem('apiConfig')
            let apiUrl = '/api/api-config-simple'

            if (savedConfig) {
                try {
                    const localConfig = JSON.parse(savedConfig)
                    const params = new URLSearchParams({
                        apiKey: localConfig.apiKey,
                        apiUrl: localConfig.apiUrl
                    })
                    apiUrl = `/api/api-config-simple?${params.toString()}`
                } catch (e) {
                    console.error('Failed to parse local config', e)
                }
            }

            const response = await fetch(apiUrl)
            const data = await response.json()

            if (data.success) {
                if (savedConfig) {
                    try {
                        const localConfig = JSON.parse(savedConfig)
                        setApiInfo({
                            ...data.data,
                            apiKey: localConfig.apiKey,
                            apiUrl: localConfig.apiUrl
                        })
                    } catch {
                        setApiInfo(data.data)
                    }
                } else {
                    setApiInfo(data.data)
                }
            }
        } catch (error) {
            console.error('Failed to load API info', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveApiKey = async () => {
        if (!newApiKey.trim()) return
        setSaveLoading(true)
        try {
            const response = await fetch('/api/api-config-simple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: newApiKey.trim(),
                    apiUrl: apiInfo?.apiUrl || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
                })
            })
            const data = await response.json()

            if (data.success) {
                const configToSave = {
                    apiKey: newApiKey.trim(),
                    apiUrl: apiInfo?.apiUrl || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search',
                    balance: data.data.balance,
                    currency: data.data.currency,
                    totalCost: data.data.totalCost,
                    yesterdayBalance: data.data.yesterdayBalance,
                    lastUpdate: data.data.lastUpdate
                }
                localStorage.setItem('apiConfig', JSON.stringify(configToSave))
                setApiInfo(configToSave)
                setNewApiKey('')
                setEditing(false)
            }
        } catch (error) {
            console.error('Failed to save API key', error)
        } finally {
            setSaveLoading(false)
        }
    }

    const handlePasswordVerify = () => {
        if (passwordInput === 'Bin89439370@') {
            setShowApiKey(true)
            setShowPasswordDialog(false)
            setPasswordInput('')
            setPasswordError('')
        } else {
            setPasswordError('密码错误')
        }
    }

    // --- Image Logic ---
    const loadImageConfig = async () => {
        setImageLoading(true)
        try {
            const r = await fetch('/api/image-config')
            const j = await r.json()
            if (j.success && j.data) {
                setImageApiKey(j.data.apiKey || '')
                setImageApiUrl(j.data.apiUrl || 'https://api.siliconflow.cn/v1')
            }
        } catch (e) {
            console.error('Failed to load image config', e)
        } finally {
            setImageLoading(false)
        }
    }

    const saveImageConfig = async () => {
        if (!imageApiKey.trim()) return
        setImageSaving(true)
        try {
            const r = await fetch('/api/image-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: imageApiKey.trim(), apiUrl: imageApiUrl.trim() })
            })
            const j = await r.json()
            if (j.success) {
                // Success feedback could be added here
            }
        } catch (e) {
            console.error('Failed to save image config', e)
        } finally {
            setImageSaving(false)
        }
    }

    const getBalanceColor = (balance: number) => {
        if (balance >= 500) return 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20'
        if (balance >= 100) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
        return 'text-destructive bg-destructive/10 border-destructive/20'
    }

    return (
        <Card className="border-border shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <Bot className="mr-2 h-5 w-5 text-muted-foreground" />
                    AI服务配置
                </CardTitle>
                <CardDescription>
                    配置文本生成和图片生成的AI服务
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="text" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="text" className="flex items-center">
                            <Bot className="mr-2 h-4 w-4" />
                            文本生成 (LLM)
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex items-center">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            图片生成
                        </TabsTrigger>
                    </TabsList>

                    {/* Text Generation Tab */}
                    <TabsContent value="text" className="space-y-6">
                        <div className="space-y-4">
                            {/* Default Model Selection */}
                            <div className="p-4 bg-muted/50 rounded-xl border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="font-medium text-foreground">默认模型</h4>
                                        <p className="text-sm text-muted-foreground">选择系统默认使用的AI模型</p>
                                    </div>
                                    <Badge variant="outline" className="bg-background">
                                        {defaultModel ? defaultModel.name : '未设置'}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {availableModels.map((model) => (
                                        <div
                                            key={model.id}
                                            onClick={() => handleSetDefaultModel(model)}
                                            className={cn(
                                                "cursor-pointer p-3 rounded-lg border transition-all flex items-center justify-between",
                                                defaultModel?.id === model.id
                                                    ? "bg-background border-primary shadow-sm ring-1 ring-primary"
                                                    : "bg-background border-border hover:border-muted-foreground/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn("w-2 h-2 rounded-full shrink-0", model.isActive ? "bg-green-500" : "bg-muted")} />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{model.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{model.provider}</p>
                                                </div>
                                            </div>
                                            {defaultModel?.id === model.id && (
                                                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <h4 className="font-medium text-foreground">API 密钥配置</h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditing(!editing)}
                                    className="text-muted-foreground"
                                >
                                    {editing ? '取消' : '编辑'}
                                </Button>
                            </div>
                            {editing ? (
                                <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
                                    <div className="relative">
                                        <Input
                                            placeholder="请输入API密钥"
                                            value={newApiKey}
                                            onChange={(e) => setNewApiKey(e.target.value)}
                                            type={showApiKey ? 'text' : 'password'}
                                            className="pr-10 font-mono bg-background"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1 h-8 w-8"
                                            onClick={() => {
                                                if (!showApiKey) {
                                                    setShowPasswordDialog(true)
                                                } else {
                                                    setShowApiKey(false)
                                                }
                                            }}
                                        >
                                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSaveApiKey}
                                            disabled={saveLoading || !newApiKey.trim()}
                                            size="sm"
                                            className=""
                                        >
                                            {saveLoading ? '保存中...' : '保存配置'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center justify-between">
                                    <code className="text-sm text-muted-foreground font-mono">
                                        {apiInfo?.apiKey && showApiKey ? apiInfo.apiKey : '••••••••••••••••••••••••••••'}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (!showApiKey) {
                                                setShowPasswordDialog(true)
                                            } else {
                                                setShowApiKey(false)
                                            }
                                        }}
                                    >
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className={cn('p-6 rounded-xl border transition-colors', getBalanceColor(apiInfo?.balance || 0))}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium opacity-80">账户余额</p>
                                            <p className="text-2xl font-bold mt-1">¥{apiInfo?.balance.toFixed(2)}</p>
                                        </div>
                                        <CheckCircle className="h-6 w-6 opacity-80" />
                                    </div>
                                </div>
                                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-700 dark:text-blue-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">今日消费</span>
                                        <span className="text-lg font-bold">¥{apiInfo?.totalCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between opacity-80 text-sm">
                                        <span>昨日余额</span>
                                        <span>¥{apiInfo?.yesterdayBalance?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <Button variant="outline" onClick={loadAPIInfo} disabled={loading} size="sm" className="border-border">
                                    <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                                    刷新数据
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Image Generation Tab */}
                    <TabsContent value="image" className="space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">API 地址</label>
                                    <Input
                                        value={imageApiUrl}
                                        onChange={(e) => setImageApiUrl(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                                    <Input
                                        type="password"
                                        value={imageApiKey}
                                        onChange={(e) => setImageApiKey(e.target.value)}
                                        placeholder="请输入硅基流动 API Key"
                                        className="bg-background"
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={saveImageConfig}
                                        disabled={imageSaving || !imageApiKey.trim()}
                                    >
                                        {imageSaving ? '保存中...' : '保存配置'}
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-sm">
                                <div className="flex items-start">
                                    <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                                    <p>
                                        图片生成服务目前使用硅基流动 (SiliconFlow) API。请确保您的 API Key 具有足够的额度。
                                        <a href="https://siliconflow.cn" target="_blank" rel="noreferrer" className="underline ml-1 font-medium">
                                            前往官网
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Password Dialog */}
                {showPasswordDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                        <Card className="w-full max-w-sm shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg">验证密码</CardTitle>
                                <CardDescription>请输入密码以查看API密钥</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Input
                                        type="password"
                                        placeholder="请输入密码"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handlePasswordVerify()
                                        }}
                                        autoFocus
                                    />
                                    {passwordError && <p className="text-rose-500 text-sm mt-2">{passwordError}</p>}
                                </div>
                                <div className="flex space-x-2">
                                    <Button onClick={handlePasswordVerify} disabled={!passwordInput.trim()} className="flex-1">确认</Button>
                                    <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="flex-1">取消</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
