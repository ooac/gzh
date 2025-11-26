'use client'

import React from 'react'
import { mdToHtml } from '@/lib/markdown-theme'
import { cn } from '@/lib/utils'

export default function MarkdownViewer({ content, theme }: { content: string, theme?: 'hammer' | 'hammer-beige' | 'fresh-green' | 'default' | 'dark' | 'aurora' }) {
  const resolvedTheme = React.useMemo(() => {
    if (theme) return theme
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('compose_theme')
      if (saved === 'hammer') return 'hammer'
      if (saved === 'hammer-beige') return 'hammer-beige'
      if (saved === 'fresh-green') return 'fresh-green'
      if (saved === 'dark') return 'dark'
      if (saved === 'aurora') return 'aurora'
    }
    return 'default'
  }, [theme])

  const html = React.useMemo(() => mdToHtml(content || "", resolvedTheme as any, false), [content, resolvedTheme])

  const themeClass = React.useMemo(() => {
    if (resolvedTheme === 'dark') return 'dark'
    if (resolvedTheme === 'aurora') return 'aurora'
    return ''
  }, [resolvedTheme])

  const containerStyle = React.useMemo(() => {
    if (resolvedTheme === 'hammer-beige') {
      return { backgroundColor: 'rgb(251, 247, 238)', padding: '20px', color: 'rgb(99, 87, 83)' }
    }
    if (resolvedTheme === 'hammer') {
      return { backgroundColor: '#ffffff', padding: '20px', color: '#000000' }
    }
    if (resolvedTheme === 'fresh-green') {
      return { backgroundColor: '#ffffff', padding: '20px', color: 'rgb(89, 89, 89)' }
    }
    // For Dark and Aurora, we rely on Tailwind classes and global theme variables
    // to ensure consistency with the App's theme definitions.
    return undefined
  }, [resolvedTheme])

  const proseClass = React.useMemo(() => {
    if (resolvedTheme === 'default') {
      return "prose prose-neutral dark:prose-invert max-w-none bg-card p-4 rounded-lg border border-border shadow-sm text-foreground"
    }
    
    if (resolvedTheme === 'dark' || resolvedTheme === 'aurora') {
      // Use theme tokens for background/text to match global styles
      // The 'dark' or 'aurora' class on the wrapper will activate dark mode variants
      return "prose prose-neutral dark:prose-invert max-w-none bg-background p-4 rounded-lg border border-border shadow-sm text-foreground"
    }

    // For specific paper themes (hammer, etc.), force light mode styles inside the container
    return "prose prose-neutral max-w-none rounded-lg border border-border shadow-sm"
  }, [resolvedTheme])

  return (
    <div
      className={cn(proseClass, themeClass)}
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}