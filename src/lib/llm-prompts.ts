/**
 * LLM分析提示词模板
 * 为不同类型的分析提供标准化的提示词
 */

export interface AnalysisContext {
  articles: any[];
  keyword: string;
  totalArticles: number;
  avgReadCount: number;
  avgLikeCount: number;
}

/**
 * 构建综合分析提示词
 * 包含词云分析和选题洞察
 */
export function buildComprehensiveAnalysisPrompt(context: AnalysisContext): string {
  const { articles, keyword, totalArticles, avgReadCount, avgLikeCount } = context;

  return `
你是一个专业的内容分析专家，请深入分析以下${totalArticles}篇关于"${keyword}"的文章，生成高质量的词云数据和选题洞察。

## 文章数据概览：
- 搜索关键词：${keyword}
- 文章数量：${totalArticles}篇
- 平均阅读量：${avgReadCount}
- 平均点赞数：${avgLikeCount}

## 详细文章内容：
${articles.map((article, index) => `
### 文章${index + 1}
- **标题**：${article.title}
- **作者**：${article.author}
- **阅读量**：${article.readCount}
- **点赞数**：${article.likeCount}
- **互动率**：${article.engagementRate || '0'}%
- **发布时间**：${new Date(article.publishTime).toLocaleDateString()}
- **内容摘要**：${article.content?.substring(0, 800) || '暂无内容'}...
`).join('\n')}

## 分析任务：
请严格按照以下JSON格式返回全面的分析结果：

{
  "wordCloud": [
    {
      "word": "关键词1",
      "count": 具体数字,
      "importance": 1-10评分,
      "category": "技术/概念/趋势/方法/工具",
      "description": "简要说明该词汇的重要性"
    },
    {
      "word": "关键词2",
      "count": 具体数字,
      "importance": 1-10评分,
      "category": "技术/概念/趋势/方法/工具",
      "description": "简要说明该词汇的重要性"
    }
  ],
  "insights": [
    "基于数据分析的深度洞察1：具体、可操作的发现",
    "基于数据分析的深度洞察2：包含趋势预测和机会分析",
    "基于数据分析的深度洞察3：用户需求痛点和解决方案",
    "基于数据分析的深度洞察4：竞争分析和差异化角度",
    "基于数据分析的深度洞察5：内容创作和传播策略建议"
  ],
  "contentStrategy": {
    "targetAudience": "目标用户群体分析（年龄、兴趣、需求特点）",
    "contentAngles": ["推荐的内容角度1", "推荐的内容角度2", "推荐的内容角度3"],
    "hotTopics": ["当前热点话题1", "当前热点话题2", "当前热点话题3"],
    "contentTypes": ["推荐内容类型1", "推荐内容类型2"],
    "timingSuggestions": "最佳发布时机建议"
  },
  "qualityMetrics": {
    "contentDepth": "内容深度评分1-10及建议",
    "technicalAccuracy": "技术准确性评分1-10及建议",
    "userEngagement": "用户互动性评分1-10及建议",
    "innovationLevel": "创新性评分1-10及建议"
  },
  "analysisSummary": {
    "keyFindings": "主要发现总结",
    "recommendations": "核心建议",
    "nextSteps": "后续行动建议"
  }
}

## 分析要求：

### 词云分析要求：
1. **词汇数量**：提取20-30个最具代表性的关键词
2. **质量标准**：避免通用词汇（如"的"、"是"、"为了"等），优先选择专业术语和核心概念
3. **统计准确性**：count字段应基于词汇在文章中的实际出现频率
4. **重要性评分**：importance基于词汇在专业领域和当前语境中的重要性（1-10分）
5. **分类准确性**：category应准确反映词汇的性质：
   - **技术**：具体的技术术语、框架、工具
   - **概念**：核心理念、理论、原理
   - **趋势**：发展方向、未来趋势、新兴技术
   - **方法**：实施方法、技巧、最佳实践
   - **工具**：软件、平台、工具类词汇

### 选题洞察要求：
1. **深度分析**：基于实际数据提供有深度的洞察，避免泛泛而谈
2. **可操作性**：每个洞察都应提供具体的行动建议
3. **趋势预测**：包含对未来发展趋势的预测和分析
4. **用户导向**：重点关注用户需求和痛点
5. **竞争视角**：从竞争角度分析内容差异化策略

### 内容策略要求：
1. **用户画像**：精确定位目标用户群体
2. **内容角度**：提供多个可执行的内容创作角度
3. **热点把握**：识别当前最热门的话题和趋势
4. **时机建议**：提供最佳的内容发布时机

### 输出格式要求：
1. **JSON格式**：确保返回的是有效的JSON格式
2. **完整性**：所有字段都必须填写，不能为空
3. **准确性**：基于实际文章内容进行分析，避免虚构
4. **专业性**：使用专业术语，体现分析的专业水准

请确保你的分析既全面又深入，能够为内容创作提供真正的价值指导。
`;
}

/**
 * 构建简化的词云分析提示词
 * 仅用于生成词云数据
 */
export function buildWordCloudPrompt(context: AnalysisContext): string {
  const { articles, keyword, totalArticles } = context;

  return `
请分析以下${totalArticles}篇关于"${keyword}"的文章，提取高质量的高频词云数据。

## 文章内容：
${articles.map((article, index) => `
文章${index + 1}：
标题：${article.title}
内容：${article.content?.substring(0, 500) || '暂无内容'}...
`).join('\n')}

请返回JSON格式：
{
  "wordCloud": [
    {"word": "关键词1", "count": 数字, "importance": 1-10, "category": "技术/概念/趋势/方法/工具"},
    {"word": "关键词2", "count": 数字, "importance": 1-10, "category": "技术/概念/趋势/方法/工具"}
  ]
}

要求：
1. 提取20-30个最有价值的关键词
2. 避免通用词汇，优先专业术语
3. count基于实际出现频率
4. importance基于词汇重要性（1-10）
5. 确保JSON格式正确
`;
}

/**
 * 构建选题洞察提示词
 * 基于已有词云数据进行深度洞察分析
 */
export function buildInsightsPrompt(context: AnalysisContext, wordCloudData: any[]): string {
  const { articles, keyword } = context;

  return `
基于以下文章内容和词云分析结果，请生成深度的选题洞察。

## 词云数据：
${JSON.stringify(wordCloudData.slice(0, 10), null, 2)}

## 文章数据：
${articles.map((article, index) => `
文章${index + 1}：${article.title}（阅读量：${article.readCount}，点赞：${article.likeCount}）
`).join('\n')}

请返回JSON格式：
{
  "insights": [
    "具体洞察1（基于数据分析）",
    "具体洞察2（包含趋势预测）",
    "具体洞察3（提供操作建议）",
    "具体洞察4（分析用户需求）",
    "具体洞察5（竞争分析角度）"
  ],
  "contentStrategy": {
    "targetAudience": "目标用户群体分析",
    "contentAngles": ["推荐角度1", "推荐角度2", "推荐角度3"],
    "recommendations": ["内容建议1", "内容建议2", "内容建议3"]
  }
}

要求：
1. 洞察要有深度和可操作性
2. 基于实际数据提供具体建议
3. 考虑用户痛点和需求
4. 提供可执行的内容创作指导
`;
}