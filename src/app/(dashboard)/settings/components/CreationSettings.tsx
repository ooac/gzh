'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PenTool, Layout, Image as ImageIcon, Check } from 'lucide-react'

export default function CreationSettings() {
    const [theme, setTheme] = useState('default')
    const [imageStyle, setImageStyle] = useState('photography')
    const [imageRatio, setImageRatio] = useState('16:9')
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        // Load saved settings
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('compose_theme')
            const savedStyle = localStorage.getItem('image_style')
            const savedRatio = localStorage.getItem('image_ratio')

            if (savedTheme) setTheme(savedTheme)
            if (savedStyle) setImageStyle(savedStyle)
            if (savedRatio) setImageRatio(savedRatio)
        }
    }, [])

    const handleSave = () => {
        setLoading(true)
        // Simulate API delay
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('compose_theme', theme)
                localStorage.setItem('image_style', imageStyle)
                localStorage.setItem('image_ratio', imageRatio)
            }
            setLoading(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }, 500)
    }

    return (
        <Card className="border-border shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <PenTool className="mr-2 h-5 w-5 text-muted-foreground" />
                    创作设置
                </CardTitle>
                <CardDescription>
                    配置内容创作的默认偏好
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {/* Article Theme */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Layout className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium text-foreground">文章排版</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    默认主题
                                </label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger className="bg-background border-input">
                                        <SelectValue placeholder="选择主题" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">默认主题 (标准)</SelectItem>
                                        <SelectItem value="minimal">极简黑 (Craft风格)</SelectItem>
                                        <SelectItem value="wechat">微信公众号 (优化排版)</SelectItem>
                                        <SelectItem value="modern">现代商务 (蓝色系)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-2">
                                    新创建的文章将默认使用此主题
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Image Generation */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium text-foreground">图片生成</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    默认风格
                                </label>
                                <Select value={imageStyle} onValueChange={setImageStyle}>
                                    <SelectTrigger className="bg-background border-input">
                                        <SelectValue placeholder="选择风格" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="photography">摄影写实</SelectItem>
                                        <SelectItem value="illustration">扁平插画</SelectItem>
                                        <SelectItem value="3d-render">3D 渲染</SelectItem>
                                        <SelectItem value="anime">动漫风格</SelectItem>
                                        <SelectItem value="cyberpunk">赛博朋克</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    默认比例
                                </label>
                                <Select value={imageRatio} onValueChange={setImageRatio}>
                                    <SelectTrigger className="bg-background border-input">
                                        <SelectValue placeholder="选择比例" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="16:9">16:9 (横屏)</SelectItem>
                                        <SelectItem value="4:3">4:3 (标准)</SelectItem>
                                        <SelectItem value="1:1">1:1 (方形)</SelectItem>
                                        <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="min-w-[100px]"
                        >
                            {loading ? '保存中...' : saved ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    已保存
                                </>
                            ) : '保存设置'}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
