import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password', 10)
    await prisma.user.update({
        where: { username: 'admin' },
        data: { password: hashedPassword }
    })
    console.log('Updated admin password to hashed "password"')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
