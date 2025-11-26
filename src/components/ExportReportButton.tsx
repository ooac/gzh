"use client"

import { useState, useEffect } from "react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAnalysisContextStore } from '@/store/analysisContext'
import { FileText, Brain, History, Wand2, Settings } from 'lucide-react'
import ThemeIcon from '@/components/ThemeIcon'

export default function ExportReportButton() {
  const { currentKeyword, currentHistoryId, articleCount } = useAnalysisContextStore()
  const [open, setOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [resultOpen, setResultOpen] = useState(false)
  const [resultContent, setResultContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [extractPrompts, setExtractPrompts] = useState<any[]>([])
  const [aggregatePrompts, setAggregatePrompts] = useState<any[]>([])
  const [briefPrompts, setBriefPrompts] = useState<any[]>([])
  const [activeExtractId, setActiveExtractId] = useState<string | null>(null)
  const [activeAggregateId, setActiveAggregateId] = useState<string | null>(null)
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null)
  const [currentExtract, setCurrentExtract] = useState<any | null>(null)
  const [currentAggregate, setCurrentAggregate] = useState<any | null>(null)
  const [currentBrief, setCurrentBrief] = useState<any | null>(null)
  const [historyReports, setHistoryReports] = useState<any[]>([])
  const [tabValue, setTabValue] = useState('analyze')
  const [editReportOpen, setEditReportOpen] = useState(false)
  const [editReportId, setEditReportId] = useState<string | null>(null)
  const [editReportText, setEditReportText] = useState('')
  const [editReportMarkdown, setEditReportMarkdown] = useState('')
  const [historyArticles, setHistoryArticles] = useState<any[]>([])
  const [metrics, setMetrics] = useState<{ avgRead: number; avgLike: number; avgRate: number } | null>(null)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const handleEditOpenChange = (v: boolean) => {
    setEditReportOpen(v)
  }

  useEffect(() => {
    if (open) {
      loadPrompts()
    }
  }, [open, currentKeyword])

  useEffect(() => {
    if (open && tabValue === 'history') {
      loadReports()
    }
  }, [open, tabValue, currentKeyword])

  useEffect(() => {
    if (open && tabValue === 'analyze') {
      loadHistoryDetail()
    }
  }, [open, tabValue, currentHistoryId, currentKeyword])

  const loadReports = async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (filterKeyword.trim()) {
        params.set('q', filterKeyword.trim())
      }
      if (filterStart) params.set('start', filterStart)
      if (filterEnd) params.set('end', filterEnd)
      const res = await fetch(`/api/reports?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        let list = data.data || []
        if ((!list || list.length === 0) && !filterKeyword.trim()) {
          const fallback = await fetch(`/api/reports?limit=50`)
          const fb = await fallback.json()
          if (fb.success) list = fb.data || []
        }
        setHistoryReports(list)
      }
    } catch (e) {
      console.error('加载历史报告失败', e)
    }
  }

  useEffect(() => {
    if (open && tabValue === 'history') {
      loadReports()
    }
  }, [filterKeyword, filterStart, filterEnd])

  const loadHistoryDetail = async () => {
    try {
      let hid = currentHistoryId
      if (!hid) {
        const res = await fetch(`/api/analysis/history?limit=1&keyword=${encodeURIComponent(currentKeyword || '')}`)
        if (res.ok) {
          const d = await res.json()
          hid = d?.data?.[0]?.id || ''
        }
      }
      if (!hid) { setHistoryArticles([]); setMetrics(null); return }
      const detail = await fetch(`/api/analysis/history?id=${hid}`)
      if (detail.ok) {
        const dd = await detail.json()
        const articles = dd?.data?.articles || []
        setHistoryArticles(articles)
        if (articles.length > 0) {
          const avgRead = Math.round(articles.reduce((s: number, a: any) => s + (a.readCount || 0), 0) / articles.length)
          const avgLike = Math.round(articles.reduce((s: number, a: any) => s + (a.likeCount || 0), 0) / articles.length)
          const rates = articles.map((a: any) => (a.readCount > 0 ? a.likeCount / a.readCount : 0))
          const avgRate = Math.round((rates.reduce((s: number, r: number) => s + r, 0) / rates.length) * 10000) / 100
          setMetrics({ avgRead, avgLike, avgRate })
        } else {
          setMetrics(null)
        }
      }
    } catch (e) {
      console.error('加载分析数据失败', e)
    }
  }

  const loadPrompts = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`/api/prompts?type=extract&keyword=${encodeURIComponent(currentKeyword || '')}`),
        fetch(`/api/prompts?type=aggregate&keyword=${encodeURIComponent(currentKeyword || '')}`),
        fetch(`/api/prompts?type=brief&keyword=${encodeURIComponent(currentKeyword || '')}`)
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      const d3 = await r3.json()
      if (d1.success) setExtractPrompts(d1.data || [])
      if (d2.success) setAggregatePrompts(d2.data || [])
      if (d3.success) setBriefPrompts(d3.data || [])
      let selData: any = null
      try {
        const selRes = await fetch(`/api/prompts/active?keyword=${encodeURIComponent(currentKeyword || '')}`)
        if (selRes.ok) selData = await selRes.json()
      } catch (e) {
        console.error('加载当前选择失败', e)
      }
      let extractId = selData?.data?.extractId || null
      let aggregateId = selData?.data?.aggregateId || null
      let briefId = selData?.data?.briefId || null
      const pickLatest = (arr: any[]) => {
        if (!arr || arr.length === 0) return null
        const v3 = arr.find((x) => x.version?.toLowerCase() === 'v3')
        return v3 || arr[0]
      }
      if (!extractId) extractId = pickLatest(d1.data || [])?.id || null
      if (!aggregateId) aggregateId = pickLatest(d2.data || [])?.id || null
      if (!briefId) briefId = pickLatest(d3.data || [])?.id || null
      setActiveExtractId(extractId)
      setActiveAggregateId(aggregateId)
      setActiveBriefId(briefId)
      setCurrentExtract((d1.data || []).find((x: any) => x.id === extractId) || null)
      setCurrentAggregate((d2.data || []).find((x: any) => x.id === aggregateId) || null)
      setCurrentBrief((d3.data || []).find((x: any) => x.id === briefId) || null)
    } catch (e) {
      console.error('加载提示词失败', e)
    }
  }

  const handleAnalyzeAndExport = async () => {
    if (!currentKeyword) return
    try {
      setLoading(true)
      const res = await fetch('/api/keyword/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: currentKeyword, promptIds: { extractId: activeExtractId, aggregateId: activeAggregateId, briefId: activeBriefId } })
      })
      const data = await res.json()
      if (data.success && data.data?.summaryMarkdown) {
        setResultContent(data.data.summaryMarkdown)
        setResultOpen(true)
        try { await loadReports() } catch { }
        const blob = new Blob([data.data.summaryMarkdown], { type: 'text/markdown;charset=utf-8' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${currentKeyword}_汇总分析_${new Date().toISOString().split('T')[0]}.md`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const exp = await fetch('/api/analysis/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: currentKeyword })
        })
        if (exp.ok) {
          const blob = await exp.blob()
          const text = await blob.text()
          setResultContent(text)
          setResultOpen(true)
          try { await loadReports() } catch { }
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${currentKeyword}_汇总分析_${new Date().toISOString().split('T')[0]}.md`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (e) {
      console.error('分析并导出失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleExportLast = async () => {
    try {
      const res = await fetch('/api/analysis/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: currentKeyword })
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentKeyword}_最近报告_${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error('导出最近报告失败', e)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2">
          <Button size="sm" className="rounded-lg pl-1" disabled={loading} onClick={handleAnalyzeAndExport}>
            {loading ? (
              <div className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>生成中...</div>
            ) : (
              <><ThemeIcon icon={Wand2} variant="glass" size="sm" className="w-6 h-6 mr-2 bg-primary/20 border-none" iconClassName="w-3.5 h-3.5 text-primary-foreground" />分析并导出</>
            )}
          </Button>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-lg pl-1">
              <ThemeIcon icon={Settings} variant="secondary" size="sm" className="w-6 h-6 mr-2 bg-muted border-none" iconClassName="w-3.5 h-3.5 text-muted-foreground" />
              报告设置
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-[720px] max-h-[75vh] overflow-hidden flex flex-col" aria-describedby="export-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> 汇总分析与导出
            </DialogTitle>
            <DialogDescription id="export-desc">导出与提示词设置</DialogDescription>
            <div className="text-sm text-muted-foreground">
              当前关键词：{currentKeyword || '未选择'} · 文章数：{articleCount}
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 min-w-0">
                <span className="shrink-0">素材抽取：</span>
                <span className="truncate">{currentExtract ? `${currentExtract.name}（${currentExtract.version}）` : '未选择'}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="shrink-0">聚合诊断：</span>
                <span className="truncate">{currentAggregate ? `${currentAggregate.name}（${currentAggregate.version}）` : '未选择'}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="shrink-0">写作提纲：</span>
                <span className="truncate">{currentBrief ? `${currentBrief.name}（${currentBrief.version}）` : '未选择'}</span>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-3 flex flex-col h-[60vh]">
            <Tabs defaultValue="analyze" className="flex flex-col h-full" onValueChange={(v) => setTabValue(v)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="analyze" className="flex items-center gap-1"><Brain className="h-4 w-4" />分析</TabsTrigger>
                <TabsTrigger value="prompts" className="flex items-center gap-1"><Settings className="h-4 w-4" />提示词</TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1"><History className="h-4 w-4" />历史报告</TabsTrigger>
              </TabsList>
              <TabsContent value="analyze" className="flex-1 overflow-y-auto space-y-4">
                <div className="text-sm text-muted-foreground">将聚合该关键词下所有已存文章，生成爆款榜单与热点洞察，并导出 Markdown。</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground">平均阅读</div>
                    <div className="text-lg font-semibold">{metrics ? metrics.avgRead : '-'}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground">平均点赞</div>
                    <div className="text-lg font-semibold">{metrics ? metrics.avgLike : '-'}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground">平均互动率</div>
                    <div className="text-lg font-semibold">{metrics ? `${metrics.avgRate}%` : '-'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-2">点赞最高 Top-5</div>
                    <div className="space-y-2">
                      {historyArticles.length === 0 ? (<div className="text-sm text-muted-foreground">暂无数据</div>) : (
                        [...historyArticles].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 5).map((a: any, i: number) => (
                          <div key={a.id || i} className="text-sm">
                            <div className="truncate">{i + 1}. {a.title}</div>
                            <div className="text-muted-foreground">{a.author} · 阅读 {a.readCount} · 点赞 {a.likeCount}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-2">互动率最高 Top-5</div>
                    <div className="space-y-2">
                      {historyArticles.length === 0 ? (<div className="text-sm text-muted-foreground">暂无数据</div>) : (
                        [...historyArticles].sort((a, b) => {
                          const ra = a.readCount > 0 ? a.likeCount / a.readCount : 0
                          const rb = b.readCount > 0 ? b.likeCount / b.readCount : 0
                          return rb - ra
                        }).slice(0, 5).map((a: any, i: number) => {
                          const rate = a.readCount > 0 ? ((a.likeCount / a.readCount) * 100).toFixed(2) : '0.00'
                          return (
                            <div key={a.id || i} className="text-sm">
                              <div className="truncate">{i + 1}. {a.title}</div>
                              <div className="text-muted-foreground">{a.author} · 阅读 {a.readCount} · 点赞 {a.likeCount} · 互动率 {rate}%</div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

              </TabsContent>
              <TabsContent value="prompts" className="flex-1 overflow-y-auto space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">素材抽取模板</div>
                    <Button size="sm" onClick={async () => { const name = prompt('提示词名称') || ''; const content = prompt('提示词内容') || ''; if (!name || !content) return; await fetch('/api/prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, content, type: 'extract', keyword: currentKeyword }) }); loadPrompts() }}>新建提示词</Button>
                  </div>
                  <div className="space-y-2">
                    {extractPrompts.map((p) => (
                      <div key={p.id} className={`p-3 border rounded-lg flex items-start justify-between gap-3 ${activeExtractId === p.id ? 'border-primary bg-primary/10' : 'border-border'}`}>
                        <div className="text-sm flex-1 min-w-0"><div className="font-medium">{p.name} <Badge variant="outline">{p.version}</Badge></div><div className="text-muted-foreground whitespace-pre-wrap break-words">{p.content}</div></div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Button size="sm" variant="outline" onClick={async () => { setActiveExtractId(p.id); setCurrentExtract(p); await fetch('/api/prompts/active', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: currentKeyword, extractId: p.id, aggregateId: activeAggregateId, briefId: activeBriefId }) }); }}>设为当前</Button>
                          <Button size="sm" variant="outline" onClick={() => { setPreviewContent(p.content); setPreviewOpen(true) }}>查看</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditId(p.id); setEditName(p.name); setEditContent(p.content); setEditOpen(true) }}>编辑</Button>
                          <Button size="sm" variant="outline" onClick={async () => { try { await fetch(`/api/prompts/${p.id}`, { method: 'DELETE' }); } catch (e) { console.error('删除失败', e) } finally { loadPrompts() } }}>删除</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">聚合诊断模板</div>
                    <Button size="sm" onClick={async () => { const name = prompt('提示词名称') || ''; const content = prompt('提示词内容') || ''; if (!name || !content) return; await fetch('/api/prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, content, type: 'aggregate', keyword: currentKeyword }) }); loadPrompts() }}>新建提示词</Button>
                  </div>
                  <div className="space-y-2">
                    {aggregatePrompts.map((p) => (
                      <div key={p.id} className={`p-3 border rounded-lg flex items-start justify-between gap-3 ${activeAggregateId === p.id ? 'border-primary bg-primary/10' : 'border-border'}`}>
                        <div className="text-sm flex-1 min-w-0"><div className="font-medium">{p.name} <Badge variant="outline">{p.version}</Badge></div><div className="text-muted-foreground whitespace-pre-wrap break-words">{p.content}</div></div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Button size="sm" variant="outline" onClick={async () => { setActiveAggregateId(p.id); setCurrentAggregate(p); await fetch('/api/prompts/active', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: currentKeyword, extractId: activeExtractId, aggregateId: p.id, briefId: activeBriefId }) }); }}>设为当前</Button>
                          <Button size="sm" variant="outline" onClick={() => { setPreviewContent(p.content); setPreviewOpen(true) }}>查看</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditId(p.id); setEditName(p.name); setEditContent(p.content); setEditOpen(true) }}>编辑</Button>
                          <Button size="sm" variant="outline" onClick={async () => { try { await fetch(`/api/prompts/${p.id}`, { method: 'DELETE' }); } catch (e) { console.error('删除失败', e) } finally { loadPrompts() } }}>删除</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">写作提纲模板</div>
                    <Button size="sm" onClick={async () => { const name = prompt('提示词名称') || ''; const content = prompt('提示词内容') || ''; if (!name || !content) return; await fetch('/api/prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, content, type: 'brief', keyword: currentKeyword }) }); loadPrompts() }}>新建提示词</Button>
                  </div>
                  <div className="space-y-2">
                    {briefPrompts.map((p) => (
                      <div key={p.id} className={`p-3 border rounded-lg flex items-start justify-between gap-3 ${activeBriefId === p.id ? 'border-primary bg-primary/10' : 'border-border'}`}>
                        <div className="text-sm flex-1 min-w-0"><div className="font-medium">{p.name} <Badge variant="outline">{p.version}</Badge></div><div className="text-muted-foreground whitespace-pre-wrap break-words">{p.content}</div></div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Button size="sm" variant="outline" onClick={async () => { setActiveBriefId(p.id); setCurrentBrief(p); await fetch('/api/prompts/active', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: currentKeyword, extractId: activeExtractId, aggregateId: activeAggregateId, briefId: p.id }) }); }}>设为当前</Button>
                          <Button size="sm" variant="outline" onClick={() => { setPreviewContent(p.content); setPreviewOpen(true) }}>查看</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditId(p.id); setEditName(p.name); setEditContent(p.content); setEditOpen(true) }}>编辑</Button>
                          <Button size="sm" variant="outline" onClick={async () => { try { await fetch(`/api/prompts/${p.id}`, { method: 'DELETE' }); } catch (e) { console.error('删除失败', e) } finally { loadPrompts() } }}>删除</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="flex-1 overflow-y-auto space-y-4">
                <div className="text-sm text-muted-foreground">历史报告筛选</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input placeholder="关键词" value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} className="w-40" />
                  <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="w-36" />
                  <span className="text-muted-foreground">至</span>
                  <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="w-36" />
                  <Button size="sm" variant="outline" onClick={loadReports}>筛选</Button>
                  <Button size="sm" variant="outline" onClick={() => { setFilterKeyword(''); setFilterStart(''); setFilterEnd(''); loadReports() }}>重置</Button>
                </div>
                <div id="history-list" className="space-y-2">
                  {historyReports.length === 0 ? (
                    <div className="text-sm text-muted-foreground">暂无报告</div>
                  ) : (
                    historyReports.map((r) => (
                      <div key={r.id} className="p-3 border border-border rounded-lg flex items-start justify-between gap-3">
                        <div className="text-sm flex-1 min-w-0">
                          <div className="font-medium">{r.keyword || currentKeyword} · {new Date(r.generatedAt).toLocaleString('zh-CN')}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <Button size="sm" variant="outline" onClick={async () => { try { const res = await fetch(`/api/reports/${r.id}/export`); if (!res.ok) return; const blob = await res.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${(r.keyword || currentKeyword)}_报告_${new Date().toISOString().split('T')[0]}.md`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); } catch (e) { console.error('下载失败', e) } }}>下载</Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              setEditReportId(r.id); handleEditOpenChange(true); let fullText = '';
                              const res = await fetch(`/api/reports/${r.id}`); if (res.ok) { const d = await res.json(); const item = d.data || {}; if (item.renderedMarkdown) fullText = item.renderedMarkdown }
                              if (!fullText) { const exp = await fetch(`/api/reports/${r.id}/export?raw=1`); if (exp.ok) { const blob = await exp.blob(); fullText = await blob.text(); } }
                              setEditReportMarkdown(fullText)
                            } catch (e) { console.error('加载原内容失败', e) }
                          }}>编辑</Button>
                          <Button size="sm" variant="outline" onClick={async () => { try { const resp = await fetch(`/api/reports/${r.id}`, { method: 'DELETE' }); if (!resp.ok) { console.error('删除失败'); return } } finally { loadReports() } }}>删除</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          {tabValue === 'analyze' && (
            <div className="mt-3 flex justify-end gap-2">
              <Button onClick={handleAnalyzeAndExport} disabled={loading} className="rounded-lg">
                {loading ? (<div className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>生成中...</div>) : (<><Wand2 className="mr-2 h-4 w-4" />分析并导出</>)}
              </Button>
              <Button variant="outline" onClick={handleExportLast} className="rounded-lg">
                导出最近报告
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="sm:max-w-[720px]" aria-describedby="preview-desc">
          <DialogHeader>
            <DialogTitle>报告预览</DialogTitle>
            <DialogDescription id="preview-desc">生成后的报告内容预览与下载</DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap break-words text-sm text-foreground max-h-[60vh] overflow-y-auto overflow-x-hidden w-full max-w-full">{resultContent}</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(resultContent) }}>复制全文</Button>
            <Button onClick={() => {
              const blob = new Blob([resultContent], { type: 'text/markdown;charset=utf-8' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${currentKeyword}_汇总分析_${new Date().toISOString().split('T')[0]}.md`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
            }}>再次下载</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[720px]" aria-describedby="prompt-preview-desc">
          <DialogHeader>
            <DialogTitle>提示词预览</DialogTitle>
            <DialogDescription id="prompt-preview-desc">当前提示词全文预览</DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap break-words text-sm text-foreground max-h-[60vh] overflow-auto overflow-x-hidden w-full max-w-full">{previewContent}</div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(previewContent) }}>复制</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editReportOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-[800px] w-[800px] max-h-[85vh] overflow-auto z-[60]" aria-describedby="edit-report-desc">
          <DialogHeader>
            <DialogTitle>修改报告全文</DialogTitle>
            <DialogDescription id="edit-report-desc">编辑与保存当前报告的完整Markdown</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea className="w-full h-[55vh] rounded-lg border border-input px-3 py-2 text-sm bg-background text-foreground" value={editReportMarkdown} onChange={(e) => setEditReportMarkdown(e.target.value)} />
          </div>
          <div className="flex items-center justify-between mt-4 sticky bottom-0 bg-background py-2">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(editReportMarkdown) }}>复制全文</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditReportOpen(false)}>取消</Button>
              <Button onClick={async () => { if (!editReportId) return; await fetch(`/api/reports/${editReportId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ renderedMarkdown: editReportMarkdown }) }); setEditReportOpen(false); loadReports() }}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[720px]" aria-describedby="edit-prompt-desc">
          <DialogHeader>
            <DialogTitle>编辑提示词</DialogTitle>
            <DialogDescription id="edit-prompt-desc">修改并保存提示词内容</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-10 rounded-lg border border-input px-3 text-sm bg-background text-foreground" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <textarea className="w-full min-h-[260px] rounded-lg border border-input px-3 py-2 text-sm bg-background text-foreground" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={async () => { if (!editId) return; await fetch(`/api/prompts/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, content: editContent }) }); setEditOpen(false); loadPrompts() }}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
