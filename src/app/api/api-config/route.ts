import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// 获取昨日余额（简化版本，直接返回0）
const getYesterdayBalance = async (apiKey: string) => {
  // 简化实现，实际可以调用特定的API或存储历史数据
  return 0
}

// 获取使用统计
const getUsageStats = async (currentBalance: number, apiKey: string) => {
  try {
    const yesterdayBalance = await getYesterdayBalance(apiKey)
    const todayCost = Math.max(0, yesterdayBalance - currentBalance)

    return {
      totalCost: todayCost,
      yesterdayBalance: yesterdayBalance,
      lastUpdate: new Date().toISOString()
    }
  } catch (error) {
    console.error('获取使用统计失败:', error)
    return {
      totalCost: 0,
      yesterdayBalance: 0,
      lastUpdate: new Date().toISOString()
    }
  }
}

// GET - 获取API配置
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging API Config - prisma:', typeof prisma);
    console.log('🔍 prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    console.log('🔍 prisma.aPIConfig:', typeof prisma.aPIConfig);

    // 从数据库获取活跃的微信API配置
    const apiConfig = await prisma.aPIConfig.findFirst({
      where: {
        service: 'wechat',
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (!apiConfig) {
      // 如果没有配置，返回默认配置
      const defaultConfig = {
        apiKey: process.env.WECHAT_API_KEY || 'JZL156fc9ab0b0706a5',
        apiUrl: process.env.WECHAT_API_URL || 'https://www.dajiala.com/fbmain/monitor/v3/kw_search',
        balance: 0,
        currency: 'CNY'
      }

      const balance = await checkBalance(defaultConfig.apiKey)
      const usageStats = await getUsageStats(balance, defaultConfig.apiKey)

      return NextResponse.json({
        success: true,
        data: {
          apiKey: defaultConfig.apiKey,
          apiUrl: defaultConfig.apiUrl,
          balance,
          currency: defaultConfig.currency,
          totalCost: usageStats.totalCost,
          yesterdayBalance: usageStats.yesterdayBalance,
          lastUpdate: usageStats.lastUpdate
        }
      })
    }

    // 检查并更新余额
    const currentBalance = await checkBalance(apiConfig.apiKey || '')

    // 如果余额发生变化，更新数据库
    if (currentBalance !== apiConfig.balance) {
      await prisma.aPIConfig.update({
        where: { id: apiConfig.id },
        data: { balance: currentBalance }
      })
    }

    const usageStats = await getUsageStats(currentBalance, apiConfig.apiKey || '')

    return NextResponse.json({
      success: true,
      data: {
        id: apiConfig.id,
        apiKey: apiConfig.apiKey,
        apiUrl: apiConfig.apiUrl,
        balance: currentBalance,
        currency: apiConfig.currency,
        totalCost: usageStats.totalCost,
        yesterdayBalance: usageStats.yesterdayBalance,
        lastUpdate: usageStats.lastUpdate
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

    // 验证API密钥
    let testBalance = 0
    let warningMessage = null

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kw: 'test',
          sort_type: 1,
          mode: 1,
          period: 7,
          page: 1,
          key: apiKey.trim(),
          any_kw: '',
          ex_kw: '',
          verifycode: '',
          type: 1
        })
      })

      if (response.ok) {
        const testResult = await response.json()

        // 检查API返回状态
        if (testResult.code !== 0 && testResult.code !== '0') {
          const errorMsg = testResult.msg || 'API密钥验证失败'

          // 如果是余额不足等可以保存的错误，允许保存但显示警告
          if (errorMsg.includes('余额不足') || errorMsg.includes('充值') || errorMsg.includes('金额')) {
            warningMessage = 'API密钥已保存，但账户余额不足，请充值后使用'
          } else {
            return NextResponse.json(
              { success: false, error: errorMsg },
              { status: 400 }
            )
          }
        } else {
          // 验证成功，获取余额
          testBalance = parseFloat(testResult.remain_money) || 0
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'API密钥验证失败' },
          { status: 400 }
        )
      }
    } catch (testError) {
      console.error('API验证测试失败:', testError)
      return NextResponse.json(
        { success: false, error: 'API验证时发生网络错误' },
        { status: 400 }
      )
    }

    // 保存或更新API配置到数据库
    try {
      // 先查找现有配置
      const existingConfig = await prisma.aPIConfig.findFirst({
        where: {
          service: 'wechat',
          isActive: true
        }
      })

      let savedConfig
      if (existingConfig) {
        // 更新现有配置，将旧的设为非活跃
        await prisma.aPIConfig.updateMany({
          where: { service: 'wechat' },
          data: { isActive: false }
        })

        savedConfig = await prisma.aPIConfig.create({
          data: {
            service: 'wechat',
            apiKey: apiKey.trim(),
            apiUrl: apiEndpoint.trim(),
            balance: testBalance,
            currency: 'CNY',
            isActive: true
          }
        })
      } else {
        // 创建新配置
        savedConfig = await prisma.aPIConfig.create({
          data: {
            service: 'wechat',
            apiKey: apiKey.trim(),
            apiUrl: apiEndpoint.trim(),
            balance: testBalance,
            currency: 'CNY',
            isActive: true
          }
        })
      }

      const usageStats = await getUsageStats(testBalance, apiKey.trim())

      const responseData: {
        id: string
        apiKey: string | null
        apiUrl: string | null
        balance: number
        currency: string
        totalCost: number
        yesterdayBalance: number
        lastUpdate: string
        warning?: string
      } = {
        id: savedConfig.id,
        apiKey: savedConfig.apiKey,
        apiUrl: savedConfig.apiUrl,
        balance: savedConfig.balance,
        currency: savedConfig.currency,
        totalCost: usageStats.totalCost,
        yesterdayBalance: usageStats.yesterdayBalance,
        lastUpdate: usageStats.lastUpdate
      }

      if (warningMessage) {
        responseData.warning = warningMessage
      }

      return NextResponse.json({
        success: true,
        data: responseData
      })

    } catch (dbError) {
      console.error('保存API配置到数据库失败:', dbError)
      return NextResponse.json(
        { success: false, error: '保存API配置失败' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('验证API配置失败:', error)
    return NextResponse.json(
      { success: false, error: 'API配置验证失败' },
      { status: 500 }
    )
  }
}