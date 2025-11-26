import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const articleId = searchParams.get('articleId') || undefined
    const images = await prisma.image.findMany({ where: articleId ? { articleId } : {}, orderBy: { createdAt: 'desc' }, take: 50 })
    return NextResponse.json({ success: true, data: { images } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const articleId: string = body.articleId
    const imageIds: string[] = Array.isArray(body.imageIds) ? body.imageIds : []
    const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls : []
    if (!articleId) return NextResponse.json({ success: false, error: '缺少articleId' }, { status: 400 })
    let updated = 0
    if (imageIds.length > 0) {
      const r = await prisma.image.updateMany({ where: { id: { in: imageIds } }, data: { articleId } })
      updated += r.count
    }
    if (imageUrls.length > 0) {
      const r = await prisma.image.updateMany({ where: { url: { in: imageUrls } }, data: { articleId } })
      updated += r.count
    }
    return NextResponse.json({ success: true, data: { updated } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '更新失败' }, { status: 500 })
  }
}