'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User,
  Bell,
  Shield,
  Database,
  Bot,
  Palette,
  Download,
  PenTool
} from 'lucide-react'

import ProfileSettings from './components/ProfileSettings'
import AISettings from './components/AISettings'
import CreationSettings from './components/CreationSettings'
import NotificationSettings from './components/NotificationSettings'
import SecuritySettings from './components/SecuritySettings'
import DataSettings from './components/DataSettings'
import AppearanceSettings from './components/AppearanceSettings'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('personal')

  const menuItems = [
    { id: 'personal', label: '个人信息', icon: User },
    { id: 'creation', label: '创作设置', icon: PenTool },
    { id: 'ai', label: 'AI配置', icon: Bot },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'data', label: '数据管理', icon: Database },
    { id: 'appearance', label: '外观设置', icon: Palette }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return <ProfileSettings />
      case 'creation':
        return <CreationSettings />
      case 'ai':
        return <AISettings />
      case 'notifications':
        return <NotificationSettings />
      case 'security':
        return <SecuritySettings />
      case 'data':
        return <DataSettings />
      case 'appearance':
        return <AppearanceSettings />
      default:
        return <ProfileSettings />
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-muted-foreground">系统运行正常</span>
          </div>
          <p className="text-muted-foreground mt-1">
            配置系统参数、用户偏好和AI服务
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-background border-border hover:bg-muted/50 text-foreground">
            <Download className="mr-2 h-4 w-4" />
            分析并导出
          </Button>
          <Button variant="outline" className="bg-background border-border hover:bg-muted/50 text-foreground">
            报告设置
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            导出配置
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧导航 */}
        <div className="lg:col-span-3">
          <Card className="border-border shadow-sm sticky top-6">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg font-bold text-foreground">设置分类</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`w-full justify-start px-4 py-6 text-sm font-medium transition-all duration-200 ${isActive
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                      {item.label}
                    </Button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* 右侧设置内容 */}
        <div className="lg:col-span-9">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

