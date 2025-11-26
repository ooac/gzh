"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Paintbrush } from "lucide-react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[150px] h-9 bg-background/50 backdrop-blur-sm border-input/50 focus:ring-primary/20 transition-all hover:bg-accent/10 hover:border-primary/30">
                    <div className="flex items-center gap-2">
                        <Paintbrush className="h-4 w-4 text-primary" />
                        <SelectValue placeholder="选择主题" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="light">
                        <span className="flex items-center gap-2">简约白</span>
                    </SelectItem>
                    <SelectItem value="dark">
                        <span className="flex items-center gap-2">深邃黑</span>
                    </SelectItem>
                    <SelectItem value="aurora">
                        <span className="flex items-center gap-2">极光紫 <span className="pro-badge ml-1">PRO</span></span>
                    </SelectItem>
                    <SelectItem value="system">
                        <span className="flex items-center gap-2">跟随系统</span>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
