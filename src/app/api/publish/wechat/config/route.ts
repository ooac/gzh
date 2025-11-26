import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SERVICE_CANDIDATES = ['wechat_publish','wechat']

export async function GET() {
  try {
    const cfg = await prisma.aPIConfig.findFirst({ where: { service: { in: SERVICE_CANDIDATES }, isActive: true } })
    return NextResponse.json({ success: true, data: { apiKey: cfg?.apiKey || '', apiUrl: cfg?.apiUrl || '' } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const apiKey = String(body?.apiKey || '')
    const apiUrl = String(body?.apiUrl || '').replace(/\/$/, '')
    const existing = await prisma.aPIConfig.findFirst({ where: { service: { in: SERVICE_CANDIDATES }, isActive: true } })
    const data = { service: 'wechat_publish', apiKey, apiUrl, balance: existing?.balance || 0, currency: existing?.currency || 'CNY', config: existing?.config || '{}', isActive: true }
    let saved
    if (existing) saved = await prisma.aPIConfig.update({ where: { id: existing.id }, data })
    else saved = await prisma.aPIConfig.create({ data })
    return NextResponse.json({ success: true, data: { apiKey: saved.apiKey || '', apiUrl: saved.apiUrl || '' } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '保存失败' }, { status: 500 })
  }
}