'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Moon, Sun, Monitor, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function AppearanceSettings() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Card className="border-border shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <Palette className="mr-2 h-5 w-5 text-muted-foreground" />
                    外观设置
                </CardTitle>
                <CardDescription>
                    自定义界面外观和主题
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium text-foreground mb-4">主题选择</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setTheme('light')}
                                className={cn(
                                    "h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all relative",
                                    theme === 'light'
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-muted/50 text-muted-foreground"
                                )}
                            >
                                <Sun className="h-6 w-6" />
                                <span className="text-sm font-medium">简约白</span>
                                {theme === 'light' && <Check className="h-4 w-4 absolute top-2 right-2 text-primary" />}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setTheme('dark')}
                                className={cn(
                                    "h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all relative",
                                    theme === 'dark'
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-muted/50 text-muted-foreground"
                                )}
                            >
                                <Moon className="h-6 w-6" />
                                <span className="text-sm font-medium">深邃黑</span>
                                {theme === 'dark' && <Check className="h-4 w-4 absolute top-2 right-2 text-primary" />}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setTheme('aurora')}
                                className={cn(
                                    "h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all relative",
                                    theme === 'aurora'
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-muted/50 text-muted-foreground"
                                )}
                            >
                                <Sparkles className="h-6 w-6 text-primary" />
                                <span className="text-sm font-medium">极光紫</span>
                                {theme === 'aurora' && <Check className="h-4 w-4 absolute top-2 right-2 text-primary" />}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setTheme('system')}
                                className={cn(
                                    "h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all relative",
                                    theme === 'system'
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-muted/50 text-muted-foreground"
                                )}
                            >
                                <Monitor className="h-6 w-6" />
                                <span className="text-sm font-medium">跟随系统</span>
                                {theme === 'system' && <Check className="h-4 w-4 absolute top-2 right-2 text-primary" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-foreground mb-4">界面密度</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <Button variant="outline" className="border-border hover:bg-muted/50 text-muted-foreground">
                                宽松
                            </Button>
                            <Button variant="outline" className="border-2 border-primary bg-primary/10 text-foreground">
                                标准
                            </Button>
                            <Button variant="outline" className="border-border hover:bg-muted/50 text-muted-foreground">
                                紧凑
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
