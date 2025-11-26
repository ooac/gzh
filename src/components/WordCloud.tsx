'use client'

import React, { useEffect, useRef } from 'react'

interface WordCloudProps {
  words: Array<{
    text: string
    value: number
  }>
  width?: number
  height?: number
}

export default function WordCloud({ words, width = 600, height = 300 }: WordCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || words.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    canvas.width = width
    canvas.height = height

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 计算字体大小范围
    const maxCount = Math.max(...words.map(w => w.value))
    const minCount = Math.min(...words.map(w => w.value))
    const sizeRange = 32 - 12 // 最大字体32px，最小12px

    // 绘制词云
    const positions: Array<{ x: number; y: number; width: number; height: number }> = []

    words.forEach((word, index) => {
      // 计算字体大小
      const fontSize = Math.round(12 + ((word.value - minCount) / (maxCount - minCount)) * sizeRange)
      ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`

      // 测量文字尺寸
      const metrics = ctx.measureText(word.text)
      const textWidth = metrics.width
      const textHeight = fontSize

      // 尝试找到不重叠的位置
      let placed = false
      let attempts = 0
      const maxAttempts = 50

      while (!placed && attempts < maxAttempts) {
        const x = Math.random() * (width - textWidth)
        const y = Math.random() * (height - textHeight) + textHeight

        // 检查是否与已放置的文字重叠
        const newBox = { x, y, width: textWidth, height: textHeight }
        const overlapping = positions.some(pos =>
          !(newBox.x + newBox.width < pos.x ||
            pos.x + pos.width < newBox.x ||
            newBox.y + newBox.height < pos.y ||
            pos.y + pos.height < newBox.y)
        )

        if (!overlapping || attempts > 20) { // 20次后允许重叠
          // 绘制文字
          const hue = (index * 137) % 360 // 黄金角度分布颜色
          ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
          ctx.fillText(word.text, x, y)

          // 保存位置信息
          positions.push(newBox)
          placed = true
        }

        attempts++
      }
    })
  }, [words, width, height])

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-muted-foreground">暂无词云数据</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg border border-border/50">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}