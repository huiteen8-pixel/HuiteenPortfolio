#!/bin/bash
set -e

# ============================================================
# 部署脚本 - ooooyasumi.com
# ============================================================
#
# 使用前请配置以下环境变量（或创建 .env.deploy 文件）：
#   DEPLOY_SERVER       目标服务器地址，如 root@1.2.3.4
#   DEPLOY_PASSWORD     服务器 SSH 密码
#   DEPLOY_TARGET_DIR   服务器上部署目录，如 /www/wwwroot/example.com
#   DEPLOY_NGINX_CONF   服务器 Nginx 配置文件路径（可选）
#
# 也可以直接修改下方的配置变量。
# ============================================================

# 配置（请根据实际情况修改）
SERVER="${DEPLOY_SERVER:-root@your-server-ip}"
PASSWORD="${DEPLOY_PASSWORD:-your-password}"
TARGET_DIR="${DEPLOY_TARGET_DIR:-/www/wwwroot/ooooyasumi.com}"
NGINX_CONF="${DEPLOY_NGINX_CONF:-/www/server/panel/vhost/nginx/ooooyasumi.com.conf}"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"
SSHPASS="sshpass -p $PASSWORD"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
log_info "=========================================="
log_info "  开始部署 ooooyasumi.com"
log_info "=========================================="
echo ""

# 进入项目目录
cd "$LOCAL_DIR" || log_error "项目目录不存在: $LOCAL_DIR"
log_info "当前目录: $(pwd)"

# 检查环境
log_info "[1/7] 检查环境..."
command -v node >/dev/null 2>&1 || log_error "Node.js 未安装"
command -v pnpm >/dev/null 2>&1 || log_error "pnpm 未安装"
$SSHPASS -V >/dev/null 2>&1 || log_error "sshpass 未安装"
command -v rsync >/dev/null 2>&1 || log_error "rsync 未安装"
log_info "环境检查通过 (node: $(node --version), pnpm: $(pnpm --version))"

# 安装依赖
log_info "[2/7] 安装依赖..."
pnpm install --frozen-lockfile || log_error "依赖安装失败"

# 构建项目
log_info "[3/7] 构建项目..."
pnpm build || log_error "项目构建失败"

# 检查构建输出
# 注意：本项目使用 standalone 输出模式，构建产物在 .next/standalone/
# 如使用静态导出模式，请检查 out/ 目录
BUILD_DIR=".next/standalone"
if [ ! -d "$BUILD_DIR" ]; then
  log_error "构建输出目录 $BUILD_DIR 不存在"
fi
FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l | tr -d ' ')
log_info "构建完成，共 $FILE_COUNT 个文件"

# 远程创建目录
log_info "[5/7] 准备服务器目录..."
$SSHPASS ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER "mkdir -p $TARGET_DIR" || log_error "服务器目录创建失败"

# 同步文件（带进度条）
log_info "[6/7] 同步文件到服务器..."
export LC_ALL=C
$SSHPASS rsync -avz --delete --progress "$BUILD_DIR"/ $SERVER:$TARGET_DIR/ || log_error "文件同步失败"

# 部署 Nginx 配置
if [ -n "$DEPLOY_NGINX_CONF" ] && [ -f "deploy/nginx/ooooyasumi.com.conf" ]; then
  log_info "[7/7] 部署 Nginx 配置..."
  $SSHPASS scp -o StrictHostKeyChecking=no deploy/nginx/ooooyasumi.com.conf $SERVER:$NGINX_CONF || log_error "Nginx 配置同步失败"
  $SSHPASS ssh -o StrictHostKeyChecking=no $SERVER "/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload" || log_warn "Nginx 重载失败，请手动检查"
else
  log_info "[7/7] 跳过 Nginx 配置部署"
fi

# 验证服务器文件
SERVER_FILE_COUNT=$($SSHPASS ssh -o StrictHostKeyChecking=no $SERVER "find $TARGET_DIR -type f | wc -l" 2>/dev/null || echo "0")
log_info "服务器文件数量: $SERVER_FILE_COUNT"

echo ""
log_info "=========================================="
log_info "  部署完成!"
log_info "  访问 https://ooooyasumi.com"
log_info "=========================================="
echo ""
