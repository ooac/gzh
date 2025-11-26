import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { llmAdapterFactory } from '@/lib/llm-adapters'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const content: string = body.content || ''
    const count: number = Math.min(Math.max(parseInt(body.count || '3'), 1), 8)
    const style: string = body.style || '插画风格'
    const ratio: string = (body.ratio || '2.35:1').trim()
    if (!content.trim()) return NextResponse.json({ success: false, error: '缺少文章内容' }, { status: 400 })

    const providerConfigId: string | undefined = body.providerConfigId
    let useConfig = null as any
    if (providerConfigId) {
      useConfig = await prisma.lLMProviderConfig.findUnique({ where: { id: providerConfigId } })
    }
    if (!useConfig) {
      useConfig = await prisma.lLMProviderConfig.findFirst({ where: { isActive: true } })
    }
    try {
      const sel = await prisma.lLMFeatureSelection.findUnique({ where: { feature: 'compose' }, include: { providerConfig: true } })
      if (sel?.providerConfig) useConfig = sel.providerConfig
    } catch {}
    if (!useConfig) return NextResponse.json({ success: false, error: '未配置LLM' }, { status: 400 })

    const adapter = llmAdapterFactory.getAdapter(useConfig.provider)
    let selectedModelName: string | undefined = undefined
    if (useConfig.selectedModel) {
      const m = await prisma.lLMModel.findUnique({ where: { id: useConfig.selectedModel } })
      selectedModelName = m?.modelName
    }
    if (!selectedModelName && useConfig.availableModels) {
      try {
        const parsed = JSON.parse(useConfig.availableModels)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0]
          selectedModelName = typeof first === 'string' ? first : (first?.modelName || first?.name)
        }
      } catch {}
    }
    if (!selectedModelName) {
      const defaults: Record<string, string> = {
        zhipu: 'glm-4-6',
        openrouter: 'gpt-4o',
        siliconflow: 'deepseek-chat',
        modelscope: 'qwen2.5-7b-instruct',
        minimax: 'abab6.5-chat',
        aihubmix: 'gpt-4o'
      }
      selectedModelName = defaults[useConfig.provider]
    }
    const config = { id: useConfig.id, name: useConfig.name, provider: useConfig.provider, apiKey: useConfig.apiKey || '', apiEndpoint: useConfig.apiEndpoint || '', selectedModel: selectedModelName, temperature: useConfig.temperature || 0.7, maxTokens: useConfig.maxTokens || 2000 }
    if (!config.apiKey || !config.apiEndpoint) return NextResponse.json({ success: false, error: 'LLM配置不完整（密钥或端点缺失）' }, { status: 400 })

    const splitByHeading = (s: string) => {
      const lines = s.split(/\n/)
      const segments: { start: number; end: number }[] = []
      let idx = 0
      let segStart = 0
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineLen = line.length + 1
        const isHeading = /^\s*##+\s+/.test(line)
        if (isHeading) {
          if (idx > segStart) segments.push({ start: segStart, end: idx - 1 })
          segStart = idx
        }
        idx += lineLen
      }
      segments.push({ start: segStart, end: s.length })
      return segments
    }
    const splitByEmpty = (s: string) => {
      const segments: { start: number; end: number }[] = []
      const re = /\n\s*\n+/g
      let lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = re.exec(s))) {
        segments.push({ start: lastIndex, end: m.index })
        lastIndex = re.lastIndex
      }
      segments.push({ start: lastIndex, end: s.length })
      return segments
    }
    let segs = splitByHeading(content)
    if (segs.length < count) segs = splitByEmpty(content)
    if (segs.length < count) {
      const approx: { start: number; end: number }[] = []
      const step = Math.floor(content.length / count)
      for (let i = 0; i < count; i++) {
        const start = i * step
        const end = i === count - 1 ? content.length : (i + 1) * step
        approx.push({ start, end })
      }
      segs = approx
    }
    if (segs.length > count) segs = segs.slice(0, count)

    const cleanText = (s: string) => {
      let t = s
      t = t.replace(/```[\s\S]*?```/g, ' ')
      t = t.replace(/`[^`]*`/g, ' ')
      t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      t = t.replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
      t = t.replace(/https?:\/\/[^\s)]+/g, ' ')
      t = t.replace(/\s+/g, ' ').trim()
      return t
    }
    const tailSentences = (t: string) => {
      const cleaned = cleanText(t)
      if (!cleaned) return ''
      const parts = cleaned.split(/(?<=[。！？!?；;…])\s*/).filter(Boolean)
      const last = parts[parts.length - 1] || ''
      const prev = parts.length > 1 ? parts[parts.length - 2] : ''
      const maxLen = 140
      if (last.length >= 80) return last.slice(Math.max(0, last.length - maxLen))
      const joined = (prev ? prev + ' ' : '') + last
      if (joined.length > maxLen) return joined.slice(Math.max(0, joined.length - maxLen))
      return joined
    }
    const segmentPayload = segs.map((r, i) => ({ index: i, endOffset: r.end, text: tailSentences(content.slice(r.start, r.end)) }))
    const instruction = `为每段中文正文的尾部内容生成一行用于AI生图的提示词，共${segmentPayload.length}行。每行需包含主体元素、环境氛围、色彩与光影、构图与机位，并包含“${style}”与“比例${ratio}”。优先中文，必要时在行末附英文关键词：cinematic, wide shot, soft light, high detail, ${ratio}。仅输出提示词列表，每段一行。`
    const joined = segmentPayload.map(p => `第${p.index + 1}段：${p.text}`).join('\n')
    const resp = await adapter.callAPI(`${instruction}\n\n${joined}`, config as any)
    const raw = typeof resp === 'string' ? resp : JSON.stringify(resp)
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    const prompts = segmentPayload.map((p, i) => ({ prompt: lines[i] || p.text, segmentIndex: p.index, endOffset: p.endOffset, tail: p.text }))
    return NextResponse.json({ success: true, data: { prompts } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '生成提示词失败' }, { status: 500 })
  }
}