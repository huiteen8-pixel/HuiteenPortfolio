# Security Policy

## 适用范围

本仓库包含公开作品集、私有分析后台、SQLite 访问数据和可选 SMTP 邮件通知。其中管理界面、管理类 API、数据库和凭据都必须视为私有资源。

## 当前必做的凭据处置

仓库早期历史曾提交 `data/analytics.db`，其中包含访问记录和 SMTP 配置；旧代码还出现过硬编码分析后台口令。即使当前分支已删除数据库和旧口令，Git 历史中的内容仍可被恢复。数据库中把 `smtp_pass` 更新为 `NULL` 也不能保证旧页、WAL、备份或 Git 对象中的原始字节不可恢复。

在下一次公开发布或部署前，仓库所有者必须：

1. 立即在邮件服务商侧撤销/轮换历史中出现过的 SMTP 密码或应用专用密码。
2. 使用全新的 `ANALYTICS_ADMIN_PASSWORD`，不得复用旧 `CORRECT_PASSWORD`、`x-analytics-admin-password` 或其他历史值。
3. 如果旧口令曾被复用为 bearer、会话或埋点签名密钥，同时轮换 `ANALYTICS_ADMIN_TOKEN`、`ANALYTICS_SESSION_SECRET` 和 `ANALYTICS_TRACKING_SECRET`；新值必须彼此独立。
4. 检查该邮箱的登录与发信记录，确认是否存在异常使用。
5. 关闭访问摘要邮件，直到新凭据只存放在部署平台的秘密管理中。
6. 备份仓库和标记受影响的 commit/tag，然后经过仓库所有者批准再重写历史。
7. 如果访问记录属于真实访客，根据适用的隐私规则评估是否需要通知、删除或留存事件记录。

本次代码修复不会自动轮换第三方凭据，也不会自动重写远程 Git 历史。

## 已实施的应用保护

- 分析后台使用服务端校验和 HttpOnly、SameSite 签名会话 Cookie，不再将管理密码写入客户端代码。
- 访问记录、统计、分享链接和邮件设置等管理类端点需要有效管理会话或可选服务端 bearer token。
- 公开埋点在创建访问后返回有限期的签名 visit token；后续写入需同时提供 visit ID 和有效 token。
- 分析 API 对请求大小、字段白名单、格式、跨站请求和请求频率进行限制；每次访问的外链事件有数量上限，管理响应禁止公开缓存。
- SMTP 密码只从 `SMTP_PASS` 读取，不再持久化到 SQLite。
- 默认不信任转发 IP 头，不执行外部 IP 地理位置查询；IPv4 写入 SQLite 前会截断为 /24，IPv6 默认不落库。
- `/analytics` 标记为 `noindex` / `noarchive`。

## Git 历史清理

历史重写会更改 commit ID，要求协作者重新 clone，并且需要对远程分支执行强制更新。先通知所有协作者，再在隔离备份中使用 `git-filter-repo` 或同等工具移除：

- `data/analytics.db`
- 相关 SQLite `-wal` / `-shm` 文件（如果历史中存在）
- 任何曾包含真实凭据的环境文件

可在备份仓库中先检查要处理的路径：

```bash
git log --all -- data/analytics.db
git rev-list --objects --all | grep -E '(^|/)analytics\.db(-wal|-shm)?$'
```

确认范围后的一个常见清理方式如下（仅由仓库所有者执行）：

```bash
git filter-repo --path data/analytics.db --invert-paths
```

清理后还必须在新 clone 中重新检查历史，再按托管平台的凭据泄露指引处理缓存和 fork。历史清理不能替代凭据轮换。

## 运行时安全基线

- 生产环境必须配置独立的 `ANALYTICS_ADMIN_PASSWORD`，至少 16 个字符；不得复用邮箱、GitHub 或主机密码。
- 生产环境必须配置独立的 `ANALYTICS_SESSION_SECRET`，使用至少 32 个随机字符，并通过部署平台秘密管理注入。
- 多实例或需要在重启后延续埋点访问时，显式配置至少 32 个随机字符的 `ANALYTICS_TRACKING_SECRET`。
- `ANALYTICS_ADMIN_TOKEN` 如在生产环境启用，必须至少 32 个随机字符；它只用于受信服务器间管理请求，不得注入浏览器、公开脚本或前端构建。
- `ANALYTICS_TRUST_PROXY=true` 只能在应用无法被绕过受信反代直接访问，且反代会覆盖外部传入的 `X-Real-IP` 时启用。应用不会把 User-Agent 或其他可伪造转发头当作客户端限流身份，并始终叠加固定容量的全局限流。
- IP 地理位置查询默认关闭；启用 `ANALYTICS_IP_GEOLOCATION_ENABLED=true` 前必须评估第三方传输、隐私告知和数据保留。
- 不要使用 `NEXT_PUBLIC_` 前缀保存管理密码、会话密钥、SMTP 密码或其他秘密。
- `/analytics` 与管理类 API 只能通过 HTTPS 对外提供，不得绕过服务端认证。
- SMTP 凭据应只在运行时环境变量中保存，邮件功能默认关闭。
- 生产数据库路径必须是发布目录之外的绝对路径，并仅授权应用运行账户读写；应用会拒绝相对路径和 release 内路径。
- 部署不得将 `.env*`、`data/`、备份、日志或开发工具打包到 Web 根目录。
- 不要在应用日志、错误响应或截图中输出密码、SMTP 认证或原始访问记录。

## 数据最小化

分析表可包含 IP 地址、User-Agent、Referrer、点击和停留时间。每次部署前确认：

1. 只采集实际用于作品集改进的字段。
2. 对访客提供清晰的隐私告知，必要时获得同意。
3. 原始访问记录默认在新访问写入时清理 90 天以前的数据，且每条分享链接最多保留最新 10,000 条；按隐私要求通过 `ANALYTICS_RETENTION_DAYS` 进一步缩短，并为长期无人访问的链接安排独立定期清理。
4. 对备份使用同等的访问控制和删除规则。
5. 不在个人作品集分析中收集敏感个人信息。

这些公开埋点不是防篡改审计日志。签名 visit token 会限制跨访问伪造，但无法阻止真实打开分享链接的人重复访问或制造允许范围内的事件；后台数据应作为近似趋势，而不是身份、转化或合规证明。

启用 `ANALYTICS_IP_GEOLOCATION_ENABLED=true` 时，原始 IP 会被发送给 `ipwho.is` 进行查询，只有写入本地 SQLite 的 IP 会被匿名化。因此不应仅因为本地库中是粗粒度 IP 就忽略第三方数据传输。

## 漏洞报告

请通过仓库所有者的私有联系渠道报告安全问题。在完成修复和凭据轮换前，不要在公开 Issue、PR、评论、日志或截图中粘贴攻击细节、凭据或真实访问数据。
