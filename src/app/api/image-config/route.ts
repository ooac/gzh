import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const cfg = await prisma.aPIConfig.findFirst({ where: { service: 'siliconflow-image', isActive: true } })
    return NextResponse.json({ success: true, data: cfg || null })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '获取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const apiKey: string = (body.apiKey || '').trim()
    const apiUrl: string = (body.apiUrl || 'https://api.siliconflow.cn/v1').trim()
    if (!apiKey) return NextResponse.json({ success: false, error: '缺少API Key' }, { status: 400 })
    const existing = await prisma.aPIConfig.findFirst({ where: { service: 'siliconflow-image' } })
    let cfg
    if (existing) {
      cfg = await prisma.aPIConfig.update({ where: { id: existing.id }, data: { apiKey, apiUrl, isActive: true } })
    } else {
      cfg = await prisma.aPIConfig.create({ data: { service: 'siliconflow-image', apiKey, apiUrl, isActive: true, balance: 0, currency: 'CNY' } })
    }
    return NextResponse.json({ success: true, data: cfg })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '保存失败' }, { status: 500 })
  }
}
