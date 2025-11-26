import { NextRequest, NextResponse } from 'next/server'
import type { WechatSearchResponse, WechatArticleData, WechatSearchRequest } from '@/types'
import { createSearchHistory, saveArticles } from '@/lib/db/operations'
import { prisma } from '@/lib/prisma'

// 获取API配置
const getAPIConfig = async () => {
  try {
    const apiConfig = await prisma.aPIConfig.findFirst({
      where: {
        service: 'wechat',
        isActive: true
      }
    })

    if (apiConfig && apiConfig.apiKey) {
      return {
        apiKey: apiConfig.apiKey,
        apiUrl: apiConfig.apiUrl || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
      }
    }

    // 回退到环境变量或默认值
    return {
      apiKey: process.env.WECHAT_API_KEY || 'JZL156fc9ab0b0706a5',
      apiUrl: process.env.WECHAT_API_URL || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
    }
  } catch (error) {
    console.error('获取API配置失败:', error)
    return {
      apiKey: process.env.WECHAT_API_KEY || 'JZL156fc9ab0b0706a5',
      apiUrl: process.env.WECHAT_API_URL || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
    }
  }
}

// 数据转换函数：将API返回的数据转换为前端期望的格式
function transformArticleData(apiData: WechatArticleData): any {
  return {
    id: apiData.short_link || apiData.url,
    title: apiData.title,
    content: apiData.content,
    author: apiData.wx_name,
    readCount: apiData.read || 0,
    likeCount: apiData.praise || 0,
    viewCount: apiData.looking || 0,
    publishTime: new Date(apiData.publish_time * 1000).toISOString(),
    engagementRate: apiData.read > 0 ? ((apiData.praise / apiData.read) * 100).toFixed(2) : '0',
    url: apiData.url,
    // 保留原始数据以备其他用途
    originalData: apiData
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, limit = 20, apiKey: reqApiKey, apiUrl: reqApiUrl } = await request.json()

    // 验证关键词
    if (!keyword || !keyword.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的搜索关键词' },
        { status: 400 }
      )
    }

    // 获取API配置
    const apiConfig = await getAPIConfig()
    const mergedKey = (reqApiKey && typeof reqApiKey === 'string' ? reqApiKey : apiConfig.apiKey) || ''
    const mergedUrl = (reqApiUrl && typeof reqApiUrl === 'string' ? reqApiUrl : apiConfig.apiUrl) || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'
    const sanitizedKey = mergedKey.replace(/[{}\s]/g, '')
    const sanitizedUrl = mergedUrl.replace(/[`'"\s]/g, '')

    const cacheKey = `${keyword.trim()}:${limit}`
    const now = Date.now()
    const ttl = 10 * 60 * 1000
      ; (globalThis as any).__wechatSearchCache = (globalThis as any).__wechatSearchCache || new Map<string, { t: number; payload: any }>()
    const cacheMap: Map<string, { t: number; payload: any }> = (globalThis as any).__wechatSearchCache
    const cached = cacheMap.get(cacheKey)
    if (cached && now - cached.t < ttl) {
      return NextResponse.json(cached.payload)
    }

    // 计算需要获取的页数
    const pageSize = 20 // API每页固定返回20条
    const pagesToFetch = Math.ceil(limit / pageSize)

    console.log(`正在搜索关键词: ${keyword}，需要获取 ${pagesToFetch} 页数据，总计 ${limit} 条`)

    let allArticles: any[] = []
    let totalCost = 0
    let totalArticles = 0
    let totalPages = 0
    let remainMoney = 0

    // 循环获取多页数据
    for (let page = 1; page <= pagesToFetch; page++) {
      try {
        // 构建请求参数
        const searchParams: WechatSearchRequest = {
          kw: keyword.trim(),
          sort_type: 1,    // 排序类型：1-综合排序
          mode: 1,         // 模式：1-精确匹配
          period: 7,       // 时间范围：7天
          page: page,      // 页码
          key: sanitizedKey,    // API密钥
          any_kw: '',      // 包含任意关键词
          ex_kw: '',       // 排除关键词
          verifycode: '',  // 验证码
          type: 1          // 类型：1-文章
        }

        console.log(`正在获取第 ${page} 页数据...`)

        // 调用真实API
        let response = await fetch(sanitizedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(searchParams),
          signal: AbortSignal.timeout(10000)
        })

        if (!response.ok) {
          const formBody = new URLSearchParams({
            kw: searchParams.kw,
            sort_type: String(searchParams.sort_type),
            mode: String(searchParams.mode),
            period: String(searchParams.period),
            page: String(searchParams.page),
            key: searchParams.key,
            any_kw: searchParams.any_kw,
            ex_kw: searchParams.ex_kw,
            verifycode: searchParams.verifycode,
            type: String(searchParams.type)
          })
          response = await fetch(sanitizedUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            body: formBody.toString(),
            signal: AbortSignal.timeout(10000)
          })
          if (!response.ok) {
            throw new Error(`第${page}页API请求失败，状态码: ${response.status}`)
          }
        }

        const apiResponse: WechatSearchResponse = await response.json()

        // 检查API响应状态
        if (apiResponse.code !== 0) {
          const formBody = new URLSearchParams({
            kw: searchParams.kw,
            sort_type: String(searchParams.sort_type),
            mode: String(searchParams.mode),
            period: String(searchParams.period),
            page: String(searchParams.page),
            key: searchParams.key,
            any_kw: searchParams.any_kw,
            ex_kw: searchParams.ex_kw,
            verifycode: searchParams.verifycode,
            type: String(searchParams.type)
          })
          const resp2 = await fetch(sanitizedUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            body: formBody.toString(),
            signal: AbortSignal.timeout(10000)
          })
          if (!resp2.ok) {
            throw new Error(`第${page}页API请求失败，状态码: ${resp2.status}`)
          }
          const apiResponse2: WechatSearchResponse = await resp2.json()
          if (apiResponse2.code !== 0) {
            throw new Error(`第${page}页API返回错误: ${apiResponse2.msg || '未知错误'}`)
          }
          ; (apiResponse as any) = apiResponse2
        }

        // 检查是否有数据
        if (!apiResponse.data || apiResponse.data.length === 0) {
          console.log(`第 ${page} 页没有数据，停止获取`)
          break
        }

        // 累积数据
        allArticles = allArticles.concat(apiResponse.data)
        totalCost += apiResponse.cost_money || 0
        totalArticles = apiResponse.total || 0
        totalPages = apiResponse.total_page || 0
        remainMoney = apiResponse.remain_money || 0

        console.log(`第 ${page} 页获取成功，当前累计 ${allArticles.length} 篇文章`)

        // 如果已经获取了足够的数据，停止获取
        if (allArticles.length >= limit) {
          break
        }

        // 如果已经获取了所有可用数据，停止获取
        if (allArticles.length >= totalArticles) {
          break
        }

      } catch (pageError) {
        console.error(`获取第 ${page} 页数据失败:`, pageError)
        // 如果不是第一页失败，继续使用已获取的数据
        if (page === 1) {
          throw pageError
        } else {
          console.log(`第 ${page} 页获取失败，使用前 ${page - 1} 页数据`)
          break
        }
      }
    }

    // 限制最终返回的文章数量
    const finalApiArticles = allArticles.slice(0, limit)

    if (finalApiArticles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          articles: [],
          total: 0,
          keyword,
          message: '未找到相关文章，请尝试其他关键词'
        }
      })
    }

    // 保存搜索历史和文章数据到数据库
    let searchHistoryId: string = ''
    let savedArticles: any[] = []

    try {
      // 创建搜索历史记录
      const searchHistory = await createSearchHistory({
        keyword,
        totalArticles: totalArticles,
        apiCost: totalCost,
        apiInfo: {
          cost_money: totalCost,
          remain_money: remainMoney,
          total_page: totalPages,
          current_page: 1
        }
      })

      searchHistoryId = searchHistory.id
      console.log(`搜索历史已保存，ID: ${searchHistory.id}`)

      // 保存文章数据到数据库
      savedArticles = await saveArticles(searchHistory.id, finalApiArticles)
      console.log(`已保存 ${savedArticles.length} 篇文章到数据库`)

    } catch (dbError) {
      console.error('保存到数据库失败:', dbError)
      // 即使数据库保存失败，也继续返回API数据
    }

    // 使用保存后的文章数据（包含数据库ID），如果没有则使用原始数据
    const finalArticles = savedArticles.length > 0
      ? savedArticles.map(article => ({
        id: article.id, // 使用数据库ID
        title: article.title,
        content: article.content,
        author: article.author,
        readCount: article.readCount,
        likeCount: article.likeCount,
        viewCount: article.lookingCount,
        publishTime: article.publishTime.toISOString(),
        engagementRate: article.engagementRate,
        url: article.url,
        originalData: JSON.parse(article.originalData || '{}')
      }))
      : finalApiArticles.map(transformArticleData)

    console.log(`成功获取 ${finalArticles.length} 篇文章`)

    const payload = {
      success: true,
      data: {
        articles: finalArticles,
        total: totalArticles,
        keyword,
        searchHistoryId: searchHistoryId || '',
        apiInfo: {
          cost_money: totalCost,
          remain_money: remainMoney,
          total_page: totalPages,
          current_page: 1
        }
      }
    }
    cacheMap.set(cacheKey, { t: Date.now(), payload })
    return NextResponse.json(payload)

  } catch (error) {
    console.error('微信搜索API错误:', error)

    // 返回用户友好的错误信息
    let errorMessage = '搜索失败，请重试'
    if (error instanceof Error) {
      if (error.message.includes('API请求失败')) {
        errorMessage = '网络连接失败，请检查网络后重试'
      } else if (error.message.includes('API返回错误')) {
        errorMessage = 'API服务暂时不可用，请稍后重试'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
