import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { llmAdapterFactory } from '@/lib/llm-adapters'

// 获取所有LLM配置
export async function GET() {
  try {
    // 获取新的供应商配置
    const providerConfigs = await prisma.lLMProviderConfig.findMany({
      include: {
        usageStats: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // 获取预定义模型
    const availableModels = await prisma.lLMModel.findMany({
      where: { isActive: true },
      orderBy: [
        { provider: 'asc' },
        { displayName: 'asc' }
      ]
    })

    // 获取所有可用的适配器信息
    const availableProviders = llmAdapterFactory.getAllAdapters()

    return NextResponse.json({
      success: true,
      data: {
        providerConfigs,
        availableModels,
        availableProviders
      }
    })
  } catch (error) {
    console.error('获取LLM配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取LLM配置失败' },
      { status: 500 }
    )
  }
}

// 创建或更新LLM配置
export async function POST(request: NextRequest) {
  let provider, apiKey, apiEndpoint, selectedModel, availableModels, isDefault

  try {
    const body = await request.json()
    provider = body.provider
    apiKey = body.apiKey
    apiEndpoint = body.apiEndpoint
    selectedModel = body.selectedModel
    availableModels = body.availableModels
    isDefault = body.isDefault ?? false

    // 验证必填字段
    if (!provider) {
      return NextResponse.json(
        { success: false, error: '供应商为必填项' },
        { status: 400 }
      )
    }

    // 验证供应商是否支持
    try {
      llmAdapterFactory.getAdapter(provider)
    } catch {
      return NextResponse.json(
        { success: false, error: `不支持的供应商: ${provider}` },
        { status: 400 }
      )
    }

    // 获取供应商名称
    const providerNames: { [key: string]: string } = {
      'modelscope': 'ModelScope',
      'siliconflow': '硅基流动',
      'zhipu': '智谱AI',
      'minimax': 'MiniMax',
      'openrouter': 'OpenRouter',
      'aihubmix': 'AiHubMix'
    }

    // 如果设置为默认配置，先将其他配置设为非默认
    if (isDefault) {
      await prisma.lLMProviderConfig.updateMany({
        data: { isDefault: false }
      })
    }

    // 使用 upsert 创建或更新配置（每个供应商一个配置，支持多个模型）
    const config = await prisma.lLMProviderConfig.upsert({
      where: { provider },
      update: {
        apiKey: apiKey || undefined,
        apiEndpoint: apiEndpoint || undefined,
        selectedModel,
        availableModels,
        isDefault,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        provider,
        name: providerNames[provider] || `${provider}配置`,
        apiKey,
        apiEndpoint,
        selectedModel,
        availableModels,
        isDefault,
        isActive: true,
        usageStats: {
          create: {
            usageCount: 0
          }
        }
      },
      include: {
        usageStats: true
      }
    })

    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('创建LLM配置失败:', error)
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : '无堆栈信息',
      requestData: { provider, apiKey, apiEndpoint, selectedModel, availableModels }
    })
    return NextResponse.json(
      { success: false, error: `创建LLM配置失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}