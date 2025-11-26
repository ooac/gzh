import { NextRequest, NextResponse } from 'next/server'
import { getSearchHistoryById } from '@/lib/db/operations'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { searchHistoryId, keyword } = await request.json()

    // 如果传入 keyword，则导出该关键词最近报告
    if (keyword) {
      const history = await prisma.searchHistory.findFirst({
        where: { keyword },
        orderBy: { searchDate: 'desc' },
        include: { articles: true, reports: true }
      })
      if (!history) {
        return NextResponse.json({ success: false, error: '该关键词暂无历史' }, { status: 404 })
      }
      const markdown = generateMarkdown(history)
      const headers = new Headers()
      headers.set('Content-Type', 'text/markdown; charset=utf-8')
      const timestamp = new Date().toISOString().split('T')[0]
      const safeKeyword = history.keyword.replace(/[^\x00-\x7F]/g, '_')
      const filename = `${safeKeyword}_analysis_report_${timestamp}.md`
      headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
      return new NextResponse(markdown, { status: 200, headers })
    }

    if (!searchHistoryId) {
      return NextResponse.json(
        { success: false, error: '缺少搜索历史ID或关键词' },
        { status: 400 }
      )
    }

    // 获取搜索历史详情
    const searchHistory = await getSearchHistoryById(searchHistoryId)
    if (!searchHistory) {
      return NextResponse.json(
        { success: false, error: '未找到该搜索记录' },
        { status: 404 }
      )
    }

    // 生成Markdown内容
    const markdown = generateMarkdown(searchHistory)

    // 设置响应头，告诉浏览器这是一个文件下载
    const headers = new Headers()
    headers.set('Content-Type', 'text/markdown; charset=utf-8')

    // 对文件名进行 URL 编码以解决中文字符问题
    const timestamp = new Date().toISOString().split('T')[0]
    const safeKeyword = searchHistory.keyword.replace(/[^\x00-\x7F]/g, '_') // 替换非ASCII字符为下划线
    const filename = `${safeKeyword}_analysis_report_${timestamp}.md`

    console.log('处理后的文件名:', filename)

    headers.set('Content-Type', 'text/markdown; charset=utf-8')
    // 使用 RFC 5987 编码格式支持中文文件名
    const encodedFilename = encodeURIComponent(filename)
    headers.set(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFilename}`
    )

    return new NextResponse(markdown, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('导出Markdown失败:', error)
    return NextResponse.json(
      { success: false, error: '导出失败' },
      { status: 500 }
    )
  }
}

function generateMarkdown(searchHistory: any): string {
  const { keyword, totalArticles, apiCost, apiInfo, articles, searchDate, reports } = searchHistory

  // 获取分析报告数据
  const analysisReport = reports && reports.length > 0
    ? [...reports].sort((a:any,b:any)=> new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0]
    : null
  const analysisData = analysisReport ? JSON.parse(analysisReport.analysisData) : null
  const wordCloudData = analysisReport ? JSON.parse(analysisReport.wordCloudData) : []
  const insightsData = analysisReport ? JSON.parse(analysisReport.insightsData) : []
  const materialsJson = analysisReport && (analysisReport as any).materialsJson ? JSON.parse((analysisReport as any).materialsJson as any) : []

  const generateDate = new Date(searchDate).toLocaleString('zh-CN')

  let markdown = `# ${keyword} - 选题分析报告

> **生成时间**: ${generateDate}
> **搜索关键词**: ${keyword}
> **找到文章数**: ${totalArticles.toLocaleString()} 篇
> **API费用**: ¥${apiCost.toFixed(2)}
> **API余额**: ¥${apiInfo?.remain_money.toFixed(2) || 'N/A'}

---

## 📊 数据概览

### 搜索统计
- **关键词**: ${keyword}
- **找到文章总数**: ${totalArticles.toLocaleString()} 篇
- **搜索时间**: ${generateDate}
- **API花费**: ¥${apiCost.toFixed(2)}

### 文章表现分析
`

  // 添加文章表现统计
  if (articles.length > 0) {
    const avgReadCount = Math.round(articles.reduce((sum: number, a: any) => sum + a.readCount, 0) / articles.length)
    const avgLikeCount = Math.round(articles.reduce((sum: number, a: any) => sum + a.likeCount, 0) / articles.length)
    const maxReadCount = Math.max(...articles.map((a: any) => a.readCount))
    const maxLikeCount = Math.max(...articles.map((a: any) => a.likeCount))
    const topReadArticle = articles.reduce((max: any, a: any) => a.readCount > max.readCount ? a : max, articles[0])
    const topLikeArticle = articles.reduce((max: any, a: any) => a.likeCount > max.likeCount ? a : max, articles[0])

    markdown += `- **平均阅读量**: ${avgReadCount.toLocaleString()} 次
- **平均点赞数**: ${avgLikeCount.toLocaleString()} 次
- **最高阅读量**: ${maxReadCount.toLocaleString()} 次
- **最高点赞数**: ${maxLikeCount.toLocaleString()} 次

### 阅读量分布
`

    // 阅读量分布
    const readRanges = [
      { name: '0-1K', min: 0, max: 1000 },
      { name: '1K-10K', min: 1000, max: 10000 },
      { name: '10K-50K', min: 10000, max: 50000 },
      { name: '50K-100K', min: 50000, max: 100000 },
      { name: '100K+', min: 100000, max: Infinity }
    ]

    readRanges.forEach(range => {
      const count = articles.filter((a: any) => a.readCount >= range.min && a.readCount < range.max).length
      markdown += `- **${range.name}**: ${count} 篇文章 (${((count / articles.length) * 100).toFixed(1)}%)\n`
    })

    markdown += `
### 发布时间分布
`

    // 发布时间分布
    const timeMap = new Map<string, number>()
    articles.forEach((article: any) => {
      const date = new Date(article.publishTime).toLocaleDateString('zh-CN')
      timeMap.set(date, (timeMap.get(date) || 0) + 1)
    })

    Array.from(timeMap.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(([date, count]) => {
        markdown += `- **${date}**: ${count} 篇文章\n`
      })
  }

  markdown += `

---

## 🔥 热门文章排行

### 📖 阅读量最高的文章

`

  // 点赞量最高文章
  if (analysisData && analysisData.topLikedArticles) {
    analysisData.topLikedArticles.forEach((article: any, index: number) => {
      markdown += `${index + 1}. **${article.title}**
   - 作者: ${article.author}
   - 阅读量: ${article.readCount.toLocaleString()}
   - 点赞数: ${article.likeCount.toLocaleString()}
   - 发布时间: ${new Date(article.publishTime).toLocaleDateString('zh-CN')}
   - 链接: [查看原文](${article.url})

`
    })
  }

  markdown += `### 💬 互动率最高的文章

`

  // 互动率最高文章
  if (analysisData && analysisData.topEngagementArticles) {
    analysisData.topEngagementArticles.forEach((article: any, index: number) => {
      markdown += `${index + 1}. **${article.title}**
   - 作者: ${article.author}
   - 阅读量: ${article.readCount.toLocaleString()}
   - 点赞数: ${article.likeCount.toLocaleString()}
   - 互动率: ${article.engagementRate}%
   - 发布时间: ${new Date(article.publishTime).toLocaleDateString('zh-CN')}
   - 链接: [查看原文](${article.url})

`
    })
  }

  markdown += `---

## ☁️ 高频词云

`

  // 词云数据
  if (wordCloudData.length > 0) {
    wordCloudData.slice(0, 20).forEach((item: any, index: number) => {
      markdown += `${index + 1}. **${item.word}** (出现${item.count}次)\n`
    })
  }

  markdown += `---

## 💡 AI选题洞察

`

  // 洞察建议
  const cleanedInsights = Array.isArray(insightsData) ? insightsData.filter((s: string) => {
    if (!s) return false
    const t = s.trim()
    if (!t) return false
    if (t.includes('```json') || t.includes('素材JSON样例')) return false
    if (t === '测试响应成功') return false
    return true
  }) : []
  if (cleanedInsights.length > 0) {
    cleanedInsights.forEach((insight: string, index: number) => {
      markdown += `${index + 1}. ${insight}\n\n`
    })
  } else {
    const topTitles = articles.slice(0,5).map((a:any)=>a.title).join('、')
    markdown += `1. 基于当前数据的基础诊断：关键词 ${keyword}，Top标题：${topTitles}。建议围绕数据证据与场景，输出可执行清单。\n\n`
  }

  markdown += `---

## 📋 完整文章列表

`

  // 完整文章列表
  if (articles.length > 0) {
    articles.forEach((article: any, index: number) => {
      markdown += `### ${index + 1}. ${article.title}

**作者**: ${article.author}
**发布时间**: ${new Date(article.publishTime).toLocaleString('zh-CN')}
**阅读量**: ${article.readCount.toLocaleString()}
**点赞数**: ${article.likeCount.toLocaleString()}
**互动率**: ${article.engagementRate}%

**内容摘要**:
${article.content.substring(0, 200)}...

**原文链接**: [查看完整文章](${article.url})

---

`
    })
  }

  markdown += `
---

## 📈 数据分析说明

本报告基于微信公众号文章搜索数据生成，包含以下分析维度：

- **数据来源**: 微信公众号实时搜索
- **分析时间**: ${generateDate}
- **关键词**: ${keyword}
- **样本数量**: ${totalArticles.toLocaleString()} 篇文章
- **分析维度**: 阅读量、点赞数、互动率、发布时间、关键词频率

### 指标说明

- **阅读量**: 文章在微信平台的阅读次数
- **点赞数**: 文章获得的点赞数量
- **互动率**: (点赞数 / 阅读数) × 100%，反映读者参与度
- **高频词**: 基于文章内容提取的关键词频率分析

---

*本报告由内容工厂AI系统自动生成*
  *生成时间: ${generateDate}*
`

  if (materialsJson && materialsJson.length > 0) {
    markdown += `\n---\n\n## 📦 素材要点清单\n\n`
    materialsJson.slice(0,5).forEach((m:any, i:number)=>{
      const tags = Array.isArray(m.styleTags)? m.styleTags.join('、') : ''
      const points = Array.isArray(m.points)? m.points.join('；') : ''
      const evid = Array.isArray(m.evidence)? m.evidence.map((e:any)=>e.source).join('；') : ''
      const checklist = Array.isArray(m.actionChecklist)? m.actionChecklist.join('；') : ''
      const tone = m.tone || ''
      markdown += `### 素材${i+1}\n- 标题：${m.title || ''}\n- 来源类型：${m.sourceType || ''}\n- 风格标签：${tags}\n- 证据强度：${m.evidenceStrength || ''}\n- 观点要点：${points}\n- 证据链接：${evid}\n- 推荐语气：${tone}\n- 操作清单：${checklist}\n\n`
    })

    const mats = materialsJson.slice(0,5)
    const titlePool: string[] = []
    mats.forEach((m:any)=>{
      const tag = Array.isArray(m.styleTags) && m.styleTags[0] ? m.styleTags[0] : '实用'
      const p = Array.isArray(m.points) && m.points[0] ? m.points[0] : (m.title || keyword)
      titlePool.push(`${p}：${keyword}的${tag}打法`)
      titlePool.push(`${keyword}：${tag}创作的三个真相`)
      titlePool.push(`用${p}拿下互动率：${keyword}的实操清单`)
      titlePool.push(`${keyword}还能这么写？${tag}风格的高效套路`)
    })
    while (titlePool.length < 10) { titlePool.push(`${keyword}的5个可复制爆点`) }

    const hookPool: string[] = []
    mats.forEach((m:any)=>{
      const p = Array.isArray(m.points) && m.points[0] ? m.points[0] : keyword
      hookPool.push(`先看数据，再给答案：${p}`)
      hookPool.push(`只用三个步骤，把${keyword}写成爆款`)
    })
    while (hookPool.length < 6) { hookPool.push(`这条技巧，直接提升完读率`) }

    let vpCount = 0
    markdown += `\n---\n\n## 🧠 标题库（10条）\n\n`
    titlePool.slice(0,10).forEach((t:string,i:number)=>{ markdown += `${i+1}. ${t}\n` })
    markdown += `\n---\n\n## 🎯 钩子库（6条）\n\n`
    hookPool.slice(0,6).forEach((h:string,i:number)=>{ markdown += `${i+1}. ${h}\n` })
    markdown += `\n---\n\n## 📚 观点-证据对照表（≥10对）\n\n`
    mats.forEach((m:any)=>{
      const pts = Array.isArray(m.points)? m.points : []
      const evs = Array.isArray(m.evidence)? m.evidence : []
      pts.forEach((pt:string)=>{
        const links = evs.slice(0,2).map((e:any)=>e.source).filter(Boolean)
        markdown += `- 观点：${pt}\n  - 证据：${links.join('；') || '数据与案例待补充'}\n  - 引语：${m.hook || '结合读者收益的承诺语'}\n`
        vpCount++
      })
    })
    if (vpCount < 10) {
      const fill = articles.slice(0, Math.max(0,10-vpCount))
      fill.forEach((a:any)=>{ markdown += `- 观点：${a.title}\n  - 证据：${a.url}\n  - 引语：数据驱动的结论\n` })
    }

    markdown += `\n---\n\n## 🛠️ 行动清单与话术（AIDA）\n\n`
    const anchor = mats[0] || {}
    const anchorPoint = Array.isArray(anchor.points) && anchor.points[0] ? anchor.points[0] : keyword
    const anchorLink = Array.isArray(anchor.evidence) && anchor.evidence[0]?.source ? anchor.evidence[0].source : ''
    markdown += `### A. 吸引注意\n- 话术：${anchorPoint}，这是你今天能立刻用的技巧\n### I. 激发兴趣\n- 依据：${anchorLink || '引用数据或案例链接'}\n- 话术：给出反常识与收益承诺\n### D. 激发欲望\n- 步骤：列出3步操作清单\n- 话术：用读者语言重复收益\n### A. 行动召唤\n- CTA：收藏/转发/下载素材/加入社群\n\n`

    markdown += `---\n\n## 🖼️ 视觉建议与版式\n\n- 封面文案：数据型/故事型/清单型各1版\n- 配图：图表/截图/场景照片（注意版权来源）\n- 卡片模板：统一风格与标签\n\n`
    markdown += `---\n\n## 🤝 互动与分发策略\n\n- 首评话术：提出问题并承诺收益\n- 评论引导：6条问题，逐步深入\n- 投票主题：3条，聚焦痛点\n- 私域导流：3条话术\n- 发布日历：工作日中午与晚上窗口\n- 分发矩阵：朋友圈/视频号/知乎/小红书\n\n`
    markdown += `---\n\n## ⚖️ 风险与合规\n\n- 敏感词替代表述\n- 引用格式：作者/标题/链接/时间\n- 版权与素材来源标注\n\n`
    markdown += `---\n\n## 🧪 AB测试方案\n\n- 变体：标题/首段/封面\n- 指标：点击率/完读率/互动率/收藏转发\n- 记录：简单实验表，一期一迭代\n\n`
  }

  return markdown
}
