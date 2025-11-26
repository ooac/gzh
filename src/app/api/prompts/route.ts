import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || undefined
  const keyword = searchParams.get('keyword') || undefined
  const where: any = {}
  if (type) where.type = type
  // 当传入 keyword 时，优先返回该关键词的模板，同时包含全局默认（keyword 为 null）的模板
  if (keyword) where.OR = [{ keyword }, { keyword: null }]
  const items = await prisma.promptTemplate.findMany({ where, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ success: true, data: items })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const content = String(body.content || '')
    const version = String(body.version || 'v1').trim()
    const type = String(body.type || 'collection_assistant').trim()
    if (!name || !content) {
      return NextResponse.json({ success: false, error: '参数不完整：name 或 content 缺失' }, { status: 400 })
    }
    const item = await prisma.promptTemplate.upsert({
      where: { name_version: { name, version } },
      update: { content, type, keyword: body.keyword || null },
      create: { name, content, type, version, keyword: body.keyword || null }
    })
    return NextResponse.json({ success: true, data: item })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : '创建失败'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
