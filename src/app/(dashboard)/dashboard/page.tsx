'use client'

import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  TrendingUp,
  Users,
  Eye,
  ArrowUpRight,
  Calendar,
  Clock,
  Wand2,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Activity
} from 'lucide-react'
import ThemeIcon from '@/components/ThemeIcon'

interface Article {
  id: string
  title: string
  status: string
  platform: string[]
  readCount: number
  likeCount: number
  publishTime: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const stats = [
    {
      title: '总文章数',
      value: '156',
      change: '+12%',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: '本月发布',
      value: '23',
      change: '+8%',
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: '总阅读量',
      value: '45.2K',
      change: '+23%',
      icon: Eye,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: '互动率',
      value: '8.5%',
      change: '+2.1%',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ]

  const [recentArticles, setRecentArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentArticles()
  }, [])

  const fetchRecentArticles = async () => {
    try {
      const res = await fetch('/api/articles?limit=6')
      if (res.ok) {
        const json = await res.json()

        if (json.success && json.data && Array.isArray(json.data.articles)) {
          const articles = json.data.articles

          // Sort by createdAt desc and take top 6
          const sorted = articles.sort((a: any, b: any) =>
            new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime()
          ).slice(0, 6)

          // Map to display format
          const mapped = sorted.map((article: any) => {
            const statusLower = (article.status || '').toLowerCase()
            let statusDisplay = article.status
            if (statusLower === 'published') statusDisplay = '已发布'
            else if (statusLower === 'draft') statusDisplay = '草稿'
            else if (statusLower === 'pending') statusDisplay = '待发布'

            return {
              id: article.id,
              title: article.title,
              status: statusDisplay,
              platform: article.platform ? (Array.isArray(article.platform) ? article.platform : [article.platform]) : [],
              readCount: article.readCount || 0,
              likeCount: article.likeCount || 0,
              publishTime: article.publishTime
                ? new Date(article.publishTime).toLocaleDateString()
                : (article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '刚刚')
            }
          })
          setRecentArticles(mapped)
        } else {
          console.error('API returned invalid format:', json)
          setRecentArticles([])
        }
      } else {
        console.error('API request failed')
        setRecentArticles([])
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      setRecentArticles([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已发布':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case '草稿':
        return 'bg-secondary text-secondary-foreground border-border'
      case '待发布':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case '公众号':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case '小红书':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-secondary text-secondary-foreground border-border'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 页面标题区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            早安，<span className="text-gradient">Admin</span>
          </h1>
          <p className="text-muted-foreground mt-2">准备好开始今天的创作了吗？</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push('/analytics')}
          >
            <TrendingUp className="h-4 w-4" />
            查看分析
          </Button>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/create')}
          >
            <FileText className="h-4 w-4" />
            新建文章
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="premium-card border-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className="w-24 h-24 text-primary transform rotate-12 translate-x-8 -translate-y-8" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${stat.change.startsWith('+')
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-destructive/10 text-destructive'
                    }`}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-foreground mt-1 group-hover:text-primary transition-colors">
                    {stat.value}
                  </h3>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* 最近文章 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              最近文章
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => router.push('/articles')}
            >
              查看全部 <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {recentArticles.map((article) => (
              <Card
                key={article.id}
                className="premium-card hover:shadow-md transition-all duration-300 group hover:border-primary/50 cursor-pointer"
                onClick={() => router.push(`/create?tab=rewrite&articleId=${article.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1 text-sm sm:text-base">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {article.publishTime || '未发布'}
                        </span>
                        {article.platform.length > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                            <div className="flex gap-1">
                              {article.platform.map(p => (
                                <span key={p} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-foreground">{article.readCount.toLocaleString()} 阅读</div>
                      <div className="text-xs text-muted-foreground">{article.likeCount} 点赞</div>
                    </div>
                    <Badge className={cn("border-0 px-2.5 py-0.5 font-normal", getStatusColor(article.status))}>
                      {article.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 侧边栏：快速操作 & 系统状态 */}
        <div className="space-y-6 sticky top-6">
          {/* 快速操作 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between h-9">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                快速操作
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className="premium-card cursor-pointer hover:shadow-md transition-all duration-300 group hover:-translate-y-1 hover:border-primary/50"
                onClick={() => router.push('/create')}
              >
                <CardContent className="p-5 flex flex-col justify-between h-40">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">AI 写作</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="premium-card cursor-pointer hover:shadow-md transition-all duration-300 group hover:-translate-y-1 hover:border-primary/50"
                onClick={() => router.push('/create')}
              >
                <CardContent className="p-5 flex flex-col justify-between h-40">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">配图生成</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="premium-card cursor-pointer hover:shadow-md transition-all duration-300 group hover:-translate-y-1 hover:border-primary/50"
                onClick={() => router.push('/analytics')}
              >
                <CardContent className="p-5 flex flex-col justify-between h-40">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">数据报表</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </CardContent>
              </Card>

              <Card
                className="premium-card cursor-pointer hover:shadow-md transition-all duration-300 group hover:-translate-y-1 hover:border-primary/50"
                onClick={() => router.push('/settings')}
              >
                <CardContent className="p-5 flex flex-col justify-between h-40">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">系统设置</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 系统状态 */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base font-bold text-foreground">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  系统状态
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-normal">
                  运行正常
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API 额度使用</span>
                    <span className="font-bold text-foreground">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">存储空间</span>
                    <span className="font-bold text-foreground">42%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: '42%' }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>上次同步</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 10分钟前
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
