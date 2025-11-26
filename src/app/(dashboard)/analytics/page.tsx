'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Users,
  Eye,
  MessageCircle,
  ThumbsUp,
  Share2,
  Calendar,
  Download
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function AnalyticsPage() {
  const stats = {
    totalViews: 45234,
    totalLikes: 3456,
    totalShares: 892,
    totalComments: 1234,
    engagementRate: 8.5,
    avgReadingTime: 4.2
  }

  const platformStats = [
    { name: '公众号', views: 28345, likes: 2345, engagement: 8.2 },
    { name: '小红书', views: 16889, likes: 1111, engagement: 8.8 }
  ]

  const topArticles = [
    {
      title: '2024年AI技术发展趋势深度分析',
      views: 8234,
      likes: 567,
      platform: '公众号'
    },
    {
      title: 'React 18新特性完整指南',
      views: 6789,
      likes: 445,
      platform: '小红书'
    },
    {
      title: '产品经理必备的5个数据分析工具',
      views: 4567,
      likes: 234,
      platform: '公众号'
    }
  ]

  // 模拟趋势数据
  const trendData = [
    { date: '11-01', value: 2400 },
    { date: '11-05', value: 1398 },
    { date: '11-10', value: 9800 },
    { date: '11-15', value: 3908 },
    { date: '11-20', value: 4800 },
    { date: '11-25', value: 3800 },
    { date: '11-30', value: 4300 },
  ]

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">数据分析</h1>
          <p className="text-muted-foreground mt-2">
            查看内容发布效果和用户互动数据
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-background">
            <Calendar className="mr-2 h-4 w-4" />
            选择日期范围
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 核心指标 - 响应式布局：1列 -> 2列 -> 3列 -> 6列，确保6个卡片排列整齐 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground truncate pr-8">总阅读量</p>
              <div className="flex items-baseline mt-2 gap-1">
                <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.totalViews.toLocaleString()}</p>
              </div>
              <p className="text-sm text-emerald-600 font-medium mt-2">+12.5%</p>
            </div>
            <Eye className="absolute top-6 right-6 h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground truncate pr-8">互动率</p>
              <div className="flex items-baseline mt-2 gap-1">
                <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.engagementRate}</p>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">%</span>
              </div>
              <p className="text-sm text-emerald-600 font-medium mt-2">+2.1%</p>
            </div>
            <TrendingUp className="absolute top-6 right-6 h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground truncate pr-8">平均阅读时长</p>
              <div className="flex items-baseline mt-2 gap-1">
                <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.avgReadingTime}</p>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">分钟</span>
              </div>
              <p className="text-sm text-rose-600 font-medium mt-2">-0.5%</p>
            </div>
            <MessageCircle className="absolute top-6 right-6 h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground truncate pr-8">总点赞数</p>
              <div className="flex items-baseline mt-2 gap-1">
                <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.totalLikes.toLocaleString()}</p>
              </div>
              <p className="text-sm text-emerald-600 font-medium mt-2">+8.3%</p>
            </div>
            <ThumbsUp className="absolute top-6 right-6 h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground truncate pr-8">总分享数</p>
              <div className="flex items-baseline mt-2 gap-1">
                <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.totalShares.toLocaleString()}</p>
              </div>
              <p className="text-sm text-emerald-600 font-medium mt-2">+15.2%</p>
            </div>
            <Share2 className="absolute top-6 right-6 h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground truncate pr-8">总评论数</p>
              <div className="flex items-baseline mt-2 gap-1">
                <p className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.totalComments.toLocaleString()}</p>
              </div>
              <p className="text-sm text-emerald-600 font-medium mt-2">+5.7%</p>
            </div>
            <MessageCircle className="absolute top-6 right-6 h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 平台对比 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">平台表现对比</CardTitle>
            <CardDescription className="text-muted-foreground">
              不同平台的内容表现数据对比
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformStats.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-bold text-foreground">{platform.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        互动率: {platform.engagement}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">阅读</div>
                    <div className="text-xl font-bold text-foreground">{platform.views.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 热门文章 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">热门文章</CardTitle>
            <CardDescription className="text-muted-foreground">
              阅读量和互动量最高的文章
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topArticles.map((article, index) => (
                <div key={index} className="flex items-start justify-between group">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {index + 1}. {article.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {article.platform} • 阅读 {article.views.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <ThumbsUp className="h-4 w-4 mr-1.5" />
                      {article.likes}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 趋势分析 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">30天趋势分析</CardTitle>
          <CardDescription className="text-muted-foreground">
            内容表现的趋势变化分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
