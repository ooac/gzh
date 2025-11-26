'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Settings, X } from 'lucide-react'

export default function ImageAPIConfigButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('https://api.siliconflow.cn/v1')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/image-config')
        const j = await r.json()
        if (j.success && j.data) {
          setApiKey(j.data.apiKey || '')
          setApiUrl(j.data.apiUrl || 'https://api.siliconflow.cn/v1')
        }
      } catch { }
    }
    load()
  }, [])

  const save = async () => {
    if (!apiKey.trim()) return
    setLoading(true)
    try {
      const r = await fetch('/api/image-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: apiKey.trim(), apiUrl: apiUrl.trim() }) })
      const j = await r.json()
      if (j.success) setIsOpen(false)
    } catch { }
    setLoading(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="flex items-center"><Settings className="h-4 w-4 mr-2 text-muted-foreground" />图片API配置</Button>
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card">
            <CardHeader>
              <div className="flex items-center justify-between"><div><CardTitle>图片 API 配置</CardTitle><CardDescription>配置硅基流动生图密钥与端点</CardDescription></div><Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-foreground">API 地址</label>
                <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-foreground">API Key</label>
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="请输入你的密钥,不会写入代码" />
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button><Button onClick={save} disabled={loading || !apiKey.trim()}>{loading ? '保存中...' : '保存'}</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}