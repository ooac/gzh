import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const id = params.id
    const body = await request.json()
    const item = await prisma.promptTemplate.update({
      where: { id },
      data: { name: body.name, content: body.content, version: body.version }
    })
    return NextResponse.json({ success: true, data: item })
  } catch {
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const url = new URL(request.url)
    const id = params?.id ?? (url.pathname.split('/').pop() || '')
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    const client: any = prisma as any
    const selModel = client.promptSelection
    if (selModel) {
      await selModel.updateMany({ where: { extractId: id }, data: { extractId: null } })
      await selModel.updateMany({ where: { aggregateId: id }, data: { aggregateId: null } })
      await selModel.updateMany({ where: { briefId: id }, data: { briefId: null } })
    }
    try {
      await prisma.promptTemplate.delete({ where: { id } })
    } catch (e: any) {
      if (e?.code === 'P2025') {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ success: false, error: e?.message || '删除失败', code: e?.code }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '删除失败', code: e?.code }, { status: 500 })
  }
}
