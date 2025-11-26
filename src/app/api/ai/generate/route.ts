import { NextRequest, NextResponse } from 'next/server'

// Mock内容生成数据
function generateMockContent(topic: string, style: string = '专业') {
  const templates = {
    'AI技术': {
      title: `${topic}：技术发展趋势与应用前景分析`,
      content: `随着人工智能技术的快速发展，${topic}已经成为当前技术领域的重要研究方向。本文将从技术原理、应用场景和发展趋势三个维度进行深入分析。

## 技术原理与核心概念

${topic}的核心在于通过算法模型实现智能化处理。其技术架构主要包括数据层、算法层和应用层三个部分。数据层负责收集和预处理训练数据，算法层实现核心的计算逻辑，应用层则提供具体的业务功能。

## 实际应用场景

目前，${topic}已经在多个领域得到广泛应用：

1. **智能客服**：通过${topic}技术，提供24小时不间断的客户服务
2. **内容创作**：辅助生成各类文本内容，提高创作效率
3. **数据分析**：快速处理和分析大规模数据，发现潜在规律
4. **自动化决策**：基于数据模型进行智能决策，减少人为干预

## 发展趋势与挑战

展望未来，${topic}技术将朝着更加智能化、个性化的方向发展。同时也面临着数据安全、算法偏见、可解释性等挑战。

## 总结

${topic}作为人工智能的重要组成部分，正在深刻改变我们的工作和生活方式。掌握这一技术，将为个人和企业带来巨大机遇。`,
      keywords: [topic, '人工智能', '技术趋势', '应用场景', '发展前景']
    },
    '产品管理': {
      title: `${topic}：产品经理的实践指南`,
      content: `作为产品经理，深入理解${topic}对于制定有效的产品策略至关重要。本文将分享相关的实践经验和方法论。

## 用户需求分析

${topic}的核心是用户需求。我们需要通过用户访谈、数据分析、竞品研究等多种方式，准确把握用户的真实需求。

## 产品设计原则

在${topic}的产品设计过程中，应该遵循以下原则：

1. **用户中心**：始终以用户需求为出发点
2. **简洁实用**：避免功能冗余，聚焦核心价值
3. **迭代优化**：通过快速迭代不断改进产品体验
4. **数据驱动**：基于数据进行决策和优化

## 实施策略

针对${topic}，我们建议采用分阶段的实施策略：
- 第一阶段：市场调研和需求分析
- 第二阶段：产品原型设计和用户测试
- 第三阶段：产品开发和功能实现
- 第四阶段：产品发布和持续优化

## 总结

${topic}的成功需要产品经理具备综合能力，包括用户洞察、数据分析、沟通协调等。只有不断学习和实践，才能在产品管理的道路上走得更远。`,
      keywords: [topic, '产品管理', '用户需求', '产品设计', '实践经验']
    }
  }

  // 根据话题类型选择模板
  let selectedTemplate = templates['AI技术']
  if (topic.includes('产品') || topic.includes('用户') || topic.includes('需求')) {
    selectedTemplate = templates['产品管理']
  }

  return {
    ...selectedTemplate,
    summary: `本文深入探讨了${topic}的相关内容，从技术原理到实际应用，为读者提供了全面的指导和参考。`,
    wordCount: Math.floor(Math.random() * 500) + 800,
    readingTime: Math.floor(Math.random() * 3) + 3
  }
}

// 获取相关图片
async function getRelatedImages(keyword: string, count: number = 3) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/unsplash/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword, count })
    })

    const result = await response.json()
    if (result.success) {
      return result.data.images
    }
    return []
  } catch (error) {
    console.error('获取图片失败:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { topic, style = '专业', length = 'medium', aiProvider = 'openai', includeImages = true } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { success: false, error: '缺少主题参数' },
        { status: 400 }
      )
    }

    // 模拟AI生成延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    const contentResult = generateMockContent(topic, style)

    // 获取相关图片
    let images = []
    if (includeImages) {
      images = await getRelatedImages(topic, 3)
    }

    // 在内容中插入图片（简单的占位符方式）
    let contentWithImages = contentResult.content
    if (images.length > 0) {
      // 在内容中插入图片占位符
      const sections = contentWithImages.split('\n\n')
      if (sections.length >= 3) {
        sections.splice(2, 0, `\n![相关图片](${images[0].urls.regular})\n*图片来源: ${images[0].user.name} @ Unsplash*`)
      }
      if (sections.length >= 5 && images.length > 1) {
        sections.splice(4, 0, `\n![配图](${images[1].urls.regular})\n*图片来源: ${images[1].user.name} @ Unsplash*`)
      }
      contentWithImages = sections.join('\n\n')
    }

    return NextResponse.json({
      success: true,
      data: {
        ...contentResult,
        content: contentWithImages,
        images,
        aiProvider,
        style,
        length,
        includeImages,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI generate API error:', error)
    return NextResponse.json(
      { success: false, error: '内容生成失败，请重试' },
      { status: 500 }
    )
  }
}