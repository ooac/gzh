const { PrismaClient } = require('@prisma/client')
const qiniu = require('qiniu')

const prisma = new PrismaClient()

async function updateQiniuUrls() {
    try {
        // 获取七牛云配置
        const config = await prisma.aPIConfig.findFirst({
            where: { service: 'qiniu', isActive: true }
        })

        if (!config || !config.apiKey || !config.apiUrl) {
            console.log('未配置七牛云')
            return
        }

        const configData = config.config ? JSON.parse(config.config) : {}
        const domain = configData.domain || process.env.QINIU_DOMAIN

        if (!domain) {
            console.log('域名配置不完整')
            return
        }

        const mac = new qiniu.auth.digest.Mac(config.apiKey, config.apiUrl)
        const bucketManager = new qiniu.rs.BucketManager(mac, new qiniu.conf.Config())

        // 获取所有七牛云图片
        const images = await prisma.image.findMany({
            where: { source: 'QINIU' }
        })

        console.log(`找到 ${images.length} 张七牛云图片`)

        let updated = 0
        let skipped = 0

        for (const img of images) {
            // 检查URL是否已经包含签名
            if (img.url.includes('?e=') && img.url.includes('&token=')) {
                console.log(`跳过已签名的URL: ${img.id}`)
                skipped++
                continue
            }

            // 从URL中提取文件名
            const urlObj = new URL(img.url)
            const key = urlObj.pathname.replace(/^\//, '')

            // 生成签名URL（1年有效期）
            const domainUrl = `http://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
            const deadline = Math.floor(Date.now() / 1000) + 31536000
            const signedUrl = bucketManager.privateDownloadUrl(domainUrl, key, deadline)

            // 更新数据库
            await prisma.image.update({
                where: { id: img.id },
                data: { url: signedUrl }
            })

            console.log(`已更新: ${img.id} -> ${signedUrl}`)
            updated++
        }

        console.log(`\n更新完成！`)
        console.log(`- 已更新: ${updated}`)
        console.log(`- 已跳过: ${skipped}`)
        console.log(`- 总计: ${images.length}`)

    } catch (e) {
        console.error('更新失败:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

updateQiniuUrls()
