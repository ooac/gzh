
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const configs = await prisma.aPIConfig.findMany({
        where: {
            service: { in: ['wechat_publish', 'wechat'] }
        }
    });
    console.log(JSON.stringify(configs, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
