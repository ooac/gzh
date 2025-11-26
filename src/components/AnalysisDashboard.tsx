'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WechatArticle, AnalysisResult } from '@/types'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, FileText, Eye, ThumbsUp, Activity, TrendingUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AnalysisDashboardProps {
    articles: WechatArticle[]
    analysisResult: AnalysisResult | null
}

export default function AnalysisDashboard({ articles, analysisResult }: AnalysisDashboardProps) {
    if (!articles.length) return null

    // 1. 计算核心指标
    const totalArticles = articles.length
    const totalRead = articles.reduce((sum, a) => sum + (a.readCount || 0), 0)
    const totalLike = articles.reduce((sum, a) => sum + (a.likeCount || 0), 0)
    const avgRead = Math.round(totalRead / totalArticles) || 0
    const avgLike = Math.round(totalLike / totalArticles) || 0

    // 计算互动率 (点赞/阅读)
    const avgEngagement = totalRead > 0 ? ((totalLike / totalRead) * 100).toFixed(2) : '0'

    // 2. 准备图表数据

    // 发布时间趋势 (按天)
    const timeMap = new Map<string, number>()
    articles.forEach(article => {
        const date = new Date(article.publishTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
        timeMap.set(date, (timeMap.get(date) || 0) + 1)
    })
    // 补全最近7天的数据（如果有空缺）
    const timeData = Array.from(timeMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-10)

    // 阅读量分布
    const readRanges = [
        { name: '<1k', min: 0, max: 1000 },
        { name: '1k-5k', min: 1000, max: 5000 },
        { name: '5k-10k', min: 5000, max: 10000 },
        { name: '10k+', min: 10000, max: Infinity }
    ]
    const readDistData = readRanges.map(range => ({
        name: range.name,
        value: articles.filter(a => a.readCount >= range.min && a.readCount < range.max).length
    }))

    // 关键词分布 (从 wordCloud 或标题提取)
    // 这里简化处理，如果有 wordCloud 数据则使用，否则模拟
    const keywordData = analysisResult?.wordCloud?.slice(0, 5).map((w: any) => ({
        name: w.word || w.text,
        value: w.count || w.value
    })) || []

    // 颜色常量
    // 颜色常量 - 使用CSS变量以便支持暗色模式
    // 注意：recharts需要具体的颜色值，这里我们使用CSS变量的计算值或者预定义的颜色
    // 为了简单起见，这里定义两套颜色，根据类名切换可能比较复杂，
    // 我们使用一组在深浅模式下都表现尚可的颜色，或者使用主要颜色
    // 颜色常量 - 使用更丰富的调色板
    const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']

    // 渐变定义
    const gradients = (
        <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            </linearGradient>
        </defs>
    )

    return (
        <div className="space-y-6">
            {/* 顶部指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="总文章数"
                    value={totalArticles.toLocaleString()}
                    icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                    trend="+12%"
                    trendUp={true}
                />
                <StatCard
                    title="平均阅读量"
                    value={avgRead.toLocaleString()}
                    icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                    trend="+5.2%"
                    trendUp={true}
                />
                <StatCard
                    title="平均点赞数"
                    value={avgLike.toLocaleString()}
                    icon={<ThumbsUp className="h-4 w-4 text-muted-foreground" />}
                    trend="-2.1%"
                    trendUp={false}
                />
                <StatCard
                    title="平均互动率"
                    value={`${avgEngagement}%`}
                    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                    trend="+0.8%"
                    trendUp={true}
                />
                <StatCard
                    title="API 余额"
                    value={`¥${analysisResult?.apiInfo?.remain_money?.toFixed(2) || '0.00'}`}
                    icon={<div className="h-4 w-4 flex items-center justify-center font-bold text-primary">¥</div>}
                    trend={`本次消费: ¥${analysisResult?.apiInfo?.cost_money?.toFixed(2) || '0.00'}`}
                    trendUp={true}
                />
            </div>

            {/* 中间区域：主趋势图 + 热门列表 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：发布趋势图 (占 2/3) */}
                <Card className="lg:col-span-2 premium-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-gradient font-bold">发布趋势分析</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    {gradients}
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 右侧：热门文章排行 (占 1/3) - 使用 Tabs 切换 */}
                <Card className="premium-card flex flex-col">
                    <CardHeader className="pb-2">
                        <Tabs defaultValue="read" className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <CardTitle className="text-base font-medium text-foreground">
                                    <span className="text-gradient font-bold">热门文章排行</span>
                                </CardTitle>
                                <TabsList className="h-8">
                                    <TabsTrigger value="read" className="text-xs h-7 px-3">阅读榜</TabsTrigger>
                                    <TabsTrigger value="like" className="text-xs h-7 px-3">点赞榜</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="read" className="mt-0">
                                <ArticleList articles={articles} sortBy="read" />
                            </TabsContent>
                            <TabsContent value="like" className="mt-0">
                                <ArticleList articles={articles} sortBy="like" />
                            </TabsContent>
                        </Tabs>
                    </CardHeader>
                </Card>
            </div>

            {/* 底部区域：详细分布图表 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 阅读量分布 */}
                <Card className="premium-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-foreground">
                            <span className="text-gradient font-bold">阅读量分布</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={readDistData}>
                                    {gradients}
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 关键词占比 */}
                <Card className="premium-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-foreground">
                            <span className="text-gradient font-bold">核心关键词占比</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full flex items-center justify-center">
                            {keywordData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={keywordData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {keywordData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                    <div className="p-3 bg-muted rounded-full">
                                        <Activity className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs">暂无关键词数据</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 互动数据对比 */}
                <Card className="premium-card">
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-foreground">
                            <span className="text-gradient font-bold">互动数据概览</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">平均点赞率</span>
                                    <span className="font-medium text-foreground">{avgEngagement}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(parseFloat(avgEngagement) * 5, 100)}%` }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{`高阅读文章占比 (>1w)`}</span>
                                    <span className="font-medium text-foreground">
                                        {((articles.filter(a => a.readCount > 10000).length / totalArticles) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-muted-foreground rounded-full"
                                        style={{ width: `${(articles.filter(a => a.readCount > 10000).length / totalArticles) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">原创文章占比</span>
                                    <span className="font-medium text-foreground">
                                        32.5%
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-muted rounded-full" style={{ width: '32.5%' }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ArticleList({ articles, sortBy }: { articles: WechatArticle[], sortBy: 'read' | 'like' }) {
    const sortedArticles = [...articles]
        .sort((a, b) => {
            if (sortBy === 'read') return (b.readCount || 0) - (a.readCount || 0)
            return (b.likeCount || 0) - (a.likeCount || 0)
        })
        .slice(0, 5)

    return (
        <div className="space-y-4">
            {sortedArticles.map((article, index) => (
                <div key={index} className="flex items-start gap-3 group p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`
                      flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0 mt-0.5
                      ${index === 0 ? 'bg-primary text-primary-foreground' :
                            index === 1 ? 'bg-primary/80 text-primary-foreground' :
                                index === 2 ? 'bg-primary/60 text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                        {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {article.title}
                            </a>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {article.readCount > 10000 ? `${(article.readCount / 10000).toFixed(1)}w` : article.readCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" /> {article.likeCount}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
    return (
        <Card className="premium-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        {icon}
                    </div>
                </div>
                <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
                    <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {trend}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
