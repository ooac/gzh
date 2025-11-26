// 最终版本：完全移除温度和maxTokens参数的LLM适配器

export interface LLMConfig {
  id?: string
  name?: string
  provider: string
  apiKey?: string
  apiEndpoint?: string
  selectedModel?: string
  isActive?: boolean
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
  usageStats?: {
    usageCount: number
    lastUsedAt?: string
  }
}

interface LLMAdapter {
  name: string
  callAPI: (prompt: string, config: LLMConfig) => Promise<string>
  formatResponse: (response: string) => any
}

// ModelScope 魔搭适配器（无温度参数）
class ModelScopeAdapter implements LLMAdapter {
  name = 'ModelScope'

  formatResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      return { content: response, insights: [], wordCloud: [] }
    }
  }

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const endpoint = config.apiEndpoint?.endsWith('/v1')
      ? `${config.apiEndpoint}/chat/completions`
      : `${config.apiEndpoint}/v1/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`ModelScope API错误: ${response.status} ${response.statusText} - ${errorData.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// 硅基流动适配器（无温度参数）
class SiliconFlowAdapter implements LLMAdapter {
  name = '硅基流动'

  formatResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      return { content: response, insights: [], wordCloud: [] }
    }
  }

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const endpoint = config.apiEndpoint?.endsWith('/v1')
      ? `${config.apiEndpoint}/chat/completions`
      : `${config.apiEndpoint}/v1/chat/completions`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`硅基流动 API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// 智谱AI适配器（无温度参数）
class ZhipuAdapter implements LLMAdapter {
  name = '智谱AI'

  formatResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      return { content: response, insights: [], wordCloud: [] }
    }
  }

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    // 修复API端点格式，避免双斜杠
    const endpoint = config.apiEndpoint?.endsWith('/')
      ? `${config.apiEndpoint}chat/completions`
      : `${config.apiEndpoint}/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // 智谱AI特殊错误处理
      if (response.status === 429) {
        // 429可能是频率限制或余额不足，需要特殊处理
        const errorCode = errorData.error?.code
        if (errorCode === '1113') {
          throw new Error(`智谱AI API错误: 账户余额不足或无可用资源包，错误代码: ${errorCode}`)
        } else {
          throw new Error(`智谱AI API错误: 请求频率过高，请稍后再试。错误代码: ${errorCode || '未知'}`)
        }
      }

      throw new Error(`智谱AI API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// MiniMax适配器（无温度参数）
class MiniMaxAdapter implements LLMAdapter {
  name = 'MiniMax'

  formatResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      return { content: response, insights: [], wordCloud: [] }
    }
  }

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const endpoint = `${config.apiEndpoint}/text/chatcompletion`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`MiniMax API错误: ${response.status} ${response.statusText} - ${errorData.error?.msg || errorData.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || data.reply || '测试响应成功'
  }
}

// OpenRouter适配器（无温度参数）
class OpenRouterAdapter implements LLMAdapter {
  name = 'OpenRouter'

  formatResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      return { content: response, insights: [], wordCloud: [] }
    }
  }

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Content Factory LLM Test',
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// AiHubMix适配器（无温度参数）
class AiHubMixAdapter implements LLMAdapter {
  name = 'AiHubMix'

  formatResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      return { content: response, insights: [], wordCloud: [] }
    }
  }

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const endpoint = `${config.apiEndpoint}/chat/completions`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify({
        model: config.selectedModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`AiHubMix API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

class LLMAdapterFactory {
  private adapters: Map<string, LLMAdapter> = new Map()

  constructor() {
    this.adapters.set('modelscope', new ModelScopeAdapter())
    this.adapters.set('siliconflow', new SiliconFlowAdapter())
    this.adapters.set('zhipu', new ZhipuAdapter())
    this.adapters.set('minimax', new MiniMaxAdapter())
    this.adapters.set('openrouter', new OpenRouterAdapter())
    this.adapters.set('aihubmix', new AiHubMixAdapter())
  }

  getAdapter(provider: string): LLMAdapter {
    const adapter = this.adapters.get(provider)
    if (!adapter) {
      throw new Error(`不支持的LLM提供商: ${provider}`)
    }
    return adapter
  }

  getAllAdapters(): { provider: string; name: string }[] {
    return Array.from(this.adapters.entries()).map(([provider, adapter]) => ({
      provider,
      name: adapter.name
    }))
  }
}

export const llmAdapterFactory = new LLMAdapterFactory()
