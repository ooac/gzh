'use client'

import { useEffect, useMemo, useState, useRef, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Wand2,
  FileText,
  Image as ImageIcon,
  Save,
  Eye,
  Send,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  SplitSquareHorizontal
} from 'lucide-react'
import LLMModelSelector from '@/components/LLMModelSelector'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import ImageAPIConfigButton from '@/components/ImageAPIConfigButton'
import ImagePromptEditorButton from '@/components/ImagePromptEditorButton'
import MarkdownViewer from '@/components/MarkdownViewer'
import { mdToHtml } from '@/lib/markdown-theme'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import ThemeIcon from '@/components/ThemeIcon'
import { useRouter, useSearchParams } from 'next/navigation'

function CreatePageContent() {
  const [activeTab, setActiveTab] = useState<'fromReport' | 'rewrite' | 'custom'>('fromReport')
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('专业')
  const [length, setLength] = useState('medium')
  const [reports, setReports] = useState<any[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string>('')
  const [reportMaterials, setReportMaterials] = useState<any[]>([])
  const [reportInsights, setReportInsights] = useState<string[]>([])
  const [rewriteSourceUrl, setRewriteSourceUrl] = useState('')
  const [rewriteSourceContent, setRewriteSourceContent] = useState('')
  const [rewriteMarkdownFile, setRewriteMarkdownFile] = useState<File | null>(null)
  const [rewriteLength, setRewriteLength] = useState('unlimited')
  const [customTopic, setCustomTopic] = useState('')
  const [customStyle, setCustomStyle] = useState('公众号专业科普')
  const [customLength, setCustomLength] = useState('unlimited')
  const defaultReportPrompt = useMemo(() => (
    `请基于提供的主题、洞察摘要与Top5素材，生成“可直接发布”的完整中文公众号文章。具体要求：
1) 风格与质量：专业但亲和，语言简体中文；原创表达，不抄袭，不输出JSON或代码块，不出现无意义文本。
2) 结构：标题→导语(100–150字)→正文三段(每段有小标题)→金句(20–40字)→总结(100–150字)→CTA。
3) 就地引用：在正文相关位置使用“【来源】标题｜观点要点｜证据链接(如有)”进行引用，至少2处，不要集中堆在文末。
4) 排版：使用合适的标题、列表与加粗，避免emoji，全文不少于1200字。
5) 审稿自检：避免空话与重复；段落逻辑清晰；所有事实有出处或合理推断。`
  ), [])
  const defaultRewritePrompt = useMemo(() => (
    '在保证事实准确与原创表达的前提下，对给定文章进行自由改写与优化；语言为简体中文，输出为Markdown；如有来源可就地引用；不强制使用固定结构，由你根据内容与提示词自行组织。'
  ), [])
  const defaultCustomPrompt = useMemo(() => (
    '与我协作撰写公众号文章：先提出3个澄清问题与一个初步大纲；确认后依据大纲生成初稿；支持继续润色、补充证据与调整风格。'
  ), [])
  const [reportPrompt, setReportPrompt] = useState(defaultReportPrompt)
  const [rewritePrompt, setRewritePrompt] = useState(defaultRewritePrompt)
  const [customPrompt, setCustomPrompt] = useState(defaultCustomPrompt)
  const [promptEditorOpen, setPromptEditorOpen] = useState(false)
  const [promptEditorMode, setPromptEditorMode] = useState<'fromReport' | 'rewrite' | 'custom'>('fromReport')
  const [promptDraft, setPromptDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [selectedImages, setSelectedImages] = useState<any[]>([])
  const [imageList, setImageList] = useState<any[]>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [imageGenCount, setImageGenCount] = useState(3)
  const [segInsert, setSegInsert] = useState(true)
  const [generatedPrompts, setGeneratedPrompts] = useState<any[]>([])
  const [imagePromptTpl, setImagePromptTpl] = useState('')
  const [imageStyle, setImageStyle] = useState('插画风格')
  const [imageRatio, setImageRatio] = useState('2.35:1')
  const [tailFromReport, setTailFromReport] = useState(true)
  const [tailRewrite, setTailRewrite] = useState(true)
  const [tailCustom, setTailCustom] = useState(true)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ start: number; end: number } | null>(null)
  const [notice, setNotice] = useState('')
  const editorRef = useMemo(() => ({ current: null as any }), [])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read')
  const [showEditPreview, setShowEditPreview] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showInsertImageDialog, setShowInsertImageDialog] = useState(false)
  const [insertCandidates, setInsertCandidates] = useState<any[]>([])
  const [pendingReveal, setPendingReveal] = useState(false)
  const [revealCenter, setRevealCenter] = useState(true)
  const [toolbarTop, setToolbarTop] = useState<number>(80)
  const tabsRef = useRef<HTMLDivElement | null>(null)
  const [hasLocalDraft, setHasLocalDraft] = useState(false)
  const storageKeyDraft = 'compose_draft'
  const [lastArticleId, setLastArticleId] = useState<string | null>(null)
  const [publishOpen, setPublishOpen] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountsError, setAccountsError] = useState<{ error?: string; code?: string } | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [customAppid, setCustomAppid] = useState('')
  const [publishType, setPublishType] = useState<'news' | 'newspic'>('news')
  const [publishing, setPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const [publishError, setPublishError] = useState('')
  const [publishPreview, setPublishPreview] = useState<any>(null)
  const [showAllImagesDialog, setShowAllImagesDialog] = useState(false)
  const [allImages, setAllImages] = useState<any[]>([])
  const [selectedAllImageIds, setSelectedAllImageIds] = useState<string[]>([])
  const [allImagesLoading, setAllImagesLoading] = useState(false)
  const prevWindowScrollRef = useRef<number | undefined>(undefined)
  const [themeOpen, setThemeOpen] = useState(false)
  const [themes, setThemes] = useState<Array<{ id: string; title: string; description?: string }>>([])
  const [selectedTheme, setSelectedTheme] = useState<string | null>('default-theme')
  const defaultThemes = useMemo(() => ([{
    id: 'default-theme',
    title: '系统默认',
    description: '跟随系统深浅色模式，无额外样式',
    template: []
  }, {
    id: 'hammer-theme',
    title: '极简黑',
    description: 'Markdown 结构模板，可用于任意文章',
    template: [
      '# 公众号 Markdown 编辑器',
      '',
      '欢迎使用这款专为**微信公众号**设计的 Markdown 编辑器！✨',
      '',
      '## 🎯 核心功能',
      '',
      '### 1. 智能图片处理',
      '',
      '- **粘贴即用**：支持从任何地方复制粘贴图片（截图、浏览器、文件管理器）',
      '- **自动压缩**：图片自动压缩，平均压缩 50%-80%',
      '- **本地存储**：使用 IndexedDB 持久化，刷新不丢失',
      '- **编辑流畅**：编辑器中使用短链接，告别卡顿',
      '',
      '### 2. 多图排版展示',
      '',
      '支持朋友圈式的多图网格布局，2-3 列自动排版：',
      '',
      '### 3. 13 种精美样式',
      '',
      '1. **经典公众号系列**：默认、技术、优雅、深度阅读',
      '2. **传统媒体系列**：杂志、纽约时报、金融时报、Jony Ive',
      '3. **现代数字系列**：Wired、Medium、Apple、Claude、AI Coder',
      '',
      '### 4. 一键复制',
      '',
      '点击「复制到公众号」按钮，直接粘贴到公众号后台，格式完美保留！',
      '',
      '## 💻 代码示例',
      '',
      '```javascript',
      '// 图片自动压缩并存储到 IndexedDB',
      'const compressedBlob = await imageCompressor.compress(file);',
      'await imageStore.saveImage(imageId, compressedBlob);',
      '',
      '// 编辑器中插入短链接',
      'const markdown = `![图片](img://${imageId})`;',
      '```',
      '',
      '## 📖 引用样式',
      '',
      '> 这是一段引用文字，展示编辑器的引用样式效果。',
      '> 不同的样式主题会有不同的引用样式，试试切换样式看看效果！',
      '',
      '## 📊 表格支持',
      '',
      '| 功能 | 支持情况 | 说明 |',
      '| --- | --- | --- |',
      '| 图片粘贴 | ✅ | 100% 成功率 |',
      '| 刷新保留 | ✅ | IndexedDB 存储 |',
      '| 样式主题 | ✅ | 13 种精选样式 |',
      '| 代码高亮 | ✅ | 多语言支持 |',
      '',
      '---',
      '',
      '**💡 提示**：',
      '- 试着切换不同的样式主题，体验各种风格的排版效果',
      '- 粘贴图片试试智能压缩功能',
      '- 刷新页面看看内容是否保留',
      '',
      '**🌟 开源项目**：如果觉得有用，欢迎访问 [GitHub 仓库](https://github.com/alchaincyf/huasheng_editor) 给个 Star！'
    ].join('\n')
  }, {
    id: 'hammer-beige-theme',
    title: '锤子主题',
    description: '经典的锤子便签风格，米色背景与优雅排版',
    template: []
  }, {
    id: 'fresh-green-theme',
    title: '嫩清',
    description: '清新风格，青绿色强调，适合科技和生活类文章',
    template: []
  }, {
    id: 'dark-theme',
    title: '深邃黑',
    description: '极致深色体验，高对比度，适合夜间阅读与专业展示',
    template: []
  }, {
    id: 'aurora-theme',
    title: '极光紫',
    description: '神秘优雅的深紫色调，搭配极光般的渐变点缀',
    template: []
  }]), [])

  // 主题ID到标准主题名称的映射
  const themeIdToName = (id: string | null): string => {
    if (!id) return 'default' // 默认主题

    const mapping: Record<string, string> = {
      'default-theme': 'default',
      'hammer-theme': 'hammer',
      'hammer-beige-theme': 'hammer-beige',
      'fresh-green-theme': 'fresh-green',
      'dark-theme': 'dark',
      'aurora-theme': 'aurora'
    }

    return mapping[id] || 'default'
  }

  useEffect(() => {
    const loadAllImages = async () => {
      try {
        setAllImagesLoading(true)
        const r = await fetch('/api/images/list?take=100')
        const j = await r.json()
        if (j.success) { setAllImages(j.data?.images || []) }
      } catch { }
      finally { setAllImagesLoading(false) }
    }
    if (showAllImagesDialog) loadAllImages()
  }, [showAllImagesDialog])

  useEffect(() => {
    const initThemes = async () => {
      const saved = (typeof window !== 'undefined') ? window.localStorage.getItem('compose_theme') : null
      let list = defaultThemes
      try {
        const r = await fetch('/api/themes')
        const j = await r.json()
        if (j.success && Array.isArray(j.data)) list = [...defaultThemes, ...j.data]
      } catch { }
      setThemes(list)
      const next = saved || (list[0]?.id || null)
      if (next) {
        setSelectedTheme(next)
        try { if (typeof window !== 'undefined') window.localStorage.setItem('compose_theme', next) } catch { }
      }
    }
    initThemes()
  }, [])

  const resetToDefaultPrompt = (mode: 'fromReport' | 'rewrite' | 'custom') => {
    if (mode === 'fromReport') { setReportPrompt(defaultReportPrompt); setPromptDraft(defaultReportPrompt) }
    if (mode === 'rewrite') { setRewritePrompt(defaultRewritePrompt); setPromptDraft(defaultRewritePrompt) }
    if (mode === 'custom') { setCustomPrompt(defaultCustomPrompt); setPromptDraft(defaultCustomPrompt) }
    setNotice('已恢复默认提示词')
    setTimeout(() => setNotice(''), 1500)
  }

  const loadSavedPrompt = async (mode: 'fromReport' | 'rewrite' | 'custom', keyword?: string | null) => {
    try {
      const typeMap = { fromReport: 'compose_from_report', rewrite: 'rewrite_article', custom: 'custom_chat' } as const
      const params = new URLSearchParams()
      params.set('type', typeMap[mode])
      if (keyword) params.set('keyword', keyword)
      const r = await fetch(`/api/prompts?${params.toString()}`)
      const j = await r.json()
      if (j.success && Array.isArray(j.data) && j.data.length > 0) {
        const content = j.data[0].content || ''
        if (mode === 'fromReport') setReportPrompt(content)
        if (mode === 'rewrite') setRewritePrompt(content)
        if (mode === 'custom') setCustomPrompt(content)
      }
    } catch { }
  }

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
    try {
      const s = typeof window !== 'undefined' ? window.localStorage.getItem(storageKeyDraft) : null
      if (s) {
        const obj = JSON.parse(s)
        if (obj && typeof obj.content === 'string') {
          setEditedTitle(obj.title || '')
          setEditedContent(obj.content || '')
          setHasLocalDraft(true)
        }
      }
    } catch { }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadLatestFromDB = async () => {
      if (hasLocalDraft || editedContent) return
      try {
        const res = await fetch('/api/articles?limit=1&sortBy=updatedAt&sortOrder=desc')
        const json = await res.json()
        if (cancelled) return
        // 再次检查本地是否已有草稿，避免覆盖最新插入
        try {
          const s = typeof window !== 'undefined' ? window.localStorage.getItem(storageKeyDraft) : null
          if (s || hasLocalDraft) return
        } catch { }
        if (json.success && json.data.articles && json.data.articles.length > 0) {
          const a = json.data.articles[0]
          setEditedTitle(a.title || '')
          setEditedContent(a.content || '')
          setLastArticleId(a.id || null)
          try {
            const ps = a.imagePrompts ? (typeof a.imagePrompts === 'string' ? JSON.parse(a.imagePrompts) : a.imagePrompts) : []
            if (Array.isArray(ps) && ps.length > 0) setGeneratedPrompts(ps)
          } catch { }
        }
      } catch { }
    }
    loadLatestFromDB()
    return () => { cancelled = true }
  }, [hasLocalDraft])

  useEffect(() => {
    const loadTpl = async () => {
      try {
        const r = await fetch('/api/image-prompt-template')
        const j = await r.json()
        if (j.success && j.data) setImagePromptTpl(j.data.content || '')
      } catch { }
    }
    loadTpl()
  }, [])

  useEffect(() => {
    try {
      const s = typeof window !== 'undefined' ? window.localStorage.getItem('image_style') : null
      const r = typeof window !== 'undefined' ? window.localStorage.getItem('image_ratio') : null
      if (s) setImageStyle(s)
      if (r) setImageRatio(r)
    } catch { }
  }, [])

  useEffect(() => {
    const loadTailPref = async () => {
      try {
        for (const mode of ['fromReport', 'rewrite', 'custom'] as const) {
          const res = await fetch(`/api/compose-preferences?mode=${mode}`)
          const j = await res.json()
          if (j.success) {
            if (mode === 'fromReport') setTailFromReport(!!j.data.tailEnabled)
            if (mode === 'rewrite') setTailRewrite(!!j.data.tailEnabled)
            if (mode === 'custom') setTailCustom(!!j.data.tailEnabled)
          }
        }
      } catch { }
    }
    loadTailPref()
  }, [])

  const setTailEnabled = async (mode: 'fromReport' | 'rewrite' | 'custom', val: boolean) => {
    try { await fetch('/api/compose-preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, tailEnabled: val }) }) } catch { }
    if (mode === 'fromReport') setTailFromReport(val)
    if (mode === 'rewrite') setTailRewrite(val)
    if (mode === 'custom') setTailCustom(val)
  }

  const handleSaveDraft = () => {
    try {
      const obj = { title: editedTitle, content: editedContent, mode: activeTab, updatedAt: Date.now() }
      if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify(obj))
      setNotice('草稿已保存')
      setTimeout(() => setNotice(''), 2000)
    } catch { }
  }

  const applyWrap = (pre: string, post: string) => {
    const el = contentRef.current
    if (!el) return
    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const selected = editedContent.slice(start, end)
    const before = editedContent.slice(0, start)
    const after = editedContent.slice(end)
    const next = `${before}${pre}${selected || ''}${post}${after}`
    setEditedContent(next)
    setTimeout(() => { try { el.focus(); el.selectionStart = start + pre.length; el.selectionEnd = start + pre.length + (selected || '').length } catch { } }, 0)
  }

  const applyLinePrefix = (prefix: string) => {
    const el = contentRef.current
    if (!el) return
    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const before = editedContent.slice(0, start)
    const selected = editedContent.slice(start, end)
    const after = editedContent.slice(end)
    const target = selected || ''
    const lines = target.split(/\n/)
    const processed = lines.map(l => `${prefix}${l.replace(/^\s*/, '')}`).join('\n')
    const next = `${before}${processed}${after}`
    setEditedContent(next)
    setTimeout(() => { try { el.focus(); el.selectionStart = start; el.selectionEnd = start + processed.length } catch { } }, 0)
  }

  const clearAllImages = () => {
    setEditedContent(prev => prev.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, ''))
  }

  const clearImagePanel = () => {
    setImageList([])
    setSelectedImages([])
    try { if (typeof window !== 'undefined') { window.localStorage.setItem('compose_images', JSON.stringify([])); window.localStorage.setItem('compose_images_cleared', '1') } } catch { }
    setNotice('已清空图片素材区域（不影响正文与文章管理）')
    setTimeout(() => setNotice(''), 2000)
  }

  useEffect(() => {
    const computeTop = () => {
      try {
        const hdr = document.querySelector('header') as HTMLElement | null
        const h1 = hdr?.getBoundingClientRect().height || 0
        const h3 = tabsRef.current?.getBoundingClientRect().height || 0
        let top = h1
        if (!top || top < 40 || top > 200) top = 60
        setToolbarTop(top + h3)
      } catch { }
    }
    computeTop()
    window.addEventListener('resize', computeTop)
    return () => window.removeEventListener('resize', computeTop)
  }, [])

  const insertAtCursor = (text: string, noCenter?: boolean) => {
    const el = contentRef.current
    const prevScrollTop = el ? el.scrollTop : undefined
    const prevWindowScroll = (typeof window !== 'undefined') ? window.scrollY : undefined
    prevWindowScrollRef.current = prevWindowScroll
    const start = el ? (el.selectionStart || 0) : (cursorPos?.start ?? editedContent.length)
    const end = el ? (el.selectionEnd || 0) : (cursorPos?.end ?? start)
    const before = editedContent.slice(0, start)
    const after = editedContent.slice(end)
    const next = `${before}${text}${after}`
    setEditedContent(next)
    if (el) {
      setTimeout(() => {
        try {
          el.focus();
          const pos = start + text.length
          el.selectionStart = pos; el.selectionEnd = pos
          if (!noCenter) {
            const lhStr = (typeof window !== 'undefined') ? window.getComputedStyle(el).lineHeight : '20'
            const lh = parseFloat(lhStr || '20') || 20
            const lines = next.slice(0, pos).split('\n').length
            const targetTop = Math.max(lines * lh - el.clientHeight / 2, 0)
            el.scrollTop = targetTop
          } else if (typeof prevScrollTop === 'number') {
            el.scrollTop = prevScrollTop
            setTimeout(() => {
              try { el.scrollTop = prevScrollTop } catch { }
            }, 16)
            if (typeof prevWindowScroll === 'number') {
              try {
                window.scrollTo({ top: prevWindowScroll, behavior: 'auto' })
                requestAnimationFrame(() => {
                  try { window.scrollTo({ top: prevWindowScroll, behavior: 'auto' }) } catch { }
                })
              } catch { }
            }
          }
        } catch { }
      }, 0)
    } else {
      setCursorPos({ start: start + text.length, end: start + text.length })
      setRevealCenter(!noCenter)
      setPendingReveal(true)
    }
  }

  useEffect(() => {
    if (pendingReveal) {
      setViewMode('edit')
      setTimeout(() => {
        const el = contentRef.current
        if (el && cursorPos) {
          try {
            el.focus()
            el.selectionStart = cursorPos.start; el.selectionEnd = cursorPos.end
            if (revealCenter) {
              const lhStr = (typeof window !== 'undefined') ? window.getComputedStyle(el).lineHeight : '20'
              const lh = parseFloat(lhStr || '20') || 20
              const lines = editedContent.slice(0, cursorPos.end).split('\n').length
              const targetTop = Math.max(lines * lh - el.clientHeight / 2, 0)
              el.scrollTop = targetTop
            }
            if (!revealCenter && typeof prevWindowScrollRef.current === 'number') {
              try {
                window.scrollTo({ top: prevWindowScrollRef.current as number, behavior: 'auto' })
                requestAnimationFrame(() => {
                  try { window.scrollTo({ top: prevWindowScrollRef.current as number, behavior: 'auto' }) } catch { }
                })
              } catch { }
            }
          } catch { }
        }
        setPendingReveal(false)
        setRevealCenter(true)
      }, 0)
    }
  }, [pendingReveal, editedContent, revealCenter])

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetch('/api/reports?limit=50')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setReports(json.data)
          if (!selectedReportId && json.data.length > 0) {
            setSelectedReportId(json.data[0].id)
          }
        }
      } catch (e) { }
    }
    loadReports()
      ; (async () => { try { await loadSavedPrompt('rewrite') } catch { }; try { await loadSavedPrompt('custom') } catch { } })()
  }, [])

  useEffect(() => {
    try {
      const tab = searchParams?.get('tab') || ''
      if (tab === 'rewrite') setActiveTab('rewrite')
      const aid = searchParams?.get('articleId') || ''
      if (aid) {
        (async () => {
          try {
            const r = await fetch(`/api/articles/by-id?id=${encodeURIComponent(aid)}`)
            const j = await r.json()
            if (j.success && j.data) {
              const a = j.data
              setRewriteSourceUrl(`文章管理-${a.id}`)
              setRewriteSourceContent(a.content || '')
              setEditedTitle(a.title || '')
              setEditedContent(a.content || '')
              setHasLocalDraft(true)
              try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: a.title || '', content: a.content || '', mode: 'rewrite', updatedAt: Date.now() })) } catch { }
            }
          } catch { }
        })()
      }
      const from = searchParams?.get('from') || ''
      const wid = searchParams?.get('id') || ''
      if (from === 'wechat' && wid) {
        (async () => {
          try {
            const r = await fetch(`/api/wechat/articles/${encodeURIComponent(wid)}`)
            const j = await r.json()
            if (j.success && j.data) {
              const a = j.data
              setActiveTab('rewrite')
              setRewriteSourceUrl(a.url || `公众号-${a.id}`)
              setRewriteSourceContent(a.content || '')
            }
          } catch { }
        })()
      }
    } catch { }
  }, [searchParams])

  useEffect(() => {
    const loadReportDetail = async () => {
      if (!selectedReportId) return
      try {
        const res = await fetch(`/api/reports/${selectedReportId}`)
        const json = await res.json()
        if (json.success && json.data) {
          const r = json.data
          const materials = r.materialsJson ? JSON.parse(r.materialsJson) : []
          const insightsArr = Array.isArray(r.insightsData) ? r.insightsData : []
          setReportMaterials(materials || [])
          setReportInsights(insightsArr || [])
          try { await loadSavedPrompt('fromReport', r.keyword || null) } catch { }
        }
      } catch (e) { }
    }
    loadReportDetail()
  }, [selectedReportId])

  const handleCompose = async (mode: 'fromReport' | 'rewrite' | 'custom') => {
    setIsGenerating(true)
    try {
      const payload: any = { mode }
      if (mode === 'fromReport') {
        payload.reportId = selectedReportId
        payload.materialsJson = reportMaterials
        payload.insights = reportInsights
        payload.prompt = reportPrompt
        payload.topic = (reports.find(r => r.id === selectedReportId)?.keyword || '')
        try {
          const cfg = (window as any).__composeLLM
          if (cfg?.id) payload.providerConfigId = cfg.id
          if (cfg?.selectedModel) payload.selectedModelId = cfg.selectedModel
        } catch { }
      }
      if (mode === 'rewrite') {
        if (!rewriteSourceUrl && !rewriteSourceContent && !rewriteMarkdownFile) {
          setNotice('请提供文章链接、内容或上传Markdown')
          setTimeout(() => setNotice(''), 3000)
          return
        }
        if (rewriteMarkdownFile) {
          try {
            const fileText = await rewriteMarkdownFile.text()
            payload.sourceContent = rewriteSourceContent || fileText
            payload.sourceUrl = rewriteSourceUrl || '上传Markdown'
          } catch { }
        }
        payload.sourceUrl = rewriteSourceUrl
        payload.sourceContent = rewriteSourceContent
        payload.prompt = rewritePrompt
        payload.length = rewriteLength
      }
      if (mode === 'custom') {
        if (!customTopic.trim()) {
          setNotice('请填写主题')
          setTimeout(() => setNotice(''), 3000)
          return
        }
        payload.topic = customTopic
        payload.style = customStyle
        payload.length = customLength
        payload.prompt = customPrompt
      }
      try {
        const cfg = (window as any).__composeLLM
        if (cfg?.provider) payload.provider = cfg.provider
        if (cfg?.selectedModel) payload.selectedModel = cfg.selectedModel
      } catch { }
      const response = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()
      if (result.success) {
        const data = result.data
        setGeneratedContent(data)
        setEditedTitle(data.title || '')
        let md = data?.content || ''
        if (!md && typeof data?.body === 'string') {
          try {
            const obj = JSON.parse(data.body)
            if (obj && typeof obj.content === 'string') md = obj.content
          } catch {
            md = data.body
          }
        }
        setEditedContent(md)
        try { await handlePublish('DRAFT', true, { title: data.title || '', content: md }) } catch { }
        try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: data.title || '', content: md, mode: activeTab, updatedAt: Date.now() })) } catch { }
        try { editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch { }
        {
          const base = result.fallback ? '模型未配置或调用失败，已生成回退初稿' : '初稿已生成，可继续编辑'
          if (mode === 'rewrite') {
            const len = rewriteLength
            const desc = len === 'normal' ? '常规' : (len === 'long' ? '长文' : '不限制')
            setNotice(`${base}（篇幅：${desc}）`)
          } else {
            setNotice(base)
          }
        }
        setTimeout(() => setNotice(''), 3000)
      } else {
        setNotice((result.error ? `${result.error}，请前往“LLM设置”完善所选供应商密钥/端点/模型` : '生成失败，请稍后重试'))
        setTimeout(() => setNotice(''), 3000)
      }
    } catch (error) {
      setNotice('生成失败，请稍后重试')
      setTimeout(() => setNotice(''), 3000)
    } finally {
      setIsGenerating(false)
    }
  }

  const extractSummary = (md: string) => {
    const text = (md || '').replace(/[#>*`]/g, '').replace(/\n{2,}/g, '\n').trim()
    return text.slice(0, 200)
  }

  const handlePublish = async (status: 'PENDING' | 'DRAFT' = 'PENDING', silent: boolean = false, overrideData?: { title?: string, content?: string }): Promise<string | null | undefined> => {
    if (!overrideData && (!editedTitle.trim() || !editedContent.trim())) {
      if (!silent) {
        setNotice('标题和内容不能为空')
        setTimeout(() => setNotice(''), 3000)
      }
      return
    }

    setPublishing(true)
    try {
      const method = lastArticleId ? 'PUT' : 'POST'
      const url = lastArticleId ? `/api/articles/${lastArticleId}` : '/api/articles'

      const titleToSave = overrideData?.title || editedTitle.trim() || '未命名标题'
      const contentToSave = overrideData?.content || editedContent
      const summary = extractSummary(contentToSave)
      const keywords = Array.isArray((generatedContent as any)?.keywords) ? (generatedContent as any).keywords : []

      const body = {
        title: titleToSave,
        content: contentToSave,
        summary,
        keywords,
        status,
        theme: themeIdToName(selectedTheme), // 转换后保存标准主题名称
        imagePrompts: generatedPrompts || []
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.success) {
        try { setLastArticleId(json.data?.id || null) } catch { }
        if (!silent) { setNotice(status === 'PENDING' ? '已提交到文章管理(待发布)' : '草稿已保存到文章管理'); setTimeout(() => setNotice(''), 2000) }
        try {
          const ids = imageList.map((img: any) => img.id).filter(Boolean)
          const urls = imageList.filter((img: any) => !img.id && img.url).map((img: any) => img.url)
          await fetch('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: json.data.id, imageIds: ids, imageUrls: urls }) })
        } catch { }
        return json.data?.id
      } else {
        if (!silent) { setNotice(json.error || '保存失败'); setTimeout(() => setNotice(''), 2000) }
        return null
      }
    } catch {
      if (!silent) { setNotice('保存失败'); setTimeout(() => setNotice(''), 2000) }
      return null
    } finally {
      setPublishing(false)
    }
  }

  const openPromptEditor = (mode: 'fromReport' | 'rewrite' | 'custom') => {
    setPromptEditorMode(mode)
    if (mode === 'fromReport') setPromptDraft(reportPrompt)
    if (mode === 'rewrite') setPromptDraft(rewritePrompt)
    if (mode === 'custom') setPromptDraft(customPrompt)
    setPromptEditorOpen(true)
  }

  const savePromptTemplate = async () => {
    try {
      const typeMap = {
        fromReport: 'compose_from_report',
        rewrite: 'rewrite_article',
        custom: 'custom_chat'
      } as const
      const keyword = promptEditorMode === 'fromReport'
        ? (reports.find(r => r.id === selectedReportId)?.keyword || null)
        : null
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `提示词-${typeMap[promptEditorMode]}`,
          content: promptDraft,
          type: typeMap[promptEditorMode],
          version: 'v1',
          keyword
        })
      })
      const json = await res.json()
      if (json.success) {
        if (promptEditorMode === 'fromReport') setReportPrompt(promptDraft)
        if (promptEditorMode === 'rewrite') setRewritePrompt(promptDraft)
        if (promptEditorMode === 'custom') setCustomPrompt(promptDraft)
        setPromptEditorOpen(false)
      }
    } catch (e) { }
  }

  // 图片数据现在从API获取，不需要mock数据

  const handleImageSelect = (image: any) => {
    const key = image.id || image.url
    setSelectedImages(prev =>
      prev.find((img: any) => (img.id || img.url) === key)
        ? prev.filter((img: any) => (img.id || img.url) !== key)
        : [...prev, image]
    )
  }

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) { setIsDragging(false); return }
    const list = [...imageList]
    const [moved] = list.splice(dragIndex, 1)
    list.splice(targetIndex, 0, moved)
    setImageList(list)
    // 同步选择列表去重且仅保留仍存在的图片
    setSelectedImages(prev => {
      const keys = new Set(list.map((img: any) => (img.id || img.url)))
      const unique: any[] = []
      for (const img of prev) {
        const k = img.id || img.url
        if (keys.has(k) && !unique.find((u: any) => (u.id || u.url) === k)) unique.push(img)
      }
      return unique
    })
    try { if (typeof window !== 'undefined') window.localStorage.setItem('compose_images', JSON.stringify(list)) } catch { }
    setDragIndex(null)
    setIsDragging(false)
  }

  const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const simpleHash = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0
    return String(h)
  }
  const handleDropImages = async (e: any) => {
    try {
      e.preventDefault()
      const files: File[] = Array.from(e.dataTransfer?.files || []).filter((f: any) => f.type.startsWith('image/')) as File[]
      if (files.length === 0) return
      let aid = lastArticleId
      if (!aid) {
        const saved = await handlePublish('DRAFT', true)
        aid = saved || lastArticleId
      }
      for (const f of files) {
        const fd = new FormData()
        fd.append('file', f)
        if (aid) fd.append('articleId', aid)
        const r = await fetch('/api/images/upload', { method: 'POST', body: fd })
        const j = await r.json()
        if (j && j.success) {
          const url = j.data?.localPath || j.data?.url
          if (url) insertAtCursor(`![配图 ${imageRatio}](${url})`)
          try {
            setImageList(prev => [{ id: j.data?.id, localPath: j.data?.localPath, url: j.data?.url, alt: f.name }, ...prev])
          } catch { }
        }
      }
      try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: editedTitle, content: editedContent, mode: activeTab, updatedAt: Date.now() })) } catch { }
      setHasLocalDraft(true)
    } catch { }
  }

  const regenerateImage = async (index: number) => {
    try {
      const img = imageList[index]
      const seg = typeof img.segmentIndex === 'number' ? img.segmentIndex : index
      const pRes = await fetch('/api/image-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: editedContent, count: imageGenCount, style: imageStyle, ratio: imageRatio, providerConfigId: (typeof window !== 'undefined' && (window as any).__composeLLM?.id) || undefined }) })
      const pJson = await pRes.json()
      if (!pJson.success) { setNotice(pJson.error || '生成提示词失败'); setTimeout(() => setNotice(''), 2000); return }
      const promptItem = (pJson.data.prompts || []).find((x: any) => x.segmentIndex === seg) || (pJson.data.prompts || [])[seg]
      if (!promptItem) { setNotice('未找到对应段落提示词'); setTimeout(() => setNotice(''), 2000); return }
      const gRes = await fetch('/api/images/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompts: [{ prompt: promptItem.prompt, segmentIndex: seg }], countPerPrompt: 1, model: 'Kwai-Kolors/Kolors', articleId: lastArticleId || undefined, ratio: imageRatio }) })
      const gJson = await gRes.json()
      if (!gJson.success) { setNotice(gJson.error || '重新生成失败'); setTimeout(() => setNotice(''), 2000); return }
      const newItem = (gJson.data.images?.[0]) || {}
      const newUrl = newItem.localPath || newItem.url
      if (!newUrl) { setNotice('重新生成失败'); setTimeout(() => setNotice(''), 2000); return }
      const list = [...imageList]
      const display = (() => { const raw = newItem.localPath || newItem.url; if (!raw) return ''; try { const u = new URL(newItem.url || raw); const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString(); return newItem.localPath || `/api/image-proxy?url=${encodeURIComponent(href)}` } catch { return raw } })()
      list[index] = { ...list[index], url: newItem.url || newUrl, localPath: newItem.localPath || list[index].localPath, displayUrl: display, segmentIndex: seg }
      setImageList(list)
      try { if (typeof window !== 'undefined') window.localStorage.setItem('compose_images', JSON.stringify(list)) } catch { }
      setGeneratedPrompts(prev => {
        const next = Array.isArray(prev) ? prev.map((p: any) => (p.segmentIndex === seg ? { ...p, prompt: promptItem.prompt } : p)) : []
        try { if (typeof window !== 'undefined') window.localStorage.setItem('compose_prompts', JSON.stringify(next)) } catch { }
        return next
      })
      const oldCandidates = [img.localPath, img.displayUrl, img.url].filter(Boolean) as string[]
      const alt = oldCandidates.map(u => escapeReg(u)).join('|')
      const patt = alt ? new RegExp(`!\\[配图(?:\\s+[0-9:.]+)?\\]\\((?:${alt})\\)`, 'g') : null
      if (patt && patt.test(editedContent)) {
        const nextContent = editedContent.replace(patt, `![配图 ${imageRatio}](${newUrl})`)
        setEditedContent(nextContent)
        try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: editedTitle, content: nextContent, mode: activeTab, updatedAt: Date.now() })) } catch { }
        setHasLocalDraft(true)
        try { await handlePublish('DRAFT', true, { content: nextContent }) } catch { }
        setNotice('已重新生成并替换该图')
      } else {
        insertAtCursor(`![配图 ${imageRatio}](${newUrl})`)
        setNotice('已重新生成并插入该图')
      }
      setTimeout(() => setNotice(''), 2000)
    } catch {
      setNotice('重新生成失败')
      setTimeout(() => setNotice(''), 2000)
    }
  }

  const generateImages = async () => {
    try {
      if (!editedContent.trim()) { setNotice('请先生成或编写文章内容'); setTimeout(() => setNotice(''), 2000); return }
      let providerConfigId: string | undefined = undefined
      try { const cfg = (window as any).__composeLLM; if (cfg?.id) providerConfigId = cfg.id } catch { }
      setImageLoading(true)
      const pRes = await fetch('/api/image-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: editedContent, count: imageGenCount, style: imageStyle, ratio: imageRatio, providerConfigId }) })
      const pJson = await pRes.json()
      if (!pJson.success) { setNotice(pJson.error || '生成提示词失败'); setTimeout(() => setNotice(''), 2000); return }
      let promptsInfo: any[] = pJson.data.prompts || []
      try { if (typeof window !== 'undefined') window.localStorage.setItem('compose_prompts', JSON.stringify(promptsInfo)) } catch { }
      // 保证生成数量与选择一致：若提示词不足，循环补齐到 imageGenCount
      setGeneratedPrompts(promptsInfo)
      let prompts = (promptsInfo || []).map((x: any) => ({ prompt: x.prompt || x, segmentIndex: x.segmentIndex }))
      if (imageGenCount && prompts.length < imageGenCount) {
        const base = prompts.length > 0 ? prompts : [{ prompt: '配图', segmentIndex: 0 }]
        let i = 0
        while (prompts.length < imageGenCount) {
          const src = base[i % base.length]
          prompts.push({ prompt: src.prompt, segmentIndex: typeof src.segmentIndex === 'number' ? src.segmentIndex : prompts.length })
          i++
        }
      }
      const gRes = await fetch('/api/images/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompts, countPerPrompt: 1, model: 'Kwai-Kolors/Kolors', articleId: lastArticleId || undefined, ratio: imageRatio }) })
      const gJson = await gRes.json()
      if (!gJson.success) { setNotice(gJson.error || '生成图片失败'); setTimeout(() => setNotice(''), 2000); return }
      const imgsRaw = gJson.data.images || []
      const imgs = imgsRaw.map((img: any) => {
        const raw = img.localPath || img.url
        try { const u = new URL(img.url || raw); const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString(); return { ...img, displayUrl: img.localPath || `/api/image-proxy?url=${encodeURIComponent(href)}` } } catch { return { ...img, displayUrl: raw } }
      })
      setImageList(imgs)
      setSelectedImages([])
      try { if (typeof window !== 'undefined') { window.localStorage.setItem('compose_images', JSON.stringify(imgs)); window.localStorage.removeItem('compose_images_cleared') } } catch { }
      if (segInsert) {
        let nextContent = editedContent.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, '')
        let providerConfigIdForInsert: string | undefined = undefined
        try { const cfg = (window as any).__composeLLM; if (cfg?.id) providerConfigIdForInsert = cfg.id } catch { }
        const pRes2 = await fetch('/api/image-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: nextContent, count: imgs.length, style: imageStyle, ratio: imageRatio, providerConfigId: providerConfigIdForInsert }) })
        const pJson2 = await pRes2.json()
        if (!pJson2.success) { setNotice(pJson2.error || '生成提示词失败'); setTimeout(() => setNotice(''), 2000); setImageLoading(false); return }
        const promptsInfo = pJson2.data.prompts as Array<{ segmentIndex: number, endOffset: number, tail: string }>
        setGeneratedPrompts(promptsInfo)
        const urlBySeg = new Map<number, string>()
        for (const img of imgs) { if (typeof img.segmentIndex === 'number') urlBySeg.set(img.segmentIndex, img.localPath || img.displayUrl || img.url) }
        // 如果有图片缺少 segmentIndex，则按顺序补齐
        let seq = 0
        for (const img of imgs) {
          if (typeof img.segmentIndex !== 'number') {
            while (urlBySeg.has(seq)) seq++
            urlBySeg.set(seq, img.localPath || img.displayUrl || img.url)
          }
        }
        // 依据后端提供的 tail/endOffset 顺序插入
        const pairs = promptsInfo
          .map(p => ({ seg: p.segmentIndex, end: p.endOffset, tail: p.tail || '', url: urlBySeg.get(p.segmentIndex) }))
          .filter(k => typeof k.end === 'number' && k.url)
          .sort((a, b) => (a.end as number) - (b.end as number))
        let delta = 0
        for (const it of pairs) {
          const insert = `\n\n![配图 ${imageRatio}](${it.url})`
          const base = (it.end as number) + delta
          let pos = base
          if (tailFromReport && it.tail) {
            const winStart = Math.max(0, base - 400)
            const winEnd = Math.min(nextContent.length, base + 200)
            const windowText = nextContent.slice(winStart, winEnd)
            const localIdx = windowText.lastIndexOf(it.tail)
            if (localIdx >= 0) pos = winStart + localIdx + it.tail.length
          }
          nextContent = nextContent.slice(0, pos) + insert + nextContent.slice(pos)
          delta += insert.length
        }
        setEditedContent(nextContent)
        try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: editedTitle, content: nextContent, mode: activeTab, updatedAt: Date.now() })) } catch { }
        setHasLocalDraft(true)
      } else {
        const md = imgs.map((img: any) => `![配图 ${imageRatio}](${img.localPath || img.displayUrl || img.url})`).join('\n\n')
        if (md) {
          const baseText = editedContent.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, '')
          const nextText = `${baseText}\n\n${md}`
          setEditedContent(nextText)
          try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: editedTitle, content: nextText, mode: activeTab, updatedAt: Date.now() })) } catch { }
          setHasLocalDraft(true)
          try { await handlePublish('DRAFT', true, { content: nextText }) } catch { }
        }
      }
      setNotice('配图已生成')
      setTimeout(() => setNotice(''), 2000)
    } catch {
      setNotice('生成图片失败')
      setTimeout(() => setNotice(''), 2000)
    } finally {
      setImageLoading(false)
    }
  }

  useEffect(() => {
    const loadImages = async () => {
      try {
        setImageLoading(true)
        const cleared = typeof window !== 'undefined' ? window.localStorage.getItem('compose_images_cleared') === '1' : false
        const s = typeof window !== 'undefined' ? window.localStorage.getItem('compose_images') : null
        let usedLocal = false
        if (!cleared && s) {
          try {
            const arr = JSON.parse(s)
            if (Array.isArray(arr) && arr.length > 0) {
              setImageList(arr)
              usedLocal = true
              if (!generatedPrompts || generatedPrompts.length === 0) {
                const p = typeof window !== 'undefined' ? window.localStorage.getItem('compose_prompts') : null
                if (p) {
                  try { const arrp = JSON.parse(p); if (Array.isArray(arrp)) setGeneratedPrompts(arrp) } catch { }
                } else {
                  const ps = arr.map((img: any, idx: number) => ({ prompt: img.alt || '', segmentIndex: typeof img.segmentIndex === 'number' ? img.segmentIndex : idx }))
                  setGeneratedPrompts(ps)
                }
              }
            }
          } catch { }
        }
        if (!usedLocal && lastArticleId && !cleared) {
          const r = await fetch(`/api/images?articleId=${encodeURIComponent(lastArticleId)}`)
          const j = await r.json()
          if (j.success && Array.isArray(j.data.images) && j.data.images.length > 0) {
            setImageList(j.data.images)
            if (!generatedPrompts || generatedPrompts.length === 0) {
              const ps = j.data.images.map((img: any, idx: number) => ({ prompt: img.alt || '', segmentIndex: typeof img.segmentIndex === 'number' ? img.segmentIndex : idx }))
              setGeneratedPrompts(ps)
              try { if (typeof window !== 'undefined') window.localStorage.setItem('compose_prompts', JSON.stringify(ps)) } catch { }
            }
          } else {
            setImageList([])
          }
        }
      } catch { }
      setImageLoading(false)
    }
    loadImages()
  }, [activeTab, lastArticleId])

  return (
    <div className="w-full space-y-8">
      {notice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 pointer-events-none z-[1000]">
          <div className="bg-foreground/90 text-background text-sm px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-border/10">{notice}</div>
        </div>
      )}
      {/* 页面标题 */}
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">内容创作</h1>
          <p className="text-muted-foreground mt-2">
            AI 驱动的高质量内容生成引擎
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LLMModelSelector
            independent
            storageKey="llm_selection_compose"
            feature="compose"
            onSelect={(cfg: any) => {
              // 记录本页选择的模型与供应商
              (window as any).__composeLLM = cfg
            }}
          />
        </div>
      </div>

      {/* 选项卡与提示词入口对齐 */}
      <div className="flex items-center justify-between mb-6" ref={tabsRef}>
        <div className="inline-flex items-center p-1 rounded-xl bg-muted/50 border border-border shadow-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab('fromReport')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'fromReport'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
          >
            <Wand2 className={`inline h-4 w-4 mr-2 ${activeTab === 'fromReport' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            基于历史报告撰写
          </button>
          <button
            onClick={() => setActiveTab('rewrite')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'rewrite'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
          >
            <FileText className={`inline h-4 w-4 mr-2 ${activeTab === 'rewrite' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            改写现有文章
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'custom'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
          >
            <Wand2 className={`inline h-4 w-4 mr-2 ${activeTab === 'custom' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            自定义撰写
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditedContent(''); setNotice('已清除文章内容'); setTimeout(() => setNotice(''), 3000); clearImagePanel(); }}>
            清除图文
          </Button>
          <Button variant="outline" size="sm" onClick={() => openPromptEditor(activeTab)}>文章提示词</Button>
        </div>
      </div>



      {
        activeTab === 'fromReport' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9 space-y-6" ref={(el) => { (editorRef as any).current = el }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>文章编辑</CardTitle>
                      <CardDescription>编辑和完善您的内容</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setThemeOpen(true)}>主题</Button>
                      <Button size="sm" variant={viewMode === 'read' ? 'default' : 'outline'} onClick={() => setViewMode('read')}>阅读</Button>
                      <Button size="sm" variant={viewMode === 'edit' ? 'default' : 'outline'} onClick={() => setViewMode('edit')}>编辑</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {viewMode === 'edit' ? (
                    <>
                      <div><Input placeholder="文章标题" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-lg font-semibold" /></div>
                      <div className="flex flex-wrap items-center gap-2 sticky z-40 bg-card shadow-sm border-b border-border px-2 py-2" style={{ top: toolbarTop }}>
                        <Button variant="outline" size="sm" onClick={() => applyWrap('**', '**')}><Bold className="h-4 w-4 mr-1" />加粗</Button>
                        <Button variant="outline" size="sm" onClick={() => applyWrap('*', '*')}><Italic className="h-4 w-4 mr-1" />斜体</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('# ')}><Heading1 className="h-4 w-4 mr-1" />H1</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('## ')}><Heading2 className="h-4 w-4 mr-1" />H2</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('### ')}><Heading3 className="h-4 w-4 mr-1" />H3</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('- ')}><List className="h-4 w-4 mr-1" />无序</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('1. ')}><ListOrdered className="h-4 w-4 mr-1" />有序</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('> ')}><Quote className="h-4 w-4 mr-1" />引用</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const url = typeof window !== 'undefined' ? window.prompt('输入链接URL') : ''
                          if (url) applyWrap('[', `](${url})`)
                        }}><LinkIcon className="h-4 w-4 mr-1" />链接</Button>
                        <Button variant="outline" size="sm" onClick={() => applyWrap('```\n', '\n```')}><Code className="h-4 w-4 mr-1" />代码块</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowEditPreview(v => !v)}><SplitSquareHorizontal className="h-4 w-4 mr-1" />内联预览</Button>

                        <Button variant="outline" size="sm" onClick={clearAllImages}>清除全部图片</Button>
                        <Button variant="outline" size="sm" onClick={() => { setInsertCandidates([]); setShowAllImagesDialog(true) }}>查看全部图片</Button>
                      </div>
                      {showEditPreview ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <Textarea ref={contentRef} placeholder="文章内容..." value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onSelect={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onKeyUp={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onClick={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onDragOver={(e: any) => { e.preventDefault() }} onDrop={handleDropImages} className="min-h-[70vh] resize-y" />
                          <div className="border rounded p-3 overflow-auto"><MarkdownViewer key={selectedTheme} content={editedContent || ''} theme={themeIdToName(selectedTheme) as any} /></div>
                        </div>
                      ) : (
                        <Textarea ref={contentRef} placeholder="文章内容..." value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onSelect={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onKeyUp={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onClick={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onDragOver={(e: any) => { e.preventDefault() }} onDrop={handleDropImages} className="min-h-[70vh] resize-y" style={{ scrollMarginTop: toolbarTop }} />
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-foreground">{editedTitle || '未命名标题'}</h2>
                      <MarkdownViewer key={selectedTheme} content={editedContent || ''} theme={themeIdToName(selectedTheme) as any} />
                    </>
                  )}
                  <div className="flex justify-between">
                    <div className="space-x-2">
                      <Button variant="outline" onClick={async () => { handleSaveDraft(); await handlePublish('DRAFT'); router.push('/articles') }}><Save className="mr-2 h-4 w-4" />保存草稿</Button>
                      <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />预览</Button>
                    </div>
                    <Button onClick={async () => {
                      console.log('Clicking Publish Button (Tab 1)');
                      try {
                        const id = await handlePublish('PENDING');
                        console.log('handlePublish returned:', id);
                        const aid = id || lastArticleId;
                        console.log('Article ID to use:', aid);
                        if (aid) {
                          console.log('Opening Publish Dialog');
                          setPublishOpen(true)
                        } else {
                          console.log('No Article ID, showing error');
                          setNotice('保存失败，无法进入发布');
                          setTimeout(() => setNotice(''), 2000)
                        }
                      } catch (e) {
                        console.error('Error in Publish Button click:', e);
                      }
                    }}><Send className="mr-2 h-4 w-4" />提交发布</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base font-semibold text-foreground">
                    <ThemeIcon icon={Wand2} variant="secondary" size="sm" className="mr-2" />历史报告
                  </CardTitle>
                  <CardDescription>请先选择历史报告</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="请选择历史报告" />
                      </SelectTrigger>
                      <SelectContent>
                        {reports.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.keyword} · {new Date(r.generatedAt).toLocaleString('zh-CN')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => handleCompose('fromReport')} disabled={isGenerating || !selectedReportId} className="w-full">{isGenerating ? '生成中...' : '基于报告生成初稿'}</Button>
                  {!selectedReportId && (
                    <p className="text-xs text-muted-foreground mt-2">请先选择历史报告</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="space-y-3">
                    <span className="flex items-center text-base font-semibold text-foreground"><ThemeIcon icon={ImageIcon} variant="secondary" size="sm" className="mr-2" />图片素材</span>
                    <div className="flex items-center gap-2">
                      <ImagePromptEditorButton articleContent={editedContent} count={imageGenCount} providerConfigId={(typeof window !== 'undefined' && (window as any).__composeLLM?.id) || undefined} />
                      <ImageAPIConfigButton />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground w-8">数量</span>
                      <Select value={String(imageGenCount)} onValueChange={(v) => setImageGenCount(parseInt(v))}>
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground w-8">风格</span>
                      <Select value={imageStyle} onValueChange={(v) => { setImageStyle(v); try { if (typeof window !== 'undefined') window.localStorage.setItem('image_style', v) } catch { } }}>
                        <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="插画风格">插画风格</SelectItem>
                          <SelectItem value="写实风格">写实风格</SelectItem>
                          <SelectItem value="水彩风格">水彩风格</SelectItem>
                          <SelectItem value="赛博朋克">赛博朋克</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground w-8">比例</span>
                      <Select value={imageRatio} onValueChange={(v) => { setImageRatio(v); try { if (typeof window !== 'undefined') window.localStorage.setItem('image_ratio', v) } catch { } }}>
                        <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">1:1</SelectItem>
                          <SelectItem value="4:3">4:3</SelectItem>
                          <SelectItem value="16:9">16:9</SelectItem>
                          <SelectItem value="2.35:1">2.35:1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={segInsert} onChange={(e) => setSegInsert(e.target.checked)} className="w-4 h-4 rounded border-input" />
                        按段插图
                      </label>
                    </div>
                  </div>
                  <Button size="sm" onClick={generateImages} className="w-full">生成配图</Button>
                </CardContent>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {imageLoading && (<div className="col-span-2 text-muted-foreground">加载中...</div>)}
                    {!imageLoading && imageList.map((image: any) => (
                      <div key={image.id || image.url} draggable onDragStart={() => { setDragIndex(imageList.indexOf(image)); setIsDragging(true) }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(imageList.indexOf(image)) }} onDragEnd={() => setIsDragging(false)} className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${selectedImages.find((img: any) => (img.id || img.url) === (image.id || image.url)) ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}`} onClick={(e) => { if (isDragging) return; handleImageSelect(image) }}>
                        <img src={(() => { const raw = image.localPath || image.displayUrl || image.url; if (!raw) return ''; if (raw.startsWith('/uploads/') || raw.startsWith('/api/image-proxy')) return raw; try { const u = new URL(raw); const href = u.protocol === 'http:' ? `https://${u.hostname}${u.pathname}${u.search}${u.hash}` : u.toString(); return `/api/image-proxy?url=${encodeURIComponent(href)}` } catch { return raw } })()} alt={image.description || image.alt || image.alt_description || ''} className="w-full h-24 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); regenerateImage(imageList.indexOf(image)) }}>重新生成</Button>
                          </div>
                        </div>
                        {selectedImages.find((img: any) => (img.id || img.url) === (image.id || image.url)) && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"><div className="w-3 h-3 flex items-center justify-center"><span className="text-xs">✓</span></div></div>
                        )}
                      </div>
                    ))}
                  </div>
                  {imageList.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-muted-foreground">已选择 {selectedImages.length} / {imageList.length} 张</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedImages((selectedImages.length > 0 && selectedImages.length === imageList.length) ? [] : imageList)}>{(selectedImages.length > 0 && selectedImages.length === imageList.length) ? '取消全选' : '全选'}</Button><Button variant="outline" size="sm" onClick={clearImagePanel}>清空</Button></div></div>
                      <Button className="w-full" size="sm" onClick={async () => {
                        const imgUrl = (img: any) => (img.localPath || img.displayUrl || img.url)
                        const cleaned = editedContent.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, '')
                        const existsOnCleaned = (url: string) => new RegExp(`!\\[[^\\]]*\\]\\(${escapeReg(url)}\\)`).test(cleaned)
                        const selKeys = new Set(selectedImages.map((img: any) => (img.id || img.url)))
                        const seen = new Set<string>()
                        const toInsert = imageList.filter((img: any) => {
                          const k = img.id || img.url
                          if (!selKeys.has(k)) return false
                          if (seen.has(k)) return false
                          seen.add(k)
                          return !existsOnCleaned(imgUrl(img))
                        })
                        if (segInsert) {
                          let providerConfigId: string | undefined = undefined
                          try { const cfg = (window as any).__composeLLM; if (cfg?.id) providerConfigId = cfg.id } catch { }
                          const cleaned = editedContent.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, '')
                          let info = Array.isArray(generatedPrompts) ? (generatedPrompts as any[]) : []
                          if (!info || info.length === 0) {
                            const pRes = await fetch('/api/image-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: cleaned, count: toInsert.length || imageGenCount, style: imageStyle, ratio: imageRatio, providerConfigId }) })
                            const pJson = await pRes.json()
                            info = pJson.success ? (pJson.data.prompts || []) : []
                          }
                          let next = cleaned
                          const orderedPrompts = [...info].sort((a: any, b: any) => (a.endOffset as number) - (b.endOffset as number))
                          let delta = 0
                          for (let i = 0; i < orderedPrompts.length && i < toInsert.length; i++) {
                            const p = orderedPrompts[i]
                            const url = imgUrl(toInsert[i])
                            if (!url) continue
                            const insert = `\n\n![配图 ${imageRatio}](${url})`
                            const base = (typeof p.endOffset === 'number' ? (p.endOffset as number) : next.length) + delta
                            let pos = base
                            if (tailFromReport && p.tail) {
                              const winStart = Math.max(0, base - 400)
                              const winEnd = Math.min(next.length, base + 200)
                              const windowText = next.slice(winStart, winEnd)
                              const localIdx = windowText.lastIndexOf(p.tail)
                              if (localIdx >= 0) pos = winStart + localIdx + p.tail.length
                            }
                            pos = Math.min(Math.max(pos, 0), next.length)
                            next = next.slice(0, pos) + insert + next.slice(pos)
                            delta += insert.length
                          }
                          setEditedContent(next)
                          try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: editedTitle, content: next, mode: activeTab, updatedAt: Date.now() })) } catch { }
                          setHasLocalDraft(true)
                        } else {
                          const md = toInsert.map((img: any) => `![配图](${imgUrl(img)})`).join('\n\n')
                          if (md) {
                            const baseText = editedContent.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, '')
                            const nextText = `${baseText}\n\n${md}`
                            setEditedContent(nextText)
                            try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: editedTitle, content: nextText, mode: activeTab, updatedAt: Date.now() })) } catch { }
                            setHasLocalDraft(true)
                            try { await handlePublish('DRAFT', true, { content: nextText }) } catch { }
                          }
                        }
                      }}>插入到文章</Button>
                      {generatedPrompts.length > 0 && (
                        <div className="mt-4 border rounded p-3 bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-foreground">当前生成的图片提示词</div>
                            <label className="flex items-center gap-1 text-sm text-muted-foreground"><input type="checkbox" checked={tailFromReport} onChange={(e) => setTailEnabled('fromReport', e.target.checked)} />尾部</label>
                          </div>
                          <div className="space-y-2 text-xs text-foreground">
                            {generatedPrompts.map((p: any, idx: number) => (
                              <div key={idx}>
                                <span className="font-semibold mr-2">第{(p.segmentIndex ?? idx) + 1}段：</span>{p.prompt}
                                {tailFromReport && p.tail && (<div className="mt-1 text-muted-foreground">尾部：{p.tail}</div>)}
                              </div>
                            ))}
                          </div>
                          {imagePromptTpl && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              <div className="font-medium mb-1">当前模板（应用于生成）：</div>
                              <pre className="whitespace-pre-wrap break-words bg-card border rounded p-2">{imagePromptTpl}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">素材与洞察</CardTitle>
                  <CardDescription>将素材要点一键插入正文以形成证据链</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportInsights.length === 0 && reportMaterials.length === 0 ? (
                      <div className="text-muted-foreground">请选择历史报告以加载素材与洞察</div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">洞察</p>
                          <div className="space-y-2">{reportInsights.map((s, i) => (<div key={i} className="text-sm text-foreground">{s}</div>))}</div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">素材要点 Top5</p>
                          <div className="space-y-2">
                            {reportMaterials.slice(0, 5).map((m: any, i: number) => (
                              <div key={i} className="border rounded p-3">
                                <div className="text-sm font-medium text-foreground">{m.title || m.topic || '素材'}</div>
                                {m.evidenceLink && (<a className="text-xs text-muted-foreground hover:text-foreground underline" href={m.evidenceLink} target="_blank" rel="noreferrer">{m.evidenceLink}</a>)}
                                <div className="mt-2"><Button size="sm" variant="outline" onClick={() => setEditedContent(prev => `${prev}\n\n【素材】${m.title || ''}｜${m.viewpoint || ''}｜证据：${m.evidenceLink || ''}`)}>插入到正文</Button></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

      {
        (activeTab === 'rewrite' || activeTab === 'custom') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>文章编辑</CardTitle>
                      <CardDescription>编辑和完善您的内容</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setThemeOpen(true)}>主题</Button>
                      <Button size="sm" variant={viewMode === 'read' ? 'default' : 'outline'} onClick={() => setViewMode('read')}>阅读</Button>
                      <Button size="sm" variant={viewMode === 'edit' ? 'default' : 'outline'} onClick={() => setViewMode('edit')}>编辑</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {viewMode === 'edit' ? (
                    <>
                      <div><Input placeholder="主题/标题" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-lg font-semibold" /></div>
                      <div className="flex flex-wrap items-center gap-2 sticky z-40 bg-card shadow-sm border-b border-border px-2 py-2" style={{ top: toolbarTop }}>
                        <Button variant="outline" size="sm" onClick={() => applyWrap('**', '**')}><Bold className="h-4 w-4 mr-1" />加粗</Button>
                        <Button variant="outline" size="sm" onClick={() => applyWrap('*', '*')}><Italic className="h-4 w-4 mr-1" />斜体</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('# ')}><Heading1 className="h-4 w-4 mr-1" />H1</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('## ')}><Heading2 className="h-4 w-4 mr-1" />H2</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('### ')}><Heading3 className="h-4 w-4 mr-1" />H3</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('- ')}><List className="h-4 w-4 mr-1" />无序</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('1. ')}><ListOrdered className="h-4 w-4 mr-1" />有序</Button>
                        <Button variant="outline" size="sm" onClick={() => applyLinePrefix('> ')}><Quote className="h-4 w-4 mr-1" />引用</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const url = typeof window !== 'undefined' ? window.prompt('输入链接URL') : ''
                          if (url) applyWrap('[', `](${url})`)
                        }}><LinkIcon className="h-4 w-4 mr-1" />链接</Button>
                        <Button variant="outline" size="sm" onClick={() => applyWrap('```\n', '\n```')}><Code className="h-4 w-4 mr-1" />代码块</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowEditPreview(v => !v)}><SplitSquareHorizontal className="h-4 w-4 mr-1" />内联预览</Button>
                        <Button variant="outline" size="sm" onClick={clearAllImages}>清除全部图片</Button>
                        <Button variant="outline" size="sm" onClick={() => { setInsertCandidates([]); setShowAllImagesDialog(true) }}>查看全部图片</Button>
                      </div>
                      {showEditPreview ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <Textarea ref={contentRef} placeholder="文章内容..." value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onSelect={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onKeyUp={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onClick={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onDragOver={(e: any) => { e.preventDefault() }} onDrop={handleDropImages} className="min-h-[70vh] resize-y" />
                          <div className="border rounded p-3 overflow-auto"><MarkdownViewer key={selectedTheme} content={editedContent || ''} theme={themeIdToName(selectedTheme) as any} /></div>
                        </div>
                      ) : (
                        <Textarea ref={contentRef} placeholder="文章内容..." value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onSelect={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onKeyUp={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onClick={(e: any) => setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd })} onDragOver={(e: any) => { e.preventDefault() }} onDrop={handleDropImages} className="min-h-[70vh] resize-y" style={{ scrollMarginTop: toolbarTop }} />
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-foreground">{editedTitle || '未命名标题'}</h2>
                      <MarkdownViewer key={selectedTheme} content={editedContent || ''} theme={themeIdToName(selectedTheme) as any} />
                    </>
                  )}
                  <div className="flex justify-between">
                    <div className="space-x-2">
                      <Button variant="outline" onClick={async () => { handleSaveDraft(); await handlePublish('DRAFT'); router.push('/articles') }}><Save className="mr-2 h-4 w-4" />保存草稿</Button>
                      <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" />预览</Button>
                    </div>
                    <Button onClick={async () => {
                      console.log('Clicking Publish Button');
                      try {
                        const id = await handlePublish('PENDING');
                        console.log('handlePublish returned:', id);
                        const aid = id || lastArticleId;
                        console.log('Article ID to use:', aid);
                        if (aid) {
                          console.log('Opening Publish Dialog');
                          setPublishOpen(true)
                        } else {
                          console.log('No Article ID, showing error');
                          setNotice('保存失败，无法进入发布');
                          setTimeout(() => setNotice(''), 2000)
                        }
                      } catch (e) {
                        console.error('Error in Publish Button click:', e);
                      }
                    }}><Send className="mr-2 h-4 w-4" />提交发布</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">模式配置与提示词</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeTab === 'rewrite' && (
                    <div className="space-y-4">
                      <Input placeholder="文章链接（可选）" value={rewriteSourceUrl} onChange={(e) => setRewriteSourceUrl(e.target.value)} />
                      <Textarea placeholder="粘贴文章内容或上传Markdown" value={rewriteSourceContent} onChange={(e) => setRewriteSourceContent(e.target.value)} onDragOver={(e: any) => { e.preventDefault() }} onDrop={(e: any) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f && ((f.type && /markdown|text/.test(f.type)) || /\.md$/i.test(f.name))) { const r = new FileReader(); r.onload = () => { setRewriteSourceContent(String(r.result || '')); setRewriteMarkdownFile(f) }; r.readAsText(f) } }} className="min-h-[160px]" />
                      <Input type="file" accept="text/markdown,.md" onChange={(e) => setRewriteMarkdownFile(e.target.files?.[0] || null)} />
                      <Select value={rewriteLength} onValueChange={(v) => setRewriteLength(v as any)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择篇幅" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">常规（800~1500字）</SelectItem>
                          <SelectItem value="long">长文（1500~2500字）</SelectItem>
                          <SelectItem value="unlimited">不限制</SelectItem>
                        </SelectContent>
                      </Select>
                      {!rewriteSourceUrl && !rewriteSourceContent && !rewriteMarkdownFile && (
                        <p className="text-xs text-muted-foreground">请至少提供文章链接、正文内容或上传Markdown</p>
                      )}

                      <Button onClick={() => handleCompose('rewrite')} disabled={isGenerating} className="w-full">{isGenerating ? '生成中...' : '生成改写初稿'}</Button>
                    </div>
                  )}
                  {activeTab === 'custom' && (
                    <div className="space-y-4">
                      <Input placeholder="主题" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} />
                      <Select value={customStyle} onValueChange={setCustomStyle}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择风格" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="公众号专业科普">公众号专业科普</SelectItem>
                          <SelectItem value="资讯快报">资讯快报</SelectItem>
                          <SelectItem value="教程指南">教程指南</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={customLength} onValueChange={setCustomLength}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择篇幅" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">常规（800~1500字）</SelectItem>
                          <SelectItem value="long">长文（1500~2500字）</SelectItem>
                          <SelectItem value="unlimited">不限制</SelectItem>
                        </SelectContent>
                      </Select>
                      {!customTopic.trim() && (
                        <p className="text-xs text-muted-foreground">请填写主题以生成初稿</p>
                      )}

                      <Button onClick={() => handleCompose('custom')} disabled={isGenerating} className="w-full">{isGenerating ? '生成中...' : '生成初稿'}</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="space-y-3">
                    <span className="flex items-center text-base font-semibold text-foreground"><ThemeIcon icon={ImageIcon} variant="secondary" size="sm" className="mr-2" />图片素材</span>
                    <div className="flex items-center gap-2">
                      <ImagePromptEditorButton articleContent={editedContent} count={imageGenCount} providerConfigId={(typeof window !== 'undefined' && (window as any).__composeLLM?.id) || undefined} />
                      <ImageAPIConfigButton />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground w-8">数量</span>
                      <Select value={String(imageGenCount)} onValueChange={(v) => setImageGenCount(parseInt(v))}>
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="8">8</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground w-8">风格</span>
                      <Select value={imageStyle} onValueChange={(v) => { setImageStyle(v); try { if (typeof window !== 'undefined') window.localStorage.setItem('image_style', v) } catch { } }}>
                        <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="插画风格">插画风格</SelectItem>
                          <SelectItem value="写实风格">写实风格</SelectItem>
                          <SelectItem value="水彩风格">水彩风格</SelectItem>
                          <SelectItem value="赛博朋克">赛博朋克</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground w-8">比例</span>
                      <Select value={imageRatio} onValueChange={(v) => { setImageRatio(v); try { if (typeof window !== 'undefined') window.localStorage.setItem('image_ratio', v) } catch { } }}>
                        <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">1:1</SelectItem>
                          <SelectItem value="4:3">4:3</SelectItem>
                          <SelectItem value="16:9">16:9</SelectItem>
                          <SelectItem value="2.35:1">2.35:1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={segInsert} onChange={(e) => setSegInsert(e.target.checked)} className="w-4 h-4 rounded border-input" />
                        按段插图
                      </label>
                    </div>
                  </div>
                  <Button size="sm" onClick={generateImages} className="w-full">生成配图</Button>
                </CardContent>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {imageLoading && (<div className="col-span-2 text-muted-foreground">加载中...</div>)}
                    {!imageLoading && imageList.map((image: any) => (
                      <div key={image.id || image.url} draggable onDragStart={() => { setDragIndex(imageList.indexOf(image)); setIsDragging(true) }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop(imageList.indexOf(image)) }} onDragEnd={() => setIsDragging(false)} className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${selectedImages.find((img: any) => (img.id || img.url) === (image.id || image.url)) ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'}`} onClick={(e) => { if (isDragging) return; handleImageSelect(image) }}>
                        <img src={(() => { try { const raw = image.urls?.regular || image.url; const u = new URL(raw); return `/api/image-proxy?url=${encodeURIComponent(u.toString())}` } catch { return image.urls?.regular || image.url } })()} alt={image.description || image.alt || image.alt_description || ''} className="w-full h-24 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); regenerateImage(imageList.indexOf(image)) }}>重新生成</Button>
                          </div>
                        </div>
                        {selectedImages.find((img: any) => (img.id || img.url) === (image.id || image.url)) && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"><div className="w-3 h-3 flex items-center justify-center"><span className="text-xs">✓</span></div></div>
                        )}
                      </div>
                    ))}
                  </div>
                  {imageList.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-muted-foreground">已选择 {selectedImages.length} / {imageList.length} 张</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setSelectedImages((selectedImages.length > 0 && selectedImages.length === imageList.length) ? [] : imageList)}>{(selectedImages.length > 0 && selectedImages.length === imageList.length) ? '取消全选' : '全选'}</Button><Button variant="outline" size="sm" onClick={clearImagePanel}>清空</Button></div></div>
                      <Button className="w-full" size="sm" onClick={async () => {
                        const imgUrl = (img: any) => (img.localPath || img.displayUrl || img.url)
                        const cleaned2 = editedContent.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, '')
                        const existsOnCleaned2 = (url: string) => new RegExp(`!\\[配图(?:\\s+[0-9:.]+)?\\]\\(${escapeReg(url)}\\)`).test(cleaned2)
                        const selKeys = new Set(selectedImages.map((img: any) => (img.id || img.url)))
                        const seen = new Set<string>()
                        const toInsert = imageList.filter((img: any) => {
                          const k = img.id || img.url
                          if (!selKeys.has(k)) return false
                          if (seen.has(k)) return false
                          seen.add(k)
                          return !existsOnCleaned2(imgUrl(img))
                        })
                        if (segInsert) {
                          let info = generatedPrompts as Array<{ segmentIndex: number, endOffset: number, tail?: string }>
                          if (!info || info.length === 0) {
                            let providerConfigId: string | undefined = undefined
                            try { const cfg = (window as any).__composeLLM; if (cfg?.id) providerConfigId = cfg.id } catch { }
                            const pRes = await fetch('/api/image-prompts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: editedContent, count: toInsert.length || imageGenCount, style: imageStyle, ratio: imageRatio, providerConfigId }) })
                            const pJson = await pRes.json()
                            if (pJson.success) {
                              info = pJson.data.prompts || []
                            } else {
                              info = []
                            }
                          }
                          let next = cleaned2
                          const orderedPrompts = [...info].sort((a: any, b: any) => (a.endOffset as number) - (b.endOffset as number))
                          let delta = 0
                          for (let i = 0; i < orderedPrompts.length && i < toInsert.length; i++) {
                            const p = orderedPrompts[i]
                            const url = toInsert[i]?.url
                            if (!url) continue
                            const insert = `\n\n![配图 ${imageRatio}](${url})`
                            const base = (typeof p.endOffset === 'number' ? (p.endOffset as number) : next.length) + delta
                            let pos = base
                            if ((activeTab === 'rewrite' ? tailRewrite : tailCustom) && p.tail) {
                              const winStart = Math.max(0, base - 400)
                              const winEnd = Math.min(next.length, base + 200)
                              const windowText = next.slice(winStart, winEnd)
                              const localIdx = windowText.lastIndexOf(p.tail)
                              if (localIdx >= 0) pos = winStart + localIdx + p.tail.length
                            }
                            pos = Math.min(Math.max(pos, 0), next.length)
                            next = next.slice(0, pos) + insert + next.slice(pos)
                            delta += insert.length
                          }
                          setEditedContent(next)
                        } else {
                          const md = toInsert.map((img: any) => `![配图](${imgUrl(img)})`).join('\n\n')
                          if (md) {
                            const baseText = editedContent.replace(/!\[[^\]]*?\]\([^\)]+?\)/g, '').replace(/<img[^>]*>/gi, '')
                            const nextText = `${baseText}\n\n${md}`
                            setEditedContent(nextText)
                            try { if (typeof window !== 'undefined') window.localStorage.setItem(storageKeyDraft, JSON.stringify({ title: editedTitle, content: nextText, mode: activeTab, updatedAt: Date.now() })) } catch { }
                            setHasLocalDraft(true)
                            try { await handlePublish('DRAFT', true, { content: nextText }) } catch { }
                          }
                        }
                      }}>插入到文章</Button>
                      {generatedPrompts.length > 0 && (
                        <div className="mt-4 border rounded p-3 bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-foreground">当前生成的图片提示词</div>
                            <label className="flex items-center gap-1 text-sm text-muted-foreground"><input type="checkbox" checked={activeTab === 'rewrite' ? tailRewrite : tailCustom} onChange={(e) => setTailEnabled(activeTab === 'rewrite' ? 'rewrite' : 'custom', e.target.checked)} />尾部</label>
                          </div>
                          <div className="space-y-2 text-xs text-foreground">
                            {generatedPrompts.map((p: any, idx: number) => (
                              <div key={idx}>
                                <span className="font-semibold mr-2">第{(p.segmentIndex ?? idx) + 1}段：</span>{p.prompt}
                                {(activeTab === 'rewrite' ? tailRewrite : tailCustom) && p.tail && (<div className="mt-1 text-muted-foreground">尾部：{p.tail}</div>)}
                              </div>
                            ))}
                          </div>
                          {imagePromptTpl && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              <div className="font-medium mb-1">当前模板（应用于生成）：</div>
                              <pre className="whitespace-pre-wrap break-words bg-card border rounded p-2">{imagePromptTpl}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* 模式配置卡片已上移至图片素材之前，移除此处重复 */}
            </div>
          </div>
        )
      }

      <Dialog open={promptEditorOpen} onOpenChange={setPromptEditorOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>编辑并保存提示词</DialogTitle>
            <DialogDescription>为当前撰写模式保存默认提示词，后续可在“提示词模板”中统一管理。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} className="min-h-[200px]" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => resetToDefaultPrompt(promptEditorMode)}>恢复默认提示词</Button>
              <Button variant="outline" onClick={() => setPromptEditorOpen(false)}>取消</Button>
              <Button onClick={savePromptTemplate}>保存</Button>
            </div>
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
                  {accounts.map((a: any) => (<SelectItem key={a.wechatAppid} value={a.wechatAppid}>{a.name}（{a.type === 'subscription' ? '订阅号' : '服务号'}）</SelectItem>))}
                </SelectContent>
              </Select>
              {accounts.length === 0 && (
                <div className="mt-2 text-xs text-muted-foreground">未获取到授权公众号，请在“发布管理→公众号API配置”中保存密钥，或手动输入 AppID。{accountsError?.error ? `错误：${accountsError.error}${accountsError.code ? `（${accountsError.code}）` : ''}` : ''}</div>
              )}
              <div className="mt-2">
                <Input value={customAppid} onChange={(e) => setCustomAppid(e.target.value)} placeholder="手动输入公众号AppID（可选）" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">发布类型</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-sm"><input type="radio" name="ptype_create" checked={publishType === 'news'} onChange={() => setPublishType('news')} />公众号文章</label>
                <label className="flex items-center gap-1 text-sm"><input type="radio" name="ptype_create" checked={publishType === 'newspic'} onChange={() => setPublishType('newspic')} />小绿书图文</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 items-center">
              {publishing && (
                <div className="w-full mb-4">
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]" style={{ width: `${publishProgress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs font-medium text-muted-foreground animate-pulse">正在发布到公众号...</span>
                    <span className="text-xs font-bold text-primary">{publishProgress}%</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                {publishError && !publishing && (
                  <div className="text-destructive text-xs w-full max-h-20 overflow-y-auto border border-destructive/20 bg-destructive/10 p-2 rounded">
                    {publishError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t mt-2">
                  <Button variant="outline" onClick={async () => {
                    const appid = selectedAccount || customAppid
                    const aid = lastArticleId
                    if (!appid || !aid || publishing) return
                    try {
                      setPublishing(true)
                      let finalContent = editedContent
                      let finalFormat = 'markdown'
                      if (publishType === 'news') {
                        const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('compose_theme') : null
                        let theme: 'hammer' | 'hammer-beige' | 'fresh-green' | 'default' = 'default'
                        if (savedTheme === 'hammer-theme') theme = 'hammer'
                        else if (savedTheme === 'hammer-beige-theme') theme = 'hammer-beige'
                        else if (savedTheme === 'fresh-green-theme') theme = 'fresh-green'
                        finalContent = mdToHtml(editedContent, theme)
                        finalFormat = 'html'
                      }
                      const r = await fetch('/api/publish/wechat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: aid, wechatAppid: appid, articleType: publishType, contentFormat: finalFormat, content: finalContent, dryRun: true }) })
                      const j = await r.json()
                      if (j.success) { setPublishPreview(j.data?.preview || null); setPublishError('') } else { setPublishError(j.error || '预览失败') }
                    } catch { setPublishError('预览失败') }
                    finally { setPublishing(false) }
                  }} disabled={publishing}>预览内容</Button>

                  <Button variant="outline" onClick={() => {
                    if (!publishing) {
                      setPublishError('');
                      setPublishOpen(false);
                      setPublishPreview(null)
                    }
                  }} disabled={publishing}>取消</Button>

                  <Button disabled={publishing} onClick={async () => {
                    const appid = selectedAccount || customAppid
                    const aid = lastArticleId
                    if (!appid || !aid) { setNotice('请选择或输入公众号AppID，并确认文章已保存'); setTimeout(() => setNotice(''), 3000); return }

                    try {
                      setPublishing(true)
                      setPublishProgress(10)
                      setPublishError('')

                      let finalContent = editedContent
                      let finalFormat = 'markdown'
                      if (publishType === 'news') {
                        const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('compose_theme') : null
                        let theme: 'hammer' | 'hammer-beige' | 'fresh-green' | 'default' = 'default'
                        if (savedTheme === 'hammer-theme') theme = 'hammer'
                        else if (savedTheme === 'hammer-beige-theme') theme = 'hammer-beige'
                        else if (savedTheme === 'fresh-green-theme') theme = 'fresh-green'
                        finalContent = mdToHtml(editedContent, theme)
                        finalFormat = 'html'
                      }

                      const r = await fetch('/api/publish/wechat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          articleId: aid,
                          wechatAppid: appid,
                          articleType: publishType,
                          contentFormat: finalFormat,
                          content: finalContent
                        })
                      })

                      setPublishProgress(60)
                      const j = await r.json()
                      setPublishProgress(90)

                      if (j.success) {
                        setPublishProgress(100)
                        setNotice('发布成功！')
                        setTimeout(() => setNotice(''), 3000)
                        setPublishOpen(false)
                      } else {
                        setPublishError(j.error || '发布失败')
                      }
                    } catch (e: any) {
                      setPublishError(e.message || '发布请求失败')
                    } finally {
                      setPublishing(false)
                    }
                  }} className="min-w-[80px]">
                    {publishing ? '发布中...' : '确认发布'}
                  </Button>
                </div>
              </div>

              {publishPreview && (
                <div className="mt-4 border rounded p-3 max-h-[40vh] overflow-auto">
                  <div className="text-sm font-medium text-muted-foreground mb-2">将发送到公众号的最终内容</div>
                  <div dangerouslySetInnerHTML={{ __html: (publishPreview?.contentFormat === 'html' ? publishPreview?.content : '') || '' }} />
                  {publishPreview?.contentFormat !== 'html' && (<pre className="text-xs whitespace-pre-wrap break-words">{String(publishPreview?.content || '')}</pre>)}
                  {Array.isArray(publishPreview?.images) && publishPreview.images.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">图片链接：{publishPreview.images.join(', ')}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Markdown预览</DialogTitle>
            <DialogDescription>以阅读器样式查看当前文章内容</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            <MarkdownViewer content={editedContent || ''} theme={themeIdToName(selectedTheme) as any} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInsertImageDialog} onOpenChange={setShowInsertImageDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>插入图片到光标处</DialogTitle>
            <DialogDescription>选择图片后将插入当前光标位置</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {imageList.map((img: any) => {
              const k = img.id || img.url
              const checked = !!insertCandidates.find((x: any) => (x.id || x.url) === k)
              return (
                <div key={k} className={`relative border-2 rounded-lg overflow-hidden cursor-pointer ${checked ? 'border-primary' : 'border-border'}`} onClick={() => {
                  setInsertCandidates(prev => checked ? prev.filter((x: any) => (x.id || x.url) !== k) : [...prev, img])
                }} onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); const url = img.localPath || img.displayUrl || img.url; insertAtCursor(`![配图 ${imageRatio}](${url})`, true); setShowInsertImageDialog(false) }}>
                  <img src={(() => { const raw = img.localPath || img.displayUrl || img.url; if (!raw) return ''; if (raw.startsWith('/uploads/') || raw.startsWith('/api/image-proxy')) return raw; try { const u = new URL(raw); return `/api/image-proxy?url=${encodeURIComponent(u.toString())}` } catch { return raw } })()} alt={img.alt || ''} className="w-full h-24 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowInsertImageDialog(false)}>取消</Button>
            <Button onClick={() => {
              const order = new Map(imageList.map((x: any, idx: number) => [x.id || x.url, idx]))
              const sorted = [...insertCandidates].sort((a: any, b: any) => (order.get(a.id || a.url) || 0) - (order.get(b.id || b.url) || 0))
              const md = sorted.map((img: any) => `![配图 ${imageRatio}](${img.localPath || img.displayUrl || img.url})`).join('\n\n')
              if (md) insertAtCursor(md)
              setShowInsertImageDialog(false)
            }}>确认插入</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 查看全部图片弹窗 */}
      <Dialog open={showAllImagesDialog} onOpenChange={(v) => { setShowAllImagesDialog(v); if (!v) { setSelectedAllImageIds([]) } }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>查看全部图片</DialogTitle>
            <DialogDescription>支持多选插入，双击图片立即插入到光标处</DialogDescription>
          </DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                setAllImagesLoading(true)
                const r = await fetch('/api/images/list?take=100')
                const j = await r.json()
                if (j.success) { setAllImages(j.data?.images || []) }
              } catch { }
              finally { setAllImagesLoading(false) }
            }}>刷新</Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedAllImageIds((selectedAllImageIds.length > 0 && selectedAllImageIds.length === allImages.length) ? [] : (allImages.map((x: any) => x.id).filter(Boolean)))}>{(selectedAllImageIds.length > 0 && selectedAllImageIds.length === allImages.length) ? '取消全选' : '全选'}</Button>
          </div>
          {allImagesLoading && (<div className="text-muted-foreground text-sm">加载中...</div>)}
          {!allImagesLoading && allImages.length === 0 && (<div className="text-muted-foreground text-sm">暂无图片，请点击“刷新”或前往文章管理生成/上传图片</div>)}
          <div className="grid grid-cols-2 gap-4 max-h-[55vh] overflow-auto">
            {allImages.map((img: any) => {
              const id = img.id || img.url
              const url = img.localPath || img.url
              const checked = selectedAllImageIds.includes(img.id)
              const display = (() => { const raw = url; if (!raw) return ''; if (raw.startsWith('/uploads/') || raw.startsWith('/api/image-proxy')) return raw; try { const u = new URL(raw); return `/api/image-proxy?url=${encodeURIComponent(u.toString())}` } catch { return raw } })()
              return (
                <div key={id} className="relative border rounded overflow-hidden cursor-pointer h-28 bg-center bg-cover" style={{ backgroundImage: `url(${display})` }} onDoubleClick={(e) => { e.preventDefault(); const ins = `![配图 ${imageRatio}](${url})`; insertAtCursor(ins, true); setShowAllImagesDialog(false) }}>
                  <label className="absolute top-2 left-2 bg-card/90 rounded px-2 py-1 text-xs flex items-center gap-1 select-none">
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      setSelectedAllImageIds(prev => e.target.checked ? (img.id ? [...prev, img.id] : prev) : prev.filter(x => x !== img.id))
                    }} /> 选择
                  </label>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAllImagesDialog(false)}>取消</Button>
            <Button onClick={() => {
              const order = new Map(allImages.map((x: any, idx: number) => [x.id, idx]))
              const sortedIds = [...selectedAllImageIds].sort((a, b) => (order.get(a) || 0) - (order.get(b) || 0))
              const md = sortedIds.map(id => {
                const item = allImages.find((x: any) => x.id === id)
                const url = item?.localPath || item?.url
                return url ? `![配图 ${imageRatio}](${url})` : ''
              }).filter(Boolean).join('\n\n')
              if (md) insertAtCursor(md)
              setShowAllImagesDialog(false)
            }}>插入已选</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 主题弹窗 */}
      <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>主题素材</DialogTitle>
            <DialogDescription>选择主题后可设为标题或插入到正文</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-auto">
            {themes.length === 0 && (
              <div className="text-muted-foreground text-sm">暂无主题，请稍后提供主题素材</div>
            )}
            {themes.map((t) => (
              <div key={t.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">{t.title}</div>
                  {t.description && (<div className="text-xs text-muted-foreground mt-1">{t.description}</div>)}
                </div>
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <span>默认开关</span>
                  <input type="checkbox" checked={selectedTheme === t.id} onChange={(e) => { const on = e.target.checked; const val = on ? t.id : (themes[0]?.id || null); setSelectedTheme(val); try { if (typeof window !== 'undefined') { if (val) window.localStorage.setItem('compose_theme', String(val)); else window.localStorage.removeItem('compose_theme') } } catch { } }} />
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setThemeOpen(false)}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>


    </div >
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <CreatePageContent />
    </Suspense>
  )
}
