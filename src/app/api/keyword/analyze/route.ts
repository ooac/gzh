import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeTextFrequency, generateEnhancedWordCloud } from '@/lib/text-analysis'
import { rankTop, groupHotThemes, buildProfessionalMarkdown } from '@/lib/analysis/aggregator'
import { llmAdapterFactory } from '@/lib/llm-adapters'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function rankArticles(articles: any[]) {
  return [...articles].sort((a, b) => {
    const aEng = a.readCount > 0 ? (a.likeCount / a.readCount) : 0
    const bEng = b.readCount > 0 ? (b.likeCount / b.readCount) : 0
    const aScore = (a.likeCount) * 0.5 + (aEng * 100) * 0.3 + (a.readCount) * 0.2
    const bScore = (b.likeCount) * 0.5 + (bEng * 100) * 0.3 + (b.readCount) * 0.2
    return bScore - aScore
  })
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, searchHistoryId, promptId, promptIds, limit = 200 } = await request.json()
    if (!keyword) {
      return NextResponse.json({ success: false, error: '缺少关键词' }, { status: 400 })
    }

    let latest = null as any
    let articles: any[] = []
    if (searchHistoryId) {
      const sh = await prisma.searchHistory.findUnique({ where: { id: searchHistoryId }, include: { articles: true, reports: true } })
      if (sh && sh.keyword === keyword) {
        latest = sh
        articles = (latest?.articles || []).slice(0, limit)
      }
    }
    if (!latest) {
      const histories = await prisma.searchHistory.findMany({ where: { keyword }, orderBy: { searchDate: 'desc' }, include: { articles: true, reports: true } })
      latest = histories[0]
      articles = histories.flatMap(h => h.articles).slice(0, limit)
    }
    if (!latest) {
      // 无任何历史，创建占位
      try {
        const created = await prisma.searchHistory.create({ data: { keyword, totalArticles: 0, apiCost: 0, apiInfo: JSON.stringify({ note: 'auto-created for analyze' }) } })
        latest = created as any
      } catch {}
    }
    if (articles.length === 0) {
      // 如果该关键词没有历史，创建一个占位历史以承载报告
      try {
        if (latest) {
          await prisma.searchHistory.update({ where: { id: latest.id }, data: { totalArticles: 0 } })
        }
      } catch {}
      // 仍返回提示，但继续使用空集生成结构化报告，避免记录缺失
      // 注意：下方仍会保存报告到最新（占位）历史
      articles = []
    }

    const withEngagement = articles.map(a => ({ ...a, engagementRate: a.readCount > 0 ? ((a.likeCount / a.readCount) * 100).toFixed(2) : '0', publishDate: (a as any).publishTime ?? null }))
    const ranked = rankTop(withEngagement, undefined, 30)
    const topByLike = [...withEngagement].sort((a, b) => b.likeCount - a.likeCount).slice(0, 10)
    const topByEngagement = [...withEngagement].sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate)).slice(0, 10)

    const wordCloud = generateEnhancedWordCloud(withEngagement, keyword)
    const themes = groupHotThemes(withEngagement, keyword)

    // 组装提示词
    let assistantAggregate = ''
    let assistantExtract = ''
    let assistantBrief = ''
    if (promptIds?.aggregateId) {
      const p = await prisma.promptTemplate.findUnique({ where: { id: promptIds.aggregateId } })
      assistantAggregate = p?.content || ''
    }
    if (promptIds?.extractId) {
      const p = await prisma.promptTemplate.findUnique({ where: { id: promptIds.extractId } })
      assistantExtract = p?.content || ''
    }
    if (promptIds?.briefId) {
      const p = await prisma.promptTemplate.findUnique({ where: { id: promptIds.briefId } })
      assistantBrief = p?.content || ''
    }
    if (!assistantAggregate) {
      const p = await prisma.promptTemplate.findFirst({ where: { type: 'aggregate' }, orderBy: { updatedAt: 'desc' } })
      assistantAggregate = p?.content || ''
    }
    if (!assistantExtract) {
      const p = await prisma.promptTemplate.findFirst({ where: { type: 'extract' }, orderBy: { updatedAt: 'desc' } })
      assistantExtract = p?.content || ''
    }
    if (!assistantBrief) {
      const p = await prisma.promptTemplate.findFirst({ where: { type: 'brief' }, orderBy: { updatedAt: 'desc' } })
      assistantBrief = p?.content || ''
    }


    let active = null as any
    let adapter = null as any
    try {
      active = await prisma.lLMProviderConfig.findFirst({ where: { isActive: true }, orderBy: { isDefault: 'desc' } })
      if (active && active.provider) {
        adapter = llmAdapterFactory.getAdapter(active.provider)
      }
    } catch {}

    let materials: any[] = []
    if (adapter) {
      try {
        const baseArticles = withEngagement.slice(0, 15).map(a => ({ id: a.id, title: a.title, author: a.author, url: a.url, publishDate: a.publishDate, read: a.readCount, like: a.likeCount }))
        const strictSchema = {
          id: "string",
          title: "string",
          author: "string",
          url: "string",
          publishDate: "string",
          hook: "string",
          structure: "string",
          rhetoric: ["string"],
          points: ["string"],
          evidence: [{ text: "string", source: "string" }],
          metrics: { read: 0, like: 0, rate: "string" },
          audience: "string",
          scenes: ["string"],
          rewriteAdvice: "string",
          styleTags: ["string"],
          sourceType: "string",
          evidenceStrength: "string",
          tone: "string",
          actionChecklist: ["string"]
        }
        const promptText = `请严格输出 JSON 数组（只输出 JSON，不要额外文本），数组长度与输入相同，每项遵循如下字段：\n${JSON.stringify(strictSchema)}\n输入：${JSON.stringify(baseArticles)}\n要求：${assistantExtract}`
        const resp = await adapter.callAPI(promptText, { provider: active.provider, apiKey: active.apiKey || '', apiEndpoint: active.apiEndpoint || '', selectedModel: active.selectedModel || undefined } as any)
        const text = typeof resp === 'string' ? resp : JSON.stringify(resp)
        try { materials = JSON.parse(text) } catch {}
      } catch {}
    }
    if (!materials || materials.length === 0) {
      materials = withEngagement.slice(0, 6).map(a => ({ id: a.id, title: a.title, author: a.author, url: a.url, publishDate: a.publishDate, hook: a.title, structure: 'AIDA', rhetoric: [], points: [a.title.slice(0, 30)], evidence: [{ text: a.title, source: a.url }], metrics: { read: a.readCount || 0, like: a.likeCount || 0, rate: a.readCount>0 ? ((a.likeCount/a.readCount)*100).toFixed(2)+'%' : '0%' }, audience: '泛人群', scenes: ['公众号'], rewriteAdvice: '结合数据与场景给出操作清单' }))
    }

    let diagnosis = ''
    if (adapter) {
      try {
        const briefMaterials = materials.slice(0, 6)
        const promptText = `请根据排行榜与主题及素材，生成中文聚合诊断（Markdown 小标题与要点格式）：\n- 章节：\n  1) 主题与人群画像（3条，格式：主题-人群-场景）\n  2) 爆款要素诊断（结构/素材/情绪/时效四维，每维列要点并引用证据）\n  3) 趋势标签（Top-5主题，标注上升/平稳/下降，给出原因）\n  4) 选题与角度（3条，含人群/场景/承诺结果）\n- 数据：${JSON.stringify({ ranked: ranked.slice(0,10), themes: themes.slice(0,5) })}\n- 素材样例：${JSON.stringify(briefMaterials)}\n- 要求：中文、要点化、引用可核查链接；${assistantAggregate}`
        const resp = await adapter.callAPI(promptText, { provider: active.provider, apiKey: active.apiKey || '', apiEndpoint: active.apiEndpoint || '', selectedModel: active.selectedModel || undefined } as any)
        diagnosis = typeof resp === 'string' ? resp : JSON.stringify(resp)
      } catch {}
    }
    if (!diagnosis || diagnosis.trim() === '测试响应成功') {
      diagnosis = `主题诊断（基础版）：\n- 关键词：${keyword}\n- Top标题：${ranked.slice(0,3).map(a=>a.title).join('、')}\n- 选题建议：围绕数据、反常识与清单化输出，结合证据链接。`
    }

    let outline = ''
    if (adapter) {
      try {
        const promptText = `请生成中文写作提纲（Markdown 小标题与要点格式）：\n- 标题：2版（数据型/反常识型，≤30字，标注风格标签）\n- 开头钩子：1段（≤80字）\n- 正文：AIDA 或 PAS 的 3-5 节，每节包含：观点 + 素材引用(链接) + 操作步骤清单\n- 结尾 CTA：收藏/转发/下载素材/加入社群\n- 标题库：6例（标注风格标签），钩子库：4例（情绪线）\n关键词：${keyword}\n要求：中文，结构清晰；${assistantBrief}`
        const resp = await adapter.callAPI(promptText, { provider: active.provider, apiKey: active.apiKey || '', apiEndpoint: active.apiEndpoint || '', selectedModel: active.selectedModel || undefined } as any)
        outline = typeof resp === 'string' ? resp : JSON.stringify(resp)
      } catch {}
    }
    if (!outline || outline.trim() === '测试响应成功') {
      outline = `写作提纲（基础版）：\n- 标题：${keyword}的3个真实信号\n- 钩子：给读者一个明确收益的承诺\n- 段落：AIDA结构三节，各节含数据/引用与操作清单\n- CTA：收藏与下载素材包`
    }

    const summary = `### 聚合诊断\n${diagnosis}\n\n### 写作提纲\n${outline}\n\n（素材要点清单附后）`

    const summaryMarkdown = buildProfessionalMarkdown(keyword, ranked, themes, { like:0.4, engage:0.25, read:0.2, recency:0.1, publisher:0.05 }) + `\n\n## AI洞察与素材\n${summary}`

    if (latest) {
      try {
        await prisma.analysisReport.create({
          data: {
            searchHistoryId: latest.id,
            analysisData: JSON.stringify({ keyword, topByLike, topByEngagement, ranked, themes, generatedAt: new Date().toISOString() }),
            wordCloudData: JSON.stringify(wordCloud),
            insightsData: JSON.stringify([summary]),
            materialsJson: JSON.stringify(materials)
          }
        })
      } catch (e) {
        console.error('保存汇总报告失败', e)
      }
    }

    return NextResponse.json({ success: true, data: { summaryMarkdown } })
  } catch (error) {
    console.error('关键词分析失败:', error)
    return NextResponse.json({ success: false, error: '分析失败' }, { status: 500 })
  }
}
