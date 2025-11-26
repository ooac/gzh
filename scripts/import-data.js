const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

async function main() {
  const prisma = new PrismaClient()
  const raw = fs.readFileSync('export-data.json', 'utf-8')
  const data = JSON.parse(raw)

  for (const u of data.users || []) {
    await prisma.user.upsert({ where: { id: u.id }, update: { username: u.username, password: u.password, email: u.email, bio: u.bio, avatar: u.avatar }, create: { id: u.id, username: u.username, password: u.password, email: u.email, bio: u.bio, avatar: u.avatar, createdAt: new Date(u.createdAt) } })
  }

  for (const a of data.articles || []) {
    await prisma.article.upsert({ where: { id: a.id }, update: { title: a.title, content: a.content, summary: a.summary, status: a.status, theme: a.theme, keywords: a.keywords, analysisData: a.analysisData, imagePrompts: a.imagePrompts, publishedAt: a.publishedAt ? new Date(a.publishedAt) : null, coverImageId: a.coverImageId }, create: { id: a.id, title: a.title, content: a.content, summary: a.summary, status: a.status, theme: a.theme, keywords: a.keywords, analysisData: a.analysisData, imagePrompts: a.imagePrompts, createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt), publishedAt: a.publishedAt ? new Date(a.publishedAt) : null, coverImageId: a.coverImageId } })
  }

  for (const i of data.images || []) {
    await prisma.image.upsert({ where: { id: i.id }, update: { url: i.url, alt: i.alt, source: i.source, localPath: i.localPath, articleId: i.articleId, segmentIndex: i.segmentIndex }, create: { id: i.id, url: i.url, alt: i.alt, source: i.source, localPath: i.localPath, articleId: i.articleId, segmentIndex: i.segmentIndex, createdAt: new Date(i.createdAt) } })
  }

  for (const p of data.publishRecords || []) {
    await prisma.publishRecord.upsert({ where: { id: p.id }, update: { articleId: p.articleId, platform: p.platform, platformId: p.platformId, status: p.status, publishedAt: p.publishedAt ? new Date(p.publishedAt) : null, errorMessage: p.errorMessage }, create: { id: p.id, articleId: p.articleId, platform: p.platform, platformId: p.platformId, status: p.status, publishedAt: p.publishedAt ? new Date(p.publishedAt) : null, errorMessage: p.errorMessage, createdAt: new Date(p.createdAt) } })
  }

  for (const c of data.apiConfigs || []) {
    await prisma.aPIConfig.upsert({ where: { id: c.id }, update: { service: c.service, apiKey: c.apiKey, apiUrl: c.apiUrl, balance: c.balance, currency: c.currency, config: c.config, isActive: c.isActive }, create: { id: c.id, service: c.service, apiKey: c.apiKey, apiUrl: c.apiUrl, balance: c.balance, currency: c.currency, config: c.config, isActive: c.isActive, createdAt: new Date(c.createdAt) } })
  }

  for (const l of data.llmModels || []) {
    await prisma.lLMModel.upsert({ where: { id: l.id }, update: { provider: l.provider, modelName: l.modelName, displayName: l.displayName, description: l.description, maxTokens: l.maxTokens, isActive: l.isActive }, create: { id: l.id, provider: l.provider, modelName: l.modelName, displayName: l.displayName, description: l.description, maxTokens: l.maxTokens, isActive: l.isActive, createdAt: new Date(l.createdAt) } })
  }

  for (const pc of data.llmProviderConfigs || []) {
    await prisma.lLMProviderConfig.upsert({ where: { provider: pc.provider }, update: { name: pc.name, apiKey: pc.apiKey, apiEndpoint: pc.apiEndpoint, temperature: pc.temperature, maxTokens: pc.maxTokens, isActive: pc.isActive, isDefault: pc.isDefault, selectedModel: pc.selectedModel, availableModels: pc.availableModels }, create: { id: pc.id, provider: pc.provider, name: pc.name, apiKey: pc.apiKey, apiEndpoint: pc.apiEndpoint, temperature: pc.temperature, maxTokens: pc.maxTokens, isActive: pc.isActive, isDefault: pc.isDefault, selectedModel: pc.selectedModel, availableModels: pc.availableModels } })
  }

  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); process.exit(1) })
