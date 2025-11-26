// 简单的API测试脚本
// 运行方式: node test-api.js

async function testAPI() {
  const baseUrl = 'http://localhost:3000'

  console.log('🚀 开始测试内容工厂Agent API...\n')

  try {
    // 测试公众号搜索API
    console.log('📝 测试公众号搜索API...')
    const searchResponse = await fetch(`${baseUrl}/api/wechat/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: 'AI技术', limit: 10 })
    })

    const searchResult = await searchResponse.json()
    console.log('✅ 搜索API响应:', JSON.stringify(searchResult, null, 2))
    console.log(`📊 搜索到 ${searchResult.data?.articles?.length || 0} 篇文章\n`)

    if (searchResult.success && searchResult.data.articles.length > 0) {
      // 测试AI分析API
      console.log('🤖 测试AI分析API...')
      const analysisResponse = await fetch(`${baseUrl}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: searchResult.data.articles,
          keyword: 'AI技术'
        })
      })

      const analysisResult = await analysisResponse.json()
      console.log('✅ 分析API响应:', JSON.stringify(analysisResult, null, 2))
      console.log(`💡 生成了 ${analysisResult.data?.insights?.length || 0} 个洞察建议\n`)

      // 测试AI内容生成API
      console.log('✍️ 测试AI内容生成API...')
      const generateResponse = await fetch(`${baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'AI技术发展趋势',
          style: '专业',
          length: 'short'
        })
      })

      const generateResult = await generateResponse.json()
      console.log('✅ 生成API响应:', JSON.stringify(generateResult, null, 2))
      console.log(`📄 生成了 ${generateResult.data?.wordCount || 0} 字的内容\n`)
    }

    console.log('🎉 所有API测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testAPI()
