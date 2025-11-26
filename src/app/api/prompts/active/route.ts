import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''
    if (!keyword) return NextResponse.json({ success: false, error: '缺少关键词' }, { status: 400 })
    const client: any = prisma as any
    const selModel = client.promptSelection
    if (!selModel) return NextResponse.json({ success: true, data: null })
    const sel = await selModel.findFirst({ where: { keyword } })
    return NextResponse.json({ success: true, data: sel || null })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const keyword = body.keyword as string
    if (!keyword) return NextResponse.json({ success: false, error: '缺少关键词' }, { status: 400 })
    const data = { extractId: body.extractId ?? null, aggregateId: body.aggregateId ?? null, briefId: body.briefId ?? null }
    const sel = await prisma.promptSelection.upsert({
      where: { keyword },
      update: data,
      create: { keyword, ...data }
    })
    return NextResponse.json({ success: true, data: sel })
  } catch (e) {
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 })
  }
}
