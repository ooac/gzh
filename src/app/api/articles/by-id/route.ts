import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || ''
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 })
    return NextResponse.json({ success: true, data: article })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}