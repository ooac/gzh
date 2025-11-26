import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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
        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: '请输入当前密码和新密码' },
                { status: 400 }
            )
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        })

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 404 }
            )
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password)

        if (!isValid) {
            return NextResponse.json(
                { error: '当前密码错误' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('Update password error:', error)
        return NextResponse.json(
            { error: '更新失败' },
            { status: 500 }
        )
    }
}
