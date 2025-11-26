import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const cfg = await prisma.aPIConfig.findFirst({ where: { service: { in: ['wechat_publish','wechat'] }, isActive: true } })
    const apiKey = cfg?.apiKey || process.env.WECHAT_PUBLISH_API_KEY || ''
    const apiUrl = (cfg?.apiUrl || 'https://wx.limyai.com').replace(/\/$/, '')
    if (!apiKey) return NextResponse.json({ success: false, error: '未配置公众号发布API密钥' }, { status: 400 })
    const r = await fetch(`${apiUrl}/api/openapi/wechat-accounts`, { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } })
    const raw = await r.text()
    let data: any = null
    try { data = JSON.parse(raw) } catch {}
    if (!r.ok || (data && data.success === false)) {
      return NextResponse.json({ success: false, error: (data && data.error) || raw || '获取公众号列表失败', code: data?.code }, { status: r.status || 500 })
    }
    return NextResponse.json({ success: true, data: (data && data.data) ?? data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '服务异常' }, { status: 500 })
  }
}