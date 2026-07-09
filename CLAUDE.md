# RenRui Web Resume — 任睿个人简历网站

基于 Next.js 16 的全栈个人简历展示网站，集成 Supabase 埋点分析系统。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui (Radix UI), Tailwind CSS 4 |
| 动画 | framer-motion, lenis (平滑滚动), GSAP |
| 后端 | Next.js API Routes, Supabase (PostgreSQL) |
| 存储 | 腾讯云 COS (简历 PDF 存储) |
| 包管理 | pnpm ≥9 |

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器 (localhost:5000)
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # ESLint 检查
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入实际值：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `COS_SECRET_ID` | 腾讯云 COS SecretId |
| `COS_SECRET_KEY` | 腾讯云 COS SecretKey |
| `COS_BUCKET` | COS 存储桶名称 |
| `COS_REGION` | COS 区域 |

## 项目结构

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 根布局 (暗色模式、字体、TrackerProvider)
│   ├── page.tsx                # 首页 (单页面简历)
│   ├── globals.css             # 全局样式 + Tailwind + 主题变量
│   ├── analytics/              # /analytics 埋点仪表盘页面
│   └── api/analytics/          # 埋点 API 路由
│       ├── track/              # POST 埋点上报
│       ├── visits/             # 访问记录
│       ├── click-event/        # 点击事件
│       ├── visit-duration/     # 访问时长
│       ├── visit-dwell/        # 停留时间
│       ├── module-dwell/       # 模块停留
│       ├── stats/              # 统计聚合
│       ├── links/              # 链接管理
│       └── resume-action/      # 简历操作事件
├── components/
│   ├── ui/                     # shadcn/ui 基础组件 (55个)
│   ├── CustomCursor.tsx        # 自定义光标
│   ├── ScrollReveal.tsx        # 滚动揭示动画
│   ├── SmoothScroll.tsx        # Lenis 平滑滚动
│   ├── CountUp.tsx             # 数字计数动画
│   ├── VideoPlayer.tsx         # 视频播放器
│   ├── ImageGallery.tsx        # 图片画廊
│   ├── Interest.tsx            # 兴趣展示区
│   ├── ResumeViewer.tsx        # 简历在线预览 (iframe PDF)
│   └── TrackerProvider.tsx     # 埋点追踪上下文
├── hooks/
│   ├── useModuleTracker.ts     # 模块曝光追踪
│   ├── useVisitTracker.ts      # 访问追踪
│   ├── useVisitDuration.ts     # 访问时长追踪
│   └── use-mobile.ts           # 移动端检测
└── lib/
    ├── supabase.ts             # Supabase 客户端
    └── utils.ts                # cn() 工具函数
db/                             # 数据库初始化脚本
scripts/                        # 构建/启动脚本 + COS 上传
deploy/nginx/                   # Nginx 配置
```

## 架构要点

### 页面结构
网站为单页面设计 (SPA-style)，`page.tsx` 包含所有区块：
Hero → 个人信息 → 技能 → 经历 → 作品 → 兴趣 → Connect
每个区块数据为静态硬编码，未使用 CMS。

### 埋点系统
- **前端**: `TrackerProvider` 包裹整个应用，通过 Context 提供上报方法
- **Hooks**: `useModuleTracker` (IntersectionObserver 检测模块曝光)、`useVisitTracker` (访问记录)
- **API**: `/api/analytics/track` 为核心上报端点，Supabase 存储
- **仪表盘**: `/analytics` 页面展示埋点数据

### 动画
- **framer-motion**: 页面元素进出动画
- **lenis**: 全局平滑滚动
- **CountUp**: 数字滚动计数效果
- **ScrollReveal**: 滚动触发揭示动画
- **VideoPlayer**: 视频淡入淡出 + 鼠标视差

### 数据库 (Supabase)
- `visits`: 访问记录
- `click_events`: 点击事件
- `visit_duration`: 页面停留时长
- `module_dwell_time`: 模块停留时间
- `links`: Connect 区域链接
- `resume_actions`: 简历操作记录
- 初始化脚本在 `db/` 目录

### 部署
- 服务器: Linux + Nginx (宝塔面板)
- 构建模式: `standalone` (支持 API Routes)
- 静态资源: 腾讯云 COS
- 部署脚本: `deploy.sh` (需配置服务器信息)

## 开发注意

1. **包管理器**: 必须使用 pnpm，项目已配置 preinstall 强制检查
2. **组件优先**: UI 优先使用 `src/components/ui/` 下的 shadcn 组件
3. **客户端组件**: 使用浏览器 API 的组件必须标记 `'use client'`
4. **Hydration**: 严禁在 JSX 中直接使用 `typeof window`/`Date.now()`/`Math.random()`
5. **环境变量**: 前端可用变量以 `NEXT_PUBLIC_` 开头

## 相关文档

- `DOCUMENT/design.md` — 视觉设计文档（色彩、字体、间距规范）
- `REFERENCE/` — 设计参考素材（gitignored）
- `AGENTS.md` — Coze 平台项目上下文
