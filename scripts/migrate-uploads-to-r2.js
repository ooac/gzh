/* 中文说明：将 public/uploads 下的本地图片批量上传到 Cloudflare R2，并将数据库与文章内容中的本地路径替换为 R2 公网域名链接。*/
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

function getEnv(name, def) {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : def
}

async function main() {
  // 读取 R2 环境变量
  const ACCOUNT_ID = getEnv('R2_ACCOUNT_ID')
  const ACCESS_KEY_ID = getEnv('R2_ACCESS_KEY_ID')
  const SECRET_ACCESS_KEY = getEnv('R2_SECRET_ACCESS_KEY')
  const BUCKET = getEnv('R2_BUCKET')
  const PUBLIC_DOMAIN = getEnv('R2_PUBLIC_DOMAIN')

  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET || !PUBLIC_DOMAIN) {
    console.error('缺少 R2 环境变量：R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_DOMAIN')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'file:./prisma/dev.db'
  const prisma = new PrismaClient()

  const endpoint = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`
  const S3 = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY } })

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    console.log('uploads 目录不存在，跳过')
    process.exit(0)
  }

  const files = fs.readdirSync(uploadsDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
  let success = 0, failed = 0
  const domain = PUBLIC_DOMAIN.startsWith('http') ? PUBLIC_DOMAIN.replace(/\/$/, '') : `https://${PUBLIC_DOMAIN.replace(/\/$/, '')}`

  for (const f of files) {
    const full = path.join(uploadsDir, f)
    const buf = fs.readFileSync(full)
    const ct = f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
    try {
      await S3.send(new PutObjectCommand({ Bucket: BUCKET, Key: f, Body: buf, ContentType: ct }))
      const url = `${domain}/${f}`

      // 更新 images 表
      await prisma.image.updateMany({ where: { OR: [{ localPath: `/uploads/${f}` }, { url: `/uploads/${f}` }] }, data: { url, source: 'EXTERNAL' } })

      // 批量替换 articles 内容中的本地路径
      const affected = await prisma.article.findMany({ where: { content: { contains: `/uploads/${f}` } }, select: { id: true, content: true } })
      for (const a of affected) {
        const newContent = a.content.replaceAll(`/uploads/${f}`, url)
        await prisma.article.update({ where: { id: a.id }, data: { content: newContent } })
      }

      success++
    } catch (e) {
      console.error('上传失败:', f, e.message)
      failed++
    }
  }

  console.log(`迁移完成：成功 ${success}，失败 ${failed}`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
