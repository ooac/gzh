import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Download, Upload, Trash2 } from 'lucide-react'

export default function DataSettings() {
    return (
        <Card className="border-border shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <Database className="mr-2 h-5 w-5 text-muted-foreground" />
                    数据管理
                </CardTitle>
                <CardDescription>
                    管理系统数据和备份
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 border border-border rounded-xl bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-foreground">文章数据</h4>
                                <span className="text-sm text-muted-foreground">128 篇</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                包括已发布、草稿和待发布文章
                            </p>
                            <Button variant="outline" size="sm" className="w-full bg-background border-border hover:bg-muted">
                                <Download className="mr-2 h-4 w-4" />
                                导出文章
                            </Button>
                        </div>
                        <div className="p-6 border border-border rounded-xl bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-foreground">分析数据</h4>
                                <span className="text-sm text-muted-foreground">56 份</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                话题分析和洞察报告
                            </p>
                            <Button variant="outline" size="sm" className="w-full bg-background border-border hover:bg-muted">
                                <Download className="mr-2 h-4 w-4" />
                                导出分析
                            </Button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <h4 className="font-medium text-foreground mb-4">高级操作</h4>
                        <div className="flex space-x-4">
                            <Button variant="outline" className="border-border hover:bg-muted/50">
                                <Upload className="mr-2 h-4 w-4" />
                                导入数据
                            </Button>
                            <Button variant="outline" className="border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
                                <Trash2 className="mr-2 h-4 w-4" />
                                清理缓存
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
