import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const defaults = [
    {
      name: '素材抽取模板 v1',
      type: 'extract',
      version: 'v1',
      keyword: null,
      content:
        '对输入的文章列表，逐篇提取：1) 开头钩子句；2) 核心观点1-3条；3) 支撑证据链接或出处；4) 关键数据（数值/时间/对象）；用简洁句式，避免主观形容。'
    },
    {
      name: '聚合诊断模板 v1',
      type: 'aggregate',
      version: 'v1',
      keyword: null,
      content:
        '根据评分与素材，输出热点主题诊断：每主题包含成因、人群、场景与风险；给出“爆款原因总结”（数据+文案结构）；避免空泛。'
    },
    {
      name: '写作提纲模板 v1',
      type: 'brief',
      version: 'v1',
      keyword: null,
      content:
        '生成可执行提纲（AIDA 或 PAS 或三幕式），列出段落标题与要点；提供 12 个标题示例与 6 个开头钩子示例，标注风格标签。'
    }
  ]

  const pro = [
    {
      name: '专业素材抽取 v2',
      type: 'extract',
      version: 'v2',
      keyword: null,
      content:
        '为每篇文章输出JSON：{"id":"","title":"","author":"","url":"","hook":"","points":[""],"evidence":[{"text":"","source":""}],"metrics":{"read":0,"like":0,"rate":""}}。要求：钩子为开头抓人句，points为3个核心观点，evidence为可核查的引用或链接，metrics填已有数据。避免泛化描述。'
    },
    {
      name: '专业聚合诊断 v2',
      type: 'aggregate',
      version: 'v2',
      keyword: null,
      content:
        '按主题输出：主题名、成因（数据证据）、人群与场景、风险与反例。总结爆款原因：结构/素材/情绪/时效四维，并给出每维的数据支撑。'
    },
    {
      name: '专业写作提纲 v2',
      type: 'brief',
      version: 'v2',
      keyword: null,
      content:
        '输出AIDA提纲：Attention（标题与开头钩子），Interest（3段主题展开，每段含素材引用），Desire（案例与收益场景），Action（CTA与资源）。再给12个标题与6个开头钩子，标注风格标签。'
    }
  ]

  const proV3 = [
    {
      name: '素材抽取模板 v3',
      type: 'extract',
      version: 'v3',
      keyword: null,
      content:
        '逐篇输出JSON:{"id":"","title":"","author":"","url":"","publishDate":"","hook":"≤60字","structure":"AIDA/PAS/三幕式","rhetoric":["修辞"],"points":["3条≤30字"],"evidence":[{"text":"引用或数据","source":"链接或出处"}],"metrics":{"read":0,"like":0,"rate":"%"},"audience":"人群","scenes":["场景"],"rewriteAdvice":"≤50字"}；每篇至少1条可核查证据，短句、可执行。'
    },
    {
      name: '聚合诊断模板 v3',
      type: 'aggregate',
      version: 'v3',
      keyword: null,
      content:
        '归纳主题与人群画像（3条匹配描述）；爆款要素诊断（结构/素材/情绪/时效，每维给证据）；主题Top-5（成因/人群与场景/风险与反例/趋势标签）；选题与角度3条。中文输出，证据可核查。'
    },
    {
      name: '写作提纲模板 v3',
      type: 'brief',
      version: 'v3',
      keyword: null,
      content:
        '生成公众号成稿骨架：标题2版（数据/反常识，≤30字）；开头钩子（≤80字）；正文AIDA或PAS的3-5节，每节含观点+素材引用(带链接)+操作步骤/清单；结尾CTA。附标题库6例（标风格）、钩子库4例（情绪线），与AIDA/PAS提纲模板。'
    }
  ]

  for (const d of defaults) {
    const exists = await prisma.promptTemplate.findFirst({ where: { name: d.name, version: d.version } })
    if (!exists) {
      await prisma.promptTemplate.create({ data: d })
    }
  }

  for (const d of pro) {
    const exists = await prisma.promptTemplate.findFirst({ where: { name: d.name, version: d.version } })
    if (!exists) {
      await prisma.promptTemplate.create({ data: d })
    }
  }

  for (const d of proV3) {
    const exists = await prisma.promptTemplate.findFirst({ where: { name: d.name, version: d.version } })
    if (!exists) {
      await prisma.promptTemplate.create({ data: d })
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
