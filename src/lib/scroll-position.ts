// 滚动位置管理工具

export interface ScrollPosition {
  tab: string
  scrollTop: number
  timestamp: number
}

const SCROLL_POSITION_KEY = 'analysis_scroll_positions'
const POSITION_EXPIRY_TIME = 30 * 60 * 1000 // 30分钟过期

// 保存滚动位置
export const saveScrollPosition = (tab: string, scrollTop: number) => {
  if (typeof window === 'undefined') return

  try {
    const existingData = localStorage.getItem(SCROLL_POSITION_KEY)
    const positions: Record<string, ScrollPosition> = existingData ? JSON.parse(existingData) : {}

    // 清理过期的位置记录
    const now = Date.now()
    Object.keys(positions).forEach(key => {
      if (now - positions[key].timestamp > POSITION_EXPIRY_TIME) {
        delete positions[key]
      }
    })

    // 保存当前位置，使用带前缀的键名以避免冲突
    const positionKey = `analysis_${tab}`
    positions[positionKey] = {
      tab,
      scrollTop,
      timestamp: now
    }

    localStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions))
  } catch (error) {
    console.warn('保存滚动位置失败:', error)
  }
}

// 获取滚动位置
export const getScrollPosition = (tab: string): number => {
  if (typeof window === 'undefined') return 0

  try {
    const existingData = localStorage.getItem(SCROLL_POSITION_KEY)
    const positions: Record<string, ScrollPosition> = existingData ? JSON.parse(existingData) : {}

    const positionKey = `analysis_${tab}`
    const position = positions[positionKey]
    if (!position) return 0

    // 检查是否过期
    const now = Date.now()
    if (now - position.timestamp > POSITION_EXPIRY_TIME) {
      delete positions[positionKey]
      localStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions))
      return 0
    }

    return position.scrollTop
  } catch (error) {
    console.warn('获取滚动位置失败:', error)
    return 0
  }
}

// 清除特定tab的滚动位置
export const clearScrollPosition = (tab: string) => {
  if (typeof window === 'undefined') return

  try {
    const existingData = localStorage.getItem(SCROLL_POSITION_KEY)
    const positions: Record<string, ScrollPosition> = existingData ? JSON.parse(existingData) : {}

    const positionKey = `analysis_${tab}`
    delete positions[positionKey]
    localStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions))
  } catch (error) {
    console.warn('清除滚动位置失败:', error)
  }
}

// 清除所有滚动位置
export const clearAllScrollPositions = () => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(SCROLL_POSITION_KEY)
  } catch (error) {
    console.warn('清除所有滚动位置失败:', error)
  }
}