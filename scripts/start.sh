#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

DEFAULT_DEPLOY_PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$DEFAULT_DEPLOY_PORT}"
DEPLOY_BIND_HOST="${DEPLOY_BIND_HOST:-127.0.0.1}"
STANDALONE_DIR="${COZE_WORKSPACE_PATH}/.next/standalone"


start_service() {
    if [[ ! -f "${STANDALONE_DIR}/server.js" ]]; then
        echo "Standalone server not found. Run pnpm build first." >&2
        exit 1
    fi

    cd "${STANDALONE_DIR}"
    echo "Starting HTTP service on ${DEPLOY_BIND_HOST}:${DEPLOY_RUN_PORT} for deploy..."
    HOSTNAME="${DEPLOY_BIND_HOST}" PORT="${DEPLOY_RUN_PORT}" node server.js
}

start_service
