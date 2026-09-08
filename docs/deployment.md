# 构建与部署

本项目是带 Route Handlers 和 SQLite 的 Next.js Node 应用，不是纯静态导出。推荐架构是：

```text
Browser ── HTTPS ──> Nginx ── HTTP/localhost ──> Next.js standalone
                                                       └──> SQLite persistent volume
```

## 与现有 Caddy 服务同机部署

仓库根目录的 `Dockerfile` 与 `compose.portfolio.yml` 用于把作品集作为独立
Compose 项目运行。该方式适合目标服务器已经由另一套 Caddy 占用公网
`80/443` 的场景：作品集只发布到服务器回环地址，正式流量再通过一个专用
edge 网络从现有 Caddy 转发，不加入其他应用的内部网络。

```text
公网 80/443 -> 共享入口 Caddy -> huiteen-portfolio-edge
                                      └-> huiteen-portfolio:3000
                                           └-> 独立 SQLite volume
```

首次启动前，以 root 运行一次环境初始化脚本。它只在配置不存在时生成随机
后台密码及会话密钥，不会在终端打印秘密：

```bash
sudo bash deploy/bootstrap-portfolio-host.sh
sudo env HUITEEN_IMAGE_TAG=<release-id> docker compose \
  -f compose.portfolio.yml build
sudo env HUITEEN_IMAGE_TAG=<release-id> docker compose \
  -f compose.portfolio.yml up -d --no-build
```

候选服务默认只监听 `127.0.0.1:5101`。可先通过 SSH 转发验收，不需要开放
新的防火墙端口：

```bash
ssh -N -L 5101:127.0.0.1:5101 deploy@server.example.com
```

正式上线前，将现有 Caddy 与作品集容器同时连接到
`huiteen-portfolio-edge`，再审阅 `deploy/caddy/huiteen.com.caddy`。
必须先运行 `caddy validate`，通过后才能 hot reload。不要启动第二个绑定
`80/443` 的反向代理，也不要执行其他项目的 `docker compose down`。

作品集的数据卷、环境文件、容器和镜像都必须使用自己的命名空间。共享
Caddy 的第二网络还需写入入口服务的声明式配置；单独执行
`docker network connect` 只能作为首发验证，入口容器重建后不会自动恢复。

## 部署脚本

根目录的 `deploy.sh` 会先执行 lint、类型检查和生产构建，然后组装 standalone 服务器、`.next/static` 和 `public`。它使用现有 SSH key/agent 认证，不接收或保存 SSH 密码。每次部署会创建唯一的 `releases/<release-id>`，在本地和上传后两次检查 `.env*` 与 SQLite 产物，然后用软链接原子切换 `current`；它不会覆盖已上线的 release 或持久化数据。

推荐配置（包含服务重启和健康检查）：

```bash
DEPLOY_SERVER=deploy@server.example.com \
DEPLOY_ALLOWED_BASE=/srv \
DEPLOY_TARGET_DIR=/srv/huiteen-portfolio \
DEPLOY_RESTART_COMMAND='sudo systemctl restart huiteen-portfolio' \
DEPLOY_HEALTHCHECK_URL=https://huiteen.com \
./deploy.sh
```

`DEPLOY_TARGET_DIR` 是包含 `releases/`、`current` 和 `previous` 的部署根目录，不能填写 `.../current`。它必须是规范绝对路径、位于 `DEPLOY_ALLOWED_BASE` 下（默认 `/srv`），且不能包含 `.`、`..`、空路径段或符号链接解析跳转。`DEPLOY_RESTART_COMMAND` 本身可选：未配置时仍会切换 `current`，但不会重启进程。只要设置了 `DEPLOY_HEALTHCHECK_URL`，重启命令就变为必填；脚本会在修改远端前拒绝缺少重启命令的组合，避免把旧进程的响应误报为新版本健康。

健康检查或重启失败时，脚本会将 `current` 原子切回本次部署前的 release，并再次执行同一重启命令。首次部署没有 previous，因而无法自动回滚；请先确认服务配置正确，或在首发时手工验收。脚本会尝试清理失败且未被 `current` 引用的 release；首次部署失败时，它不会删除仍被 `current` 指向的唯一 release。

`DEPLOY_RELEASE_ID` 可用于 CI 显式指定 release 名称，只允许字母、数字、点、下划线和连字符；默认值由 UTC 时间、Git commit、进程号和随机数组成。脚本通过远端 `.deploy-lock` 阻止并行部署，正常退出时会清理锁；若构建机被强制断电，应确认没有其他部署运行后再手工移除陈旧锁。

`deploy.sh` 不会修改 Nginx。Nginx 配置位于原子应用 release 之外，若直接覆盖失败无法随应用自动回滚，因此必须先人工审阅 `deploy/nginx/huiteen-portfolio.conf.example`、核对正式域名、证书路径与上游端口，把它安装为临时配置后执行 `nginx -t`，验证通过才原子替换正式文件并 reload。旧的 `DEPLOY_NGINX_CONF`、`DEPLOY_NGINX_TEMPLATE`、`DEPLOY_NGINX_ALLOWED_BASE` 参数会被脚本明确拒绝，避免操作者误以为配置已经安全发布。

### 从 Linux 构建机运行

脚本需要 Bash、Node.js、pnpm、OpenSSH、rsync，以及配置健康检查时的 curl。由于 `better-sqlite3` 含原生二进制，发布产物必须在 Linux 上构建，并与目标服务器使用相同的 CPU 架构、libc 家族和 Node 模块 ABI。脚本会在安装依赖和构建前通过 SSH 比对这些条件；不匹配时会停止，不会尝试在远端无锁重建。

libc 家族相同仍不保证任意发行版版本都具备向后兼容性。最稳妥的方式是在与生产机相同的基础镜像/发行版版本和 Node 版本中构建，例如固定的 Linux CI runner 或构建容器。不要在 macOS 或 Windows 原生 Node.js 中构建后上传 Linux release。

### 从 Windows 运行

建议在与目标服务器架构、libc 和 Node 版本一致的 WSL 或 Linux 容器中运行，不要从 PowerShell 的 Windows Node.js 直接构建。先在 WSL 安装 Linux 版 Node.js、pnpm、OpenSSH、rsync 和 curl，并清理任何由 Windows Node.js 生成的 `node_modules`，然后从 PowerShell 调用：

```powershell
wsl -- bash -lc 'cd "/mnt/c/path/to/HuiteenPortfolio" && DEPLOY_SERVER=deploy@server.example.com DEPLOY_TARGET_DIR=/srv/huiteen-portfolio DEPLOY_RESTART_COMMAND="sudo systemctl restart huiteen-portfolio" DEPLOY_HEALTHCHECK_URL=https://huiteen.com ./deploy.sh'
```

将 `/mnt/c/path/to/HuiteenPortfolio` 替换为仓库的 WSL 路径。WSL 通常是 x86_64/glibc，若生产机是 arm64 或 musl（例如 Alpine），应改用匹配目标的 CI/container。若 SSH key 位于 Windows 而未导入 WSL，需要先在 WSL 内配置 key/agent；脚本不会提示输入或保存密码。

## 前置条件

- Linux 服务器，以及与其 CPU 架构和 libc 基线兼容的 Linux 构建环境
- 构建机与服务器使用相同 Node 模块 ABI 的 Node.js 20.19 或更高版本
- pnpm 9 或更高版本（仅构建机需要）
- Nginx 和有效的 HTTPS 证书
- 一个非 root 的应用账户
- 一个不会随发布删除的 SQLite 持久化目录

以下路径只是示例，请根据服务器修改：

```text
/srv/huiteen-portfolio/releases/<release-id>/    # 不可变的发布产物
/srv/huiteen-portfolio/current -> releases/...   # 当前版本软链接
/srv/huiteen-portfolio/previous -> releases/...  # 最近一次切换前的版本
/var/lib/huiteen-portfolio/analytics.db          # 持久化数据
/etc/huiteen-portfolio.env                       # 仅运行账户可读的秘密
```

## 构建

在干净的构建环境中：

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm ts-check
pnpm build
```

`next.config.ts` 使用 `output: 'standalone'`。一个完整的发布目录必须包含：

```text
release/
├── server.js                    # 来自 .next/standalone
├── node_modules/                # standalone 自动追踪的运行依赖
├── .next/
│   ├── server/                  # 来自 .next/standalone/.next
│   └── static/                  # 需要另外从 .next/static 复制
└── public/                     # 需要另外从 public 复制
```

可在一个新的空发布目录中组装产物：

```bash
cp -a .next/standalone/. /path/to/release/
mkdir -p /path/to/release/.next/static
cp -a .next/static/. /path/to/release/.next/static/
mkdir -p /path/to/release/public
cp -a public/. /path/to/release/public/
```

组装前必须确认构建产物没有夹带运行数据：

```bash
test ! -e .next/standalone/data
```

`next.config.ts` 会从 output tracing 中排除 `data/`、`.env*`、`.codex/` 和日志；`pnpm build` 还会把 `public` 与 `.next/static` 补入 standalone 目录。部署脚本也会在本地组装后、远端上传后分别检查根级 `data/`、任何 `.env*` 文件，以及 `.db`、`.sqlite`、WAL/SHM/journal 等 SQLite 产物。不要绕过这些检查，也不要将仓库中的 Git 元数据、测试输出或日志复制到发布目录。

## 生产环境变量

可以从 `.env.example` 创建部署平台的秘密配置。生产服务的最小配置示例：

```dotenv
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=5000
SQLITE_DB_PATH=/var/lib/huiteen-portfolio/analytics.db
ANALYTICS_ADMIN_PASSWORD=<unique-secret-at-least-16-characters>
ANALYTICS_SESSION_SECRET=<random-secret-at-least-32-characters>
ANALYTICS_TRACKING_SECRET=<random-secret-at-least-32-characters>
ANALYTICS_TRUST_PROXY=true
ANALYTICS_IP_GEOLOCATION_ENABLED=false
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_SUMMARY_EMAIL_ENABLED=false
ANALYTICS_PUBLIC_BASE_URL=https://huiteen.com
ANALYTICS_EMAIL_MIN_DURATION_MS=10000
```

`<...>` 是占位符，不能原样用于生产。秘密文件建议权限为 `0600`，且不应位于项目目录或 Nginx Web 根目录。生产环境缺少 `SQLITE_DB_PATH`、使用相对路径或指向当前 release 时，应用都会拒绝打开分析数据库，避免切版时把访客数据一并替换。原始访问默认保留 90 天，并按每条分享链接最多 10,000 条滚动清理；`ANALYTICS_RETENTION_DAYS` 可设为 1–3650 天，公开埋点只适合观察近似趋势，不应当作审计记录。

将 `ANALYTICS_TRUST_PROXY` 设为 `true` 的前提是 Nginx 是唯一可直达 Node.js 的入口，并且会覆盖客户伪造的 `X-Real-IP`。示例配置会同时覆盖 `X-Forwarded-For` 并清空客户端传入的 `CF-Connecting-IP`。如果无法保证，保持 `false`。若前面还有 Cloudflare 等 CDN，应先用 Nginx `real_ip` 模块只信任该 CDN 的官方地址段，再让 `$remote_addr` 参与上述转发；不要直接信任浏览器传来的转发头。

`ANALYTICS_ADMIN_TOKEN` 是可选的服务器间 bearer token。浏览器登录不需要它，也不应将它注入客户端环境或前端请求代码。`ANALYTICS_TRACKING_SECRET` 用于保持公开埋点签名在多实例和进程重启之间稳定，生产环境建议显式设置。

如果启用邮件摘要，再配置 `ANALYTICS_SUMMARY_EMAIL_TO`、`SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASS` 和 `SMTP_FROM`。新的 SMTP 密码必须与仓库历史中曾出现的凭据不同。

## SQLite 持久化与备份

1. 在发布目录之外创建数据目录。
2. 将目录所有者设置为运行 Next.js 的非 root 账户。
3. 仅对该账户授予读写权限。
4. 将 `SQLITE_DB_PATH` 设置为绝对路径。
5. 备份时使用 SQLite 的一致性备份方式，不要在服务写入期间只复制主 `.db` 文件。

例如，先创建目录并授权：

```bash
sudo install -d -o huiteen -g huiteen -m 0700 /var/lib/huiteen-portfolio
```

首次访问数据库时，应用会根据 `src/lib/db/schema.sql` 自动建表。

## systemd 示例

```ini
[Unit]
Description=Huiteen Portfolio
After=network.target

[Service]
Type=simple
User=huiteen
Group=huiteen
WorkingDirectory=/srv/huiteen-portfolio/current
EnvironmentFile=/etc/huiteen-portfolio.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

调整 Node.js 实际路径后，使用 `systemctl daemon-reload`、`systemctl enable` 和 `systemctl restart` 管理服务。重启前先检查新版本目录、环境文件与数据库权限。

## Nginx 反向代理示例

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 444;
}

server {
    listen 80;
    server_name huiteen.com www.huiteen.com;
    return 301 https://huiteen.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.huiteen.com;

    ssl_certificate /etc/letsencrypt/live/huiteen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/huiteen.com/privkey.pem;

    return 301 https://huiteen.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name huiteen.com;

    # 防止未知 Host 落入此虚拟主机。
    if ($host != huiteen.com) { return 444; }

    ssl_certificate /etc/letsencrypt/live/huiteen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/huiteen.com/privkey.pem;

    # 只在域名及所有需要覆盖的子域名均已稳定使用 HTTPS 后启用。
    add_header Strict-Transport-Security "max-age=31536000" always;

    # 覆盖而不是追加浏览器可能伪造的转发头。
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port 443;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header CF-Connecting-IP "";
    proxy_set_header Forwarded "";

    # 应用内分析 JSON 上限为 16 KiB；在反代层提前拒绝大请求。
    client_max_body_size 32k;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        # 本 location 自己声明了 add_header，因此需显式保留 server 级 HSTS。
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
    }
}
```

替换域名和证书路径后，执行 `nginx -t` 检查语法再重载。HSTS 会让浏览器在有效期内强制使用 HTTPS，只应在全站 HTTPS 已稳定可用后启用；示例不默认添加 `includeSubDomains` 或 `preload`，避免误伤尚未启用 HTTPS 的子域名。不要为 `/analytics` 或 `/api/analytics/` 配置公开缓存。

## 发布验收

每次发布后至少检查：

- 首页、项目图片和 ICU 视频能够加载。
- `/_next/static/` 中的 JS/CSS 返回 200，且带有长期缓存头。
- `/analytics` 未登录时不能读取真实访问数据。
- 管理类 API 在缺少有效会话时返回 401。
- SQLite 写入位于持久化目录，而不是当前 release 目录。
- 轮换 `current` 软链接并重启后，原有数据仍然存在。
- HTTPS 自动跳转正常，管理会话 Cookie 不通过明文 HTTP 传输。
- 应用日志不包含密码、SMTP 认证或原始访问记录。

## 回滚

脚本会在每次切换前将旧的 `current` 记录为 `previous`。若重启命令或健康检查失败，它会自动执行相当于以下操作的原子回滚并再次重启服务：

```bash
cd /srv/huiteen-portfolio
ln -s "$(readlink previous)" .current-manual
mv -Tf .current-manual current
sudo systemctl restart huiteen-portfolio
```

手工操作前必须先确认 `previous` 指向 `releases/` 下存在且可信的目录。不要覆盖或回滚持久化 SQLite 数据。如果新版本包含 Schema 变更，必须事先设计可回滚迁移和数据备份；应用二进制回滚不能自动撤销数据库迁移。
