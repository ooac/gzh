import { NextRequest, NextResponse } from 'next/server'
import { getSearchHistoryList, getSearchHistoryById } from '@/lib/db/operations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (id) {
      // 获取单个搜索历史详情
      const history = await getSearchHistoryById(id)
      if (!history) {
        return NextResponse.json(
          { success: false, error: '未找到该搜索记录' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: history
      })
    } else {
      // 获取搜索历史列表
      const histories = await getSearchHistoryList(limit)

      return NextResponse.json({
        success: true,
        data: histories
      })
    }
  } catch (error) {
    console.error('获取搜索历史失败:', error)
    return NextResponse.json(
      { success: false, error: '获取搜索历史失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少记录ID' },
        { status: 400 }
      )
    }

    await deleteSearchHistory(id)

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除搜索历史失败:', error)
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    )
  }
}

import { deleteSearchHistory } from '@/lib/db/operations'