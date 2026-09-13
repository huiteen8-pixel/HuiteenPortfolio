# Huiteen Portfolio 协作开发与生产发布手册

本文档交给参与维护 Huiteen 作品集的伙伴使用，覆盖新电脑初始化、代码修改、GitHub 协作、生产发布、验证和回滚。

> 当前生产环境使用 **Docker Compose + 独立 Caddy**。根目录的 `deploy.sh` 属于另一套 standalone/systemd 发布方案，**不要在当前生产服务器上使用它**。

> **当前授权状态：** `main` Ruleset 尚未启用，下面规划的伙伴专属账号及三个受限发布命令也尚未安装。伙伴可以先准备自己的 GitHub 账号和本机工具；Owner 必须先完成第 3.1 节再按第 3.2 节授予仓库权限，并完成第 3.3 节后才能授予生产发布权限。

## 1. 项目信息

| 项目 | 当前值 |
| --- | --- |
| GitHub 仓库 | [HuiteenPortfolio](https://github.com/huiteen8-pixel/HuiteenPortfolio) |
| 正式网站 | [https://huiteen.com](https://huiteen.com) |
| `www` 地址 | `https://www.huiteen.com`，自动跳转到主域名 |
| 生产架构 | Docker Compose 应用 + 独立 Caddy HTTPS 入口 |
| 生产连接资料 | 主机、用户名与主机指纹由 Owner 私下提供 |
| 默认分支 | `main` |
| 本地开发地址 | `http://127.0.0.1:3001` |

生产地址和服务器 ED25519 主机指纹不要写进公开仓库。Owner 应通过与 SSH 不同的可信渠道私下发送；首次连接时只有看到完全一致的指纹才可以接受，不一致时立即停止。

## 2. 先理解权限边界

伙伴需要两种彼此独立的权限：

1. **GitHub 协作权限**：在自己的电脑上拉取、提交分支并创建 Pull Request。
2. **生产发布权限**：连接服务器，发布已经合并到 `origin/main` 的精确 commit。

必须遵守以下原则：

- 每个人、每台电脑使用自己的密钥；GitHub 和生产服务器分别使用不同密钥。
- 只交换 `.pub` 公钥，任何人都不得发送或复制私钥。
- 不共享 GitHub 账号、Personal Access Token、现有服务器私钥或生产后台密码。
- 普通协作者不应加入服务器的 `sudo` 组或 `docker` 组。Docker 权限等同于主机 root 权限。
- 不要向伙伴开放现有管理员账号，也不要复制任何现有管理员私钥。
- 推荐由所有者创建伙伴专属 Linux 账号，并只允许调用 root 所有、伙伴不可修改的发布脚本。
- 能发布任意应用代码的人，理论上仍可能让应用读取生产环境变量和分析数据库，因此生产发布必须以 Owner 审核过的 `main` 为边界。

## 3. 项目所有者的一次性准备

本节由仓库和服务器所有者完成，伙伴不要自行操作。

### 3.1 先保护 `main`

先把仓库内的 `.github/CODEOWNERS` 合并到 `main`，再在仓库 **Settings → Rules → Rulesets** 为 `main` 创建启用状态的规则：

- 必须通过 Pull Request 才能合并；
- 仓库包含 `.github/CODEOWNERS`，要求项目 Owner 审核全部改动；
- 开启 **Require review from Code Owners**；
- 新 commit 推送后撤销旧批准（Dismiss stale approvals）；
- 禁止 force push；
- 禁止删除 `main`；
- 不给伙伴配置 bypass；
- 配置 CI 后，要求 `lint`、`ts-check` 和 `build` 检查通过；
- `Dockerfile`、`compose.portfolio.yml`、`deploy/**`、认证和数据库代码必须由 Owner 特别复核。

通过测试分支创建一次 Pull Request，确认没有 Owner 的 Code Owner 批准时无法合并。保护规则确认生效后，才能发送协作者邀请。

GitHub 官方说明：[创建仓库 Ruleset](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)。
CODEOWNERS 官方说明：[About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)。

### 3.2 再邀请 GitHub 协作者

1. 让伙伴提供自己的 GitHub 用户名。
2. 确认第 3.1 节的 Ruleset 已经启用并通过测试。
3. 打开仓库的 **Settings → Collaborators → Add people**。
4. 邀请伙伴自己的账号，并等待对方接受邀请。
5. 双方启用 GitHub 2FA，并把恢复代码分别保存在自己的密码管理器中。
6. 不要共享仓库所有者账号、访问令牌或 2FA 恢复代码。

GitHub 官方说明：[邀请个人仓库协作者](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository)。
2FA 恢复材料应单独保存，参考：[配置 2FA 恢复方式](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication-recovery-methods)。

### 3.3 开通服务器权限

伙伴先生成第 5.2 节中的生产 SSH 公钥，并且只把 `.pub` 内容发给所有者。推荐配置为：

- 一人一个 Linux 账号，例如 `huiteen-deploy-alice`，用户名只使用小写英文字母、数字和连字符；
- 账号不加入 `sudo` 或 `docker` 组；
- 只把该伙伴的公钥加入其自己的 `authorized_keys`；
- 在服务端禁用密码、agent forwarding、X11 forwarding、端口转发和 PTY；最好使用 `restrict` 与 root 管理的 forced-command dispatcher，而不只依赖伙伴电脑上的 SSH 配置；
- 只允许调用以下由 root 管理的固定命令：

```text
sudo /usr/local/sbin/huiteen-portfolio-deploy <完整 commit SHA>
sudo /usr/local/sbin/huiteen-portfolio-status
sudo /usr/local/sbin/huiteen-portfolio-rollback
```

以上是 **Owner 待安装的安全接口，不是仓库当前已经可用的命令**。这些脚本及其生产 Compose 清单必须位于伙伴不可写的位置，并固定应用目录、镜像名、环境文件、回环监听、数据卷和网络。不能让受限脚本用 root 权限直接执行仓库内可被协作者修改的 Compose 文件，也不能继承调用者提供的 `COMPOSE_FILE`、`DOCKER_HOST`、环境文件或构建镜像变量。

如果这些受限命令尚未安装，先联系所有者完成服务器授权；不要临时复制现有管理员私钥来绕过。

Owner 完成后，通过私密渠道发送下面这张交接卡，不要把填写后的版本提交到 Git：

```text
生产 SSH Host：<Owner 填写>
伙伴专属用户名：<Owner 填写>
服务器 ED25519 主机指纹：<Owner 填写>
伙伴公钥指纹：<双方核对>
受限 status/deploy/rollback 命令：已安装并通过演练 / 未完成
授权日期与撤销联系人：<Owner 填写>
```

## 4. 伙伴电脑的准备工作

### 4.1 安装工具

需要：

- Git；
- Node.js `20.19.0` 或更高版本；
- pnpm。项目固定使用 `pnpm@11.19.0`，禁止使用 npm 或 yarn 管理依赖；
- Windows 内置 OpenSSH，或 macOS/Linux 的 OpenSSH。

启用项目所需 pnpm：

```powershell
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm --version
node --version
git --version
ssh -V
```

如果系统没有 Corepack，请使用 pnpm 官方安装方式安装同一版本，不要在项目中生成 npm/yarn 锁文件。

## 5. 创建两把独立 SSH 密钥

建议给密钥设置口令，并将恢复信息保存在伙伴自己的密码管理器中。

### 5.1 GitHub 密钥

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force "$HOME\.ssh" | Out-Null
ssh-keygen -t ed25519 -a 100 -C "你的名字-github-huiteen" -f "$HOME\.ssh\id_ed25519_huiteen_github"
Get-Content "$HOME\.ssh\id_ed25519_huiteen_github.pub" | Set-Clipboard
```

macOS/Linux：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -a 100 -C "你的名字-github-huiteen" -f ~/.ssh/id_ed25519_huiteen_github
cat ~/.ssh/id_ed25519_huiteen_github.pub
```

将公钥添加到伙伴自己的 GitHub 账号 **Settings → SSH and GPG keys**。不要上传没有 `.pub` 后缀的文件。

首次连接 GitHub 时核对其官方 ED25519 指纹：

```text
SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU
```

来源：[GitHub 的 SSH 主机指纹](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints)。

### 5.2 生产服务器密钥

以下示例中的 `name` 替换为伙伴自己的简短英文标识，并在所有位置保持一致。

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force "$HOME\.ssh" | Out-Null
ssh-keygen -t ed25519 -a 100 -C "name-huiteen-prod" -f "$HOME\.ssh\huiteen_prod_name"
Get-Content "$HOME\.ssh\huiteen_prod_name.pub"
```

macOS/Linux：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -a 100 -C "name-huiteen-prod" -f ~/.ssh/huiteen_prod_name
cat ~/.ssh/huiteen_prod_name.pub
```

只把这把密钥的单行 `.pub` 内容发送给项目所有者。私钥只保留在伙伴电脑上。

### 5.3 SSH 配置

编辑 `~/.ssh/config`，把 `PRODUCTION_HOST_FROM_OWNER`、服务器用户名和带有 `name` 的文件名全部替换为 Owner 私下提供或双方约定的实际值：

```sshconfig
Host github-huiteen
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_huiteen_github
    IdentitiesOnly yes

Host huiteen-prod
    HostName PRODUCTION_HOST_FROM_OWNER
    User huiteen-deploy-name
    IdentityFile ~/.ssh/huiteen_prod_name
    IdentitiesOnly yes
    ForwardAgent no
    ForwardX11 no
```

macOS/Linux 创建配置文件后再执行：

```bash
chmod 600 ~/.ssh/config
```

测试 GitHub：

```powershell
ssh -T git@github-huiteen
```

成功时 GitHub 会显示已认证、但不提供 shell access 的提示；该命令可能仍返回非零退出码，以认证成功文字为准。

Owner 确认受限账号和命令安装完成后，使用只读状态命令测试生产服务器：

```powershell
ssh huiteen-prod "sudo -n /usr/local/sbin/huiteen-portfolio-status"
```

首次连接生产服务器时，核对 Owner 私下提供的 ED25519 主机指纹。SSH 私钥口令提示是正常的；服务器账号密码或 `sudo` 密码提示是不正常的。出现指纹不一致或意外密码提示时，不要继续。

## 6. 第一次获取项目

```powershell
git clone git@github-huiteen:huiteen8-pixel/HuiteenPortfolio.git
Set-Location HuiteenPortfolio
git config user.name "你的姓名"
git config user.email "GitHub 设置中显示的 noreply 邮箱"
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

macOS/Linux 将 `Copy-Item .env.example .env.local` 改为：

```bash
cp .env.example .env.local
```

浏览器打开 `http://127.0.0.1:3001`。只预览作品集时可以保留邮件通知关闭；需要本地测试 `/analytics` 时，使用专门的本地测试密码，不要索取或复制生产密码。

常见内容位置：

- `src/app/page.tsx`：首页结构、项目资料和主要文案；
- `public/projects/`：项目图片、GIF 和视频；
- `docs/portfolio-content.md`：作品内容证据与表述边界；
- `.env.local`：仅本机环境配置，禁止提交。

## 7. 日常修改与 GitHub 提交流程

每个改动都从最新 `main` 建立新分支：

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/short-description
```

完成修改后先本地验证：

```powershell
pnpm lint
pnpm ts-check
pnpm build
```

然后只提交本次涉及的文件：

```powershell
git status
git diff
git diff --check
git add path/to/changed-file
git diff --cached
git commit -m "feat: 简要说明本次修改"
git push -u origin feat/short-description
```

在 GitHub 上创建 Pull Request，请 Owner 审核后再合并。不要：

- 直接 force push `main`；
- 使用 `git reset --hard` 清理不明改动；
- 提交 `.env.local`、数据库、日志、后台密码、SMTP 密码或私钥；
- 提交 npm/yarn 生成的锁文件；
- 为了让测试通过而跳过 lint、类型检查或生产构建。

## 8. 发布到生产服务器

只有满足以下条件才能发布：

- Pull Request 已经由 Owner 审核并合并；
- 本地 `pnpm lint`、`pnpm ts-check`、`pnpm build` 全部通过；
- 准备发布的 commit 必须等于当时 `origin/main` 的最新 tip；
- 没有其他人同时发布；
- 不包含未经单独评审的数据库、认证、Docker、Caddy 或 DNS 变更。

### 8.1 取得要发布的完整 SHA

在伙伴电脑中执行：

```powershell
git switch main
git pull --ff-only origin main
git rev-parse HEAD
```

复制输出的 40 位 commit SHA，例如：

```text
0123456789abcdef0123456789abcdef01234567
```

### 8.2 用受限命令发布

> Owner 明确确认三个受限命令已经安装并通过回滚演练后，本节才能执行。当前未开通时不要尝试其他登录方式。

```powershell
ssh huiteen-prod "sudo -n /usr/local/sbin/huiteen-portfolio-status"
ssh huiteen-prod "sudo -n /usr/local/sbin/huiteen-portfolio-deploy 0123456789abcdef0123456789abcdef01234567"
ssh huiteen-prod "sudo -n /usr/local/sbin/huiteen-portfolio-status"
```

发布脚本应自动完成以下工作，伙伴不要绕过：

1. 加部署锁，防止两个人同时发布；
2. 从 GitHub 获取目标 commit，并确认它等于当前 `origin/main` tip；
3. 确认服务器工作树没有未知改动；
4. 使用 SQLite `.backup` 创建一致性备份并执行 `PRAGMA integrity_check`；
5. 记录当前 commit 和旧镜像标签；
6. 使用包含 commit SHA 的不可变标签构建新镜像；
7. 使用固定、root 管理的生产 Compose 清单执行 `up -d --no-build`，不执行 `down`；
8. 等待应用健康检查通过；
9. 验证内网 `127.0.0.1:5101` 与正式 HTTPS；
10. 失败时恢复上一镜像，且不自动覆盖数据库。

### 8.3 浏览器验收

发布命令成功后，至少检查：

- [https://huiteen.com](https://huiteen.com) 能打开首页；
- `https://www.huiteen.com` 跳转到主域名；
- 首页导航、项目图片、视频和全屏查看正常；
- 手机宽度下没有横向溢出或无法关闭的弹层；
- `/analytics` 未登录时仍要求认证；
- `https://huiteen.com/api/analytics/stats` 未登录请求返回 `401`；
- `/analytics` 和 `/api/analytics/*` 不被公开缓存；
- 浏览器控制台没有新增错误。

## 9. 回滚

如果新版本出现 502、容器不健康、首页核心内容缺失或持续前端错误，停止继续尝试并执行：

```powershell
ssh huiteen-prod "sudo -n /usr/local/sbin/huiteen-portfolio-rollback"
ssh huiteen-prod "sudo -n /usr/local/sbin/huiteen-portfolio-status"
```

回滚后重新检查正式网站并告知 Owner。代码回滚默认只恢复上一应用镜像，**不会自动恢复数据库**。

如果新版本包含不兼容的数据库结构变化，不要自行覆盖数据库。数据库恢复会丢失备份之后产生的新数据，必须由 Owner 明确决定恢复时间点。

## 10. 普通发布绝对不能做的事

```text
不得读取、复制或修改由 root 管理的生产环境文件
不得修改生产 HTTPS 入口、Caddy、UFW、防火墙或 DNS
不得把 5101 改为 0.0.0.0 或添加公网放行规则
不得运行仓库根目录 deploy.sh 发布当前生产环境
不得运行 docker compose down
不得运行 docker compose down -v
不得运行 docker volume rm
不得运行 docker system prune --volumes
不得操作其他项目、容器、网络或数据卷
不得把生产日志、访问数据或环境变量粘贴到公开 Issue、聊天或截图中
```

生产密钥位于 root-only 文件中。伙伴正常修改、构建和发布作品集都不需要知道这些值。

## 11. 常见故障

### GitHub 无法推送

- 确认已经接受仓库协作者邀请；
- 执行 `ssh -T git@github-huiteen`；
- 执行 `git remote -v`，确认远程地址指向正确仓库；
- 不要通过共享 Token 解决权限问题。

### 服务器提示 `Permission denied (publickey)`

- 确认 SSH 配置中的用户名和私钥文件名正确；
- 确认发给所有者的是 `.pub` 文件；
- 请所有者检查该公钥是否加入伙伴自己的服务器账号；
- 不要改用密码登录，也不要索取现有管理员私钥。

### 构建失败

- 新容器尚未替换旧容器，正式网站通常不会受影响；
- 保留错误摘要，回到本地分支修复并重新走 Pull Request；
- 不要临时修改生产环境变量或 Compose 安全限制。

### 发布后出现 502 或容器不健康

- 立即使用受限回滚命令；
- 不要反复重启 Caddy；
- 不要删除数据卷；
- 把 commit SHA、发生时间和状态命令摘要私下发给 Owner。

### 磁盘空间不足

- 只运行状态命令查看情况；
- 不要自行执行 Docker prune；
- 由 Owner 确认要保留的最近镜像和数据库备份后再清理。

## 12. 设备丢失或协作结束

立即通知 Owner，并完成：

1. 移除该 GitHub 协作者权限；
2. 删除伙伴的服务器公钥并禁用其专属账号；
3. 撤销该设备上的 GitHub Token、SSH 会话和相关凭据；
4. 检查 GitHub 与服务器认证日志；
5. 如果可能接触过生产密钥或分析数据，由 Owner 轮换所有相关秘密并使旧会话失效。

## 13. 每次发布的简短清单

```text
[ ] 从最新 main 建立分支
[ ] 修改内容已自行预览
[ ] pnpm lint 通过
[ ] pnpm ts-check 通过
[ ] pnpm build 通过
[ ] PR 已由 Owner 审核并合并
[ ] 记录要发布的完整 commit SHA
[ ] 确认当前无人发布
[ ] 执行受限 deploy 命令
[ ] status 显示容器 healthy
[ ] 正式首页、www 跳转、移动端和 analytics 已验收
[ ] 把已发布 SHA 和时间告知 Owner
```
