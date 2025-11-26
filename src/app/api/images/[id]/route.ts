import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// 生产环境不做本地文件删除，避免打包 public/uploads 进入 Serverless

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const { searchParams, pathname } = new URL(req.url)
    const id = params.id
    if (!id) return NextResponse.json({ success: false, error: '缺少图片ID' }, { status: 400 })
    const img = await prisma.image.findUnique({ where: { id }, include: { article: true } })
    if (!img) return NextResponse.json({ success: false, error: '图片不存在' }, { status: 404 })

    // 本地文件删除逻辑已移除，保留数据库记录清理与文章引用清理

    // 清理文章中的引用
    let removedFromArticle: string | null = null
    if (img.articleId) {
      const article = await prisma.article.findUnique({ where: { id: img.articleId } })
      if (article?.content) {
        const local = img.localPath || ''
        const remote = img.url || ''
        let content = article.content
        if (local) {
          const mdLocal = new RegExp(`!\\[[^\\]]*?\\]\\(${esc(local)}\\)`, 'g')
          const htmlLocal = new RegExp(`<img[^>]+src=["']${esc(local)}["']`, 'gi')
          content = content.replace(mdLocal, '').replace(htmlLocal, '')
        }
        if (remote) {
          const mdRemote = new RegExp(`!\\[[^\\]]*?\\]\\(${esc(remote)}\\)`, 'g')
          const htmlRemote = new RegExp(`<img[^>]+src=["']${esc(remote)}["']`, 'gi')
          content = content.replace(mdRemote, '').replace(htmlRemote, '')
        }
        await prisma.article.update({ where: { id: img.articleId }, data: { content } })
        removedFromArticle = img.articleId
      }
    }

    // 删除数据库记录
    await prisma.image.delete({ where: { id } })
    return NextResponse.json({ success: true, data: { removedFromArticle } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '删除失败' }, { status: 500 })
  }
}
