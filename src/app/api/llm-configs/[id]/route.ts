import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { llmAdapterFactory } from '@/lib/llm-adapters'

// 获取单个LLM配置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const config = await prisma.lLMProviderConfig.findUnique({
      where: { id },
      include: {
        usageStats: true
      }
    })

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'LLM配置不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('获取LLM配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取LLM配置失败' },
      { status: 500 }
    )
  }
}

// 更新LLM配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const {
      name,
      apiKey,
      apiEndpoint,
      selectedModel,
      availableModels,
      isActive,
      isDefault
    } = await request.json()

    // 验证配置是否存在
    const existingConfig = await prisma.lLMProviderConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'LLM配置不存在' },
        { status: 404 }
      )
    }

    // 如果设置为默认配置，先将其他配置设为非默认
    if (isDefault) {
      await prisma.lLMProviderConfig.updateMany({
        where: {
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    // 更新配置
    const updateData: any = {
      updatedAt: new Date()
    }
    if (name !== undefined) updateData.name = name
    if (apiKey !== undefined) updateData.apiKey = apiKey
    if (apiEndpoint !== undefined) updateData.apiEndpoint = apiEndpoint
    if (selectedModel !== undefined) updateData.selectedModel = selectedModel
    if (availableModels !== undefined) updateData.availableModels = availableModels
    if (isActive !== undefined) updateData.isActive = isActive
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const config = await prisma.lLMProviderConfig.update({
      where: { id },
      data: updateData,
      include: {
        usageStats: true
      }
    })

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('更新LLM配置失败:', error)
    return NextResponse.json(
      { success: false, error: '更新LLM配置失败' },
      { status: 500 }
    )
  }
}

// 删除LLM配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 验证配置是否存在
    const existingConfig = await prisma.lLMProviderConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { success: false, error: 'LLM配置不存在' },
        { status: 404 }
      )
    }

    // 删除相关的使用统计
    await prisma.lLMUsageStats.deleteMany({
      where: { providerConfigId: id }
    })

    // 删除配置
    await prisma.lLMProviderConfig.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'LLM配置删除成功'
    })
  } catch (error) {
    console.error('删除LLM配置失败:', error)
    return NextResponse.json(
      { success: false, error: '删除LLM配置失败' },
      { status: 500 }
    )
  }
}

// 测试LLM配置连接
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 获取配置
    const config = await prisma.lLMProviderConfig.findUnique({
      where: { id }
    })

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'LLM配置不存在' },
        { status: 404 }
      )
    }

    if (!config.isActive) {
      return NextResponse.json(
        { success: false, error: 'LLM配置已禁用' },
        { status: 400 }
      )
    }

    // 获取适配器
    const adapter = llmAdapterFactory.getAdapter(config.provider)

    console.log(`🧪 开始测试${adapter.name}配置连接...`)

    // 构建测试提示词
    const testPrompt = "请回答一个简单的问题：1+1等于多少？"

    try {
      // 调用API进行测试
      const response = await adapter.callAPI(testPrompt, {
        ...config,
        apiKey: config.apiKey || undefined,
        apiEndpoint: config.apiEndpoint || undefined,
        selectedModel: config.selectedModel || undefined,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString()
      })
      console.log(`✅ ${adapter.name}连接测试成功`)

      return NextResponse.json({
        success: true,
        message: '连接测试成功',
        data: {
          provider: config.provider,
          modelName: config.selectedModel,
          adapterName: adapter.name,
          testResponse: typeof response === 'string' ? response.substring(0, 100) + '...' : '测试成功'
        }
      })
    } catch (apiError) {
      console.error(`❌ ${adapter.name}连接测试失败:`, apiError)
      return NextResponse.json({
        success: false,
        error: `连接测试失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`,
        data: {
          provider: config.provider,
          modelName: config.selectedModel,
          adapterName: adapter.name
        }
      }, { status: 400 })
    }
  } catch (error) {
    console.error('测试LLM配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '测试连接失败',
        fallback: true
      },
      { status: 500 }
    )
  }
}