import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''
    const searchHistoryId = searchParams.get('searchHistoryId') || ''
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam))) : 50
    const q = (searchParams.get('q') || '').trim()
    const start = (searchParams.get('start') || '').trim()
    const end = (searchParams.get('end') || '').trim()
    let dateFilter: any = undefined
    if (start || end) {
      const s = start ? new Date(start + 'T00:00:00') : undefined
      const e = end ? new Date(end + 'T23:59:59') : undefined
      dateFilter = { gte: s, lte: e }
    }
    if (!keyword && !searchHistoryId) {
      const reports = await prisma.analysisReport.findMany({
        orderBy: { generatedAt: 'desc' },
        take: limit,
        include: { searchHistory: { select: { keyword: true } } },
        where: {
          AND: [
            dateFilter ? { generatedAt: dateFilter } : {},
            q ? { searchHistory: { is: { keyword: { contains: q } } } } : {}
          ]
        }
      })
      const data = reports.map((r:any) => ({
        id: r.id,
        analysisData: r.analysisData,
        wordCloudData: r.wordCloudData,
        insightsData: r.insightsData,
        renderedMarkdown: r.renderedMarkdown,
        materialsJson: (r as any).materialsJson ?? null,
        generatedAt: r.generatedAt,
        exportedAt: r.exportedAt,
        searchHistoryId: r.searchHistoryId,
        keyword: r.searchHistory?.keyword || ''
      }))
      return NextResponse.json({ success: true, data })
    }
    let historyIds: string[] = []
    if (searchHistoryId) {
      historyIds = [searchHistoryId]
    } else {
      const histories = await prisma.searchHistory.findMany({ where: { keyword }, select: { id: true }, orderBy: { searchDate: 'desc' } })
      historyIds = histories.map(h => h.id)
    }
    if (historyIds.length === 0) return NextResponse.json({ success: true, data: [] })
    const reports = await prisma.analysisReport.findMany({
      where: { searchHistoryId: { in: historyIds } },
      orderBy: { generatedAt: 'desc' },
      include: { searchHistory: { select: { keyword: true } } },
      take: limit,
      ...(q || dateFilter ? {
        where: {
          AND: [
            { searchHistoryId: { in: historyIds } },
            q ? { searchHistory: { is: { keyword: { contains: q } } } } : {},
            dateFilter ? { generatedAt: dateFilter } : {}
          ]
        }
      } : {})
    })
    const data = reports.map((r:any) => ({
      id: r.id,
      analysisData: r.analysisData,
      wordCloudData: r.wordCloudData,
      insightsData: r.insightsData,
      renderedMarkdown: r.renderedMarkdown,
      materialsJson: (r as any).materialsJson ?? null,
      generatedAt: r.generatedAt,
      exportedAt: r.exportedAt,
      searchHistoryId: r.searchHistoryId,
      keyword: r.searchHistory?.keyword || ''
    }))
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '查询失败' }, { status: 500 })
  }
}
