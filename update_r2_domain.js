const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const publicDomain = 'https://pub-8e198d0d5d8c448895b01c3ff392524d.r2.dev'

    console.log('正在更新 R2 Public Domain...')

    const config = await prisma.aPIConfig.findFirst({
        where: { service: 'r2', isActive: true }
    })

    if (!config) {
        console.error('未找到活跃的 R2 配置！')
        return
    }

    const configData = JSON.parse(config.config)
    configData.publicDomain = publicDomain

    await prisma.aPIConfig.update({
        where: { id: config.id },
        data: {
            config: JSON.stringify(configData)
        }
    })

    console.log('R2 Public Domain 已更新为:', publicDomain)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
