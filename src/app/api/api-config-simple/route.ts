import { NextRequest, NextResponse } from 'next/server'

// 检查API余额
const checkBalance = async (apiKey: string) => {
  try {
    const response = await fetch('https://www.dajiala.com/fbmain/monitor/v3/get_remain_money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: apiKey,
        verifycode: ''
      })
    })

    if (!response.ok) {
      console.error('余额查询API调用失败:', response.status)
      return 0
    }

    const result = await response.json()

    if (result.code === 0 || result.code === '0') {
      const balance = parseFloat(result.remain_money) || 0
      return balance
    } else {
      console.error('余额查询返回错误:', result)
      return 0
    }
  } catch (error) {
    console.error('检查余额失败:', error)
    return 0
  }
}

// GET - 获取API配置
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const queryApiKey = searchParams.get('apiKey')
    const queryApiUrl = searchParams.get('apiUrl')

    // 如果提供了API密钥参数，使用它来查询余额；否则使用默认配置
    const config = {
      apiKey: queryApiKey || process.env.WECHAT_API_KEY || 'JZL156fc9ab0b0706a5',
      apiUrl: queryApiUrl || process.env.WECHAT_API_URL || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search',
    }

    console.log('🔍 GET请求查询余额，使用API密钥:', config.apiKey?.substring(0, 10) + '...')
    const balance = await checkBalance(config.apiKey)

    return NextResponse.json({
      success: true,
      data: {
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        balance,
        currency: 'CNY',
        totalCost: 0,
        yesterdayBalance: 0,
        lastUpdate: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('获取API配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取API配置失败' },
      { status: 500 }
    )
  }
}

// POST - 更新API配置
export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiUrl } = await request.json()

    // 验证输入
    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'API密钥不能为空' },
        { status: 400 }
      )
    }

    const apiEndpoint = apiUrl || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search'

    // 使用免费的余额查询接口验证API密钥
    let testBalance = 0
    let warningMessage = null

    try {
      console.log('🔍 使用免费余额查询接口验证API密钥...')

      // 直接调用免费的余额查询接口进行验证
      testBalance = await checkBalance(apiKey.trim())

      console.log('🔍 余额查询结果:', testBalance)

      // 余额查询成功，API密钥有效
      if (testBalance < 0.01) {
        warningMessage = 'API密钥已验证，但账户余额不足，请充值后使用'
      }

    } catch (testError) {
      console.error('API密钥验证失败:', testError)
      return NextResponse.json(
        { success: false, error: 'API密钥验证失败，请检查密钥是否正确' },
        { status: 400 }
      )
    }

    // 注意：这里暂时不保存到数据库，直接返回配置信息
    const responseData: {
      apiKey: string
      apiUrl: string
      balance: number
      currency: string
      totalCost: number
      yesterdayBalance: number
      lastUpdate: string
      warning?: string
    } = {
      apiKey: apiKey.trim(),
      apiUrl: apiEndpoint.trim(),
      balance: testBalance,
      currency: 'CNY',
      totalCost: 0,
      yesterdayBalance: 0,
      lastUpdate: new Date().toISOString()
    }

    if (warningMessage) {
      responseData.warning = warningMessage
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('验证API配置失败:', error)
    return NextResponse.json(
      { success: false, error: 'API配置验证失败' },
      { status: 500 }
    )
  }
}