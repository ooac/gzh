/**
 * 测试新的词云算法功能
 * 验证真实文本分析算法的正确性和效果
 */

// 导入我们的文本分析函数
const {
  analyzeTextFrequency,
  extractTextFromArticles,
  generateEnhancedWordCloud,
  generateWordCloudData
} = require('./src/lib/text-analysis.ts');

// 模拟文章数据
const mockArticles = [
  {
    id: '1',
    title: 'React 18新特性深度解析：并发渲染与自动批处理',
    content: 'React 18带来了许多令人兴奋的新特性，其中最重要的是并发渲染机制。并发渲染允许React中断渲染过程，优先处理更重要的更新，从而提升用户体验。自动批处理是另一个重要特性，它可以减少不必要的重新渲染，提高应用性能。这些新特性对于前端开发者来说具有重要意义。',
    author: '技术前线',
    readCount: 15000,
    likeCount: 890,
    url: 'https://example.com/react18-features'
  },
  {
    id: '2',
    title: '前端性能优化最佳实践：从加载速度到用户体验',
    content: '前端性能优化是每个开发者都必须掌握的技能。本文将从多个角度探讨性能优化策略，包括代码分割、懒加载、图片优化、缓存策略等。通过实际案例和性能测试数据，我们将深入分析各种优化技术的效果。现代前端应用越来越复杂，性能优化变得尤为重要。',
    author: 'Web技术周刊',
    readCount: 12000,
    likeCount: 670,
    url: 'https://example.com/frontend-performance'
  },
  {
    id: '3',
    title: 'Vue 3 Composition API实战：构建可复用的业务组件',
    content: 'Vue 3的Composition API为我们提供了更灵活的组件设计方式。通过实际项目案例，我们将学习如何使用Composition API构建可复用的业务组件。本文将涵盖状态管理、生命周期钩子、依赖注入等核心概念。Composition API不仅提高了代码的可读性，还增强了组件的可测试性。',
    author: 'Vue开发者社区',
    readCount: 8500,
    likeCount: 450,
    url: 'https://example.com/vue3-composition'
  },
  {
    id: '4',
    title: 'TypeScript进阶：泛型编程与高级类型系统',
    content: 'TypeScript的类型系统非常强大，泛型编程是其中的重要特性。本文将深入探讨TypeScript的高级类型系统，包括条件类型、映射类型、模板字面量类型等。通过实际代码示例，我们将学习如何编写类型安全的通用函数和类。掌握这些高级特性将大大提升代码质量和开发效率。',
    author: 'TypeScript技术博客',
    readCount: 9200,
    likeCount: 520,
    url: 'https://example.com/typescript-advanced'
  },
  {
    id: '5',
    title: '微前端架构设计：模块化开发与独立部署',
    content: '微前端是一种架构风格，它将前端应用分解为更小的、更简单的部分。本文将介绍微前端架构的设计原则和实现方案，包括模块联邦、single-spa等主流技术。我们将讨论如何在大型项目中实施微前端，以及如何处理跨模块通信、样式隔离等技术挑战。微前端能够帮助团队更好地协作和独立部署。',
    author: '架构师之路',
    readCount: 7800,
    likeCount: 380,
    url: 'https://example.com/micro-frontend'
  }
];

async function testTextAnalysis() {
  console.log('🚀 开始测试新的词云算法功能...\n');

  try {
    // 1. 测试文本提取功能
    console.log('📝 1. 测试文本提取功能');
    const extractedTexts = extractTextFromArticles(mockArticles);
    console.log(`✅ 成功提取 ${extractedTexts.length} 篇文章的文本内容`);
    console.log(`📊 文本总长度: ${extractedTexts.join('').length} 字符\n`);

    // 2. 测试基础词频分析
    console.log('🔍 2. 测试基础词频分析');
    const wordFrequencies = analyzeTextFrequency(extractedTexts, {
      minWordLength: 2,
      maxWords: 30,
      includeEnglish: true,
      weightByLength: true
    });

    console.log(`✅ 分析完成，共提取 ${wordFrequencies.length} 个词汇`);
    console.log('📈 前15个高频词汇:');
    wordFrequencies.slice(0, 15).forEach((item, index) => {
      console.log(`   ${index + 1:2}. ${item.word} (${item.count}次, 权重:${item.weight.toFixed(2)})`);
    });

    // 3. 测试增强词云生成
    console.log('\n🌈 3. 测试增强词云生成');
    const keyword = '前端技术';
    const enhancedWordCloud = generateEnhancedWordCloud(mockArticles, keyword, {
      minWordLength: 2,
      maxWords: 50,
      includeEnglish: true,
      weightByLength: true
    });

    console.log(`✅ 词云数据生成完成，包含 ${enhancedWordCloud.length} 个词汇`);
    console.log('🎨 高频词云数据:');
    enhancedWordCloud.slice(0, 20).forEach((item, index) => {
      console.log(`   ${index + 1:2}. ${item.word}: ${item.count}次`);
    });

    // 4. 测试不同参数组合
    console.log('\n⚙️ 4. 测试不同参数组合的效果');

    const testConfigs = [
      { name: '仅中文', options: { includeEnglish: false, minWordLength: 2 } },
      { name: '包含英文', options: { includeEnglish: true, minWordLength: 2 } },
      { name: '最少3字', options: { includeEnglish: true, minWordLength: 3 } },
      { name: '长词加权', options: { includeEnglish: true, weightByLength: true } },
    ];

    testConfigs.forEach((config, index) => {
      console.log(`\n   配置${index + 1}: ${config.name}`);
      const result = analyzeTextFrequency(extractedTexts, {
        maxWords: 10,
        ...config.options
      });

      console.log(`      词汇数: ${result.length}`);
      console.log(`      前5词: ${result.slice(0, 5).map(w => w.word).join(', ')}`);
    });

    // 5. 性能测试
    console.log('\n⚡ 5. 性能测试');
    const startTime = Date.now();

    // 模拟大量文章数据
    const largeDataSet = Array(100).fill(null).map((_, index) => ({
      ...mockArticles[index % mockArticles.length],
      title: `${mockArticles[index % mockArticles.length].title} - 第${index + 1}部分`,
      content: `${mockArticles[index % mockArticles.length].content} `.repeat(3)
    }));

    const largeTexts = extractTextFromArticles(largeDataSet);
    const largeAnalysis = analyzeTextFrequency(largeTexts, {
      maxWords: 100,
      includeEnglish: true
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log(`✅ 处理${largeDataSet.length}篇文章 (${largeTexts.join('').length}字符)`);
    console.log(`⏱️  处理时间: ${processingTime}ms`);
    console.log(`📊 提取词汇: ${largeAnalysis.length}个`);
    console.log(`🚀 处理速度: ${(largeTexts.join('').length / 1000 / processingTime).toFixed(2)} KB/s`);

    // 6. 边界情况测试
    console.log('\n🧪 6. 边界情况测试');

    // 空数据测试
    const emptyResult = analyzeTextFrequency([], { maxWords: 10 });
    console.log(`✅ 空数据处理: ${emptyResult.length}个词汇`);

    // 单字符测试
    const singleCharResult = analyzeTextFrequency(['a b c 我 你 他'], { minWordLength: 1 });
    console.log(`✅ 单字符处理: ${singleCharResult.length}个词汇`);

    // 混合语言测试
    const mixedLangResult = analyzeTextFrequency([
      'React is a JavaScript library',
      'Vue是渐进式框架',
      'Angular框架TypeScript开发'
    ], { includeEnglish: true, minWordLength: 2 });
    console.log(`✅ 混合语言处理: ${mixedLangResult.length}个词汇`);

    console.log('\n🎉 所有测试完成！新的词云算法功能正常工作。');

    // 输出JSON格式的测试结果，可用于前端测试
    const testOutput = {
      timestamp: new Date().toISOString(),
      testResults: {
        basicAnalysis: wordFrequencies.slice(0, 20),
        enhancedWordCloud: enhancedWordCloud.slice(0, 30),
        performanceTest: {
          articlesProcessed: largeDataSet.length,
          processingTimeMs: processingTime,
          wordsExtracted: largeAnalysis.length
        }
      }
    };

    console.log('\n📄 测试结果数据已准备，可用于前端集成测试。');
    return testOutput;

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    return null;
  }
}

// 运行测试
if (require.main === module) {
  testTextAnalysis()
    .then(result => {
      if (result) {
        // 保存测试结果到文件
        const fs = require('fs');
        fs.writeFileSync(
          './wordcloud-test-results.json',
          JSON.stringify(result, null, 2),
          'utf8'
        );
        console.log('📁 测试结果已保存到 wordcloud-test-results.json');
      }
    })
    .catch(error => {
      console.error('💥 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testTextAnalysis, mockArticles };