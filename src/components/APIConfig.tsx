'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Settings, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function APIConfig() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('https://www.dajiala.com/fbmain/monitor/v3/kw_search')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadConfig = async () => {
    setLoading(true)
    try {
      // Try to get from local storage first to populate fields
      const savedConfig = localStorage.getItem('apiConfig')
      let currentApiKey = ''
      let currentApiUrl = 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'

      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          currentApiKey = parsed.apiKey || ''
          currentApiUrl = parsed.apiUrl || currentApiUrl
          setApiKey(currentApiKey)
          setApiUrl(currentApiUrl)
          if (parsed.balance !== undefined) setBalance(parsed.balance)
        } catch { }
      }

      // Fetch latest from API
      let fetchUrl = '/api/api-config-simple'
      if (currentApiKey) {
        const params = new URLSearchParams({ apiKey: currentApiKey, apiUrl: currentApiUrl })
        fetchUrl = `/api/api-config-simple?${params.toString()}`
      }

      const res = await fetch(fetchUrl)
      const data = await res.json()
      if (data.success && data.data) {
        setBalance(data.data.balance)
        // Update local storage if we got fresh data
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig)
          localStorage.setItem('apiConfig', JSON.stringify({ ...parsed, balance: data.data.balance }))
        } else {
          // If no local config but we got data (e.g. from env vars on server), save it
          localStorage.setItem('apiConfig', JSON.stringify({
            apiKey: currentApiKey,
            apiUrl: currentApiUrl,
            balance: data.data.balance
          }))
        }
      }
    } catch (e) {
      console.error('Failed to load API config', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const save = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/api-config-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim(), apiUrl: apiUrl.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setBalance(data.data.balance)
        localStorage.setItem('apiConfig', JSON.stringify({
          apiKey: apiKey.trim(),
          apiUrl: apiUrl.trim(),
          balance: data.data.balance,
          currency: data.data.currency,
          totalCost: data.data.totalCost,
          yesterdayBalance: data.data.yesterdayBalance,
          lastUpdate: data.data.lastUpdate
        }))
        setIsOpen(false)
      }
    } catch (e) {
      console.error('Failed to save API config', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
        title="点击配置API"
      >
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span>API配置</span>
        {balance !== null && (
          <span className={cn(
            "ml-1 text-xs font-medium",
            balance < 10 ? "text-destructive" : "text-emerald-500"
          )}>
            (¥{balance.toFixed(2)})
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API 配置</CardTitle>
                  <CardDescription>配置大模型 API 密钥与余额查询</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-primary/10 text-primary text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  当前余额: <span className="font-bold">¥{balance !== null ? balance.toFixed(2) : '--'}</span>
                  <p className="text-xs opacity-80 mt-1">余额不足时可能导致生成失败，请及时充值。</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">API 地址</label>
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
                <Button onClick={save} disabled={saving || !apiKey.trim()}>
                  {saving ? '保存中...' : '保存配置'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
