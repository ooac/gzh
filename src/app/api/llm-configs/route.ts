import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { llmAdapterFactory } from '@/lib/llm-adapters'

// 获取所有LLM配置
export async function GET() {
  try {
    // 获取新的供应商配置
    let providerConfigs = await prisma.lLMProviderConfig.findMany({
      include: {
        usageStats: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // 如果数据库为空，则从环境变量注入一组可用配置（不暴露到客户端源码）
    if (providerConfigs.length === 0) {
      const envConfigs = [
        {
          provider: 'modelscope',
          name: 'ModelScope',
          apiKey: process.env.MODELSCOPE_API_KEY,
          apiEndpoint: process.env.MODELSCOPE_ENDPOINT || 'https://api-inference.modelscope.cn/v1/',
          selectedModel: process.env.MODELSCOPE_MODEL || 'qwen2.5-7b-instruct'
        },
        {
          provider: 'siliconflow',
          name: '硅基流动',
          apiKey: process.env.SILICONFLOW_API_KEY,
          apiEndpoint: process.env.SILICONFLOW_ENDPOINT || 'https://api.siliconflow.cn',
          selectedModel: process.env.SILICONFLOW_MODEL || 'deepseek-chat'
        },
        {
          provider: 'zhipu',
          name: '智谱AI',
          apiKey: process.env.ZHIPU_API_KEY,
          apiEndpoint: process.env.ZHIPU_ENDPOINT || 'https://open.bigmodel.cn/api/paas/v4',
          selectedModel: process.env.ZHIPU_MODEL || 'glm-4'
        },
        {
          provider: 'minimax',
          name: 'MiniMax',
          apiKey: process.env.MINIMAX_API_KEY,
          apiEndpoint: process.env.MINIMAX_ENDPOINT || 'https://api.minimax.chat/v1/',
          selectedModel: process.env.MINIMAX_MODEL || 'abab6.5s-chat'
        },
        {
          provider: 'openrouter',
          name: 'OpenRouter',
          apiKey: process.env.OPENROUTER_API_KEY,
          apiEndpoint: process.env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/',
          selectedModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet'
        }
      ].filter(c => !!c.apiKey)

      if (envConfigs.length > 0) {
        for (const c of envConfigs) {
          const created = await prisma.lLMProviderConfig.upsert({
            where: { provider: c.provider },
            update: {
              apiKey: c.apiKey,
              apiEndpoint: c.apiEndpoint,
              selectedModel: c.selectedModel,
              isActive: true,
              updatedAt: new Date()
            },
            create: {
              provider: c.provider,
              name: c.name,
              apiKey: c.apiKey,
              apiEndpoint: c.apiEndpoint,
              selectedModel: c.selectedModel,
              isDefault: providerConfigs.length === 0, // 第一条作为默认
              isActive: true,
              usageStats: { create: { usageCount: 0 } }
            },
            include: { usageStats: true }
          })
        }
        providerConfigs = await prisma.lLMProviderConfig.findMany({
          include: { usageStats: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        })
      }
    }

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
