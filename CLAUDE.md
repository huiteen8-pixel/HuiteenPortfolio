# Huiteen Portfolio — 工程维护说明

这是郑惠文（Huiteen）的交互与服务设计作品集。本文档记录当前代码的实际结构和维护约束；通用的代理协作规则以 `AGENTS.md` 为准。

## 当前技术栈

| 类别 | 实现 |
| --- | --- |
| 框架 | Next.js 16 App Router、React 19、TypeScript 5 |
| UI | Tailwind CSS 4、shadcn/ui / Radix UI |
| 动效 | Framer Motion、CSS 滚动行为 |
| 服务端 | Next.js Route Handlers、Next.js standalone server |
| 数据 | SQLite（`better-sqlite3`） |
| 包管理 | pnpm 9+ only |

当前不使用 Supabase 作为运行时数据库。`scripts/migrate-to-sqlite.ts` 仅是一次性历史迁移工具，不属于日常启动、构建或部署流程。不要因该文件而为新功能增加 Supabase 依赖。

`scripts/upload-resume.mjs`、`src/components/Interest.tsx` 和 `src/components/ResumeViewer.tsx` 等旧站点遗留文件已删除。如未来恢复类似能力，应使用 Huiteen 的受控资产和全新配置重新实现，不得从 Git 历史直接恢复旧凭据或业务逻辑。

## 页面与内容结构

- `src/app/page.tsx`：当前的单页作品集，包含 Hero、个人介绍、教育、能力、项目和 Approach。
- `src/app/page.tsx` 中的 `projects` 数组：当前 9 组项目文案与媒体元数据的来源。
- `public/projects/`：项目图片、GIF、SVG 和视频。
- `src/components/ImageGallery.tsx` 与 `src/components/VideoPlayer.tsx`：项目媒体展示。
- `src/components/MotionProvider.tsx`、`ScrollReveal.tsx` 和 `CustomCursor.tsx`：全局动效、滚动揭示与指针交互。
- `src/app/analytics/`、`src/app/api/analytics/`、`src/lib/db.ts`：可选的访问分析与管理界面。

项目事实、研究样本和效果数据不得凭空补写。修改对外文案前，先对照 `docs/portfolio-content.md`，并将未验证陈述标记为“设计产出”、“概念原型”或“预期价值”。编辑备注、TODO 和采集问题只留在文档中，不直接渲染到线上页面。

## 开发命令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm ts-check
pnpm build
pnpm start
```

常用项目命令兼容 Windows、macOS 和 Linux，无需 Bash。`pnpm dev` 固定监听 `127.0.0.1:3001`；`pnpm start` 从 `.next/standalone/server.js` 启动本地生产预览，默认只绑定 `127.0.0.1:3001`，也可通过 `PORTFOLIO_BIND_HOST` 和 `PORTFOLIO_PORT` 覆盖。部署环境应直接运行 release 根目录的 `server.js`，并由服务管理器显式配置 `HOSTNAME` 和 `PORT`。

构建前至少运行 `pnpm lint` 和 `pnpm ts-check`。`pnpm build` 使用 Webpack 并执行 `scripts/prepare-standalone.mjs`，把 `public` 和 `.next/static` 补入 standalone 目录；这也能避免 Turbopack 在 Windows 非 ASCII 路径下的已知问题。

## 环境变量

| 变量 | 用途 | 要求 |
| --- | --- | --- |
| `SQLITE_DB_PATH` | 分析数据库路径 | 生产环境必须指向发布目录之外的持久化路径 |
| `ANALYTICS_ADMIN_PASSWORD` | 分析后台管理员密码 | 生产环境必填，至少 16 个字符，不得出现在客户端代码中 |
| `ANALYTICS_SESSION_SECRET` | 分析会话签名密钥 | 生产环境必填，至少 32 个随机字符 |
| `ANALYTICS_ADMIN_TOKEN` | 受信服务端调用管理 API 的 bearer token | 可选；仅服务器间调用，不得发送到浏览器 |
| `ANALYTICS_TRACKING_SECRET` | 公开埋点访客签名 | 多实例部署或需跨重启保留访问时必填，建议至少 32 个随机字符 |
| `ANALYTICS_TRUST_PROXY` | 是否信任反向代理传入的 IP 头 | 默认 `false`；只在受信代理会覆盖而非追加这些头时开启 |
| `ANALYTICS_IP_GEOLOCATION_ENABLED` | 是否调用外部 IP 地理位置服务 | 默认 `false`；需要独立评估隐私和第三方传输 |
| `ANALYTICS_SUMMARY_EMAIL_ENABLED` | 访问摘要邮件开关 | 默认 `false` |
| `ANALYTICS_SUMMARY_EMAIL_TO` | 摘要收件地址 | 仅邮件功能开启时需要 |
| `ANALYTICS_PUBLIC_BASE_URL` | 邮件中用到的公开站点地址 | 生产环境使用 HTTPS 正式域名 |
| `ANALYTICS_EMAIL_MIN_DURATION_MS` | 允许发送访问摘要的最短停留时间 | 默认 `10000`（毫秒） |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | SMTP 连接 | 仅邮件功能开启时需要 |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP 认证与发件人 | 仅服务端使用，不得使用 `NEXT_PUBLIC_` 前缀 |

以 `.env.example` 为模板创建 `.env.local`。不要把任何真实凭据、真实邮箱或生产数据库路径写回模板。

## SQLite 与分析安全

- Schema 位于 `src/lib/db/schema.sql`，应用首次访问数据库时自动建表。
- SQLite 文件、`-wal` 和 `-shm` 文件都是运行时私有数据，必须忽略并排除在部署制品之外。
- 早期 Git 历史曾包含 `data/analytics.db`。修复当前工作树不会自动修改历史；发布前必须轮换历史中出现过的 SMTP 凭据，并按 `SECURITY.md` 完成历史清理。
- 分析数据可包含 IP、User-Agent 和 Referrer。新增事件前先做数据最小化判断，并设定保留与删除策略。
- 首页只在 URL 带有非空 `?ref=<slug>` 时启动追踪；切换 `ref` 必须创建新 visit，不得跨分享链接复用 visit ID 或 token。
- 不要使用纯前端变量、本地存储或硬编码密码作为分析后台认证。

## 构建与部署约束

- `next.config.ts` 使用 `output: 'standalone'`；部署包必须同时包含 standalone 服务器、`.next/static` 和 `public`。
- SQLite 位置不得位于会被 `rsync --delete` 或新发布版本覆盖的目录。
- Nginx 只负责 HTTPS、反向代理和静态资源缓存；不要把当前应用当作静态导出站点。
- `deploy.sh` 使用 SSH key/agent 认证，组装 standalone、`.next/static` 和 `public`，并保护远端 `data/` / `.env*`。重启命令与健康检查通过环境变量显式提供；脚本不修改 Nginx，配置需按 `docs/deployment.md` 人工校验、安装与重载。
- 生产流程、systemd 示例、Nginx 反向代理和验收项见 `docs/deployment.md`。

## 开发约束

1. 只使用 pnpm，不使用 npm 或 yarn。
2. 基础 UI 优先复用 `src/components/ui/` 中的 shadcn/ui 组件。
3. 浏览器 API 只能在 Client Component 的 effect 或事件处理器中使用。不要在 JSX 渲染路径中直接使用 `typeof window`、`Date.now()` 或 `Math.random()`。
4. 保留无障碍缩放、键盘导航和 `prefers-reduced-motion` 行为。
5. 优化媒体时保留有源文件或可恢复备份；不要在未核对画质的情况下直接覆盖唯一原图。
