#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the Next.js project..."
# Turbopack currently panics when this project lives in a Windows path that
# contains non-ASCII characters. Webpack produces the same production output
# without that upstream path-decoding failure.
pnpm next build --webpack

echo "Preparing the standalone runtime..."
node scripts/prepare-standalone.mjs

echo "Build completed successfully!"
