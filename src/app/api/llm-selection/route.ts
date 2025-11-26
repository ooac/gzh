import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const feature = searchParams.get('feature') || ''
    if (!feature) return NextResponse.json({ success: false, error: '缺少feature' }, { status: 400 })
    const sel = await prisma.lLMFeatureSelection.findUnique({ where: { feature }, include: { providerConfig: true } })
    return NextResponse.json({ success: true, data: sel || null })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const feature = body.feature as string
    const providerConfigId = body.providerConfigId as string
    const selectedModel = body.selectedModel as string | undefined
    if (!feature || !providerConfigId) return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 })
    const sel = await prisma.lLMFeatureSelection.upsert({
      where: { feature },
      update: { providerConfigId, selectedModel },
      create: { feature, providerConfigId, selectedModel },
      include: { providerConfig: true }
    })
    return NextResponse.json({ success: true, data: sel })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '保存失败' }, { status: 500 })
  }
}