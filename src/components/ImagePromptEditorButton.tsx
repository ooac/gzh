'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Settings, X } from 'lucide-react'
import ThemeIcon from '@/components/ThemeIcon'

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export default function ImagePromptEditorButton({ articleContent, count, providerConfigId }: { articleContent: string; count: number; providerConfigId?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tplContent, setTplContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [prompts, setPrompts] = useState<any[]>([])
  const [style, setStyle] = useState('插画风格')
  const [ratio, setRatio] = useState('2.35:1')

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/image-prompt-template')
        const j = await r.json()
        const defaultTpl = '为每段中文正文的尾部内容生成一行用于AI生图的提示词，共{count}行。每行需包含主体元素、环境氛围、色彩与光影、构图与机位，并包含“{style}”与“比例{ratio}”。优先中文，必要时在行末附英文关键词：cinematic, wide shot, soft light, high detail, {ratio}。仅输出提示词列表，每段一行。'
        if (j.success && j.data && j.data.content) {
          setTplContent(j.data.content)
        } else {
          setTplContent(defaultTpl)
        }
      } catch { }
    }
    load()
  }, [])

  const save = async () => {
    if (!tplContent.trim()) return
    setLoading(true)
    try {
      const r = await fetch('/api/image-prompt-template', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: tplContent }) })
      const j = await r.json()
      if (j.success) setIsOpen(false)
    } catch { }
    setLoading(false)
  }

  const preview = async () => {
    setPreviewLoading(true)
    try {
      const r = await fetch('/api/image-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: articleContent, count, style, ratio, providerConfigId }) })
      const j = await r.json()
      if (j.success) setPrompts(j.data.prompts || [])
    } catch { }
    setPreviewLoading(false)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="flex items-center">
        <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
        图片提示词
      </Button>
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl border-border shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between"><div><CardTitle>图片提示词模板</CardTitle><CardDescription>可使用占位符 {"{count}"} {"{style}"} {"{ratio}"}；每行一段提示词</CardDescription></div><Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground">风格</span>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="插画风格">插画风格</SelectItem>
                    <SelectItem value="写实风格">写实风格</SelectItem>
                    <SelectItem value="水彩风格">水彩风格</SelectItem>
                    <SelectItem value="赛博朋克">赛博朋克</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-foreground">比例</span>
                <Select value={ratio} onValueChange={setRatio}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="选择比例" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="2.35:1">2.35:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea value={tplContent} onChange={(e) => setTplContent(e.target.value)} className="min-h-[220px]" placeholder="例如：为每段中文正文的尾部内容生成一行用于AI生图的提示词，共{count}行..." />
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={preview} disabled={previewLoading}>{previewLoading ? '生成预览中...' : '预览当前提示词'}</Button>
                <div className="flex gap-2"><Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button><Button onClick={save} disabled={loading || !tplContent.trim()}>{loading ? '保存中...' : '保存'}</Button></div>
              </div>
              {prompts.length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/50 border-border">
                  <div className="text-sm font-medium text-foreground mb-2">预览结果</div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {prompts.map((p: any, idx: number) => (
                      <div key={idx}><span className="font-semibold mr-2 text-foreground">第{(p.segmentIndex ?? idx) + 1}段：</span>{p.prompt}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}