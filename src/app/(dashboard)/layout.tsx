'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import ThemeIcon from '@/components/ThemeIcon'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
const ExportReportButton = dynamic(() => import('@/components/ExportReportButton'), { ssr: false })
import {
  Search,
  PenTool,
  FileText,
  Send,
  BarChart3,
  Settings,
  Home
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navigation = [
    { name: '首页', href: '/dashboard', icon: Home },
    { name: '选题分析', href: '/analysis', icon: Search },
    { name: '内容创作', href: '/create', icon: PenTool },
    { name: '文章管理', href: '/articles', icon: FileText },
    { name: '发布管理', href: '/publish', icon: Send },
    { name: '数据分析', href: '/analytics', icon: BarChart3 },
    { name: '设置', href: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* 悬浮侧边栏 */}
      <aside className="fixed inset-y-4 left-4 z-50 w-72 hidden lg:flex flex-col glass-sidebar rounded-2xl border border-border shadow-sm">
        <div className="flex h-20 items-center justify-center border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
              C
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              ContentFactory
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const base = 'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group'
            const cls = isActive
              ? `${base} text-[var(--sidebar-active-fg)]`
              : `${base} text-muted-foreground hover:bg-accent hover:text-foreground`
            
            const activeStyle = isActive ? { backgroundColor: 'var(--sidebar-active)' } : {}

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cls}
                style={activeStyle}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={cn(
                  "mr-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isActive ? "bg-primary-foreground/10" : "bg-transparent"
                )}>
                  <Icon className={cn("w-4 h-4", isActive ? "text-current" : "text-muted-foreground group-hover:text-foreground")} />
                </div>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="rounded-xl p-4 bg-accent/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="pro-badge">PRO版</span>
              <span className="text-xs text-muted-foreground">v2.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">解锁更多AI高级模型与无限生成额度</p>
            <button className="w-full py-2 text-xs btn-premium rounded-lg transition-all active:scale-95">
              立即升级
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 lg:pl-80 min-h-screen flex flex-col">
        {/* 悬浮顶部导航栏 */}
        <header className="sticky top-4 z-40 mx-4 lg:mx-8 mt-4 rounded-2xl glass border border-border px-6 h-16 flex items-center justify-between transition-all duration-300 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              {navigation.find(n => pathname.startsWith(n.href))?.name || '仪表板'}
            </h2>
            <div className="h-4 w-px bg-border"></div>
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              系统运行正常
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ExportReportButton />
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-foreground">Admin User</div>
                <div className="text-xs text-muted-foreground">超级管理员</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-accent p-0.5 cursor-pointer hover:bg-accent/80 transition-colors">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center text-foreground font-bold text-sm border border-border">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 py-8 px-4 lg:px-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
