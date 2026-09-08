#!/bin/bash
set -Eeuo pipefail


COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
DEV_PORT="${DEPLOY_RUN_PORT:-3001}"
DEV_BIND_HOST="${DEV_BIND_HOST:-127.0.0.1}"

cd "${COZE_WORKSPACE_PATH}"

echo "Starting Next.js development server on ${DEV_BIND_HOST}:${DEV_PORT}..."
exec pnpm exec next dev --webpack -H "${DEV_BIND_HOST}" -p "${DEV_PORT}"
