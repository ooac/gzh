import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeIconProps {
    icon: LucideIcon
    variant?: 'primary' | 'secondary' | 'glass' | 'outline'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    iconClassName?: string
}

export default function ThemeIcon({
    icon: Icon,
    variant = 'primary',
    size = 'md',
    className,
    iconClassName
}: ThemeIconProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 rounded-lg',
        md: 'w-10 h-10 rounded-xl',
        lg: 'w-12 h-12 rounded-2xl',
        xl: 'w-16 h-16 rounded-3xl'
    }

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    }

    const variantClasses = {
        primary: 'theme-icon-primary',
        secondary: 'theme-icon-secondary',
        glass: 'theme-icon-glass',
        outline: 'theme-icon-outline'
    }

    return (
        <div
            className={cn(
                'flex items-center justify-center transition-all duration-300 group-hover:scale-110',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
        >
            <Icon className={cn(iconSizes[size], iconClassName)} />
        </div>
    )
}
