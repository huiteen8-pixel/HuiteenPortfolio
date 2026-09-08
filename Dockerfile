# syntax=docker/dockerfile:1.7

ARG NODE_BUILD_IMAGE=node:22-bookworm
ARG NODE_RUNTIME_IMAGE=node:22-bookworm-slim

FROM ${NODE_BUILD_IMAGE} AS base

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate


FROM base AS dependencies

# The full Debian Node build image already includes Python, make, and g++, which
# lets better-sqlite3 fall back to a native build without downloading packages
# from Debian mirrors during a production build.

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=huiteen-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile


FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN pnpm build


FROM ${NODE_RUNTIME_IMAGE} AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    SQLITE_DB_PATH=/var/lib/huiteen-portfolio/analytics.db

WORKDIR /app

COPY --from=base /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

RUN groupadd --system --gid 10001 huiteen \
    && useradd --system --uid 10001 --gid huiteen --home-dir /nonexistent --shell /usr/sbin/nologin huiteen \
    && mkdir -p /app/.next/cache /var/lib/huiteen-portfolio \
    && chown -R huiteen:huiteen /app /var/lib/huiteen-portfolio \
    && chmod 0700 /var/lib/huiteen-portfolio

# prepare-standalone.mjs places public/ and .next/static/ inside this directory.
# The traced tree also carries better-sqlite3's Linux addon and the SQL schema.
COPY --from=builder --chown=huiteen:huiteen /app/.next/standalone ./

RUN test -f /app/server.js \
    && test -f /app/src/lib/db/schema.sql \
    && test -f /app/node_modules/better-sqlite3/build/Release/better_sqlite3.node

USER 10001:10001

EXPOSE 3000
VOLUME ["/var/lib/huiteen-portfolio"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/robots.txt').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

STOPSIGNAL SIGTERM

CMD ["sh", "-c", "umask 077 && exec node server.js"]
