import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 预定义的LLM模型数据
const llmModels = [
  // ModelScope 模型
  {
    provider: 'modelscope',
    modelName: 'qwen2.5-7b-instruct',
    displayName: '通义千问2.5-7B',
    description: '阿里通义千问2.5版本，70亿参数指令模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'modelscope',
    modelName: 'qwen2.5-14b-instruct',
    displayName: '通义千问2.5-14B',
    description: '阿里通义千问2.5版本，140亿参数指令模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'modelscope',
    modelName: 'qwen2.5-32b-instruct',
    displayName: '通义千问2.5-32B',
    description: '阿里通义千问2.5版本，320亿参数指令模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'modelscope',
    modelName: 'qwen2.5-72b-instruct',
    displayName: '通义千问2.5-72B',
    description: '阿里通义千问2.5版本，720亿参数指令模型',
    maxTokens: 8000,
    isActive: true
  },

  // SiliconFlow 模型
  {
    provider: 'siliconflow',
    modelName: 'qwen2.5-7b-instruct',
    displayName: '通义千问2.5-7B',
    description: '硅基流动平台上的通义千问2.5-7B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'siliconflow',
    modelName: 'qwen2.5-14b-instruct',
    displayName: '通义千问2.5-14B',
    description: '硅基流动平台上的通义千问2.5-14B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'siliconflow',
    modelName: 'qwen2.5-32b-instruct',
    displayName: '通义千问2.5-32B',
    description: '硅基流动平台上的通义千问2.5-32B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'siliconflow',
    modelName: 'qwen2.5-72b-instruct',
    displayName: '通义千问2.5-72B',
    description: '硅基流动平台上的通义千问2.5-72B模型',
    maxTokens: 8000,
    isActive: true
  },

  // 智谱AI 模型
  {
    provider: 'zhipu',
    modelName: 'glm-4-flash',
    displayName: 'GLM-4-Flash',
    description: '智谱GLM-4 Flash版本，高速推理模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'zhipu',
    modelName: 'glm-4-plus',
    displayName: 'GLM-4-Plus',
    description: '智谱GLM-4 Plus版本，增强性能模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'zhipu',
    modelName: 'glm-4-air',
    displayName: 'GLM-4-Air',
    description: '智谱GLM-4 Air版本，轻量级模型',
    maxTokens: 8000,
    isActive: true
  },

  // MiniMax 模型
  {
    provider: 'minimax',
    modelName: 'abab-6.5s-chat',
    displayName: 'abab-6.5s-chat',
    description: 'MiniMax abab-6.5s系列对话模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'minimax',
    modelName: 'abab-6.5t-chat',
    displayName: 'abab-6.5t-chat',
    description: 'MiniMax abab-6.5t系列对话模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'minimax',
    modelName: 'abab-6-chat',
    displayName: 'abab-6-chat',
    description: 'MiniMax abab-6系列对话模型',
    maxTokens: 8000,
    isActive: true
  },

  // OpenRouter 模型
  {
    provider: 'openrouter',
    modelName: 'qwen/qwen-2.5-7b-instruct',
    displayName: 'Qwen2.5-7B-Instruct',
    description: 'OpenRouter上的通义千问2.5-7B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'openrouter',
    modelName: 'qwen/qwen-2.5-14b-instruct',
    displayName: 'Qwen2.5-14B-Instruct',
    description: 'OpenRouter上的通义千问2.5-14B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'openrouter',
    modelName: 'qwen/qwen-2.5-32b-instruct',
    displayName: 'Qwen2.5-32B-Instruct',
    description: 'OpenRouter上的通义千问2.5-32B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'openrouter',
    modelName: 'qwen/qwen-2.5-72b-instruct',
    displayName: 'Qwen2.5-72B-Instruct',
    description: 'OpenRouter上的通义千问2.5-72B模型',
    maxTokens: 8000,
    isActive: true
  },

  // AiHubMix 模型
  {
    provider: 'aihubmix',
    modelName: 'qwen2.5-7b-instruct',
    displayName: '通义千问2.5-7B',
    description: 'AiHubMix平台上的通义千问2.5-7B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'aihubmix',
    modelName: 'qwen2.5-14b-instruct',
    displayName: '通义千问2.5-14B',
    description: 'AiHubMix平台上的通义千问2.5-14B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'aihubmix',
    modelName: 'qwen2.5-32b-instruct',
    displayName: '通义千问2.5-32B',
    description: 'AiHubMix平台上的通义千问2.5-32B模型',
    maxTokens: 8000,
    isActive: true
  },
  {
    provider: 'aihubmix',
    modelName: 'qwen2.5-72b-instruct',
    displayName: '通义千问2.5-72B',
    description: 'AiHubMix平台上的通义千问2.5-72B模型',
    maxTokens: 8000,
    isActive: true
  }
]

// 默认的供应商配置
const defaultProviderConfigs = [
  {
    provider: 'modelscope',
    name: 'ModelScope配置',
    apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    isDefault: true,
  },
  {
    provider: 'siliconflow',
    name: '硅基流动配置',
    apiEndpoint: 'https://api.siliconflow.cn/v1',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    isDefault: false,
  },
  {
    provider: 'zhipu',
    name: '智谱AI配置',
    apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    isDefault: false,
  },
  {
    provider: 'minimax',
    name: 'MiniMax配置',
    apiEndpoint: 'https://api.minimax.chat/v1',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    isDefault: false,
  },
  {
    provider: 'openrouter',
    name: 'OpenRouter配置',
    apiEndpoint: 'https://openrouter.ai/api/v1',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    isDefault: false,
  },
  {
    provider: 'aihubmix',
    name: 'AiHubMix配置',
    apiEndpoint: 'https://aihubmix.com/v1',
    temperature: 0.7,
    maxTokens: 2000,
    isActive: true,
    isDefault: false,
  }
]

async function main() {
  console.log('开始初始化LLM模型数据...')

  try {
    // 清空现有数据（可选）
    // await prisma.lLMModel.deleteMany({})
    // await prisma.lLMProviderConfig.deleteMany({})

    // 插入预定义模型
    console.log('插入预定义LLM模型...')
    for (const model of llmModels) {
      const existingModel = await prisma.lLMModel.findUnique({
        where: {
          provider_modelName: {
            provider: model.provider,
            modelName: model.modelName
          }
        }
      })

      if (!existingModel) {
        await prisma.lLMModel.create({
          data: model
        })
        console.log(`✅ 创建模型: ${model.provider}/${model.modelName}`)
      } else {
        console.log(`⚠️ 模型已存在: ${model.provider}/${model.modelName}`)
      }
    }

    // 插入默认供应商配置
    console.log('插入默认供应商配置...')
    for (const config of defaultProviderConfigs) {
      const existingConfig = await prisma.lLMProviderConfig.findUnique({
        where: { provider: config.provider }
      })

      if (!existingConfig) {
        await prisma.lLMProviderConfig.create({
          data: {
            ...config,
            usageStats: {
              create: {
                usageCount: 0
              }
            }
          }
        })
        console.log(`✅ 创建供应商配置: ${config.provider}`)

        // 为该供应商设置默认选中模型
        const firstModel = await prisma.lLMModel.findFirst({
          where: { provider: config.provider, isActive: true }
        })

        if (firstModel) {
          await prisma.lLMProviderConfig.update({
            where: { provider: config.provider },
            data: { selectedModel: firstModel.id }
          })
          console.log(`🎯 设置默认模型: ${config.provider} -> ${firstModel.modelName}`)
        }
      } else {
        console.log(`⚠️ 供应商配置已存在: ${config.provider}`)
      }
    }

    console.log('✅ LLM模型初始化完成！')

    // 显示统计信息
    const modelCount = await prisma.lLMModel.count()
    const configCount = await prisma.lLMProviderConfig.count()

    console.log(`📊 统计信息:`)
    console.log(`   - 预定义模型: ${modelCount}个`)
    console.log(`   - 供应商配置: ${configCount}个`)

  } catch (error) {
    console.error('❌ 初始化失败:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })