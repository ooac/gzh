const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

async function main() {
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'file:./prisma/dev.db'
  const prisma = new PrismaClient()
  const users = await prisma.user.findMany()
  const articles = await prisma.article.findMany()
  const images = await prisma.image.findMany()
  const publishRecords = await prisma.publishRecord.findMany()
  const apiConfigs = await prisma.aPIConfig.findMany()
  const llmProviderConfigs = await prisma.lLMProviderConfig.findMany({ include: { usageStats: true } })
  const llmModels = await prisma.lLMModel.findMany()
  const data = { users, articles, images, publishRecords, apiConfigs, llmProviderConfigs, llmModels }
  fs.writeFileSync('export-data.json', JSON.stringify(data))
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); process.exit(1) })
