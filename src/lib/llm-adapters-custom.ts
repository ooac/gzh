// 专门为每个大模型厂商定制的适配器实现

interface LLMConfig {
  provider: string
  apiKey?: string
  apiEndpoint?: string
  selectedModel?: string
  temperature?: number
  maxTokens?: number
}

interface LLMAdapter {
  name: string
  callAPI: (prompt: string, config: LLMConfig) => Promise<string>
  formatResponse: (response: string) => any
}

// ModelScope 魔搭适配器
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
    // ModelScope端点格式: https://api-inference.modelscope.cn/v1/chat/completions
    const endpoint = config.apiEndpoint?.endsWith('/v1')
      ? `${config.apiEndpoint}/chat/completions`
      : `${config.apiEndpoint}/v1/chat/completions`

    // 构建请求体，根据ModelScope文档格式
    const requestBody: any = {
      model: config.selectedModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    }

    // ModelScope支持温度和max_tokens参数
    if (config.temperature !== undefined && config.temperature > 0) {
      requestBody.temperature = config.temperature
    }
    if (config.maxTokens !== undefined && config.maxTokens > 0) {
      requestBody.max_tokens = config.maxTokens
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`ModelScope API错误: ${response.status} ${response.statusText} - ${errorData.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// 硅基流动适配器
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
    // 硅基流动端点格式: https://api.siliconflow.cn/v1/chat/completions
    const endpoint = `${config.apiEndpoint}/v1/chat/completions`

    // 构建请求体，根据硅基流动文档格式
    const requestBody: any = {
      model: config.selectedModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    }

    // 硅基流动支持温度和max_tokens参数
    if (config.temperature !== undefined && config.temperature > 0) {
      requestBody.temperature = config.temperature
    }
    if (config.maxTokens !== undefined && config.maxTokens > 0) {
      requestBody.max_tokens = config.maxTokens
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`硅基流动 API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// 智谱AI适配器
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
    // 智谱端点格式: https://open.bigmodel.cn/api/paas/v4/chat/completions
    const endpoint = `${config.apiEndpoint}/chat/completions`

    // 构建请求体，根据智谱文档格式
    const requestBody: any = {
      model: config.selectedModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }

    // 智谱支持温度和max_tokens参数
    if (config.temperature !== undefined && config.temperature > 0) {
      requestBody.temperature = config.temperature
    }
    if (config.maxTokens !== undefined && config.maxTokens > 0) {
      requestBody.max_tokens = config.maxTokens
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`智谱AI API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// MiniMax适配器
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
    // MiniMax端点格式: https://api.minimax.io/v1/chat/completions
    const endpoint = `${config.apiEndpoint}/v1/chat/completions`

    // 构建请求体，根据MiniMax文档格式
    const requestBody: any = {
      model: config.selectedModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    }

    // MiniMax支持温度和max_tokens参数
    if (config.temperature !== undefined && config.temperature > 0) {
      requestBody.temperature = config.temperature
    }
    if (config.maxTokens !== undefined && config.maxTokens > 0) {
      requestBody.max_tokens = config.maxTokens
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`MiniMax API错误: ${response.status} ${response.statusText} - ${errorData.error?.msg || errorData.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || data.reply || '测试响应成功'
  }
}

// OpenRouter适配器
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
    // OpenRouter端点格式: https://openrouter.ai/api/v1/chat/completions
    const endpoint = `${config.apiEndpoint}/chat/completions`

    // 构建请求体，根据OpenRouter文档格式
    const requestBody: any = {
      model: config.selectedModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    }

    // OpenRouter支持温度和max_tokens参数
    if (config.temperature !== undefined && config.temperature > 0) {
      requestBody.temperature = config.temperature
    }
    if (config.maxTokens !== undefined && config.maxTokens > 0) {
      requestBody.max_tokens = config.maxTokens
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Content Factory LLM Test',
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API错误: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '测试响应成功'
  }
}

// AiHubMix适配器
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
    // AiHubMix端点格式: https://aihubmix.com/v1/chat/completions
    const endpoint = `${config.apiEndpoint}/v1/chat/completions`

    // 构建请求体，根据AiHubMix文档格式
    const requestBody: any = {
      model: config.selectedModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false
    }

    // AiHubMix支持温度和max_tokens参数
    if (config.temperature !== undefined && config.temperature > 0) {
      requestBody.temperature = config.temperature
    }
    if (config.maxTokens !== undefined && config.maxTokens > 0) {
      requestBody.max_tokens = config.maxTokens
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'Content-Factory-Agent/1.0'
      },
      body: JSON.stringify(requestBody)
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