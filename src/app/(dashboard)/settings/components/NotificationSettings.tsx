import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export default function NotificationSettings() {
    return (
        <Card className="border-border shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <Bell className="mr-2 h-5 w-5 text-muted-foreground" />
                    通知设置
                </CardTitle>
                <CardDescription>
                    配置系统通知和提醒
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                            <h4 className="font-medium text-foreground">内容生成完成</h4>
                            <p className="text-sm text-muted-foreground">当AI内容生成完成时通知</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                            <h4 className="font-medium text-foreground">发布状态更新</h4>
                            <p className="text-sm text-muted-foreground">文章发布状态变化时通知</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                            <h4 className="font-medium text-foreground">系统报告</h4>
                            <p className="text-sm text-muted-foreground">每周收到系统使用报告</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-foreground">邮件通知</h4>
                            <p className="text-sm text-muted-foreground">通过邮件接收重要通知</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
