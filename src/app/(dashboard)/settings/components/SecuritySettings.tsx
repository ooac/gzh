import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shield } from 'lucide-react'

export default function SecuritySettings() {
    return (
        <Card className="border-border shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <Shield className="mr-2 h-5 w-5 text-muted-foreground" />
                    安全设置
                </CardTitle>
                <CardDescription>
                    管理账户安全和隐私设置
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium text-foreground mb-4">密码设置</h4>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    当前密码
                                </label>
                                <Input type="password" placeholder="输入当前密码" className="bg-background border-border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    新密码
                                </label>
                                <Input type="password" placeholder="输入新密码" className="bg-background border-border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    确认新密码
                                </label>
                                <Input type="password" placeholder="再次输入新密码" className="bg-background border-border" />
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">更新密码</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
