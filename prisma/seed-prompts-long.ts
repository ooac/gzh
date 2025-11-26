import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const longExtract = await prisma.promptTemplate.upsert({
    where: { name_version: { name: '素材抽取 长版 v3', version: 'v3-long' } as any },
    update: {},
    create: {
      name: '素材抽取 长版 v3',
      type: 'extract',
      version: 'v3-long',
      keyword: null,
      content:
        '逐篇输出严格JSON:{"id":"","title":"","author":"","url":"","publishDate":"","hook":"≤60字","structure":"AIDA/PAS/三幕式","rhetoric":["修辞"],"points":["3条≤30字"],"evidence":[{"text":"引用或数据","source":"链接或出处"}],"metrics":{"read":0,"like":0,"rate":"%"},"audience":"人群","scenes":["场景"],"rewriteAdvice":"≤50字"}；每篇至少1条可核查证据，短句、可执行。'
    }
  })

  const longAggregate = await prisma.promptTemplate.upsert({
    where: { name_version: { name: '聚合诊断 长版 v3', version: 'v3-long' } as any },
    update: {},
    create: {
      name: '聚合诊断 长版 v3',
      type: 'aggregate',
      version: 'v3-long',
      keyword: null,
      content:
        '归纳主题与人群画像（3条匹配描述）；爆款要素诊断（结构/素材/情绪/时效，每维给证据）；主题Top-5（成因/人群与场景/风险与反例/趋势标签）；选题与角度3条。中文输出，证据可核查。'
    }
  })

  const longBrief = await prisma.promptTemplate.upsert({
    where: { name_version: { name: '写作提纲 长版 v3', version: 'v3-long' } as any },
    update: {},
    create: {
      name: '写作提纲 长版 v3',
      type: 'brief',
      version: 'v3-long',
      keyword: null,
      content:
        '生成公众号成稿骨架：标题2版（数据/反常识，≤30字）；开头钩子（≤80字）；正文AIDA或PAS的3-5节，每节含观点+素材引用(带链接)+操作步骤/清单；结尾CTA。附标题库6例（标风格）、钩子库4例（情绪线），与AIDA/PAS提纲模板。'
    }
  })

  const keywords = ['AI趋势', 'AI未来']
  for (const kw of keywords) {
    await prisma.promptSelection.upsert({
      where: { keyword: kw },
      update: {
        extractId: longExtract.id,
        aggregateId: longAggregate.id,
        briefId: longBrief.id
      },
      create: {
        keyword: kw,
        extractId: longExtract.id,
        aggregateId: longAggregate.id,
        briefId: longBrief.id
      }
    })
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

