# Content Factory Agent - 内容工厂AI助手

## 项目概述

Content Factory Agent 是一个基于AI技术的内容创作辅助平台，旨在为内容创作者提供从选题分析到内容生成再到多平台发布的完整工作流支持。

### 核心功能模块

1. **选题分析系统**
   - 关键词搜索与公众号文章获取
   - AI驱动的数据分析和洞察报告
   - 高频词云可视化
   - 点赞量和互动率排行榜
   - 5大核心选题洞察

2. **内容创作系统**
   - AI智能内容生成
   - 多种写作风格支持（专业、轻松、故事、教程）
   - 可配置文章长度（简短500-800字、中等800-1500字、详细1500-2500字）
   - Unsplash图片素材集成
   - 富文本编辑器
   - 草稿管理功能

3. **发布管理系统**
   - 多平台发布支持（小红书、微信公众号）
   - 发布状态跟踪
   - 发布历史记录
   - 批量发布功能

## 技术架构

### 技术栈

- **前端框架**: Next.js 16 with App Router
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS v3.4.1
- **数据库**: SQLite with Prisma ORM
- **状态管理**: Zustand
- **数据获取**: React Query (@tanstack/react-query)
- **UI组件**: Radix UI + 自定义组件
- **图标库**: Lucide React
- **图表库**: Recharts
- **AI服务**: 统一AI接口抽象层（支持OpenAI、Claude、本地模型）

### 项目结构

```
content-factory-agent/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # 路由组
│   │   │   ├── dashboard/            # 仪表板页面
│   │   │   ├── analysis/             # 选题分析页面
│   │   │   ├── create/               # 内容创作页面
│   │   │   ├── articles/             # 文章管理页面
│   │   │   ├── publish/              # 发布管理页面
│   │   │   ├── analytics/            # 数据分析页面
│   │   │   └── settings/             # 系统设置页面
│   │   ├── api/                      # API路由
│   │   │   ├── wechat/               # 微信相关API
│   │   │   │   └── search/           # 文章搜索API
│   │   │   ├── ai/                   # AI相关API
│   │   │   │   ├── analyze/          # AI分析API
│   │   │   │   └── generate/         # AI生成API
│   │   │   └── unsplash/             # Unsplash图片API
│   │   │       └── search/           # 图片搜索API
│   │   ├── globals.css               # 全局样式
│   │   ├── layout.tsx                # 根布局
│   │   └── page.tsx                  # 首页
│   ├── components/                   # 组件库
│   │   ├── ui/                       # 基础UI组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── badge.tsx
│   │   ├── layout/                   # 布局组件
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Navigation.tsx
│   │   ├── WordCloud.tsx             # 词云组件
│   │   └── ArticleCard.tsx           # 文章卡片组件
│   ├── lib/                          # 工具库
│   │   ├── utils.ts                  # 通用工具函数
│   │   ├── ai.ts                     # AI服务抽象层
│   │   └── db.ts                     # 数据库连接
│   └── types/                        # TypeScript类型定义
├── prisma/
│   └── schema.prisma                 # 数据库模式
├── public/                           # 静态资源
├── package.json                      # 项目依赖
├── tsconfig.json                     # TypeScript配置
├── tailwind.config.js               # Tailwind配置
├── next.config.js                    # Next.js配置
└── README.md                         # 项目说明
```

## 数据库设计

### 数据模型

使用Prisma ORM定义的数据库模式包含以下核心模型：

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  avatar          String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  articles        Article[]
  publishRecords  PublishRecord[]
  topicAnalyses   TopicAnalysis[]
  aiConfigs       AIConfig[]
}

model Article {
  id              String       @id @default(cuid())
  title           String
  content         String
  summary         String?
  wordCount       Int?
  readingTime     Int?
  keywords        String[]     @default([])
  status          ArticleStatus @default(DRAFT)
  aiGenerated     Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  publishedAt     DateTime?
  authorId        String
  author          User         @relation(fields: [authorId], references: [id])
  images          Image[]
  publishRecords  PublishRecord[]
}

model Image {
  id            String       @id @default(cuid())
  url           String
  description   String?
  source        ImageSource  @default(UNSPLASH)
  externalId    String?
  attribution   String?
  createdAt     DateTime     @default(now())
  articleId     String?
  article       Article?     @relation(fields: [articleId], references: [id])
}

model PublishRecord {
  id            String         @id @default(cuid())
  platform      PublishPlatform
  externalId    String?
  status        PublishStatus  @default(PENDING)
  publishedAt   DateTime?
  response      String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  articleId     String
  article       Article        @relation(fields: [articleId], references: [id])
  authorId      String
  author        User           @relation(fields: [authorId], references: [id])
}

model TopicAnalysis {
  id              String   @id @default(cuid())
  keyword         String
  totalArticles   Int
  topLikedArticles Json     @default("[]")
  engagementData  Json     @default("{}")
  wordCloud       Json     @default("[]")
  insights        String[] @default([])
  generatedAt     DateTime @default(now())
  createdAt       DateTime @default(now())
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
}

model AIConfig {
  id            String    @id @default(cuid())
  provider      String    // openai, claude, local
  model         String
  apiKey        String?
  endpoint      String?
  temperature   Float?
  maxTokens     Int?
  isActive      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  userId        String
  user          User      @relation(fields: [userId], references: [id])
}
```

### 枚举类型

```prisma
enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum ImageSource {
  UNSPLASH
  LOCAL
  AI_GENERATED
}

enum PublishPlatform {
  XIAOHONGSHU
  WECHAT
}

enum PublishStatus {
  PENDING
  PUBLISHED
  FAILED
}
```

## API设计

### RESTful API端点

#### 1. 微信文章搜索API
- **端点**: `POST /api/wechat/search`
- **功能**: 根据关键词搜索公众号文章
- **请求体**: `{ keyword: string, limit?: number }`
- **响应**:
```typescript
{
  success: boolean,
  data: {
    articles: Array<{
      id: string,
      title: string,
      content: string,
      author: string,
      readCount: number,
      likeCount: number,
      viewCount: number,
      publishTime: string,
      engagementRate?: string
    }>,
    total: number,
    keyword: string
  }
}
```

#### 2. AI分析API
- **端点**: `POST /api/ai/analyze`
- **功能**: 对文章进行AI分析，生成洞察报告
- **请求体**: `{ articles: Article[], keyword: string }`
- **响应**:
```typescript
{
  success: boolean,
  data: {
    keyword: string,
    totalArticles: number,
    topLikedArticles: Article[],
    topEngagementArticles: Article[],
    wordCloud: Array<{ word: string, count: number }>,
    insights: string[],
    generatedAt: string
  }
}
```

#### 3. AI内容生成API
- **端点**: `POST /api/ai/generate`
- **功能**: 根据主题生成文章内容
- **请求体**: `{
  topic: string,
  style?: string,
  length?: string,
  aiProvider?: string,
  includeImages?: boolean
}`
- **响应**:
```typescript
{
  success: boolean,
  data: {
    title: string,
    content: string,
    summary: string,
    keywords: string[],
    wordCount: number,
    readingTime: number,
    images?: Image[],
    aiProvider: string,
    style: string,
    length: string,
    generatedAt: string
  }
}
```

#### 4. Unsplash图片搜索API
- **端点**: `POST /api/unsplash/search`
- **功能**: 根据关键词搜索高质量图片
- **请求体**: `{ keyword: string, count?: number }`
- **响应**:
```typescript
{
  success: boolean,
  data: {
    images: Array<{
      id: string,
      urls: {
        regular: string,
        small: string,
        thumb: string
      },
      description: string,
      user: {
        name: string,
        username: string
      }
    }>,
    keyword: string,
    total: number
  }
}
```

## 核心组件实现

### 1. 词云可视化组件 (WordCloud.tsx)

使用Canvas API实现的动态词云组件，支持：

- 自适应字体大小（基于词频）
- 防碰撞算法布局
- 彩虹色系分布
- 响应式尺寸

```typescript
export default function WordCloud({ words, width = 600, height = 300 }: WordCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || words.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    canvas.width = width
    canvas.height = height

    // 计算字体大小范围
    const maxCount = Math.max(...words.map(w => w.value))
    const minCount = Math.min(...words.map(w => w.value))
    const sizeRange = 32 - 12 // 最大字体32px，最小12px

    // 绘制词云（防碰撞算法）
    const positions: Array<{ x: number; y: number; width: number; height: number }> = []

    words.forEach((word, index) => {
      const fontSize = Math.round(12 + ((word.value - minCount) / (maxCount - minCount)) * sizeRange)
      ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`

      // 防碰撞位置算法
      let placed = false
      let attempts = 0
      const maxAttempts = 50

      while (!placed && attempts < maxAttempts) {
        const x = Math.random() * (width - textWidth)
        const y = Math.random() * (height - textHeight) + textHeight

        // 检查重叠
        const newBox = { x, y, width: textWidth, height: textHeight }
        const overlapping = positions.some(pos => /* 碰撞检测逻辑 */)

        if (!overlapping || attempts > 20) {
          // 绘制文字
          const hue = (index * 137) % 360 // 黄金角度分布颜色
          ctx.fillStyle = `hsl(${hue}, 70%, 50%)`
          ctx.fillText(word.text, x, y)

          positions.push(newBox)
          placed = true
        }
        attempts++
      }
    })
  }, [words, width, height])
}
```

### 2. AI服务抽象层

统一的AI接口抽象，支持多种AI服务提供商：

```typescript
interface AIService {
  generateContent(params: {
    topic: string
    style: string
    length: string
    includeImages: boolean
  }): Promise<GeneratedContent>

  analyzeArticles(params: {
    articles: Article[]
    keyword: string
  }): Promise<AnalysisResult>
}

class OpenAIService implements AIService {
  async generateContent(params): Promise<GeneratedContent> {
    // OpenAI API调用逻辑
  }
}

class ClaudeService implements AIService {
  async generateContent(params): Promise<GeneratedContent> {
    // Claude API调用逻辑
  }
}

// 统一AI客户端
class AIClient {
  private service: AIService

  constructor(provider: string) {
    switch (provider) {
      case 'openai':
        this.service = new OpenAIService()
        break
      case 'claude':
        this.service = new ClaudeService()
        break
      default:
        this.service = new OpenAIService()
    }
  }

  async generateContent(params) {
    return this.service.generateContent(params)
  }
}
```

### 3. 响应式布局系统

基于Tailwind CSS的移动优先设计：

```typescript
// 仪表板布局示例
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 统计卡片 */}
</div>

// 分析页面布局
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* 左右分栏布局 */}
</div>

// 设置页面布局
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* 左侧导航 + 右侧内容 */}
</div>
```

## 开发历程记录

### 第一阶段：项目初始化和环境搭建

1. **项目创建**
   - 使用 `create-next-app@latest` 创建Next.js项目
   - 配置TypeScript、ESLint、Tailwind CSS

2. **依赖安装**
   - 核心依赖：Next.js、React、TypeScript
   - 数据库：Prisma、SQLite
   - UI框架：Tailwind CSS、Radix UI
   - 状态管理：Zustand、React Query
   - 工具库：Lucide React、Recharts

3. **环境配置**
   - 配置Prisma数据库连接
   - 设置Tailwind CSS配置
   - 创建基础项目结构

### 第二阶段：数据库设计和API开发

1. **数据库模式设计**
   - 用户模型（User）
   - 文章模型（Article）
   - 图片模型（Image）
   - 发布记录模型（PublishRecord）
   - 选题分析模型（TopicAnalysis）
   - AI配置模型（AIConfig）

2. **Mock API开发**
   - 微信文章搜索API
   - AI分析API
   - AI内容生成API
   - Unsplash图片搜索API

### 第三阶段：UI组件库开发

1. **基础UI组件**
   - Button组件（多种变体和尺寸）
   - Card组件（卡片布局）
   - Input组件（文本输入）
   - Textarea组件（多行文本）
   - Badge组件（标签显示）

2. **布局组件**
   - Sidebar（侧边栏导航）
   - Header（顶部导航）
   - Navigation（面包屑导航）

3. **业务组件**
   - WordCloud（词云可视化）
   - ArticleCard（文章卡片）
   - DataTable（数据表格）

### 第四阶段：页面功能实现

1. **仪表板页面**
   - 数据统计概览
   - 最近活动记录
   - 快速操作入口

2. **选题分析页面**
   - 关键词搜索界面
   - 分析结果展示
   - 词云可视化
   - 选题洞察报告

3. **内容创作页面**
   - AI生成配置
   - 文章编辑器
   - 图片素材管理
   - 草稿保存功能

4. **文章管理页面**
   - 文章列表展示
   - 状态筛选
   - 批量操作

5. **发布管理页面**
   - 多平台配置
   - 发布状态跟踪
   - 发布历史

6. **数据分析页面**
   - 内容表现统计
   - 平台数据对比
   - 趋势图表

7. **系统设置页面**
   - 个人信息管理
   - AI服务配置
   - 通知设置
   - 安全设置
   - 数据管理
   - 外观设置

### 第五阶段：功能完善和优化

1. **Unsplash图片集成**
   - 图片搜索API集成
   - 图片选择组件
   - 图片插入功能

2. **词云可视化完善**
   - Canvas实现词云
   - 防碰撞算法
   - 颜色分布优化

3. **响应式设计优化**
   - 移动端适配
   - 平板端优化
   - 桌面端体验提升

## 技术难点和解决方案

### 1. Tailwind CSS v4兼容性问题

**问题**: 初始安装Tailwind CSS v4导致PostCSS插件错误
**解决方案**:
- 尝试安装 @tailwindcss/postcss 插件
- 最终降级到稳定的 Tailwind CSS v3.4.1 版本
- 更新PostCSS配置适配v3版本

### 2. npm权限问题

**问题**: npm缓存被root用户拥有，导致权限错误
**解决方案**:
- 切换到yarn包管理器
- 避免使用sudo权限运行npm命令

### 3. Lucide React图标导入错误

**问题**: 使用了不存在的图标名称（Wechat、Instagram）
**解决方案**:
- 替换为可用图标（MessageCircle、Camera）
- 检查图标库文档确认可用图标

### 4. 动态路由和404错误

**问题**: 用户点击导航标签时出现404错误
**解决方案**:
- 创建所有缺失的页面组件
- 实现完整的路由结构
- 添加路由保护机制

### 5. 设置页面导航状态管理

**问题**: 设置分类按钮点击无反应
**解决方案**:
- 实现useState状态管理
- 添加activeSection状态
- 创建动态内容渲染函数
- 添加视觉反馈和交互效果

### 6. 词云可视化性能优化

**问题**: 大量词汇渲染时性能下降
**解决方案**:
- 使用Canvas API而非DOM渲染
- 实现防碰撞算法减少重叠计算
- 限制最大尝试次数避免无限循环

## 部署和运行

### 本地开发环境启动

```bash
# 1. 安装依赖
yarn install

# 2. 数据库初始化
npx prisma generate
npx prisma db push

# 3. 启动开发服务器
yarn dev
```

### 环境变量配置

创建 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# AI服务
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Unsplash
UNSPLASH_ACCESS_KEY="..."
UNSPLASH_SECRET_KEY="..."

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 生产环境部署

```bash
# 1. 构建项目
yarn build

# 2. 启动生产服务器
yarn start
```

## 功能特性

### ✅ 已实现功能

#### 核心功能
- [x] 选题分析系统
  - [x] 关键词搜索
  - [x] AI分析报告
  - [x] 词云可视化
  - [x] 选题洞察
- [x] 内容创作系统
  - [x] AI内容生成
  - [x] 多种写作风格
  - [x] 图片素材集成
  - [x] 富文本编辑
- [x] 发布管理系统
  - [x] 多平台配置
  - [x] 发布状态跟踪
  - [x] 发布历史

#### 技术功能
- [x] 响应式设计
- [x] TypeScript类型安全
- [x] 数据库ORM集成
- [x] 组件化架构
- [x] 状态管理
- [x] API路由设计
- [x] 图片处理
- [x] 实时数据更新

#### 用户体验
- [x] 直观的用户界面
- [x] 流畅的交互体验
- [x] 移动端适配
- [x] 加载状态提示
- [x] 错误处理
- [x] 设置管理

### 🚧 待优化功能

#### AI集成
- [ ] 真实AI服务API集成
- [ ] 更多AI模型支持
- [ ] 自定义AI配置
- [ ] AI生成质量优化

#### 平台集成
- [ ] 小红书API集成
- [ ] 微信公众号API集成
- [ ] 更多平台支持
- [ ] 自动化发布流程

#### 数据分析
- [ ] 高级数据可视化
- [ ] 自定义报表
- [ ] 数据导出功能
- [ ] 趋势预测分析

#### 性能优化
- [ ] 缓存策略优化
- [ ] 图片懒加载
- [ ] 代码分割
- [ ] SEO优化

## 开发最佳实践

### 1. 代码规范
- 使用TypeScript进行类型安全
- 遵循ESLint规则
- 统一组件命名规范
- 详细的代码注释

### 2. 组件设计原则
- 单一职责原则
- 可复用性设计
- Props类型定义
- 错误边界处理

### 3. 状态管理
- 使用Zustand进行全局状态管理
- React Query处理服务端状态
- 本地状态优先使用useState
- 避免状态冗余

### 4. 性能优化
- 使用React.memo优化组件渲染
- 图片资源优化
- 代码分割和懒加载
- 缓存策略实施

### 5. 安全考虑
- API密钥安全存储
- 用户数据保护
- XSS防护
- CSRF防护

## 测试策略

### 单元测试
- 组件功能测试
- 工具函数测试
- API逻辑测试

### 集成测试
- API接口测试
- 数据库操作测试
- 第三方服务集成测试

### 端到端测试
- 用户流程测试
- 跨浏览器测试
- 移动端测试

## 维护和监控

### 日志记录
- API请求日志
- 错误日志收集
- 用户行为分析

### 性能监控
- 页面加载时间
- API响应时间
- 数据库查询性能

### 错误监控
- 异常捕获和报告
- 用户反馈收集
- 自动告警机制

## 未来规划

### 短期目标（1-3个月）
- 集成真实AI服务API
- 完善图片素材库
- 优化移动端体验
- 增加数据导出功能

### 中期目标（3-6个月）
- 多平台自动发布
- 高级数据分析功能
- 协作功能开发
- 性能优化提升

### 长期目标（6-12个月）
- AI训练模型定制
- 智能推荐系统
- 社区功能建设
- 商业化功能开发

## 总结

Content Factory Agent项目成功构建了一个完整的内容创作辅助平台，涵盖了从选题分析到内容创作再到多平台发布的全流程。项目采用现代化的技术栈，具有良好的可扩展性和维护性。

### 技术亮点
1. **统一AI接口抽象**: 支持多种AI服务提供商的灵活切换
2. **可视化词云组件**: 基于Canvas的高性能词云实现
3. **响应式设计**: 移动优先的多端适配方案
4. **组件化架构**: 高度可复用的组件设计

### 开发成果
1. **完整功能实现**: 三大核心模块全部落地
2. **技术栈现代化**: Next.js 16 + TypeScript + Tailwind CSS
3. **用户体验优化**: 直观易用的界面设计
4. **代码质量保证**: TypeScript类型安全 + ESLint规范

这个项目为内容创作者提供了一个强大而易用的工具，能够显著提升内容创作效率和质量。随着AI技术的不断发展，平台将继续迭代优化，为用户创造更大的价值。