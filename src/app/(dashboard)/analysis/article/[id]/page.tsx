'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, ThumbsUp, TrendingUp, Calendar, User, ExternalLink, Share2, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ImageRenderer from '@/components/ImageRenderer'

interface ArticlePageProps {
  params: Promise<{
    id: string
  }>
}

interface ArticleData {
  id: string
  title: string
  content: string
  author: string
  readCount: number
  likeCount: number
  lookingCount: number
  engagementRate: string
  publishTime: string
  url: string
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const fromParam = searchParams.get('from') || 'articles' // 默认从文章列表来
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        let apiUrl = `/api/articles/${resolvedParams.id}`
        let finalId = resolvedParams.id

        // 处理复杂的URL格式（旧数据）
        // 例如：https:/mp.weixin.qq.com/s/EVMb5nXjS--2V2TQr0ZL_A?url=...
        if (resolvedParams.id.includes('mp.weixin.qq.com') ||
          resolvedParams.id.startsWith('http://') ||
          resolvedParams.id.startsWith('https://')) {

          // 如果包含查询参数，提取出基础URL
          let baseUrl = resolvedParams.id
          if (baseUrl.includes('?url=')) {
            baseUrl = baseUrl.split('?url=')[0]
          }
          if (baseUrl.includes('&')) {
            baseUrl = baseUrl.split('&')[0]
          }

          // 修复可能的URL格式问题（如缺少斜杠的 https:/）
          if (baseUrl.startsWith('https:/') && !baseUrl.startsWith('https://')) {
            baseUrl = baseUrl.replace('https:/', 'https://')
          }
          if (baseUrl.startsWith('http:/') && !baseUrl.startsWith('http://')) {
            baseUrl = baseUrl.replace('http:/', 'http://')
          }

          finalId = baseUrl
          apiUrl = `/api/articles/by-url?url=${encodeURIComponent(baseUrl)}`
        }

        const response = await fetch(apiUrl)
        const result = await response.json()

        if (result.success) {
          setArticle(result.data)
        } else {
          setError(result.error || '获取文章失败')
        }
      } catch (err) {
        console.error('获取文章失败:', err)
        setError('网络错误，请重试')
      } finally {
        setLoading(false)
      }
    }

    if (resolvedParams.id) {
      fetchArticle()
    }
  }, [resolvedParams.id])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const calculateEngagementRate = () => {
    if (!article) return '0%'
    if (article.readCount === 0) return '0%'
    return ((article.likeCount / article.readCount) * 100).toFixed(2) + '%'
  }

  // 统一解析和格式化文章内容
  const parseArticleContent = (content: string) => {
    if (!content) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          文章内容暂不可用
        </div>
      )
    }

    // 清理内容，移除多余的空白字符
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()

    // 如果内容为空，返回提示信息
    if (!cleanContent || cleanContent.length < 10) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          文章内容过短或暂不可用
        </div>
      )
    }

    // 使用正则表达式匹配图片
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    type Part =
      | { type: 'text', content: string }
      | { type: 'image', content: { alt: string, src: string } }
    const parts: Part[] = []
    let lastIndex = 0
    let match

    // 分割文本和图片
    while ((match = imageRegex.exec(content)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        const textContent = content.substring(lastIndex, match.index)
        if (textContent.trim()) {
          parts.push({ type: 'text', content: textContent })
        }
      }

      // 添加图片
      parts.push({
        type: 'image',
        content: {
          alt: match[1] || '图片',
          src: match[2]
        }
      })

      lastIndex = match.index + match[0].length
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex)
      if (remainingText.trim()) {
        parts.push({ type: 'text', content: remainingText })
      }
    }

    // 如果没有找到图片，整个内容作为文本处理
    if (parts.length === 0) {
      parts.push({ type: 'text', content: cleanContent })
    }

    // 处理文本部分：按句号、问号、感叹号分割成段落
    const processTextContent = (text: string) => {
      const sentences = text.match(/[^。！？.!?]+[。！？.!?]?/g) || [text]
      const paragraphs: string[] = []
      let currentParagraph = ''

      sentences.forEach((sentence, index) => {
        const trimmedSentence = sentence.trim()
        if (!trimmedSentence) return

        currentParagraph += trimmedSentence

        // 计算当前段落的句子数量
        const sentenceCount = currentParagraph.match(/[。！？.!?]/g)?.length || 0

        // 如果达到合适的句子数量或是最后一句，就分段
        if (sentenceCount >= 5 || index === sentences.length - 1) {
          if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim())
          }
          currentParagraph = ''
        }
      })

      return paragraphs.length > 0 ? paragraphs : [text]
    }

    // 渲染内容
    return (
      <div className="space-y-6">
        {parts.map((part, partIndex) => {
          if (part.type === 'text') {
            const paragraphs = processTextContent(part.content)
            return (
              <div key={`text-${partIndex}`} className="space-y-6">
                {paragraphs.map((paragraph, index) => (
                  <p
                    key={`para-${partIndex}-${index}`}
                    className={cn(
                      "leading-relaxed text-justify text-base transition-colors",
                      index === 0 && partIndex === 0
                        ? "font-medium text-[17px] text-foreground border-l-4 border-primary pl-4 bg-primary/5 rounded-r-lg py-2 my-6"
                        : "text-muted-foreground my-5"
                    )}
                    style={{
                      textIndent: index === 0 && partIndex === 0 ? '0' : '2em',
                      minHeight: '1.8em'
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )
          } else if (part.type === 'image') {
            return (
              <div key={`img-${partIndex}`} className="my-6">
                <div className="flex justify-center">
                  <ImageRenderer
                    src={part.content.src}
                    alt={part.content.alt}
                    className="max-w-full h-auto rounded-lg shadow-md"
                    fallbackText="图片加载失败"
                  />
                </div>
                {part.content.alt && part.content.alt !== '图片' && (
                  <p className="text-center text-sm text-muted-foreground mt-2 italic">
                    {part.content.alt}
                  </p>
                )}
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  const handleShare = () => {
    if (!article) return
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `来自 ${article.author} 的精彩文章`,
        url: article.url
      })
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(article.url)
      alert('文章链接已复制到剪贴板')
    }
  }

  const handleBookmark = () => {
    // 这里可以实现收藏功能
    alert('收藏功能即将上线')
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Link href={`/analysis?tab=${fromParam}`}>
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {fromParam === 'search' ? '返回搜索结果' : '返回文章列表'}
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-4">加载失败</div>
            <div className="text-muted-foreground">{error || '文章不存在'}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link href={`/analysis?tab=${fromParam}`}>
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromParam === 'search' ? '返回搜索结果' : '返回文章列表'}
          </Button>
        </Link>
      </div>

      {/* 文章内容 */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* 标题 */}
            <CardTitle className="text-2xl font-bold text-foreground leading-tight">
              {article.title}
            </CardTitle>

            {/* 文章元信息 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(article.publishTime)}</span>
              </div>
              {article.url && (
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    查看原文
                  </a>
                </div>
              )}
            </div>

            {/* 数据统计 */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">阅读</span>
                <span className="font-semibold text-primary">
                  {formatNumber(article.readCount)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ThumbsUp className="h-5 w-5 text-destructive" />
                <span className="text-muted-foreground">点赞</span>
                <span className="font-semibold text-destructive">
                  {formatNumber(article.likeCount)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-muted-foreground">互动率</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {calculateEngagementRate()}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2">
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
              <Button onClick={handleBookmark} variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                收藏
              </Button>
              {article.url && (
                <Button asChild variant="outline" size="sm">
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    打开原文
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => router.push(`/create?tab=rewrite&from=wechat&id=${article?.id}`)}>
                改写文章
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 文章内容 */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <style jsx>{`
              .article-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.8;
                font-size: 16px;
                word-spacing: 0.05em;
                letter-spacing: 0.02em;
              }

              @media (max-width: 768px) {
                .article-content {
                  font-size: 15px;
                  line-height: 1.7;
                }
              }
            `}</style>
            <div className="article-content">
              {parseArticleContent(article.content)}
            </div>
          </div>

          {/* 文章底部信息 */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                发布时间: {formatDate(article.publishTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                数据来源: 微信公众号
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 相关操作 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">快速操作</CardTitle>
            <CardDescription>
              基于此文章相关的功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              基于此主题搜索更多文章
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" />
              查看作者更多文章
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Share2 className="h-4 w-4 mr-2" />
              分享到社交媒体
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">数据洞察</CardTitle>
            <CardDescription>
              基于文章数据的分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">阅读表现</span>
                <Badge
                  variant={article.readCount > 10000 ? "default" : "secondary"}
                >
                  {article.readCount > 10000 ? "优秀" : "一般"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">互动表现</span>
                <Badge
                  variant={parseFloat(calculateEngagementRate()) > 5 ? "default" : "secondary"}
                >
                  {parseFloat(calculateEngagementRate()) > 5 ? "高" : "中"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>💡 建议此类互动率的内容可以作为优质内容创作的参考</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}