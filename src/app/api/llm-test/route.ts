import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { llmAdapterFactory } from '@/lib/llm-adapters'

// 测试LLM配置连接
export async function POST(request: NextRequest) {
  try {
    const { configId } = await request.json()

    if (!configId) {
      return NextResponse.json(
        { success: false, error: '配置ID是必需的' },
        { status: 400 }
      )
    }

    // 获取配置
    const config = await prisma.lLMProviderConfig.findUnique({
      where: { id: configId },
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

    if (!config.isActive) {
      return NextResponse.json(
        { success: false, error: 'LLM配置已禁用' },
        { status: 400 }
      )
    }

    // 检查是否有必要的配置
    if (!config.apiKey || !config.apiEndpoint || !config.selectedModel) {
      return NextResponse.json(
        {
          success: false,
          error: '配置不完整，请检查API密钥、端点和模型配置'
        },
        { status: 400 }
      )
    }

    const adapter = llmAdapterFactory.getAdapter(config.provider)

    let selectedModelName = ''
    if (config.selectedModel) {
      const model = await prisma.lLMModel.findUnique({ where: { id: config.selectedModel } })
      selectedModelName = model?.modelName || ''
    }

    const testConfig = {
      provider: config.provider,
      apiKey: config.apiKey,
      apiEndpoint: config.apiEndpoint,
      selectedModel: selectedModelName || (typeof config.selectedModel === 'string' ? config.selectedModel : '')
    }

    console.log(`🧪 开始测试${adapter.name}配置连接...`)

    // 构建测试提示词
    const testPrompt = "Hi"

    try {
      // 调用API进行测试
      const response = await adapter.callAPI(testPrompt, testConfig)
      console.log(`✅ ${adapter.name}连接测试成功`)

      // 更新使用统计
      if (config.usageStats) {
        await prisma.lLMUsageStats.update({
          where: { id: config.usageStats.id },
          data: {
            usageCount: config.usageStats.usageCount + 1,
            lastUsedAt: new Date()
          }
        })
      } else {
        await prisma.lLMUsageStats.create({
          data: {
            providerConfigId: config.id,
            usageCount: 1,
            lastUsedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: '连接测试成功',
        data: {
          provider: config.provider,
          modelName: testConfig.selectedModel,
          adapterName: adapter.name,
          testResponse: typeof response === 'string' ? response.substring(0, 100) + '...' : '测试成功'
        }
      })
    } catch (apiError) {
      console.error(`❌ ${adapter.name}连接测试失败:`, apiError)

      // 为特定错误类型提供更友好的错误信息
      let errorMessage = apiError instanceof Error ? apiError.message : '未知错误'
      let isAuthError = false
      let isRateLimitError = false

      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = `API密钥无效或已过期，请检查${adapter.name}的API密钥配置`
        isAuthError = true
      } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        // 智谱AI特殊情况：429可能是余额不足
        if (config.provider === 'zhipu' && errorMessage.includes('1113')) {
          errorMessage = `智谱AI账户余额不足或无可用资源包（错误代码：1113）。请检查账户余额或联系智谱客服。`
          isRateLimitError = false // 这不是真正的频率限制
        } else {
          errorMessage = `API调用频率过高，请稍后再试。这表明连接成功，但触发了频率限制。`
          isRateLimitError = true
        }
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        errorMessage = `API地址不正确，请检查${adapter.name}的API端点配置`
      }

      return NextResponse.json({
        success: false,
        error: `连接测试失败: ${errorMessage}`,
        data: {
          provider: config.provider,
          modelName: config.selectedModel,
          adapterName: adapter.name,
          isAuthError,
          isRateLimitError,
          originalError: apiError instanceof Error ? apiError.message : '未知错误'
        }
      }, { status: 400 })
    }
  } catch (error) {
    console.error('测试LLM配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '测试连接失败'
      },
      { status: 500 }
    )
  }
}
