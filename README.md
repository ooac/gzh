# 内容工厂 Agent

智能内容创作与发布平台，从选题分析到多渠道发布的完整解决方案。

## 🚀 功能特性

### 选题分析
- 🔍 基于关键词搜索公众号文章
- 📊 AI驱动的文章分析和洞察生成
- 📈 热门文章排行和互动率分析
- ☁️ 高频词云可视化
- 💡 智能选题洞察建议

### 内容创作
- ✨ AI智能内容生成
- 📝 富文本编辑器
- 🖼️ 图片素材管理（Unsplash集成）
- 📋 草稿自动保存
- 🏷️ 关键词标签生成

### 发布管理
- 📱 支持多平台发布（小红书、微信公众号）
- 📊 文章状态管理（草稿、待发布、已发布）
- 📈 发布历史和数据统计
- ⚡ 一键发布功能

## 🛠️ 技术栈

- **前端框架**: Next.js 16 + TypeScript
- **样式**: Tailwind CSS
- **数据库**: SQLite + Prisma ORM
- **状态管理**: Zustand + React Query
- **UI组件**: 自建组件库 + Lucide图标
- **AI集成**: 统一接口抽象层（支持OpenAI、Claude等）

## 📦 项目结构

```
content-factory-agent/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # 路由组 - 主要页面
│   │   │   ├── dashboard/     # 仪表板
│   │   │   ├── analysis/      # 选题分析
│   │   │   ├── create/        # 内容创作
│   │   │   └── layout.tsx     # 布局组件
│   │   ├── api/               # API路由
│   │   │   ├── wechat/        # 公众号搜索API
│   │   │   └── ai/            # AI相关API
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React组件
│   │   └── ui/                # 基础UI组件
│   ├── lib/                   # 工具库
│   │   ├── ai/                # AI服务集成
│   │   ├── db/                # 数据库相关
│   │   └── utils.ts           # 通用工具函数
│   └── types/                 # TypeScript类型定义
├── prisma/                    # 数据库配置
│   ├── schema.prisma         # 数据库模型
│   └── dev.db                # SQLite数据库
└── public/                    # 静态资源
```

## 🚀 快速开始

### 1. 安装依赖
```bash
yarn install
```

### 2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY=""
CLAUDE_API_KEY=""
UNSPLASH_ACCESS_KEY=""
```

### 3. 初始化数据库
```bash
yarn prisma generate
yarn prisma db push
```

### 4. 启动开发服务器
```bash
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📋 可用脚本

```bash
yarn dev              # 启动开发服务器
yarn build            # 构建生产版本
yarn start            # 启动生产服务器
yarn lint             # 运行ESLint检查
yarn db:generate      # 生成Prisma客户端
yarn db:push          # 推送数据库schema变更
yarn db:migrate       # 运行数据库迁移
yarn db:studio        # 打开Prisma Studio
```

## 🎯 主要页面

### 首页 (`/`)
- 项目介绍和功能概览
- 快速导航入口

### 仪表板 (`/dashboard`)
- 数据统计概览
- 最近文章列表
- 快速操作入口
- 系统状态监控

### 选题分析 (`/analysis`)
- 关键词搜索
- AI分析报告
- 热门文章排行
- 互动率分析
- 词云图展示
- 选题洞察建议

### 内容创作 (`/create`)
- AI内容生成
- 文章编辑器
- 图片素材管理
- 草稿保存功能

### 文章管理 (`/articles`) - 开发中
- 文章列表管理
- 状态筛选
- 批量操作

### 发布管理 (`/publish`) - 开发中
- 发布队列管理
- 平台配置
- 发布历史

### 数据分析 (`/analytics`) - 开发中
- 数据统计图表
- 性能分析
- 趋势报告

## 🔧 Mock API

项目目前使用Mock API模拟真实功能：

### 公众号搜索 API
```
POST /api/wechat/search
{
  "keyword": "AI技术",
  "limit": 20
}
```

### AI分析 API
```
POST /api/ai/analyze
{
  "articles": [...],
  "keyword": "AI技术"
}
```

### AI内容生成 API
```
POST /api/ai/generate
{
  "topic": "AI技术发展趋势",
  "style": "专业",
  "length": "medium"
}
```

## 🎨 设计原则

- **用户友好**: 直观的界面设计，简洁的操作流程
- **响应式**: 支持桌面和移动端访问
- **高性能**: 优化的代码和资源加载
- **可扩展**: 模块化设计，易于添加新功能
- **类型安全**: 完整的TypeScript类型定义

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📄 许可证

MIT License

## 📞 联系

如有问题或建议，请通过Issue联系我们。