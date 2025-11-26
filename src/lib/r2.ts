import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'

// R2 配置接口
interface R2Config {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    publicDomain: string
}

// 获取 R2 配置
async function getR2Config(): Promise<R2Config | null> {
    try {
        const config = await prisma.aPIConfig.findFirst({
            where: { service: 'r2', isActive: true }
        })

        if (!config || !config.apiKey || !config.apiUrl) {
            console.log('[R2] 未配置 Cloudflare R2')
            return null
        }

        const configData = config.config ? JSON.parse(config.config as string) : {}

        return {
            accountId: config.apiUrl, // 复用 apiUrl 字段存储 accountId
            accessKeyId: config.apiKey, // 复用 apiKey 字段存储 accessKeyId
            secretAccessKey: configData.secretAccessKey,
            bucketName: configData.bucketName,
            publicDomain: configData.publicDomain
        }
    } catch (e) {
        console.error('[R2] 获取配置失败:', e)
        return null
    }
}

// 上传到 R2
export async function uploadToR2(buffer: Buffer, filename: string, contentType: string): Promise<string | null> {
    try {
        const config = await getR2Config()
        if (!config) return null

        const S3 = new S3Client({
            region: 'auto',
            endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        })

        await S3.send(new PutObjectCommand({
            Bucket: config.bucketName,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
        }))

        // 生成公开访问链接
        // 如果 publicDomain 包含 http/https 则直接使用，否则添加 https://
        const domain = config.publicDomain.startsWith('http')
            ? config.publicDomain
            : `https://${config.publicDomain}`

        // 移除末尾斜杠
        const cleanDomain = domain.replace(/\/$/, '')

        const url = `${cleanDomain}/${filename}`
        console.log('[R2] 上传成功:', url)

        return url
    } catch (e: any) {
        console.error('[R2] 上传失败:', e)
        return null
    }
}
