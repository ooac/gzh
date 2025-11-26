'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import MarkdownViewer from '@/components/MarkdownViewer'
import ImageAPIConfigButton from '@/components/ImageAPIConfigButton'
import {
  FileText,
  Eye,
  ThumbsUp,
  Calendar,
  Search,
  Edit,
  Trash2,
  Send,
  Grid,
  List,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  Download,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<any[]>([])
  const [currentArticle, setCurrentArticle] = useState<any | null>(null)
  const router = useRouter()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [statusFilterValue, setStatusFilterValue] = useState('all')
  const [platformFilterValue, setPlatformFilterValue] = useState('all')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmArticle, setConfirmArticle] = useState<any | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountsError, setAccountsError] = useState<{ error?: string; code?: string } | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [customAppid, setCustomAppid] = useState('')
  const [publishType, setPublishType] = useState<'news' | 'newspic'>('news')
  const [selectedArticleId, setSelectedArticleId] = useState<string>('')
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [previewArticleOpen, setPreviewArticleOpen] = useState(false)
  const [previewArticle, setPreviewArticle] = useState<any | null>(null)
  const [imagesOpen, setImagesOpen] = useState(false)
  const [images, setImages] = useState<any[]>([])
  const [imagesTotal, setImagesTotal] = useState(0)
  const [imagesQuery, setImagesQuery] = useState('')
  const [imagesUsed, setImagesUsed] = useState<'ALL' | 'USED' | 'UNUSED'>('ALL')
  const [imagesLoading, setImagesLoading] = useState(false)
  const [imageDeleteTarget, setImageDeleteTarget] = useState<any | null>(null)
  const [imageDeleteConfirmOpen, setImageDeleteConfirmOpen] = useState(false)
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
  const [batchImagesConfirmOpen, setBatchImagesConfirmOpen] = useState(false)
  const [imagesPage, setImagesPage] = useState(1)
  const [imagesLimit, setImagesLimit] = useState(20)

  const downloadImage = async (img: any) => {
    try {
      const src = img.localPath ? (typeof window !== 'undefined' ? window.location.origin + img.localPath : img.localPath) : (img.url ? `/api/image-proxy?url=${encodeURIComponent(img.url)}` : '')
      if (!src) return
      const r = await fetch(src)
      const b = await r.blob()
      const ext = b.type.includes('png') ? 'png' : b.type.includes('webp') ? 'webp' : 'jpg'
      const base = (img.localPath && img.localPath.split('/').pop()) || (img.alt || '').replace(/\s+/g, '_') || img.id || String(Date.now())
      const name = base.endsWith(`.${ext}`) ? base : `${base}.${ext}`
      const a = document.createElement('a')
      const url = URL.createObjectURL(b)
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setNotice('已开始下载')
      setTimeout(() => setNotice(''), 2000)
    } catch { setNotice('下载失败'); setTimeout(() => setNotice(''), 2000) }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const qs = new URLSearchParams()
        qs.set('limit', '50')
        if (searchKeyword.trim()) qs.set('keyword', searchKeyword.trim())
        if (statusFilter) qs.set('status', statusFilter)
        const res = await fetch(`/api/articles?${qs.toString()}`)
        const json = await res.json()
        if (json.success) {
          setArticles(json.data.articles || [])
        } else {
          setNotice(json.error || '加载失败')
          setTimeout(() => setNotice(''), 3000)
        }
      } catch {
        setNotice('加载失败')
        setTimeout(() => setNotice(''), 3000)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [searchKeyword, statusFilter])

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

  const loadImages = async (page?: number, limit?: number) => {
    const currentPage = page ?? imagesPage
    const currentLimit = limit ?? imagesLimit
    try {
      setImagesLoading(true)
      const r = await fetch(`/api/images/list?page=${currentPage}&limit=${currentLimit}&used=${imagesUsed}&query=${encodeURIComponent(imagesQuery)}`)
      const j = await r.json()
      if (j.success) {
        setImages(j.data.images || [])
        setImagesTotal(j.data.total || 0)
        setImagesPage(currentPage)
      }
    } catch { } finally { setImagesLoading(false) }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已发布':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case '草稿':
        return 'bg-muted text-muted-foreground border-border'
      case '待发布':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const statusText = (s: string | undefined) => {
    if (s === 'PUBLISHED') return '已发布'
    if (s === 'PENDING') return '待发布'
    if (s === 'DRAFT') return '草稿'
    return '草稿'
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case '公众号':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case '小红书':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
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

  const getArticleImage = (article: any) => {
    // 优先使用封面图
    if (article.coverImage?.url) {
      const url = article.coverImage.url
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
    if (article.content) {
      const images = parseImageUrls(article.content)
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
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {notice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-foreground text-background text-sm px-6 py-3 rounded-full shadow-md border border-border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-background"></div>
            {notice}
          </div>
        </div>
      )}

      {/* 页面标题区域 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            文章管理
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground"></span>
            管理您的所有文章内容，支持多平台发布
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/create?tab=rewrite')} className="shadow-sm">
            <FileText className="mr-2 h-4 w-4" />
            创建新文章
          </Button>
          <Button variant="outline" onClick={async () => { setImagesOpen(true); await loadImages() }}>
            <ImageIcon className="mr-2 h-4 w-4" />
            图库
          </Button>
          <ImageAPIConfigButton />
        </div>
      </div>

      {/* 搜索和筛选控制台 */}
      <div className="bg-card p-1 rounded-xl border border-border shadow-sm">
        <div className="bg-muted/50 rounded-lg p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                placeholder="搜索文章标题..."
                className="pl-9 bg-background border-input focus:border-ring focus:ring-ring transition-all"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e: any) => { if (e.key === 'Enter') setSearchKeyword(searchKeyword.trim()) }}
              />
            </div>
            <Button variant="secondary" onClick={() => setSearchKeyword(searchKeyword.trim())}>
              搜索
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            <Select value={statusFilterValue} onValueChange={(v) => { setStatusFilterValue(v); setStatusFilter(v === 'all' ? '' : v) }}>
              <SelectTrigger className="w-[120px] bg-background border-input">
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="草稿">草稿</SelectItem>
                <SelectItem value="待发布">待发布</SelectItem>
                <SelectItem value="已发布">已发布</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilterValue} onValueChange={setPlatformFilterValue}>
              <SelectTrigger className="w-[120px] bg-background border-input">
                <SelectValue placeholder="所有平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有平台</SelectItem>
                <SelectItem value="wechat">公众号</SelectItem>
                <SelectItem value="xiaohongshu">小红书</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground"></span>
              <span className="text-xs text-muted-foreground font-medium">共 {articles.length} 篇</span>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground border border-primary rounded-full animate-fade-in">
                <span className="text-xs font-medium">已选 {selectedIds.length} 项</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { const all = articles.map((a: any) => a.id); setSelectedIds(selectedIds.length === articles.length ? [] : all) }}>
              全选
            </Button>
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setBatchConfirmOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1" />
                删除所选
              </Button>
            )}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-xl bg-card/40 border border-border/50 animate-pulse"></div>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-xl bg-card/20">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">暂无文章</h3>
            <p className="text-muted-foreground/80 mt-1 max-w-sm">
              开始创作您的第一篇文章，或者尝试调整筛选条件
            </p>
            <Button className="mt-6" onClick={() => router.push('/create?tab=rewrite')}>
              立即创作
            </Button>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card key={article.id} className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md ${selectedIds.includes(article.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 pointer-events-none z-10" />

                {/* 封面图背景 */}
                <div className="h-48 w-full bg-muted relative overflow-hidden border-b border-border">
                  {(() => {
                    const imageUrl = getArticleImage(article)
                    return imageUrl ? (
                      <img src={imageUrl} alt="封面" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )
                  })()}
                  <div className="absolute top-3 left-3 z-20">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-input bg-background text-primary focus:ring-ring cursor-pointer"
                      checked={selectedIds.includes(article.id)}
                      onChange={(e) => { const id = article.id; setSelectedIds(prev => e.target.checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id)) }}
                    />
                  </div>
                  <div className="absolute top-3 right-3 z-20">
                    <Badge variant="outline" className={`${getStatusColor(statusText(article.status))} backdrop-blur-md shadow-lg`}>
                      {statusText(article.status)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <div className="">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1 mb-2 group-hover:text-muted-foreground transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10 leading-relaxed">
                      {article.summary || '暂无摘要...'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 border-b border-border pb-3">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-3">
                        {article.readCount > 0 && (
                          <div className="flex items-center text-muted-foreground">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.readCount}
                          </div>
                        )}
                        {article.likeCount > 0 && (
                          <div className="flex items-center text-muted-foreground">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {article.likeCount}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {(article.platform || []).map((p: string) => (
                        <Badge key={p} variant="outline" className={`text-xs px-1.5 py-0.5 h-5 ${getPlatformColor(p)}`}>
                          {p}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs border-input hover:border-accent" onClick={() => router.push(`/create?tab=rewrite&articleId=${article.id}`)}>
                        <Edit className="h-3 w-3 mr-1.5" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setSelectedArticleId(article.id); setPublishOpen(true) }}>
                        <Send className="h-3 w-3 mr-1.5" />
                        发布
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={async () => {
                        try {
                          const r = await fetch(`/api/articles/${article.id}`)
                          const j = await r.json()
                          if (j.success) { setPreviewArticle(j.data); setPreviewArticleOpen(true) }
                          else { setNotice(j.error || '加载文章失败'); setTimeout(() => setNotice(''), 2000) }
                        } catch { setNotice('加载文章失败'); setTimeout(() => setNotice(''), 2000) }
                      }}>
                        预览
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { setConfirmArticle(article); setConfirmOpen(true) }}>
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between border-t border-border/50 pt-6">
        <p className="text-sm text-muted-foreground">
          显示 {articles.length} 条记录
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled className="text-muted-foreground">
            上一页
          </Button>
          <Button variant="outline" size="sm" disabled className="text-muted-foreground">
            下一页
          </Button>
        </div>
      </div>

      {/* 弹窗组件保持原有逻辑，但样式会自动继承全局深色主题 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">文章配图预览</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {previewImages.map((img: any, idx: number) => (
              <div key={img.id || idx} className="border border-border rounded p-2 bg-muted/50">
                <img src={(() => { try { const u = new URL(img.url); const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString(); return `/api/image-proxy?url=${encodeURIComponent(href)}` } catch { return img.url } })()} alt={img.alt || ''} className="w-full h-32 object-cover rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                <div className="flex justify-between mt-2">
                  {img.id && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={async () => {
                      try {
                        const r = await fetch(`/api/articles/${currentArticle?.id}/cover`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId: img.id }) })
                        const j = await r.json()
                        if (j.success) {
                          setNotice('封面已更新')
                          setTimeout(() => setNotice(''), 3000)
                          setArticles(prev => prev.map(a => a.id === currentArticle?.id ? { ...a, coverImage: { url: img.url } } : a))
                        } else {
                          setNotice(j.error || '设置封面失败')
                          setTimeout(() => setNotice(''), 3000)
                        }
                      } catch {
                        setNotice('设置封面失败')
                        setTimeout(() => setNotice(''), 3000)
                      }
                    }}>设为封面</Button>
                  )}
                  {img.id && (
                    <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={async () => {
                      try {
                        const r = await fetch(`/api/images/${img.id}`, { method: 'DELETE' })
                        const j = await r.json()
                        if (j.success) setPreviewImages((prev: any[]) => prev.filter(i => i.id !== img.id))
                      } catch { }
                    }}>删除</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={imagesOpen} onOpenChange={setImagesOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col bg-background border-border">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-foreground">全部图片</DialogTitle>
            <DialogDescription className="text-muted-foreground">查看与管理所有生成的图片</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
            <span className="text-sm text-muted-foreground">共 {imagesTotal} 张</span>
            <span className="text-sm text-muted-foreground">已选 {selectedImageIds.length} 张</span>
            <Input className="w-48 bg-background border-input" value={imagesQuery} onChange={(e) => setImagesQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setImagesPage(1); loadImages(1) } }} placeholder="搜索图片" />
            <Select value={imagesUsed} onValueChange={(v: any) => { setImagesUsed(v); setImagesPage(1); loadImages(1) }}>
              <SelectTrigger className="w-[100px] bg-background border-input">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value="USED">已引用</SelectItem>
                <SelectItem value="UNUSED">未引用</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => loadImages()}>
              <RefreshCw className="h-3 w-3 mr-1" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const all = images.map((x: any) => x.id)
              setSelectedImageIds(selectedImageIds.length === images.length ? [] : all)
            }}>全选/取消</Button>
            <Button variant="destructive" size="sm" onClick={() => { if (selectedImageIds.length === 0) return; setBatchImagesConfirmOpen(true) }}>删除已选</Button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {imagesLoading ? (
              <div className="text-sm text-muted-foreground text-center py-8">加载中...</div>
            ) : images.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">暂无图片</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {images.map((img: any) => (
                  <div key={img.id} className="border border-border rounded overflow-hidden bg-card">
                    <div className="relative group">
                      <input
                        type="checkbox"
                        className="absolute top-2 left-2 w-5 h-5 cursor-pointer z-10 accent-primary rounded border-input bg-background/80"
                        checked={selectedImageIds.includes(img.id)}
                        onChange={(e) => {
                          const id = img.id
                          setSelectedImageIds(prev => e.target.checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
                        }}
                      />
                      <img
                        src={(() => {
                          const raw = img.localPath || img.url
                          if (!raw) return ''
                          if (raw.startsWith('/uploads/') || raw.startsWith('/api/image-proxy')) return raw
                          try {
                            const u = new URL(raw)
                            const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString()
                            return `/api/image-proxy?url=${encodeURIComponent(href)}`
                          } catch { return raw }
                        })()}
                        alt={img.alt || ''}
                        className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-white/10 transition-colors pointer-events-none" />
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="text-xs text-muted-foreground truncate">生成:{img.createdAt ? new Date(img.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                      {img.articleId ? (
                        <div className="text-xs text-foreground truncate" title={img.articleTitle || img.articleId}>已引用:{img.articleTitle || img.articleId}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">未引用</div>
                      )}
                      <div className="flex items-center gap-1 pt-1">
                        <Button variant="destructive" size="sm" className="flex-1 h-6 text-[10px]" onClick={() => { setImageDeleteTarget(img); setImageDeleteConfirmOpen(true) }}>删除</Button>
                        <Button variant="outline" size="sm" className="flex-1 h-6 text-[10px] border-border" onClick={() => downloadImage(img)}>下载</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              第 {imagesPage} 页，共 {Math.ceil(imagesTotal / imagesLimit)} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={imagesPage <= 1}
                onClick={() => loadImages(imagesPage - 1)}
                className="border-border"
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={imagesPage >= Math.ceil(imagesTotal / imagesLimit)}
                onClick={() => loadImages(imagesPage + 1)}
                className="border-border"
              >
                下一页
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchImagesConfirmOpen} onOpenChange={setBatchImagesConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">删除所选图片</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {(() => { const refs = images.filter((x: any) => selectedImageIds.includes(x.id) && x.articleId); const refCount = refs.length; return refCount > 0 ? `所选中有 ${refCount} 张已被文章引用（例如：${refs.slice(0, 3).map(r => r.articleTitle || r.articleId).join('、')}${refs.length > 3 ? '…' : ''}）。删除将清理对应文章中的图片引用。确认删除？` : '删除后不可恢复，确认删除？' })()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBatchImagesConfirmOpen(false)} className="border-border">取消</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                const ids = [...selectedImageIds]
                for (const id of ids) { try { await fetch(`/api/images/${encodeURIComponent(id)}`, { method: 'DELETE' }) } catch { } }
                setImages(prev => prev.filter((x: any) => !ids.includes(x.id)))
                setImagesTotal(prev => Math.max(0, prev - ids.length))
                setSelectedImageIds([])
                setBatchImagesConfirmOpen(false)
                setNotice('已删除所选图片')
                setTimeout(() => setNotice(''), 2000)
              } catch { setNotice('删除失败'); setTimeout(() => setNotice(''), 2000) }
            }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDeleteConfirmOpen} onOpenChange={setImageDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">删除图片</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {imageDeleteTarget?.articleId ? `该图片被文章《${imageDeleteTarget.articleTitle || imageDeleteTarget.articleId}》引用，删除将导致该文章图片缺失。确认删除？` : '删除后不可恢复，确认删除？'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImageDeleteConfirmOpen(false)} className="border-border">取消</Button>
            <Button variant="destructive" onClick={async () => {
              if (!imageDeleteTarget) return
              try {
                const r = await fetch(`/api/images/${encodeURIComponent(imageDeleteTarget.id)}`, { method: 'DELETE' })
                const j = await r.json()
                if (j.success) {
                  setImages(prev => prev.filter((x: any) => x.id !== imageDeleteTarget.id))
                  setImagesTotal(prev => Math.max(0, prev - 1))
                  setImageDeleteConfirmOpen(false)
                  setImageDeleteTarget(null)
                  setNotice('已删除图片')
                  setTimeout(() => setNotice(''), 2000)
                } else {
                  setNotice(j.error || '删除失败')
                  setTimeout(() => setNotice(''), 2000)
                }
              } catch { setNotice('删除失败'); setTimeout(() => setNotice(''), 2000) }
            }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <DialogContent className="sm:max-w-[360px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">删除所选文章</DialogTitle>
            <DialogDescription className="text-muted-foreground">删除后不可恢复，确认删除？</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBatchConfirmOpen(false)} className="border-border">取消</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                for (const id of selectedIds) { try { await fetch(`/api/articles/${encodeURIComponent(id)}`, { method: 'DELETE' }) } catch { } }
                setArticles(prev => prev.filter((a: any) => !selectedIds.includes(a.id)))
                setSelectedIds([])
                setBatchConfirmOpen(false)
                setNotice('已删除所选')
                setTimeout(() => setNotice(''), 2000)
              } catch { setNotice('删除失败'); setTimeout(() => setNotice(''), 2000) }
            }}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-[560px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">发布到公众号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">选择公众号</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-full bg-background border-input">
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
                  未获取到授权公众号，请先在“发布管理→公众号API配置”中保存密钥，或手动输入 AppID。
                  {accountsError?.error && (<div className="mt-1 text-red-400">错误：{accountsError.error}{accountsError.code ? `（${accountsError.code}）` : ''}</div>)}
                </div>
              )}
              <div className="mt-2">
                <Input value={customAppid} onChange={(e) => setCustomAppid(e.target.value)} placeholder="手动输入公众号AppID（可选）" className="bg-background border-input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">发布类型</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-sm text-muted-foreground"><input type="radio" name="ptype_articles" checked={publishType === 'news'} onChange={() => setPublishType('news')} className="accent-primary" />公众号文章</label>
                <label className="flex items-center gap-1 text-sm text-muted-foreground"><input type="radio" name="ptype_articles" checked={publishType === 'newspic'} onChange={() => setPublishType('newspic')} className="accent-primary" />小绿书图文</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">当前文章</label>
              <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
                <SelectTrigger className="w-full bg-background border-input">
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
                  <div className="h-1 bg-muted rounded"><div className="h-1 bg-primary rounded transition-[width] duration-300" style={{ width: `${publishProgress}%` }}></div></div>
                  <div className="mt-1 text-xs text-foreground">发布中… {publishProgress}%</div>
                </div>
              )}
              <Button variant="outline" onClick={() => { if (!publishing) setPublishOpen(false) }} disabled={publishing} className="border-border">取消</Button>
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
                  if (j.success) {
                    setPublishProgress(100)
                    setNotice('发布成功')
                    setTimeout(() => setNotice(''), 3000)
                    setPublishOpen(false)
                    setArticles(prev => prev.map(a => a.id === selectedArticleId ? { ...a, status: 'PUBLISHED', platform: Array.isArray(a.platform) ? Array.from(new Set([...a.platform, publishType === 'newspic' ? '小红书' : '公众号'])) : [publishType === 'newspic' ? '小红书' : '公众号'] } : a))
                  } else {
                    setNotice(j.error || '发布失败')
                    setTimeout(() => setNotice(''), 3000)
                  }
                } catch {
                  setNotice('发布失败')
                  setTimeout(() => setNotice(''), 3000)
                } finally {
                  setTimeout(() => { setPublishing(false); setPublishProgress(0) }, 400)
                }
              }}>发布</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[360px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">删除文章</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">确定删除该文章？此操作不可恢复。</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="border-border">取消</Button>
            <Button variant="destructive" onClick={async () => {
              if (!confirmArticle) { setConfirmOpen(false); return }
              try {
                const r = await fetch(`/api/articles/${confirmArticle.id}`, { method: 'DELETE' })
                const j = await r.json()
                if (j.success) {
                  setArticles(prev => prev.filter(a => a.id !== confirmArticle.id))
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
      <Dialog open={previewArticleOpen} onOpenChange={setPreviewArticleOpen}>
        <DialogContent className="sm:max-w-[800px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">预览文章</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">{previewArticle?.title || '—'}</div>
            <MarkdownViewer content={previewArticle?.content || ''} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
