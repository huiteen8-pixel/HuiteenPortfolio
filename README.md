# 任睿个人简历网站 (RenRui Web Resume)

基于 Next.js 16 + Supabase 的全栈个人简历展示网站，集成埋点分析系统。

🔗 **线上地址**: [ooooyasumi.com](https://ooooyasumi.com)

## 快速开始

```bash
# 1. 克隆项目
git clone <repo-url> && cd RenRuiWebResume

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入实际的 Supabase 和 COS 密钥

# 3. 安装依赖 (必须使用 pnpm)
pnpm install

# 4. 启动开发服务器
pnpm dev
# 打开 http://localhost:5000
```

## 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 (standalone 模式) |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint |
| `pnpm ts-check` | TypeScript 类型检查 |

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页 (单页面，包含所有区块)
│   ├── layout.tsx          # 根布局
│   ├── globals.css         # 全局样式 + 主题变量
│   ├── analytics/          # 埋点仪表盘页面
│   └── api/analytics/      # 埋点分析 API (9个端点)
├── components/
│   ├── ui/                 # shadcn/ui 组件库
│   ├── CustomCursor.tsx    # 自定义光标
│   ├── ScrollReveal.tsx    # 滚动揭示动画
│   ├── CountUp.tsx         # 数字计数动画
│   ├── VideoPlayer.tsx     # 视频播放器
│   ├── ImageGallery.tsx    # 图片画廊
│   ├── ResumeViewer.tsx    # 简历在线预览
│   └── TrackerProvider.tsx # 埋点追踪提供者
├── hooks/                  # 自定义 Hooks (埋点追踪、时长统计等)
└── lib/                    # 工具库 (Supabase 客户端、cn 工具)
db/                         # Supabase 数据库初始化脚本
deploy/nginx/               # Nginx 部署配置
scripts/                    # 构建/启动/上传脚本
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui, Tailwind CSS 4 |
| 动画 | framer-motion, lenis, GSAP |
| 后端 | Next.js API Routes |
| 数据库 | Supabase (PostgreSQL) |
| 存储 | 腾讯云 COS |
| 图表 | Recharts |
| 包管理 | pnpm ≥9 |

## 功能特性

- 📄 单页面简历展示 (Hero、技能、经历、作品、兴趣、Connect)
- 📊 完整的埋点分析系统 (访问/点击/停留时长/模块曝光)
- 🎬 视频背景 + 鼠标视差效果
- 🌓 亮色/暗色模式切换
- 📝 简历在线预览 (iframe PDF)
- 🖼️ 作品图片画廊
- ✨ 滚动揭示 + 数字计数动画
- 📱 响应式设计

## 部署

项目使用 `standalone` 输出模式部署到 Linux + Nginx 服务器。

```bash
# 配置部署信息后运行
bash deploy.sh
```

Nginx 配置文件位于 `deploy/nginx/`。

## 数据库初始化

在 Supabase SQL Editor 中按顺序执行 `db/` 目录下的 SQL 文件：

1. `supabase-init.sql` — 初始化
2. `supabase-schema.sql` — 创建表结构
3. `supabase-rpc.sql` — 创建 RPC 函数

或在 Node.js 环境运行 `db/setup-db.js`。

## 开发规范

1. **pnpm only** — 项目已配置 preinstall 强制检查
2. **shadcn/ui 优先** — 基础 UI 使用 `src/components/ui/` 下的组件
3. **TypeScript 严格模式** — 所有新代码需通过类型检查
4. **Hydration 安全** — 浏览器 API 在 `useEffect` 中使用，避免 SSR 水合错误
5. **环境变量** — 客户端可用的变量以 `NEXT_PUBLIC_` 开头
