'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LLMConfigManager from '@/components/LLMConfigManager'
import type { LLMConfig } from '@/lib/llm-adapters'

export default function LLMSettingsPage() {
  const [selectedConfig, setSelectedConfig] = useState<LLMConfig | null>(null)

  const handleConfigSelect = (config: LLMConfig) => {
    setSelectedConfig(config)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LLMConfigManager onConfigSelect={handleConfigSelect} />
        </div>

        <div className="space-y-4">
          {/* 当前选中配置信息 */}
          {selectedConfig && (
            <Card>
              <CardHeader>
                <CardTitle>当前配置</CardTitle>
                <CardDescription>
                  选中的大模型配置信息
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">配置名称:</span>
                    <span>{selectedConfig.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">供应商:</span>
                    <span>{selectedConfig.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">模型:</span>
                    <span>{selectedConfig.selectedModel || '未配置'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">状态:</span>
                    <span>{selectedConfig.isActive ? '激活' : '未激活'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">默认:</span>
                    <span>{selectedConfig.isDefault ? '是' : '否'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">使用次数:</span>
                    <span>{selectedConfig.usageStats?.usageCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 使用统计 */}
          <Card>
            <CardHeader>
              <CardTitle>使用统计</CardTitle>
              <CardDescription>
                大模型调用统计信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                配置的使用次数和最后使用时间等统计信息
              </p>
            </CardContent>
          </Card>

          {/* 配置说明 */}
          <Card>
            <CardHeader>
              <CardTitle>配置说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>默认配置</strong>：系统分析时默认使用的配置</p>
              <p>• <strong>激活状态</strong>：只有激活的配置才能使用</p>
              <p>• <strong>API密钥</strong>：需要从对应厂商获取有效的API密钥</p>
              <p>• <strong>模型名称</strong>：根据厂商文档填写正确的模型名称</p>
              <p>• <strong>供应商配置</strong>：每个供应商只能配置一次，支持多个模型</p>
              <p>• <strong>测试功能</strong>：配置完成后建议先测试连接是否正常</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}