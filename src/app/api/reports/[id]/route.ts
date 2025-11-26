import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    const report = await prisma.analysisReport.findUnique({ where: { id } })
    return NextResponse.json({ success: true, data: report })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    const body = await request.json()
    const data: any = {}
    if (body.analysisData !== undefined) data.analysisData = typeof body.analysisData === 'string' ? body.analysisData : JSON.stringify(body.analysisData)
    if (body.wordCloudData !== undefined) data.wordCloudData = typeof body.wordCloudData === 'string' ? body.wordCloudData : JSON.stringify(body.wordCloudData)
    if (body.insightsData !== undefined) data.insightsData = typeof body.insightsData === 'string' ? body.insightsData : JSON.stringify(body.insightsData)
    if (body.renderedMarkdown !== undefined) data.renderedMarkdown = body.renderedMarkdown
    const updated = await prisma.analysisReport.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ success: false, error: '未找到报告' }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: e?.message || '更新失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    await prisma.analysisReport.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ success: true })
    return NextResponse.json({ success: false, error: e?.message || '删除失败' }, { status: 500 })
  }
}
