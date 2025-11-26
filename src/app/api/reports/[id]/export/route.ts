import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const url = new URL(request.url)
    const id = params?.id ?? (url.pathname.split('/').slice(-2, -1)[0] || '')
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    const report = await prisma.analysisReport.findUnique({ where: { id } })
    if (!report) return NextResponse.json({ success: false, error: '未找到报告' }, { status: 404 })
    const history = await prisma.searchHistory.findUnique({ where: { id: report.searchHistoryId }, include: { articles: true } })
    if (!history) return NextResponse.json({ success: false, error: '未找到关联历史' }, { status: 404 })
    const useRaw = url.searchParams.get('raw') === '1' || url.searchParams.get('raw') === 'true'
    const markdown = useRaw ? buildMarkdown(history, report) : (report.renderedMarkdown && report.renderedMarkdown.length > 0 ? report.renderedMarkdown : buildMarkdown(history, report))
    const headers = new Headers()
    headers.set('Content-Type', 'text/markdown; charset=utf-8')
    const timestamp = new Date().toISOString().split('T')[0]
    const safeKeyword = history.keyword.replace(/[^\x00-\x7F]/g, '_')
    const filename = `${safeKeyword}_report_${timestamp}.md`
    headers.set('Content-Disposition', `attachment; filename *= UTF - 8''${encodeURIComponent(filename)} `)
    return new NextResponse(markdown, { status: 200, headers })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '导出失败' }, { status: 500 })
  }
}

function buildMarkdown(history: any, report: any): string {
  const insightsRaw: string[] = report.insightsData ? JSON.parse(report.insightsData) : []
  const wordCloud: any[] = report.wordCloudData ? JSON.parse(report.wordCloudData) : []
  const articles: any[] = history.articles || []
  const materialsJson: any[] = report.materialsJson ? JSON.parse(report.materialsJson) : []
  const generateDate = new Date(report.generatedAt).toLocaleString('zh-CN')
  let md = `# ${history.keyword} - 汇总分析报告\n\n > 生成时间: ${generateDate} \n > 关键词: ${history.keyword} \n > 文章数: ${history.totalArticles} \n\n-- -\n\n`
  const topByLike = [...articles].sort((a, b) => b.likeCount - a.likeCount).slice(0, 10)
  const topByEngage = [...articles].sort((a, b) => {
    const ea = a.readCount > 0 ? a.likeCount / a.readCount : 0
    const eb = b.readCount > 0 ? b.likeCount / b.readCount : 0
    return eb - ea
  }).slice(0, 10)
  md += `## 热门文章排行\n\n### 点赞最高\n\n`
  topByLike.forEach((a: any, i: number) => {
    md += `${i + 1}. ${a.title} \n - 作者: ${a.author} \n - 阅读: ${a.readCount} \n - 点赞: ${a.likeCount} \n - 链接: ${a.url} \n\n`
  })
  md += `### 互动率最高\n\n`
  topByEngage.forEach((a: any, i: number) => {
    const rate = a.readCount > 0 ? ((a.likeCount / a.readCount) * 100).toFixed(2) : '0'
    md += `${i + 1}. ${a.title} \n - 作者: ${a.author} \n - 阅读: ${a.readCount} \n - 点赞: ${a.likeCount} \n - 互动率: ${rate}%\n - 链接: ${a.url} \n\n`
  })
  md += `-- -\n\n## 高频词云\n\n`
  wordCloud.slice(0, 20).forEach((w: any, i: number) => { md += `${i + 1}. ${w.word} (${w.count}) \n` })
  md += `-- -\n\n## AI选题洞察\n\n`
  const insights = Array.isArray(insightsRaw) ? insightsRaw.filter((s: string) => {
    if (!s) return false
    const t = s.trim()
    if (!t) return false
    if (t.includes('```json') || t.includes('素材JSON样例')) return false
    if (t === '测试响应成功') return false
    return true
  }) : []
  insights.forEach((s: string, i: number) => { md += `${i + 1}. ${s}\n\n` })
  if (materialsJson && materialsJson.length > 0) {
    md += `## 📦 素材要点清单\n\n`
    materialsJson.slice(0, 5).forEach((m: any, i: number) => {
      const tags = Array.isArray(m.styleTags) ? m.styleTags.join('、') : ''
      const points = Array.isArray(m.points) ? m.points.join('；') : ''
      const evid = Array.isArray(m.evidence) ? m.evidence.map((e: any) => e.source).join('；') : ''
      const checklist = Array.isArray(m.actionChecklist) ? m.actionChecklist.join('；') : ''
      const tone = m.tone || ''
      md += `### 素材${i + 1}\n- 标题：${m.title || ''}\n- 来源类型：${m.sourceType || ''}\n- 风格标签：${tags}\n- 证据强度：${m.evidenceStrength || ''}\n- 观点要点：${points}\n- 证据链接：${evid}\n- 推荐语气：${tone}\n- 操作清单：${checklist}\n\n`
    })

    const mats = materialsJson.slice(0, 5)
    const titlePool: string[] = []
    mats.forEach((m: any) => {
      const tag = Array.isArray(m.styleTags) && m.styleTags[0] ? m.styleTags[0] : '实用'
      const p = Array.isArray(m.points) && m.points[0] ? m.points[0] : (m.title || history.keyword)
      titlePool.push(`${p}：${history.keyword}的${tag}打法`)
      titlePool.push(`${history.keyword}：${tag}创作的三个真相`)
      titlePool.push(`用${p}拿下互动率：${history.keyword}的实操清单`)
      titlePool.push(`${history.keyword}还能这么写？${tag}风格的高效套路`)
    })
    while (titlePool.length < 10) { titlePool.push(`${history.keyword}的5个可复制爆点`) }

    const hookPool: string[] = []
    mats.forEach((m: any) => {
      const p = Array.isArray(m.points) && m.points[0] ? m.points[0] : history.keyword
      hookPool.push(`先看数据，再给答案：${p}`)
      hookPool.push(`只用三个步骤，把${history.keyword}写成爆款`)
    })
    while (hookPool.length < 6) { hookPool.push(`这条技巧，直接提升完读率`) }

    let vpCount = 0
    md += `\n---\n\n## 🧠 标题库（10条）\n\n`
    titlePool.slice(0, 10).forEach((t: string, i: number) => { md += `${i + 1}. ${t}\n` })
    md += `\n---\n\n## 🎯 钩子库（6条）\n\n`
    hookPool.slice(0, 6).forEach((h: string, i: number) => { md += `${i + 1}. ${h}\n` })
    md += `\n---\n\n## 📚 观点-证据对照表（≥10对）\n\n`
    mats.forEach((m: any) => {
      const pts = Array.isArray(m.points) ? m.points : []
      const evs = Array.isArray(m.evidence) ? m.evidence : []
      pts.forEach((pt: string) => {
        const links = evs.slice(0, 2).map((e: any) => e.source).filter(Boolean)
        md += `- 观点：${pt}\n  - 证据：${links.join('；') || '数据与案例待补充'}\n  - 引语：${m.hook || '结合读者收益的承诺语'}\n`
        vpCount++
      })
    })
    if (vpCount < 10) {
      const fill = articles.slice(0, Math.max(0, 10 - vpCount))
      fill.forEach((a: any) => { md += `- 观点：${a.title}\n  - 证据：${a.url}\n  - 引语：数据驱动的结论\n` })
    }

    md += `\n---\n\n## 🛠️ 行动清单与话术（AIDA）\n\n`
    const anchor = mats[0] || {}
    const anchorPoint = Array.isArray(anchor.points) && anchor.points[0] ? anchor.points[0] : history.keyword
    const anchorLink = Array.isArray(anchor.evidence) && anchor.evidence[0]?.source ? anchor.evidence[0].source : ''
    md += `### A. 吸引注意\n- 话术：${anchorPoint}，这是你今天能立刻用的技巧\n### I. 激发兴趣\n- 依据：${anchorLink || '引用数据或案例链接'}\n- 话术：给出反常识与收益承诺\n### D. 激发欲望\n- 步骤：列出3步操作清单\n- 话术：用读者语言重复收益\n### A. 行动召唤\n- CTA：收藏/转发/下载素材/加入社群\n\n`

    md += `---\n\n## 🖼️ 视觉建议与版式\n\n- 封面文案：数据型/故事型/清单型各1版\n- 配图：图表/截图/场景照片（注意版权来源）\n- 卡片模板：统一风格与标签\n\n`
    md += `---\n\n## 🤝 互动与分发策略\n\n- 首评话术：提出问题并承诺收益\n- 评论引导：6条问题，逐步深入\n- 投票主题：3条，聚焦痛点\n- 私域导流：3条话术\n- 发布日历：工作日中午与晚上窗口\n- 分发矩阵：朋友圈/视频号/知乎/小红书\n\n`
    md += `---\n\n## ⚖️ 风险与合规\n\n- 敏感词替代表述\n- 引用格式：作者/标题/链接/时间\n- 版权与素材来源标注\n\n`
    md += `---\n\n## 🧪 AB测试方案\n\n- 变体：标题/首段/封面\n- 指标：点击率/完读率/互动率/收藏转发\n- 记录：简单实验表，一期一迭代\n\n`
  }
  return md
}
