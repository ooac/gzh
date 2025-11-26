/**
 * LLM API适配器
 * 支持多个大模型厂商的API调用
 */

export interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  apiKey?: string;
  apiEndpoint?: string;
  modelName?: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMAdapter {
  name: string;
  provider: string;
  callAPI(prompt: string, config: LLMConfig): Promise<string>;
  formatResponse(response: string): any;
}

export class ModelScopeAdapter implements LLMAdapter {
  name = 'ModelScope';
  provider = 'modelscope';

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch(`${config.apiEndpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName || 'qwen2.5-7b-instruct',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`ModelScope API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  formatResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('ModelScope返回的响应格式无效');
    }
  }
}

export class SiliconFlowAdapter implements LLMAdapter {
  name = '硅基流动';
  provider = 'siliconflow';

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch(`${config.apiEndpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`硅基流动API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  formatResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('硅基流动返回的响应格式无效');
    }
  }
}

export class ZhipuAdapter implements LLMAdapter {
  name = '智谱';
  provider = 'zhipu';

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName || 'glm-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`智谱API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  formatResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('智谱返回的响应格式无效');
    }
  }
}

export class MiniMaxAdapter implements LLMAdapter {
  name = 'MiniMax';
  provider = 'minimax';

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch(`${config.apiEndpoint}/text/chatcompletion_v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName || 'abab6.5s-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`MiniMax API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  formatResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('MiniMax返回的响应格式无效');
    }
  }
}

export class OpenRouterAdapter implements LLMAdapter {
  name = 'OpenRouter';
  provider = 'openrouter';

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Content Factory Agent',
      },
      body: JSON.stringify({
        model: config.modelName || 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  formatResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('OpenRouter返回的响应格式无效');
    }
  }
}

export class AiHubMixAdapter implements LLMAdapter {
  name = 'AiHubMix';
  provider = 'aihubmix';

  async callAPI(prompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch(`${config.apiEndpoint}/api/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName || 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      })
    });

    if (!response.ok) {
      throw new Error(`AiHubMix API调用失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  formatResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      throw new Error('AiHubMix返回的响应格式无效');
    }
  }
}

// 适配器工厂
export class LLMAdapterFactory {
  private adapters: Map<string, LLMAdapter> = new Map();

  constructor() {
    this.registerAdapters();
  }

  private registerAdapters() {
    const adapters = [
      new ModelScopeAdapter(),
      new SiliconFlowAdapter(),
      new ZhipuAdapter(),
      new MiniMaxAdapter(),
      new OpenRouterAdapter(),
      new AiHubMixAdapter()
    ];

    adapters.forEach(adapter => {
      this.adapters.set(adapter.provider, adapter);
    });
  }

  getAdapter(provider: string): LLMAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`不支持的LLM供应商: ${provider}`);
    }
    return adapter;
  }

  getAllAdapters(): { provider: string; name: string }[] {
    return Array.from(this.adapters.values()).map(adapter => ({
      provider: adapter.provider,
      name: adapter.name
    }));
  }
}

// 单例实例
export const llmAdapterFactory = new LLMAdapterFactory();