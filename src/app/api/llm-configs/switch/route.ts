import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { configId } = await request.json()

    if (!configId) {
      return NextResponse.json(
        { success: false, error: '缺少配置ID' },
        { status: 400 }
      )
    }

    // 验证配置是否存在
    const targetConfig = await prisma.lLMProviderConfig.findUnique({
      where: { id: configId }
    })

    if (!targetConfig) {
      return NextResponse.json(
        { success: false, error: '指定的配置不存在' },
        { status: 404 }
      )
    }

    // 将所有配置设为非激活
    await prisma.lLMProviderConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // 将目标配置设为激活
    await prisma.lLMProviderConfig.update({
      where: { id: configId },
      data: { isActive: true }
    })

    return NextResponse.json({
      success: true,
      message: 'LLM配置切换成功'
    })

  } catch (error) {
    console.error('切换LLM配置失败:', error)
    return NextResponse.json(
      { success: false, error: '切换配置失败' },
      { status: 500 }
    )
  }
}