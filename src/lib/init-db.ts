import { PrismaClient } from '@prisma/client'

// 确保在无迁移环境（如 Vercel Serverless + sqlite /tmp）下，至少创建 users 表
// 仅为演示/登录注册所需，避免全量迁移复杂度
export async function ensureUserTable(prisma: PrismaClient) {
  try {
    // 尝试查询以判断表是否存在
    await prisma.user.count()
    return
  } catch {
    // 使用原始 SQL 创建 users 表（与 schema.prisma 的映射一致）
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "email" TEXT,
        "bio" TEXT,
        "avatar" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }
}

export async function ensureCoreTables(prisma: PrismaClient) {
  try { await prisma.article.count(); } catch {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "articles" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "summary" TEXT,
        "status" TEXT DEFAULT 'DRAFT',
        "theme" TEXT DEFAULT 'hammer',
        "keywords" TEXT,
        "analysisData" TEXT,
        "imagePrompts" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "publishedAt" DATETIME,
        "coverImageId" TEXT UNIQUE
      );
    `)
  }
  try { await prisma.image.count(); } catch {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "images" (
        "id" TEXT PRIMARY KEY,
        "url" TEXT NOT NULL,
        "alt" TEXT,
        "source" TEXT DEFAULT 'UNSPLASH',
        "localPath" TEXT,
        "articleId" TEXT,
        "segmentIndex" INTEGER,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }
}
