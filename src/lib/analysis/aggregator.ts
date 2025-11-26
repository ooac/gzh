type Article = {
  id: string
  title: string
  author?: string | null
  readCount: number
  likeCount: number
  url?: string | null
  publishDate?: string | null
}

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v))

function percentile(arr: number[], p: number) {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

export function winsorize(values: number[], upperP = 95) {
  const upper = percentile(values, upperP)
  return values.map(v => Math.min(v, upper))
}

export function normalize(values: number[]) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0)
  return values.map(v => (v - min) / (max - min))
}

export function recencyDecay(dateStr?: string | null, tauDays = 7) {
  if (!dateStr) return 0.8
  const d = new Date(dateStr).getTime()
  const now = Date.now()
  const deltaDays = Math.max(0, (now - d) / (1000 * 60 * 60 * 24))
  return Math.exp(-deltaDays / tauDays)
}

export function computeScores(articles: Article[], weights?: Partial<{ like: number; engage: number; read: number; recency: number; publisher: number }>) {
  const likeW = weights?.like ?? 0.4
  const engageW = weights?.engage ?? 0.25
  const readW = weights?.read ?? 0.2
  const recencyW = weights?.recency ?? 0.1
  const publisherW = weights?.publisher ?? 0.05

  const reads = winsorize(articles.map(a => a.readCount))
  const likes = winsorize(articles.map(a => a.likeCount))
  const readNorm = normalize(reads)
  const likeNorm = normalize(likes)

  const authorKey = (a: Article) => (a.author || '未知作者')
  const authorMap = new Map<string, { totalRead: number; count: number }>()
  articles.forEach(a => {
    const key = authorKey(a)
    const prev = authorMap.get(key) || { totalRead: 0, count: 0 }
    prev.totalRead += a.readCount
    prev.count += 1
    authorMap.set(key, prev)
  })
  const publisherRaw = articles.map(a => {
    const s = authorMap.get(authorKey(a))!
    return s.totalRead / Math.max(1, s.count)
  })
  const publisherNorm = normalize(winsorize(publisherRaw))

  const scores = articles.map((a, i) => {
    const engagement = a.readCount > 0 ? a.likeCount / a.readCount : 0
    const rec = recencyDecay(a.publishDate, 7)
    const val = likeW * likeNorm[i] + engageW * engagement + readW * readNorm[i] + recencyW * rec + publisherW * publisherNorm[i]
    return clamp(val, 0, 1)
  })

  return scores
}

export function rankTop(articles: Article[], weights?: Partial<{ like: number; engage: number; read: number; recency: number; publisher: number }>, topN = 30) {
  const scores = computeScores(articles, weights)
  const ranked = articles
    .map((a, i) => ({ ...a, score: scores[i], engagementRate: a.readCount > 0 ? ((a.likeCount / a.readCount) * 100).toFixed(2) : '0' }))
    .sort((a, b) => (b.score! - a.score!))
    .slice(0, Math.min(topN, articles.length))
  return ranked
}

export function groupHotThemes(articles: Article[], keyword: string) {
  const titleWords = new Map<string, number>()
  articles.forEach(a => {
    const words = (a.title || '').toLowerCase().split(/[^a-zA-Z0-9\u4e00-\u9fa5]+/).filter(Boolean)
    words.forEach(w => {
      if (w.length <= 1) return
      const cur = titleWords.get(w) || 0
      titleWords.set(w, cur + 1)
    })
  })
  const entries = Array.from(titleWords.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50)
  const themes = entries.map(([word, count]) => ({ theme: word, count }))
  return themes.filter(t => t.theme !== keyword).slice(0, 5)
}

export function buildProfessionalMarkdown(keyword: string, ranked: any[], themes: any[], weights: any) {
  const header = `# ${keyword} - 专业版汇总分析报告\n\n时间范围：近${Math.min(30, ranked.length)}篇最近文章\n\n权重配置：点赞${weights.like ?? 0.4} 互动率${weights.engage ?? 0.25} 阅读量${weights.read ?? 0.2} 新近性${weights.recency ?? 0.1} 作者影响${weights.publisher ?? 0.05}`
  const themesMd = `\n\n## 热点主题诊断\n${themes.map((t: any, i: number) => `${i + 1}. **${t.theme}**（出现次数：${t.count}）\n- 成因：与该主题相关的文章近期增多\n- 目标人群：对${t.theme}主题感兴趣的从业者与观察者\n- 风险：同质化加剧，需避免标题党\n`).join('\n')}`
  const listMd = `\n\n## Top爆款清单（按综合分）\n${ranked.slice(0, 20).map((a: any, i: number) => `${i + 1}. **${a.title}**（作者：${a.author ?? '未知'}）\n   - 阅读：${a.readCount} 点赞：${a.likeCount} 互动率：${a.engagementRate}% 综合分：${(a.score * 100).toFixed(1)}\n   - 链接：${a.url ?? ''}\n   - 钩子建议：${buildHook(a.title)}\n`).join('\n')}`
  const outlineMd = `\n\n## 写作提纲建议\n- 开头：提出痛点 + 数据/案例引入\n- 中段：主题拆解（3-4点），每点给出实证或引用\n- 结尾：总结洞察 + 行动建议/资源链接\n\n## 标题库（示例12）\n${buildTitles(keyword)}`
  return `${header}${themesMd}${listMd}${outlineMd}`
}

function buildHook(title: string) {
  const clean = title.replace(/[\s\n]+/g, '')
  return `为何「${clean}」能引发高互动？抓住读者的核心疑问与收益场景。`
}

function buildTitles(keyword: string) {
  const items = [
    `【深度】${keyword}的3个关键拐点：从数据到实战`,
    `${keyword}爆款写作公式：结构、素材与钩子全解析`,
    `${keyword}趋势下的机会清单：避坑与打法`,
    `这5篇${keyword}爆文在讲什么？背后共性与差异`,
    `从0到1：把${keyword}转写成爆款的完整流程`,
    `${keyword}最强素材集：标题、金句与证据链接`,
    `为何你的${keyword}文章不火？看看这些数据`,
    `${keyword}热点演变：过去7天的变化与下一步`,
    `写给新手：${keyword}选题到成稿的高效方法`,
    `年度观察：${keyword}领域的10个真实信号`,
    `用AIDA写${keyword}：从吸引到行动的闭环`,
    `用PAS写${keyword}：问题-激化-解决一篇就会`
  ]
  return items.map((t, i) => `${i + 1}. ${t}`).join('\n')
}

