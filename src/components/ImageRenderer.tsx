'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react'

interface ImageRendererProps {
  src: string
  alt: string
  className?: string
  fallbackText?: string
}

export default function ImageRenderer({
  src,
  alt,
  className = "",
  fallbackText = "图片无法加载"
}: ImageRendererProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [proxiedSrc, setProxiedSrc] = useState<string>('')
  const [retryCount, setRetryCount] = useState(0)
  const [isWechatImage, setIsWechatImage] = useState(false)

  useEffect(() => {
    if (!src) {
      setImageState('error')
      return
    }

    // 检查是否是微信图片
    const wechatPattern = /mmbiz\.qpic\.cn|wx\.qlogo\.cn/i
    setIsWechatImage(wechatPattern.test(src))
    setImageState('loading')
    setRetryCount(0)

    // 根据图片类型选择加载策略
    if (wechatPattern.test(src)) {
      // 微信图片：优先使用代理，失败后尝试原始链接
      setProxiedSrc(`/api/image-proxy?url=${encodeURIComponent(src)}`)
    } else {
      // 普通图片：直接使用
      setProxiedSrc(src)
    }
  }, [src])

  const handleImageLoad = () => {
    setImageState('loaded')
  }

  const handleImageError = () => {
    console.warn('图片加载失败:', proxiedSrc)

    if (isWechatImage && retryCount === 0 && proxiedSrc.startsWith('/api/image-proxy')) {
      // 第一次失败：尝试原始链接
      console.log('代理失败，尝试原始链接:', src)
      setProxiedSrc(src)
      setRetryCount(1)
    } else if (isWechatImage && retryCount === 1) {
      // 第二次失败：尝试添加时间戳参数
      const timestampedSrc = `${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`
      console.log('原始链接失败，尝试时间戳参数:', timestampedSrc)
      setProxiedSrc(timestampedSrc)
      setRetryCount(2)
    } else {
      // 所有尝试都失败
      setImageState('error')
    }
  }

  const handleRetry = () => {
    setImageState('loading')
    setRetryCount(0)

    if (isWechatImage) {
      setProxiedSrc(`/api/image-proxy?url=${encodeURIComponent(src)}`)
    } else {
      setProxiedSrc(src)
    }
  }

  // 如果没有src，显示占位符
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 border border-border rounded-lg ${className}`}>
        <div className="flex flex-col items-center p-4 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-sm">无图片</span>
        </div>
      </div>
    )
  }

  // 加载中状态
  if (imageState === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-muted/30 border border-border rounded-lg ${className}`}>
        <div className="flex items-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">
            {isWechatImage ? '通过代理加载图片...' : '加载图片中...'}
          </span>
        </div>
      </div>
    )
  }

  // 加载失败状态
  if (imageState === 'error') {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}>
        <div className="flex flex-col items-center p-4 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <span className="text-sm text-center">{fallbackText}</span>

          {/* 显示图片来源信息 */}
          {isWechatImage && (
            <span className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
              微信图片（受防盗链保护）
            </span>
          )}

          <span className="text-xs text-muted-foreground mt-1 text-center max-w-xs truncate">
            {src.substring(0, 50)}...
          </span>

          {/* 重试按钮 */}
          <button
            onClick={handleRetry}
            className="mt-2 flex items-center text-xs text-primary hover:text-primary/80"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            重试
          </button>
        </div>
      </div>
    )
  }

  // 成功加载状态
  return (
    <div className="relative">
      <img
        src={proxiedSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      {/* 如果是微信图片，显示提示 */}
      {isWechatImage && (
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md border border-border text-foreground text-[10px] px-2 py-1 rounded-full shadow-sm">
          微信图片
        </div>
      )}
    </div>
  )
}