'use client'

import { useEffect, useState, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSearchParams } from 'next/navigation'

import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  FileText,
  MessageCircle,
  Camera,
  Image,
  List
} from 'lucide-react'
import MarkdownViewer from '@/components/MarkdownViewer'

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

function PublishPageContent() {
  const [activeTab, setActiveTab] = useState('pending')
  const [notice, setNotice] = useState('')
  const [publishOpen, setPublishOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountsError, setAccountsError] = useState<{ error?: string; code?: string } | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [customAppid, setCustomAppid] = useState('')
  const [publishType, setPublishType] = useState<'news' | 'newspic'>('news')
  const [articles, setArticles] = useState<any[]>([])
  const [selectedArticleId, setSelectedArticleId] = useState<string>('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiUrlInput, setApiUrlInput] = useState('')
  const [publishRecords, setPublishRecords] = useState<any[]>([])
  const [queue, setQueue] = useState<any[]>([])
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([])
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [previewArticleOpen, setPreviewArticleOpen] = useState(false)
  const [previewImagesOpen, setPreviewImagesOpen] = useState(false)
  const [previewArticle, setPreviewArticle] = useState<any>(null)
  const [previewImages, setPreviewImages] = useState<any[]>([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [cacheLoading, setCacheLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadPublishRecords = async () => {
      try {
        const r = await fetch('/api/publish/records/all?limit=100')
        const j = await r.json()
        if (j.success) {
          const records = j.data.items || []
          // 为每条发布记录获取对应的文章数据
          const enrichedRecords = await Promise.all(
            records.map(async (record: any) => {
              if (record.articleId) {
                try {
                  const articleRes = await fetch(`/api/articles/${record.articleId}`)
                  const articleJson = await articleRes.json()
                  if (articleJson.success) {
                    // 合并数据,但保留发布记录的关键字段(status, platform等)
                    const { status: articleStatus, platform: articlePlatform, ...articleData } = articleJson.data
                    return { ...articleData, ...record }
                  }
                } catch { }
              }
              return record
            })
          )
          setQueue(enrichedRecords)
        }
      } catch { }
    }
    loadPublishRecords()
    const loadAccounts = async () => {
      try {
        const r = await fetch('/api/publish/wechat/accounts')
        const j = await r.json()
        if (j.success) { setAccounts(j.data.accounts || []); setAccountsError(null) }
        else { setAccounts([]); setAccountsError({ error: j.error, code: j.code }); setNotice(j.error || '获取公众号列表失败'); setTimeout(() => setNotice(''), 3000) }
      } catch { setAccounts([]) }
    }
    const loadArticles = async () => {
      try { const rq = await fetch('/api/articles?limit=50'); const aj = await rq.json(); if (aj.success) setArticles(aj.data.articles || []) } catch { }
    }
    loadAccounts()
    loadArticles()
  }, [])

  useEffect(() => {
    try {
      const aid = searchParams?.get('articleId') || ''
      const open = searchParams?.get('open') || ''
      if (aid) setSelectedArticleId(aid)
      if (open === '1') setPublishOpen(true)
    } catch { }
  }, [searchParams])

  useEffect(() => {
    if (publishOpen) {
      (async () => {
        try {
          const r = await fetch('/api/publish/wechat/accounts')
          const j = await r.json()
          if (j.success) { setAccounts(j.data.accounts || []); setAccountsError(null) }
          else { setAccounts([]); setAccountsError({ error: j.error, code: j.code }) }
        } catch { }
      })()
    }
  }, [publishOpen])

  useEffect(() => {
    if (!selectedArticleId) { setPublishRecords([]); return }
    (async () => {
      try { const r = await fetch(`/api/publish/records?articleId=${encodeURIComponent(selectedArticleId)}`); const j = await r.json(); if (j.success) setPublishRecords(j.data.records || []) }
      catch { setPublishRecords([]) }
    })()
  }, [selectedArticleId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      case 'pending':
        return 'bg-secondary text-secondary-foreground border-border'
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case '公众号':
        return <MessageCircle className="h-4 w-4" />
      case '小红书':
        return <Camera className="h-4 w-4" />
      default:
        return <Send className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case '公众号':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      case '小红书':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      default:
        return 'bg-secondary text-secondary-foreground border-border'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '发布成功'
      case 'pending':
        return '等待发布'
      case 'failed':
        return '发布失败'
      default:
        return '未知状态'
    }
  }

  const parseImageUrls = (md: string) => {
    const urls = new Set<string>()
    const m = md || ''
    // 匹配 Markdown 图片语法: ![alt](url)
    const r1 = /!\[[^\]]*\]\(([^)]+)\)/g
    // 匹配 HTML img 标签
    const r2 = /<img[^>]+src=["']([^"'>]+)["'][^>]*>/gi
    let a
    while ((a = r1.exec(m)) !== null) { urls.add(a[1]) }
    while ((a = r2.exec(m)) !== null) { urls.add(a[1]) }
    return Array.from(urls)
  }

  const getArticleImage = (item: any) => {
    // 优先使用封面图
    if (item.coverImage?.url) {
      const url = item.coverImage.url
      // 如果是本地路径,直接返回
      if (url.startsWith('/uploads/') || url.startsWith('/api/image-proxy')) {
        return url
      }
      // 如果是远程URL,通过代理返回
      try {
        const u = new URL(url)
        const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString()
        return `/api/image-proxy?url=${encodeURIComponent(href)}`
      } catch {
        return url
      }
    }
    // 如果没有封面图,从文章内容中提取第一张图片
    if (item.content) {
      const images = parseImageUrls(item.content)
      if (images.length > 0) {
        const url = images[0]
        // 如果是本地路径,直接返回
        if (url.startsWith('/uploads/') || url.startsWith('/api/image-proxy')) {
          return url
        }
        // 如果是远程URL,通过代理返回
        try {
          const u = new URL(url)
          const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString()
          return `/api/image-proxy?url=${encodeURIComponent(href)}`
        } catch {
          return url
        }
      }
    }
    return null
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">发布管理</h1>
          <p className="text-muted-foreground mt-2">
            管理文章发布队列，支持多平台一键发布
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setPublishOpen(true)} className="btn-premium">
            <Send className="mr-2 h-4 w-4" />
            发布到公众号
          </Button>
          <Button variant="outline" onClick={async () => {
            try {
              setCacheLoading(true)
              const r = await fetch('/api/images/cache', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 200 }) })
              const j = await r.json()
              if (j.success) {
                const d = j.data || {}
                setNotice(`已本地化旧图片：成功${d.succeeded || 0}，失败${d.failed || 0}`)
              } else {
                setNotice(j.error || '本地化失败')
              }
            } catch {
              setNotice('本地化失败')
            } finally {
              setCacheLoading(false)
              setTimeout(() => setNotice(''), 3000)
            }
          }}>
            <Image className="mr-2 h-4 w-4" />
            一键本地化旧图片
          </Button>
          <Button variant="outline" onClick={async () => { try { const r = await fetch('/api/publish/wechat/config'); const j = await r.json(); if (j.success) { setApiKeyInput(j.data.apiKey || ''); setApiUrlInput(j.data.apiUrl || 'https://wx.limyai.com') } setConfigOpen(true) } catch { setConfigOpen(true) } }}>公众号API配置</Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总发布数</p>
                <p className="text-2xl font-bold text-foreground mt-1">{queue.length}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Send className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">成功发布</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{queue.filter((q: any) => q.status === 'success').length}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">等待发布</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{queue.filter((q: any) => q.status === 'pending').length}</p>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">发布失败</p>
                <p className="text-2xl font-bold text-destructive mt-1">{queue.filter((q: any) => q.status === 'failed').length}</p>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 发布列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="text-xs text-muted-foreground font-medium">共 {queue.length} 条记录</span>
            </div>
            {selectedRecordIds.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground border border-primary rounded-full animate-fade-in">
                <span className="text-xs font-medium">已选 {selectedRecordIds.length} 项</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { const all = queue.map((q: any) => q.id); setSelectedRecordIds(selectedRecordIds.length === queue.length ? [] : all) }}>
              全选
            </Button>
            {selectedRecordIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setBatchConfirmOpen(true)}>
                <XCircle className="h-4 w-4 mr-1" />
                删除所选
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queue.map((item) => (
            <Card key={item.id} className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md glass-card ${selectedRecordIds.includes(item.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none z-10" />

              {/* 顶部状态栏 (模拟封面区域) */}
              <div className="h-32 w-full bg-secondary/50 relative overflow-hidden border-b border-border">
                {(() => {
                  const imageUrl = getArticleImage(item)
                  return imageUrl ? (
                    <img src={imageUrl} alt="封面" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className={`p-4 rounded-2xl bg-card shadow-sm border border-border ${item.status === 'success' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {getPlatformIcon(item.platform)}
                      </div>
                    </div>
                  )
                })()}

                <div className="absolute top-3 left-3 z-20">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-input bg-background text-primary focus:ring-ring cursor-pointer"
                    checked={selectedRecordIds.includes(item.id)}
                    onChange={(e) => { const id = item.id; setSelectedRecordIds(prev => e.target.checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id)) }}
                  />
                </div>
                <div className="absolute top-3 right-3 z-20">
                  <Badge variant="outline" className={`${getStatusColor(item.status)} backdrop-blur-md shadow-lg`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(item.status)}
                      <span>{getStatusText(item.status)}</span>
                    </div>
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                    {item.articleTitle}
                  </h3>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="outline" className={`text-xs px-1.5 py-0.5 h-5 ${getPlatformColor(item.platform)}`}>
                      {item.platform}
                    </Badge>
                    {item.publishedAt && (
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {typeof item.publishedAt === 'string' ? new Date(item.publishedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : item.publishedAt}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs border-border hover:border-primary/50" onClick={async () => { try { const r = await fetch(`/api/articles/by-id?id=${encodeURIComponent(item.articleId)}`); const j = await r.json(); if (j.success) { setPreviewArticle(j.data); setPreviewArticleOpen(true) } else { setNotice(j.error || '加载文章失败'); setTimeout(() => setNotice(''), 2000) } } catch { setNotice('加载文章失败'); setTimeout(() => setNotice(''), 2000) } }}>
                      <FileText className="h-3 w-3 mr-1.5" />
                      预览
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-border hover:border-primary/50" onClick={async () => { try { const r = await fetch(`/api/images?articleId=${encodeURIComponent(item.articleId)}`); const j = await r.json(); if (j.success) { setPreviewImages(j.data.images || []); setPreviewImagesOpen(true) } else { setNotice(j.error || '加载配图失败'); setTimeout(() => setNotice(''), 2000) } } catch { setNotice('加载配图失败'); setTimeout(() => setNotice(''), 2000) } }}>
                      <Image className="h-3 w-3 mr-1.5" />
                      配图
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { setDeleteTarget({ id: item.id }); setConfirmDeleteOpen(true) }}>
                      <XCircle className="h-3 w-3 mr-1.5" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Dialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>删除所选发布记录</DialogTitle>
            <DialogDescription>删除后不可恢复，确认删除？</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBatchConfirmOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                for (const id of selectedRecordIds) { try { await fetch(`/api/publish/records/${encodeURIComponent(id)}`, { method: 'DELETE' }) } catch { } }
                setQueue(prev => prev.filter((q: any) => !selectedRecordIds.includes(q.id)))
                setSelectedRecordIds([])
                setBatchConfirmOpen(false)
                setNotice('已删除所选')
                setTimeout(() => setNotice(''), 2000)
              } catch { setNotice('删除失败'); setTimeout(() => setNotice(''), 2000) }
            }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>发布到公众号</DialogTitle>
            <DialogDescription>选择公众号与发布类型，然后执行发布</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">选择公众号</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a: any) => (
                    <SelectItem key={a.wechatAppid} value={a.wechatAppid}>{a.name}（{a.type === 'subscription' ? '订阅号' : '服务号'}）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accounts.length === 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  未获取到授权公众号，请先在“公众号API配置”中保存密钥，或手动输入 AppID。
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>打开配置</Button>
                    {accountsError?.error && (
                      <span className="text-destructive">错误：{accountsError.error}{accountsError.code ? `（${accountsError.code}）` : ''}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-2">
                <Input value={customAppid} onChange={(e) => setCustomAppid(e.target.value)} placeholder="手动输入公众号AppID（可选）" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">发布类型</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-sm"><input type="radio" name="ptype" checked={publishType === 'news'} onChange={() => setPublishType('news')} />公众号文章</label>
                <label className="flex items-center gap-1 text-sm"><input type="radio" name="ptype" checked={publishType === 'newspic'} onChange={() => setPublishType('newspic')} />小绿书图文</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">选择文章</label>
              <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map((ar: any) => (
                    <SelectItem key={ar.id} value={ar.id}>{ar.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 items-center">
              {publishing && (
                <div className="flex-1 mr-4">
                  <div className="h-1 bg-secondary rounded">
                    <div className="h-1 bg-primary rounded transition-[width] duration-300" style={{ width: `${publishProgress}%` }}></div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">发布中… {publishProgress}%</div>
                </div>
              )}
              <Button variant="outline" onClick={() => { if (!publishing) setPublishOpen(false) }} disabled={publishing}>取消</Button>
              <Button disabled={publishing} onClick={async () => {
                const appid = selectedAccount || customAppid
                if (!appid || !selectedArticleId) { setNotice('请选择或输入公众号AppID，并选择文章'); setTimeout(() => setNotice(''), 3000); return }
                try {
                  setPublishing(true)
                  setPublishProgress(10)
                  const r = await fetch('/api/publish/wechat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: selectedArticleId, wechatAppid: appid, articleType: publishType, contentFormat: 'markdown' }) })
                  setPublishProgress(60)
                  const j = await r.json()
                  setPublishProgress(90)
                  if (j.success) { setPublishProgress(100); setNotice('发布成功'); setTimeout(() => setNotice(''), 3000); setPublishOpen(false); try { const at = articles.find((ar: any) => ar.id === selectedArticleId)?.title || '未命名文章'; setQueue(prev => ([{ id: String(Date.now()), articleTitle: at, platform: publishType === 'newspic' ? '小红书' : '公众号', status: 'success', publishedAt: new Date().toLocaleString('zh-CN'), platformId: appid }, ...prev])) } catch { } } else { setNotice(j.error || '发布失败'); setTimeout(() => setNotice(''), 3000) }
                } catch { setNotice('发布失败'); setTimeout(() => setNotice(''), 3000) }
                finally { setTimeout(() => { setPublishing(false); setPublishProgress(0) }, 400) }
              }}>发布</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={previewArticleOpen} onOpenChange={setPreviewArticleOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>预览文章</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-lg font-semibold">{previewArticle?.title || '—'}</div>
            <MarkdownViewer content={previewArticle?.content || ''} />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={previewImagesOpen} onOpenChange={setPreviewImagesOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>预览配图</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {previewImages.length === 0 ? (<div className="col-span-2 text-muted-foreground text-sm">暂无图片</div>) : previewImages.map((img: any) => (
              <img key={img.id || img.url} src={(() => { const raw = img.localPath || img.url; if (!raw) return ''; if (raw.startsWith('/uploads/') || raw.startsWith('/api/image-proxy')) return raw; try { const u = new URL(raw); const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString(); return `/api/image-proxy?url=${encodeURIComponent(href)}` } catch { return raw } })()} alt={img.alt || ''} className="w-full h-32 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>删除发布记录</DialogTitle>
            <DialogDescription>删除后不可恢复，确认删除？</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={async () => { if (!deleteTarget) return; try { const r = await fetch(`/api/publish/records/${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' }); const j = await r.json(); if (j.success) { setQueue(prev => prev.filter((q: any) => q.id !== deleteTarget.id)); setNotice('已删除'); setTimeout(() => setNotice(''), 2000) } else { setNotice(j.error || '删除失败'); setTimeout(() => setNotice(''), 2000) } } catch { setNotice('删除失败'); setTimeout(() => setNotice(''), 2000) } finally { setConfirmDeleteOpen(false); setDeleteTarget(null) } }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>公众号API配置</DialogTitle>
            <DialogDescription>配置密钥与接口地址，仅后端保存</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
              <Input value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="输入API密钥" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">API地址</label>
              <Input value={apiUrlInput} onChange={(e) => setApiUrlInput(e.target.value)} placeholder="https://wx.limyai.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfigOpen(false)}>取消</Button>
              <Button onClick={async () => { try { const r = await fetch('/api/publish/wechat/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: apiKeyInput, apiUrl: apiUrlInput }) }); const j = await r.json(); if (j.success) { setNotice('已保存公众号API配置'); setTimeout(() => setNotice(''), 3000); setConfigOpen(false); try { const r2 = await fetch('/api/publish/wechat/accounts'); const j2 = await r2.json(); if (j2.success) setAccounts(j2.data.accounts || []) } catch { } } else { setNotice(j.error || '保存失败'); setTimeout(() => setNotice(''), 3000) } } catch { setNotice('保存失败'); setTimeout(() => setNotice(''), 3000) } }}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {notice && (
        <div className="fixed inset-0 flex items-start justify-center mt-24 pointer-events-none z-[1000]"><div className="bg-foreground text-background text-sm px-4 py-2 rounded-full shadow">{notice}</div></div>
      )}
    </div>
  )
}

export default function PublishPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <PublishPageContent />
    </Suspense>
  )
}