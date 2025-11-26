import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-key'

export async function GET() {
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

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                avatar: true,
                createdAt: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 404 }
            )
        }

        return NextResponse.json({ user }, { status: 200 })

    } catch (error) {
        console.error('Me error:', error)
        return NextResponse.json(
            { error: '认证失败' },
            { status: 401 }
        )
    }
}
