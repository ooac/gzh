import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在 Vercel 等只读文件系统环境下，给 sqlite 提供 /tmp 路径作为回退
// 本地未设置则使用默认 ./dev.db
if (!process.env.DATABASE_URL) {
  if (process.env.VERCEL) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db'
  } else {
    process.env.DATABASE_URL = 'file:./dev.db'
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
