import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const articleId = params.id
    const body = await req.json()
    const imageId: string = body.imageId
    if (!articleId || !imageId) return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 })
    const img = await prisma.image.findUnique({ where: { id: imageId } })
    if (!img) return NextResponse.json({ success: false, error: '图片不存在' }, { status: 404 })
    const art = await prisma.article.update({ where: { id: articleId }, data: { coverImageId: imageId } })
    return NextResponse.json({ success: true, data: art })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '设置封面失败' }, { status: 500 })
  }
}