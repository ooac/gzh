import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SERVICE = 'compose_prefs'

function parseCfg(cfg: any) {
  try {
    const j = typeof cfg?.config === 'string' ? JSON.parse(cfg.config) : (cfg?.config || {})
    return (j && typeof j === 'object') ? j : {}
  } catch { return {} }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = (searchParams.get('mode') || 'fromReport') as 'fromReport'|'rewrite'|'custom'
    const existing = await prisma.aPIConfig.findFirst({ where: { service: SERVICE } })
    const cfgObj = parseCfg(existing)
    const tailEnabled = cfgObj?.[mode]?.tailEnabled
    return NextResponse.json({ success: true, data: { mode, tailEnabled: tailEnabled === undefined ? true : !!tailEnabled } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const mode = (body.mode || 'fromReport') as 'fromReport'|'rewrite'|'custom'
    const tailEnabled = !!body.tailEnabled
    const existing = await prisma.aPIConfig.findFirst({ where: { service: SERVICE } })
    const cfgObj = parseCfg(existing)
    const next = { ...cfgObj, [mode]: { ...(cfgObj[mode] || {}), tailEnabled } }
    const data = { service: SERVICE, apiKey: '', apiUrl: '', isActive: true, balance: 0, currency: 'CNY', config: JSON.stringify(next) }
    let saved
    if (existing) saved = await prisma.aPIConfig.update({ where: { id: existing.id }, data })
    else saved = await prisma.aPIConfig.create({ data })
    return NextResponse.json({ success: true, data: { mode, tailEnabled } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '保存失败' }, { status: 500 })
  }
}