import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    const a = await prisma.wechatArticle.findUnique({ where: { id } })
    if (!a) return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 })
    return NextResponse.json({ success: true, data: a })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    await prisma.wechatArticle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '删除失败' }, { status: 500 })
  }
}