import { NextRequest, NextResponse } from 'next/server'
import { llmAdapterFactory } from '@/lib/llm-adapters'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, prompt, providerConfigId, provider: providerOverride, selectedModel: modelOverride, selectedModelId } = body || {}
    if (!mode || !prompt) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 })
    }

    // 解析应使用的配置：providerConfigId → feature=compose 的选择 → 活跃配置
    let useConfig = null as any
    if (providerConfigId) {
      useConfig = await prisma.lLMProviderConfig.findUnique({ where: { id: providerConfigId } })
    }
    if (!useConfig) {
      try {
        const sel = await prisma.lLMFeatureSelection.findUnique({ where: { feature: 'compose' }, include: { providerConfig: true } })
        if (sel?.providerConfig) useConfig = sel.providerConfig
      } catch {}
    }
    if (!useConfig) {
      useConfig = await prisma.lLMProviderConfig.findFirst({ where: { isActive: true } })
    }
    if (!useConfig || !useConfig.provider) {
      return NextResponse.json({ success: false, error: '未选择或未激活的供应商配置，请前往“LLM设置”完善后重试', code: 'NO_CONFIG' }, { status: 400 })
    }

    const provider = providerOverride || useConfig.provider
    // 解析 selectedModelName（DB 保存为模型 id，需要转换为模型名）
    let selectedModelName: string | undefined = undefined
    try {
      const modelId = selectedModelId || (typeof modelOverride === 'string' ? modelOverride : undefined)
      if (modelId) {
        const m = await prisma.lLMModel.findUnique({ where: { id: modelId } })
        selectedModelName = m?.modelName || modelId
      } else if (useConfig.selectedModel) {
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
          siliconflow: 'Qwen2.5-7B-Instruct',
          modelscope: 'Qwen2.5-7B-Instruct',
          minimax: 'abab6.5-chat',
          aihubmix: 'gpt-4o'
        }
        selectedModelName = defaults[provider]
      }
    } catch {}
    const adapter = llmAdapterFactory.getAdapter(provider)
    const config = {
      id: useConfig.id,
      provider,
      name: useConfig.name,
      apiKey: useConfig.apiKey || '',
      apiEndpoint: useConfig.apiEndpoint || '',
      selectedModel: selectedModelName,
      temperature: useConfig.temperature || 0.7,
      maxTokens: useConfig.maxTokens || 2000
    }

    if (mode === 'rewrite' || mode === 'custom') {
      const len = ((body?.length || '') + '') as string
      const map: Record<string, number> = { normal: 3000, long: 6000 }
      if (map[len]) (config as any).maxTokens = map[len]
    }

    let minWords = 1200
    if ((body?.mode || mode) === 'rewrite' || (body?.mode || mode) === 'custom') {
      const len = ((body?.length || '') + '') as string
      if (len === 'normal') minWords = 800
      else if (len === 'long') minWords = 1500
      else if (len === 'unlimited') minWords = 0
      else minWords = 1200
    }
    let systemText = ''
    if (mode === 'rewrite') {
      if (minWords > 0) {
        systemText = `你是资深中文写作助手。请用简体中文，以Markdown输出完整文章。要求：原创表达，不输出JSON或代码块；避免emoji；事实准确且可查；如有来源则就地引用；不少于${minWords}字。`
      } else {
        systemText = `你是资深中文写作助手。请用简体中文，以Markdown输出完整文章。要求：原创表达，不输出JSON或代码块；避免emoji；事实准确且可查；如有来源则就地引用。`
      }
    } else {
      systemText = minWords > 0
        ? `你是资深中文公众号写作助手。请用简体中文，生成可直接发布的完整文章。要求：原创表达，不输出JSON或代码块；风格专业但亲和；结构为“标题→导语→正文三段(每段有小标题)→金句→总结→CTA”；在正文相关位置就地使用“【来源】标题｜观点要点｜证据链接(如有)”进行引用(至少2处)；排版使用标题、列表与加粗，避免emoji，全文不少于${minWords}字；审稿自检避免空话与重复，逻辑清晰且事实可查。`
        : `你是资深中文公众号写作助手。请用简体中文，生成可直接发布的完整文章。要求：原创表达，不输出JSON或代码块；风格专业但亲和；结构为“标题→导语→正文三段(每段有小标题)→金句→总结→CTA”；在正文相关位置就地使用“【来源】标题｜观点要点｜证据链接(如有)”进行引用(至少2处)；排版使用标题、列表与加粗，避免emoji；审稿自检避免空话与重复，逻辑清晰且事实可查。`
    }
    let composedPrompt = ''
    if (mode === 'fromReport') {
      const { materialsJson = [], insights = [], topic = '' } = body
      const materialsText = Array.isArray(materialsJson) ? materialsJson.slice(0, 5).map((m: any) => `标题:${m.title||''} 来源:${m.sourceType||''} 观点:${m.viewpoint||''} 证据:${m.evidenceLink||''}`).join('\n') : ''
      const insightsText = Array.isArray(insights) ? insights.join('\n') : ''
      composedPrompt = `主题:${topic || '未设'}\n\n${prompt}\n\n洞察摘要:\n${insightsText}\n\n素材要点(Top5):\n${materialsText}`
    } else if (mode === 'rewrite') {
      const { sourceUrl = '', sourceContent = '' } = body
      const len = ((body?.length || '') + '') as string
      const lenDesc = len === 'normal' ? '常规' : (len === 'long' ? '长文' : '不限制')
      composedPrompt = `${prompt}\n\n篇幅:${lenDesc}\n来源链接:${sourceUrl}\n\n原文内容:\n${sourceContent}`
    } else if (mode === 'custom') {
      const { topic = '', style = '' } = body
      const len = ((body?.length || '') + '') as string
      const lenDesc = len === 'normal' ? '常规' : (len === 'long' ? '长文' : '不限制')
      composedPrompt = `${prompt}\n\n主题:${topic}\n风格:${style}\n篇幅:${lenDesc}`
    } else {
      return NextResponse.json({ success: false, error: '不支持的模式' }, { status: 400 })
    }

    let content = ''
    const canCall = !!config.apiKey && !!config.apiEndpoint && !!config.selectedModel
    if (canCall) {
      try {
        const resp = await adapter.callAPI(`${systemText}\n\n${composedPrompt}`, config as any)
        if (typeof adapter.formatResponse === 'function') {
          const formatted = adapter.formatResponse(resp)
          content = typeof formatted === 'string' ? formatted : JSON.stringify(formatted)
        } else {
          content = typeof resp === 'string' ? resp : JSON.stringify(resp)
        }
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e?.message || '模型调用失败，请稍后重试', code: 'CALL_FAILED' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ success: false, error: '所选供应商未配置密钥/端点或模型，请前往“LLM设置”完善后重试', code: 'MISSING_CONFIG' }, { status: 400 })
    }

    const clean = cleanMarkdown(content)
    const firstLine = clean.split('\n')[0] || ''
    const title = firstLine.replace(/^#\s*/, '').replace(/^标题[:：]\s*/, '')
    return NextResponse.json({ success: true, data: { title, content: clean } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '生成失败' }, { status: 500 })
  }
}

function buildFallbackDraft(mode: 'fromReport' | 'rewrite' | 'custom', payload: any, prompt: string) {
  let title = ''
  let body = ''
  if (mode === 'fromReport') {
    const materials = Array.isArray(payload.materialsJson) ? payload.materialsJson.slice(0,5) : []
    const insights = Array.isArray(payload.insights) ? payload.insights : []
    title = (insights[0] || '公众号文章初稿').replace(/^#\s*/, '')
    const points = materials.map((m: any, i: number) => `- ${i+1}. ${m.title || m.topic || ''}｜${m.viewpoint || ''}（证据：${m.evidenceLink || '无'}）`).join('\n')
    body = `# ${title}\n\n> 初稿（回退生成）\n\n${prompt}\n\n## 洞察摘要\n${insights.join('\n')}\n\n## 素材要点\n${points}\n\n## 正文结构\n- 导语\n- 三段论述\n- 金句\n- 总结与CTA\n`
  } else if (mode === 'rewrite') {
    title = '改写初稿'
    const src = payload.sourceUrl ? `来源：${payload.sourceUrl}` : '来源：粘贴正文或上传Markdown'
    body = `# ${title}\n\n> 初稿（回退生成）\n\n${prompt}\n\n${src}\n\n## 重写结构\n- 引子\n- 核心论点\n- 证据\n- 风险与反驳\n- 总结\n`
  } else {
    title = payload.topic || '自定义初稿'
    body = `# ${title}\n\n> 初稿（回退生成）\n\n${prompt}\n\n## 初步大纲\n- 主题阐述\n- 三段正文\n- 总结与CTA\n`
  }
  return { title, content: cleanMarkdown(body) }
}

function cleanMarkdown(input: string): string {
  let s = input || ''
  try {
    if (s.trim().startsWith('{')) {
      const obj = JSON.parse(s)
      if (obj && typeof obj.content === 'string') s = obj.content
    }
  } catch {}
  // remove fenced code blocks and stray backticks
  s = s.replace(/```[\s\S]*?```/g, '')
  s = s.replace(/[`]+/g, '')
  // fix headings like "###`  "
  s = s.replace(/^(#+)\s*`\s*/gm, '$1 ')
  // ensure first line is a heading
  if (!/^#\s+/m.test(s)) {
    const lines = s.split('\n')
    const first = (lines[0] || '').trim()
    s = `# ${first}\n\n` + lines.slice(1).join('\n')
  }
  return s
}
