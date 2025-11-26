import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tpl = await prisma.promptTemplate.findFirst({ where: { type: 'image_prompt' }, orderBy: { updatedAt: 'desc' } })
    return NextResponse.json({ success: true, data: tpl || null })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '获取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const content: string = (body.content || '').trim()
    if (!content) return NextResponse.json({ success: false, error: '缺少模板内容' }, { status: 400 })
    const tpl = await prisma.promptTemplate.upsert({
      where: { name_version: { name: 'image_prompt_default', version: 'v1' } },
      update: { content },
      create: { name: 'image_prompt_default', content, type: 'image_prompt', version: 'v1' }
    })
    return NextResponse.json({ success: true, data: tpl })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '保存失败' }, { status: 500 })
  }
}