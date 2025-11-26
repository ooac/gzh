import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const articleId = searchParams.get('articleId') || ''
    if (!articleId) return NextResponse.json({ success: false, error: '缺少文章ID' }, { status: 400 })
    const records = await prisma.publishRecord.findMany({ where: { articleId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ success: true, data: { records } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}