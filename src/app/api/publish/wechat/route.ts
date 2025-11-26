import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import { mdToHtml } from '@/lib/markdown-theme'

const extractImageUrls = (content: string) => {
  const urls = new Set<string>()

  // 1. Markdown images: ![alt](url)
  const mdImg = /!\[[^\]]*\]\(([^)]+)\)/g
  let a
  while ((a = mdImg.exec(content)) !== null) {
    urls.add(a[1])
  }

  // 2. HTML images: <img ... src="..." ...>
  // Improved regex to handle attributes before src and different quoting styles
  const htmlImg = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi
  while ((a = htmlImg.exec(content)) !== null) {
    urls.add(a[1])
  }

  return Array.from(urls)
}

const toPlainText = (s: string) => {
  return s
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/[#*>\-`]/g, '')
    .replace(/[\t ]+/g, ' ')
    .trim()
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { articleId, wechatAppid, articleType = 'news', contentFormat = 'markdown', content: bodyContent } = body || {}
    if (!articleId || !wechatAppid) return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })

    console.log('=== 微信发布API调试 ===')
    console.log('接收到的参数:')
    console.log('- articleType:', articleType)
    console.log('- contentFormat:', contentFormat)
    console.log('- bodyContent长度:', bodyContent?.length || 0)
    console.log('- bodyContent前200字符:', bodyContent?.substring(0, 200))

    const article = await prisma.article.findUnique({ where: { id: articleId } })
    if (!article) return NextResponse.json({ success: false, error: '文章不存在' }, { status: 404 })

    let content = bodyContent || article.content || ''
    let title = article.title || '未命名文章'
    let summary = article.summary || ''
    let coverImage: string | undefined = undefined

    // 将正文中的本地/代理图片链接改写为可公开访问的绝对地址(供发布服务抓取)
    // 无论内容来自数据库还是前端,都需要执行此转换,确保微信API能访问图片
    console.log('\n--- 图片路径替换开始 ---')
    console.log('替换前content长度:', content.length)
    console.log('替换前content前300字符:', content.substring(0, 300))
    try {
      const imgs = await prisma.image.findMany({ where: { articleId } })
      console.log('查询到的图片数量:', imgs.length)
      if (Array.isArray(imgs) && imgs.length > 0) {
        const headerProto = req.headers.get('x-forwarded-proto') || 'http'
        const headerHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
        const inferredBase = headerHost ? `${headerProto}://${headerHost}` : ''
        const baseUrlRaw = (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || inferredBase || '').trim()
        const baseUrl = baseUrlRaw.replace(/\/$/, '')
        for (const img of imgs) {
          const local = img.localPath || ''
          const absoluteLocal = local ? `${baseUrl}${local}` : ''
          if (local) {
            // Markdown 本地路径替换为绝对地址
            const mdLocal = new RegExp(`!\\[[^\\]]*\\]\\(${local.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g')
            content = content.replace(mdLocal, (m: string) => m.replace(local, absoluteLocal))
            // HTML 本地路径替换为绝对地址
            const htmlLocal = new RegExp(`<img([^>]+?)src=["']${local.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi')
            content = content.replace(htmlLocal, (m: string) => m.replace(local, absoluteLocal))
          }
          // 代理地址改写为远端原始链接
          const prox = `/api/image-proxy?url=`
          const proxMd = new RegExp(`!\\[[^\\]]*\\]\\(${prox.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\)]+)\\)`, 'g')
          content = content.replace(proxMd, (_m: string, p1: string) => {
            try { const u = decodeURIComponent(String(p1)); return `![配图](${u})` } catch { return _m }
          })
          const proxHtml = new RegExp(`<img([^>]+?)src=["']${prox.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^"'>]+)["']`, 'gi')
          content = content.replace(proxHtml, (m: string, _g1: string, p2: string) => {
            try { const u = decodeURIComponent(String(p2)); return m.replace(`${prox}${p2}`, u) } catch { return m }
          })
        }
      }
      console.log('替换后content长度:', content.length)
      console.log('替换后content前300字符:', content.substring(0, 300))
    } catch (err) {
      console.error('图片路径替换失败:', err)
    }
    console.log('--- 图片路径替换结束 ---\n')

    const images = extractImageUrls(content)
    if (images.length > 0) coverImage = images[0]

    let sendContent = content
    let sendFormat = contentFormat
    let sendType = articleType
    if (articleType === 'newspic') {
      const text = toPlainText(content).slice(0, 1000)
      const pics = images.slice(0, 20)
      if (pics.length === 0) return NextResponse.json({ success: false, error: '小绿书发布需要至少1张图片', code: 'INVALID_PARAMETER' }, { status: 400 })
      sendContent = [text, ...pics.map(u => `! ${u}`)].join('\n\n')
      sendFormat = 'markdown'
      sendType = 'newspic'
    }

    const cfg = await prisma.aPIConfig.findFirst({ where: { service: { in: ['wechat_publish', 'wechat'] }, isActive: true } })
    const apiKey = cfg?.apiKey || process.env.WECHAT_PUBLISH_API_KEY || ''
    const apiUrl = (cfg?.apiUrl || 'https://wx.limyai.com').replace(/\/$/, '')
    if (!apiKey) return NextResponse.json({ success: false, error: '未配置公众号发布API密钥' }, { status: 400 })

    const processingErrors: string[] = []
    const imageUploads: Array<{ localPath: string; filename: string; contentType: string; dataBase64: string }> = []

    const imgsInSend = extractImageUrls(sendContent)
    console.log(`[图片处理] 从内容中提取到 ${imgsInSend.length} 个图片URL`)

    // 从数据库查询所有与文章关联的图片，创建URL到图片记录的映射
    const dbImages = await prisma.image.findMany({ where: { articleId } })
    console.log(`[图片处理] 从数据库查询到 ${dbImages.length} 条图片记录`)

    // 创建多个映射以支持不同的URL格式匹配
    const imageByUrl = new Map<string, typeof dbImages[0]>()
    const imageByLocalPath = new Map<string, typeof dbImages[0]>()

    for (const img of dbImages) {
      if (img.url) imageByUrl.set(img.url, img)
      if (img.localPath) imageByLocalPath.set(img.localPath, img)
    }

    for (const u of imgsInSend) {
      const cleanU = u.split('?')[0].split('#')[0]
      const decodedU = decodeURIComponent(cleanU)

      console.log(`\n[图片处理] 处理图片: ${u}`)

      // 首先尝试从数据库匹配图片记录
      let dbImage = imageByUrl.get(u) || imageByUrl.get(cleanU) || imageByUrl.get(decodedU)

      // 如果是URL，尝试用pathname匹配localPath
      if (!dbImage && u.startsWith('http')) {
        try {
          const urlObj = new URL(u)
          const pathname = decodeURIComponent(urlObj.pathname)
          dbImage = imageByLocalPath.get(pathname)
        } catch { }
      }

      // 如果是相对路径，直接用路径匹配
      if (!dbImage && u.startsWith('/')) {
        dbImage = imageByLocalPath.get(u) || imageByLocalPath.get(decodedU)
      }

      // 如果找到数据库记录，根据source决定处理方式
      if (dbImage) {
        console.log(`[图片处理] 匹配到数据库记录: source=${dbImage.source}, url=${dbImage.url}`)

        if (dbImage.source === 'EXTERNAL') {
          // R2图片：直接使用其URL，不需要读取文件或转base64
          // 微信API会自己抓取这个URL
          console.log(`[图片处理] R2图片，直接使用URL: ${dbImage.url}`)
          // R2图片不需要添加到imageUploads，微信API会直接从R2抓取
          continue
        } else if (dbImage.source === 'LOCAL' && dbImage.localPath) {
          // 本地图片：需要读取文件并转base64
          console.log(`[图片处理] 本地图片，读取文件: ${dbImage.localPath}`)
          try {
            const filename = dbImage.localPath.split('/').pop() || 'image.jpg'
            const fullPath = `${process.cwd()}/public${dbImage.localPath}`
            const buf = await readFile(fullPath)
            const b64 = buf.toString('base64')
            const ct = filename.toLowerCase().endsWith('.png') ? 'image/png' :
              filename.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'

            imageUploads.push({
              localPath: dbImage.localPath,
              filename,
              contentType: ct,
              dataBase64: b64
            })

            // 同时添加绝对路径版本
            const headerProto = req.headers.get('x-forwarded-proto') || 'http'
            const headerHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
            const inferredBase = headerHost ? `${headerProto}://${headerHost}` : ''
            const baseUrlRaw = (process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || inferredBase || '').trim()
            const baseUrl = baseUrlRaw.replace(/\/$/, '') || 'http://localhost:3000'
            const absPath = `${baseUrl}${dbImage.localPath}`
            if (absPath !== dbImage.localPath) {
              imageUploads.push({ localPath: absPath, filename, contentType: ct, dataBase64: b64 })
            }

            console.log(`[图片处理] 本地图片已添加到上传队列: ${dbImage.localPath}`)
          } catch (e: any) {
            console.error(`[图片处理] 读取本地文件失败: ${dbImage.localPath}`, e)
            processingErrors.push(`读取本地文件失败: ${dbImage.localPath} (${e.message})`)
          }
          continue
        }
      }

      // 如果没有数据库记录，按原有逻辑处理（外部图片下载）
      console.log(`[图片处理] 未匹配到数据库记录，按外部图片处理`)

      if (!u.startsWith('http')) {
        console.log(`[图片处理] 跳过非HTTP URL: ${u}`)
        continue
      }

      try {
        // 外部图片：下载并转base64
        console.log(`[图片处理] 下载外部图片: ${u}`)
        const resp = await fetch(u)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

        const arrayBuf = await resp.arrayBuffer()
        const buf = Buffer.from(arrayBuf)
        const urlObj = new URL(u)
        const filename = urlObj.pathname.split('/').pop() || 'image.jpg'
        const ext = filename.split('.').pop() || 'jpg'
        const hash = createHash('md5').update(u).digest('hex')
        const placeholderPath = `/uploads/temp_${hash}.${ext}`

        // 替换内容中的URL为占位符路径
        const escapedUrl = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const mdRegex = new RegExp(`\\!\\[[^\\]]*\\]\\(${escapedUrl}\\)`, 'g')
        sendContent = sendContent.replace(mdRegex, (m: string) => m.replace(u, placeholderPath))
        const htmlRegex = new RegExp(`src=["']${escapedUrl}["']`, 'g')
        sendContent = sendContent.replace(htmlRegex, `src="${placeholderPath}"`)

        const b64 = buf.toString('base64')
        const ct = filename.toLowerCase().endsWith('.png') ? 'image/png' :
          filename.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'

        imageUploads.push({
          localPath: placeholderPath,
          filename,
          contentType: ct,
          dataBase64: b64
        })

        console.log(`[图片处理] 外部图片已下载并添加到上传队列: ${u} -> ${placeholderPath}`)
      } catch (e: any) {
        console.error(`[图片处理] 下载外部图片失败: ${u}`, e)
        processingErrors.push(`下载外部图片失败: ${u} (${e.message})`)
      }
    }

    console.log(`\n[图片处理] 处理完成: imageUploads=${imageUploads.length}, errors=${processingErrors.length}`)

    // 如果有处理错误,仅记录警告,不中断发布流程
    // R2图片不需要上传,所以processingErrors可能只是警告
    if (processingErrors.length > 0) {
      console.warn('[图片处理] 部分图片处理失败，但继续发布:', processingErrors.join('; '))
      // 不再直接返回错误，允许发布继续
    }

    try {
      // 统一转为 HTML 图片，确保公众号端可解析
      const bangImg = /(^|\n)!\s*(https?:\/\/[^\s]+|\/uploads\/[^\s]+)/g
      sendContent = sendContent.replace(bangImg, (_m: string, _g1: string, p2: string) => `${_g1}<img src="${p2}" />`)
      const mdImg = /!\[[^\]]*\]\(([^)]+)\)/g
      sendContent = sendContent.replace(mdImg, (_m: string, p1: string) => `<img src="${p1}" />`)
      const imgsNow = extractImageUrls(sendContent)
      // 封面图不能使用Data URL,必须是http/https链接
      const validImgs = imgsNow.filter(u => !u.startsWith('data:'))
      if (validImgs.length > 0) coverImage = coverImage || validImgs[0]
    } catch { }

    console.log('\n--- Markdown转HTML检查 ---')
    console.log('sendType:', sendType)
    console.log('sendFormat:', sendFormat)
    console.log('是否需要转换:', sendType === 'news' && sendFormat !== 'html')

    if (sendType === 'news' && sendFormat !== 'html') {
      console.log('执行Markdown到HTML转换(使用带主题的mdToHtml)')
      const beforeConvert = sendContent.substring(0, 200)
      try {
        // 使用文章保存的主题，默认为 'hammer' (极简黑)
        const theme = (article.theme || 'hammer') as any
        console.log('应用主题:', theme)
        sendContent = mdToHtml(sendContent, theme, true) // true = include container style
        sendFormat = 'html'
      } catch (e) {
        console.error('Markdown转换失败:', e)
      }
      const afterConvert = sendContent.substring(0, 200)
      console.log('转换前:', beforeConvert)
      console.log('转换后:', afterConvert)
    } else {
      console.log('跳过转换 - 内容已经是HTML格式或类型不是news')
    }
    console.log('--- Markdown转HTML检查结束 ---\n')

    const imageUrls = extractImageUrls(sendContent)
      .filter(u => !u.startsWith('data:')) // 过滤掉Data URL
      .map(u => {
        try {
          const url = new URL(u)
          // if (url.protocol === 'http:') { url.protocol = 'https:'; return url.toString() }
          return url.toString()
        } catch { return u }
      })

    // 再次确保封面图不是Data URL
    if ((!coverImage || coverImage.startsWith('data:')) && imageUrls.length > 0) {
      coverImage = imageUrls[0]
    }

    // 严格校验封面图: 必须是 http:// 或 https:// 开头的有效URL
    // 过滤掉本地路径(/uploads/...)、Data URL(data:...)或其他无效格式
    const isValidHttpUrl = (url: string | undefined) => {
      if (!url) return false
      return url.startsWith('http://') || url.startsWith('https://')
    }

    if (!isValidHttpUrl(coverImage)) {
      console.log('封面图无效(非http/https):', coverImage, '已重置')
      coverImage = undefined
    }

    // 如果没有有效的封面图(因为都是本地图片转Data URL了),使用默认封面图
    // 微信API强制要求封面图必须是有效的URL
    if (!coverImage) {
      // 使用一个通用的抽象背景图作为默认封面
      coverImage = 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800&auto=format&fit=crop'
      console.log('使用默认封面图:', coverImage)
    }

    const payload = { wechatAppid, title: title.slice(0, 64), content: sendContent, summary: summary ? summary.slice(0, 120) : undefined, coverImage, author: undefined, contentFormat: sendFormat, articleType: sendType, images: imageUrls, imageUploads: imageUploads.length > 0 ? imageUploads : undefined }
    console.log('=== 发布Payload调试 ===')
    console.log('contentFormat:', sendFormat)
    console.log('articleType:', sendType)
    console.log('imageUploads数量:', imageUploads.length)
    console.log('content前200字符:', sendContent.substring(0, 200))
    console.log('content是否包含data:image:', sendContent.includes('data:image'))
    console.log('========================')
    const idemKey = createHash('md5').update(`${wechatAppid}|${sendType}|${payload.title}|${payload.content}`).digest('hex')
    if (body?.dryRun) {
      return NextResponse.json({ success: true, data: { preview: payload } })
    }
    const existed = await prisma.publishRecord.findFirst({ where: { articleId, platform: 'WECHAT', platformId: idemKey, status: 'SUCCESS' } })
    if (existed) {
      return NextResponse.json({ success: true, data: { message: '已发布（命中幂等）', materialId: null, mediaId: null }, recordId: existed.id })
    }
    const r = await fetch(`${apiUrl}/api/openapi/wechat-publish`, { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const raw = await r.text()
    let dataResp: any = null
    try { dataResp = JSON.parse(raw) } catch { }

    const ok = dataResp?.success === true || (r.ok && !dataResp)
    const rec = await prisma.publishRecord.create({ data: { articleId, platform: 'WECHAT', platformId: idemKey, status: ok ? 'SUCCESS' : 'FAILED', publishedAt: ok ? new Date() : null, errorMessage: ok ? null : (dataResp?.error || `HTTP_${r.status}`) } })
    if (ok) {
      await prisma.article.update({ where: { id: articleId }, data: { status: 'PUBLISHED', publishedAt: new Date() } })
      return NextResponse.json({ success: true, data: (dataResp && dataResp.data) ?? dataResp ?? {}, recordId: rec.id })
    } else {
      return NextResponse.json({ success: false, error: dataResp?.error || raw || '发布失败', code: dataResp?.code }, { status: r.status || 500 })
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '服务异常' }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
