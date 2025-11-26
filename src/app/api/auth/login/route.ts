import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ensureUserTable } from '@/lib/init-db'

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-key'

export async function POST(request: Request) {
    try {
        // 保障 users 表存在（无迁移环境下）
        await ensureUserTable(prisma)
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json(
                { error: '用户名和密码必填' },
                { status: 400 }
            )
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { username }
        })

        if (!user) {
            return NextResponse.json(
                { error: '用户名或密码错误' },
                { status: 401 }
            )
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return NextResponse.json(
                { error: '用户名或密码错误' },
                { status: 401 }
            )
        }

        // Create token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        const response = NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    avatar: user.avatar
                }
            },
            { status: 200 }
        )

        // Set cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })

        return response

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: '登录失败' },
            { status: 500 }
        )
    }
}
