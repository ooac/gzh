import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-key'

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')

        if (!token) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            )
        }

        // Verify token
        const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: string }
        const { username, email, bio } = await request.json()

        // Check if username/email already taken by other user
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id: decoded.userId }
                }
            })
            if (existingUser) {
                return NextResponse.json(
                    { error: '用户名已存在' },
                    { status: 400 }
                )
            }
        }

        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id: decoded.userId }
                }
            })
            if (existingEmail) {
                return NextResponse.json(
                    { error: '邮箱已被使用' },
                    { status: 400 }
                )
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                ...(username && { username }),
                ...(email && { email }),
                ...(bio && { bio })
            },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                avatar: true
            }
        })

        return NextResponse.json({ success: true, user: updatedUser }, { status: 200 })

    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { error: '更新失败' },
            { status: 500 }
        )
    }
}
