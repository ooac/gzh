const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('=== 检查搜索历史记录 ===')
    const searchHistories = await prisma.searchHistory.findMany({
      orderBy: { searchDate: 'desc' },
      take: 5,
      include: {
        articles: true,
        reports: true,
      }
    })

    console.log(`找到 ${searchHistories.length} 条搜索历史记录`)

    for (const history of searchHistories) {
      console.log(`\n历史记录: ${history.keyword} (ID: ${history.id})`)
      console.log(`- 创建时间: ${history.searchDate}`)
      console.log(`- 总文章数: ${history.totalArticles}`)
      console.log(`- 关联的文章数: ${history.articles.length}`)

      if (history.articles.length > 0) {
        console.log('- 前3篇文章:')
        history.articles.slice(0, 3).forEach((article, index) => {
          console.log(`  ${index + 1}. ${article.title} (作者: ${article.author})`)
        })
      }
    }

    console.log('\n=== 检查所有文章记录 ===')
    const allArticles = await prisma.wechatArticle.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`数据库中共有 ${await prisma.wechatArticle.count()} 篇文章`)

    console.log('\n最新的10篇文章:')
    allArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`)
      console.log(`   - 作者: ${article.author}`)
      console.log(`   - searchHistoryId: ${article.searchHistoryId || 'NULL'}`)
      console.log(`   - 创建时间: ${article.createdAt}`)
    })

    console.log('\n=== 测试特定历史ID的文章查询 ===')
    const testHistoryId = searchHistories[0]?.id
    if (testHistoryId) {
      const articlesByHistory = await prisma.wechatArticle.findMany({
        where: { searchHistoryId: testHistoryId }
      })

      console.log(`历史记录 ${testHistoryId} 的文章数量: ${articlesByHistory.length}`)
    }

  } catch (error) {
    console.error('数据库查询失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()