
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Creating user...')
        const user = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {},
            create: {
                username: 'admin',
                password: 'password'
            }
        })
        console.log('User created/found:', user.id)

        console.log('Attempting to create article without author...')
        const article = await prisma.article.create({
            data: {
                title: 'Test Article',
                content: 'Test Content',
                keywords: 'test',
                status: 'DRAFT',
                theme: 'hammer',
                // author: {
                //     connect: { username: 'admin' }
                // }
            } as any
        })
        console.log('Success! Article created:', article.id)
    } catch (e) {
        console.error('Error creating article:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
