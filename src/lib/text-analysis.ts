/**
 * 中文文本分析工具
 * 用于处理中文分词、词频统计、停用词过滤等
 */

// 中文停用词列表
const CHINESE_STOP_WORDS = new Set([
  // 常用虚词
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
  // 代词
  '我', '你', '他', '她', '它', '我们', '你们', '他们', '她们', '它们', '自己', '这个', '那个', '这些', '那些', '这里', '那里',
  // 介词连词
  '在', '于', '从', '到', '对', '对于', '关于', '把', '被', '让', '使', '由', '为', '因为', '所以', '但是', '而且', '或者', '如果', '虽然', '尽管',
  // 时间数字
  '今天', '昨天', '明天', '现在', '以前', '以后', '去年', '今年', '明年', '一个', '两个', '三个', '几个', '第一', '第二', '第三',
  // 常用动词
  '是', '有', '在', '说', '做', '去', '来', '看', '想', '要', '会', '能', '可以', '应该', '需要', '希望', '喜欢', '觉得', '知道', '告诉',
  // 常用形容词
  '好', '坏', '大', '小', '多', '少', '新', '老', '高', '低', '长', '短', '美', '丑', '快', '慢', '早', '晚', '真', '假', '对', '错',
  // 其他常见词
  '什么', '怎么', '为什么', '哪里', '哪个', '多少', '几个', '如何', '这样', '那样', '这种', '那种', '各种', '所有', '全部', '部分'
])

// 英文停用词
const ENGLISH_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'get', 'may', 'am'
])

export interface WordFrequency {
  word: string
  count: number
  weight?: number
}

export interface TextAnalysisOptions {
  minWordLength?: number      // 最小词长度
  maxWords?: number          // 最大返回词数
  includeEnglish?: boolean   // 是否包含英文
  weightByLength?: boolean   // 是否按词长加权
  weightByPosition?: boolean // 是否按位置加权
}

/**
 * 清理和标准化文本
 */
function cleanText(text: string): string {
  if (!text) return ''

  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')  // 保留中文、英文、数字和空格
    .replace(/\s+/g, ' ')                             // 合并多个空格
    .trim()
}

/**
 * 简单的中文分词算法
 * 基于词典和统计方法，适用于项目需求
 */
function chineseSegment(text: string): string[] {
  const words: string[] = []

  // 1. 首先按空格和标点符号分割成片段
  const chunks = text.split(/[\s,，、]+/).filter(chunk => chunk.trim())

  // 2. 对每个片段进行处理
  chunks.forEach(chunk => {
    // 如果是纯英文/数字，直接作为词语
    if (/^[a-zA-Z0-9]+$/.test(chunk)) {
      words.push(chunk)
      return
    }

    // 如果包含中文，进行切分
    let i = 0
    while (i < chunk.length) {
      let matched = false

      // 尝试4字词 (增加4字词支持)
      if (i + 4 <= chunk.length) {
        const fourCharWord = chunk.substr(i, 4)
        if (isValidChineseWord(fourCharWord)) {
          words.push(fourCharWord)
          i += 4
          matched = true
        }
      }

      // 尝试3字词
      if (!matched && i + 3 <= chunk.length) {
        const threeCharWord = chunk.substr(i, 3)
        if (isValidChineseWord(threeCharWord)) {
          words.push(threeCharWord)
          i += 3
          matched = true
        }
      }

      // 尝试2字词
      if (!matched && i + 2 <= chunk.length) {
        const twoCharWord = chunk.substr(i, 2)
        if (isValidChineseWord(twoCharWord)) {
          words.push(twoCharWord)
          i += 2
          matched = true
        }
      }

      // 单字 (通常跳过，除非是特定单字)
      if (!matched) {
        // 如果是单字，这里我们选择跳过，因为单字通常意义不大，或者是停用词
        // 但为了不丢失信息，我们可以选择保留或跳过
        // 这里选择跳过，i+1
        i++
      }
    }
  })

  return words
}

/**
 * 判断是否为有效的中文词语
 */
function isValidChineseWord(word: string): boolean {
  if (!word || word.length === 0) return false

  // 检查是否全为中文字符
  for (let i = 0; i < word.length; i++) {
    if (!isChineseChar(word.charAt(i))) {
      return false
    }
  }

  return true
}

/**
 * 判断是否为中文字符
 */
function isChineseChar(char: string): boolean {
  return char >= '\u4e00' && char <= '\u9fa5'
}

/**
 * 判断是否为停用词
 */
function isStopWord(word: string): boolean {
  return CHINESE_STOP_WORDS.has(word) || ENGLISH_STOP_WORDS.has(word.toLowerCase())
}

/**
 * 计算词频
 */
function calculateWordFrequency(words: string[], options: TextAnalysisOptions): Map<string, number> {
  const frequency = new Map<string, number>()

  words.forEach(word => {
    if (!word) return

    // 长度过滤
    if (options.minWordLength && word.length < options.minWordLength) {
      return
    }

    // 停用词过滤
    if (isStopWord(word)) {
      return
    }

    // 纯数字过滤
    if (/^\d+$/.test(word)) {
      return
    }

    // 累计频率
    frequency.set(word, (frequency.get(word) || 0) + 1)
  })

  return frequency
}

/**
 * 计算词权重
 */
function calculateWordWeight(word: string, count: number, frequency: Map<string, number>, options: TextAnalysisOptions): number {
  let weight = count

  // 按词长加权
  if (options.weightByLength) {
    weight *= (1 + (word.length - 2) * 0.1)  // 长度大于2的词获得额外权重
  }

  // 按频率分布加权（TF-IDF简化版）
  const totalWords = Array.from(frequency.values()).reduce((sum, freq) => sum + freq, 0)
  const tf = count / totalWords

  // 简化的IDF计算（基于词长和常见程度）
  let idf = 1
  if (word.length >= 3) idf = 1.2
  if (word.length >= 4) idf = 1.5

  weight *= tf * idf

  return weight
}

/**
 * 主函数：分析文本并返回词频统计
 */
export function analyzeTextFrequency(
  textContent: string[],
  options: TextAnalysisOptions = {}
): WordFrequency[] {
  const {
    minWordLength = 2,
    maxWords = 100,
    includeEnglish = true,
    weightByLength = true,
    weightByPosition = false
  } = options

  // 1. 清理和合并文本
  const cleanedText = textContent
    .map(text => cleanText(text))
    .filter(text => text.length > 0)
    .join(' ')

  if (!cleanedText) return []

  // 2. 分词
  const words: string[] = []

  // 处理中文分词
  const chineseWords = chineseSegment(cleanedText)
  words.push(...chineseWords)

  // 处理英文单词
  if (includeEnglish) {
    const englishWords = (cleanedText.match(/[a-zA-Z]+/g) || [])
      .map(word => word.toLowerCase())
    words.push(...englishWords)
  }

  // 3. 计算词频
  const frequency = calculateWordFrequency(words, options)

  // 4. 计算权重并排序
  const wordFrequencies: WordFrequency[] = Array.from(frequency.entries())
    .map(([word, count]) => ({
      word,
      count,
      weight: calculateWordWeight(word, count, frequency, options)
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxWords)

  return wordFrequencies
}

/**
 * 从文章数据中提取文本内容
 */
export function extractTextFromArticles(articles: any[]): string[] {
  return articles.map(article => {
    const textParts: string[] = []

    if (article.title) textParts.push(article.title)
    if (article.content) textParts.push(article.content)

    // 如果API提供了分词结果，也加入分析
    if (article.originalData?.cut_words) {
      textParts.push(article.originalData.cut_words)
    }

    return textParts.join(' ')
  }).filter(text => text && text.trim().length > 0)
}

/**
 * 生成词云数据（兼容现有格式）
 */
export function generateWordCloudData(
  wordFrequencies: WordFrequency[],
  maxWords: number = 50
): Array<{ word: string; count: number }> {
  return wordFrequencies
    .slice(0, maxWords)
    .map(({ word, count }) => ({ word, count }))
}

/**
 * 为搜索关键词生成增强词云
 */
export function generateEnhancedWordCloud(
  articles: any[],
  keyword: string,
  options: TextAnalysisOptions = {}
): Array<{ word: string; count: number }> {
  // 1. 提取文本内容
  const textContent = extractTextFromArticles(articles)

  // 2. 确保关键词包含在结果中
  const textWithKeyword = [...textContent, keyword.repeat(3)] // 增加关键词权重

  // 3. 分析词频
  const wordFrequencies = analyzeTextFrequency(textWithKeyword, {
    minWordLength: 2,
    maxWords: 100,
    weightByLength: true,
    ...options
  })

  // 4. 生成词云数据
  return generateWordCloudData(wordFrequencies, 50)
}