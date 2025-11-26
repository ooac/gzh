'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { User, Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfileSettings() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [message, setMessage] = useState('')

    // Password state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [passwordMessage, setPasswordMessage] = useState('')

    useEffect(() => {
        fetchUser()
    }, [])

    async function fetchUser() {
        try {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                setUser(data.user)
            } else {
                router.push('/')
            }
        } catch (error) {
            console.error('Failed to fetch user', error)
        } finally {
            setIsLoading(false)
        }
    }

    async function onUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSaving(true)
        setMessage('')

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            const result = await res.json()
            if (res.ok) {
                setUser(result.user)
                setMessage('个人信息更新成功')
            } else {
                setMessage(result.error || '更新失败')
            }
        } catch (error) {
            setMessage('更新失败')
        } finally {
            setIsSaving(false)
        }
    }

    async function onUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSaving(true)
        setPasswordMessage('')

        try {
            const res = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            const result = await res.json()
            if (res.ok) {
                setPasswordMessage('密码修改成功')
                setCurrentPassword('')
                setNewPassword('')
            } else {
                setPasswordMessage(result.error || '修改失败')
            }
        } catch (error) {
            setPasswordMessage('修改失败')
        } finally {
            setIsSaving(false)
        }
    }

    async function onLogout() {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <User className="mr-2 h-5 w-5 text-muted-foreground" />
                        个人信息
                    </CardTitle>
                    <CardDescription>
                        管理您的基本账户信息
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    用户名
                                </label>
                                <Input
                                    name="username"
                                    defaultValue={user?.username}
                                    className="bg-background border-border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    邮箱地址
                                </label>
                                <Input
                                    name="email"
                                    type="email"
                                    defaultValue={user?.email || ''}
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                个人简介
                            </label>
                            <textarea
                                name="bio"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                                defaultValue={user?.bio || ''}
                            />
                        </div>
                        {message && (
                            <div className={`text-sm px-3 py-2 rounded-md ${message.includes('成功') ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                                {message}
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <Button type="button" variant="outline" onClick={onLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                                退出登录
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存个人信息
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <Lock className="mr-2 h-5 w-5 text-muted-foreground" />
                        安全设置
                    </CardTitle>
                    <CardDescription>
                        修改您的登录密码
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onUpdatePassword} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    当前密码
                                </label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="bg-background border-border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    新密码
                                </label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>
                        {passwordMessage && (
                            <div className={`text-sm px-3 py-2 rounded-md ${passwordMessage.includes('成功') ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                                {passwordMessage}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                修改密码
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
