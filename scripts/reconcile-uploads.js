const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function main() {
  const prisma = new PrismaClient()
  const dir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(dir)) {
    console.error('uploads 目录不存在:', dir)
    process.exit(1)
  }
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
  let created = 0
  for (const f of files) {
    const url = `/uploads/${f}`
    const exists = await prisma.image.findFirst({ where: { OR: [{ url }, { localPath: url }] } })
    if (!exists) {
      await prisma.image.create({ data: { url, localPath: url, source: 'LOCAL', alt: f } })
      created++
    }
  }
  console.log(`已对齐 uploads 目录，新增 ${created} 条图片记录`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
