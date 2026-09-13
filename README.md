# Huiteen Portfolio

郑惠文（Huiteen）的交互与服务设计作品集。网站以单页编辑式叙事展示系统设计、数字产品、数据可视化和跨媒介项目，并包含一套可选的私有访问分析后台。

线上站点：[https://huiteen.com](https://huiteen.com)

新协作者从其他电脑参与开发、提交代码和发布生产版本时，请先阅读
[`docs/collaborator-guide.md`](docs/collaborator-guide.md)。手册包含独立 SSH
密钥、Pull Request、受限服务器权限、发布验收与回滚要求。

## 技术栈

- Next.js 16（App Router）、React 19、TypeScript 5
- Tailwind CSS 4、shadcn/ui（Radix UI）
- Framer Motion
- Next.js Route Handlers、SQLite（`better-sqlite3`）
- pnpm 9+

## 本地启动

需要 Node.js 20.19 或更高版本、pnpm 9 或更高版本。项目只允许使用 pnpm。

```bash
git clone https://github.com/huiteen8-pixel/HuiteenPortfolio.git
cd HuiteenPortfolio
cp .env.example .env.local
pnpm install
pnpm dev
```

默认开发地址为 `http://127.0.0.1:3001`。本地开发和检查可在 Windows、macOS 或 Linux 上运行；生产 release 含 `better-sqlite3` 原生模块，不能跨操作系统、CPU 架构、libc 或 Node ABI 复制，必须在与 Linux 目标匹配的 CI/container/WSL 环境构建。

如果只预览作品集，`.env.example` 中的邮件通知可保持关闭。需要使用 `/analytics` 时，必须先配置管理员密码；生产环境要求至少 16 个字符。完整变量说明见 [`.env.example`](.env.example)。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 在 3001 端口启动开发服务器 |
| `pnpm build` | 使用 Webpack 构建 Next.js standalone 产物 |
| `pnpm start` | 在 `127.0.0.1:3001` 启动 standalone 生产预览（可用 `PORTFOLIO_BIND_HOST` / `PORTFOLIO_PORT` 覆盖） |
| `pnpm lint` | 运行 ESLint |
| `pnpm ts-check` | 运行 TypeScript 类型检查 |

构建命令显式使用 Webpack，避免 Next.js Turbopack 在 Windows 非 ASCII 工作路径下的已知崩溃。本地生产预览通过项目专用的 `PORTFOLIO_BIND_HOST` / `PORTFOLIO_PORT` 控制监听地址。当前正式环境在 Docker 镜像内构建和运行 standalone server，并由独立 Caddy 容器反向代理。

## 项目结构

```text
public/
├── profile/                  # 个人形象与站点图标
└── projects/                 # 作品图片、GIF 和视频
src/
├── app/
│   ├── page.tsx              # 作品集首页与项目数据
│   ├── analytics/            # 受保护的分析后台
│   └── api/analytics/        # 访问与事件分析 API
├── components/               # 作品展示组件与 shadcn/ui
├── hooks/                    # 响应式与可选埋点 hooks
└── lib/                      # SQLite、邮件与通用工具
scripts/                       # 构建、开发和启动脚本
docs/                          # 部署与作品内容维护文档
```

## 分析数据

分析功能使用 SQLite，本地开发数据库默认位于 `data/analytics.db`。该文件是运行时私有数据，不得提交到 Git、打包到公开制品或放在 Web 目录中。生产部署必须通过 `SQLITE_DB_PATH` 指向发布目录之外的绝对持久化路径；相对路径和 release 内路径会被拒绝。

首页只会在 URL 带有非空 `?ref=<分享链接 slug>` 时启动访问与停留追踪；普通直接访问不建立分析记录。同一浏览会话切换到不同 `ref` 时会创建新 visit，不复用前一条分享链接的凭据。

原始访问记录默认保留 90 天，并按每条分享链接最多 10,000 次访问滚动清理，可用 `ANALYTICS_RETENTION_DAYS` 缩短保留期。公开埋点用于趋势判断，不是审计日志：持有有效分享链接和临时 visit token 的访问者仍可能制造噪声，统计结果应按近似值解读。

本仓库的早期历史曾包含分析数据库。删除当前文件不代表历史已清除：相关 SMTP 凭据必须轮换，并在发布前完成 Git 历史清理。详见 [`SECURITY.md`](SECURITY.md)。

## 作品内容维护

作品集当前收录 9 组内容。对外发布前，所有项目必须区分“已验证结果”、“设计产出”与“预期价值”，不得补写无来源的研究样本、测试数据或合作关系。项目缺口和采集模板见 [`docs/portfolio-content.md`](docs/portfolio-content.md)。

## 构建与部署

这是需要 Node.js 运行时的 Next.js 应用，不是纯静态站点。当前 `huiteen.com` 使用 `compose.portfolio.yml` 运行独立应用容器，Caddy 通过 `huiteen-portfolio-edge` 网络反向代理，SQLite 保存在独立持久化卷中。协作者只能按照 [`docs/collaborator-guide.md`](docs/collaborator-guide.md) 的受限流程发布。

[`docs/deployment.md`](docs/deployment.md) 同时保留当前 Docker/Caddy 架构和一套可选的 standalone/systemd 架构。根目录 `deploy.sh` 只服务于后者，**不适用于当前生产服务器，也不得把当前生产检出目录作为它的目标目录**。

## 安全与隐私

- 不要提交 `.env*`、SQLite 文件、SMTP 密码、会话密钥或真实访问记录。
- `/analytics` 与管理类 API 只能通过 HTTPS 访问，并必须启用服务端认证。
- 收集 IP、User-Agent 和 Referrer 前，需确认部署地区的隐私告知、数据最小化和保留期要求。
- 发现漏洞或凭据暴露时，不要在公开 Issue 中粘贴秘密或访问数据；按 [`SECURITY.md`](SECURITY.md) 处理。
