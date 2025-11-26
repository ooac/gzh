import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const { searchParams, pathname } = new URL(req.url)
    const id = params.id || searchParams.get('id') || pathname.split('/').pop() || ''
    if (!id) return NextResponse.json({ success: false, error: '缺少记录ID' }, { status: 400 })
    await prisma.publishRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '删除失败' }, { status: 500 })
  }
}