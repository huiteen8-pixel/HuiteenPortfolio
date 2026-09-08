#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="huiteen-portfolio"
WORKSPACE="${DEPLOY_WORKSPACE:-$(cd "$(dirname "$0")" && pwd)}"
SERVER="${DEPLOY_SERVER:-}"
TARGET_DIR="${DEPLOY_TARGET_DIR:-}"
ALLOWED_BASE="${DEPLOY_ALLOWED_BASE:-/srv}"
RESTART_COMMAND="${DEPLOY_RESTART_COMMAND:-}"
HEALTHCHECK_URL="${DEPLOY_HEALTHCHECK_URL:-}"

log() { printf '[%s] %s\n' "$APP_NAME" "$1"; }
fail() { printf '[%s] ERROR: %s\n' "$APP_NAME" "$1" >&2; exit 1; }

[[ -n "$SERVER" ]] || fail "DEPLOY_SERVER is required (for example deploy@example.com)"
[[ "$SERVER" =~ ^([A-Za-z_][A-Za-z0-9._-]*@)?[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || \
  fail "DEPLOY_SERVER must be a safe [user@]host or SSH alias without options or a port"
[[ -n "$TARGET_DIR" ]] || fail "DEPLOY_TARGET_DIR is required"
[[ "$TARGET_DIR" =~ ^/[A-Za-z0-9._/-]+$ && "$TARGET_DIR" != "/" && "$TARGET_DIR" != */ && "$TARGET_DIR" != *//* ]] || \
  fail "DEPLOY_TARGET_DIR must be a safe absolute deployment root and cannot be /"
[[ ! "$TARGET_DIR" =~ (^|/)\.\.?(/|$) ]] || \
  fail "DEPLOY_TARGET_DIR cannot contain . or .. path segments"
[[ "$ALLOWED_BASE" =~ ^/[A-Za-z0-9._/-]+$ && "$ALLOWED_BASE" != "/" && "$ALLOWED_BASE" != */ && "$ALLOWED_BASE" != *//* ]] || \
  fail "DEPLOY_ALLOWED_BASE must be a safe absolute path and cannot be /"
[[ ! "$ALLOWED_BASE" =~ (^|/)\.\.?(/|$) ]] || \
  fail "DEPLOY_ALLOWED_BASE cannot contain . or .. path segments"
[[ -z "$HEALTHCHECK_URL" || "$HEALTHCHECK_URL" =~ ^https?:// ]] || \
  fail "DEPLOY_HEALTHCHECK_URL must start with http:// or https://"
[[ -z "$HEALTHCHECK_URL" || -n "$RESTART_COMMAND" ]] || \
  fail "DEPLOY_RESTART_COMMAND is required when DEPLOY_HEALTHCHECK_URL is set"

for command_name in node pnpm ssh rsync mktemp find date uname realpath; do
  command -v "$command_name" >/dev/null 2>&1 || fail "$command_name is required"
done

if [[ -n "${DEPLOY_NGINX_CONF:-}${DEPLOY_NGINX_TEMPLATE:-}${DEPLOY_NGINX_ALLOWED_BASE:-}" ]]; then
  fail "automated Nginx uploads are not supported; install the reviewed template manually, run nginx -t, then reload"
fi

if [[ -n "$HEALTHCHECK_URL" ]]; then
  command -v curl >/dev/null 2>&1 || fail "curl is required when DEPLOY_HEALTHCHECK_URL is set"
fi

cd "$WORKSPACE"

[[ "$(realpath -ms -- "$TARGET_DIR")" == "$TARGET_DIR" ]] || \
  fail "DEPLOY_TARGET_DIR must already be in canonical absolute form"
[[ "$(realpath -ms -- "$ALLOWED_BASE")" == "$ALLOWED_BASE" ]] || \
  fail "DEPLOY_ALLOWED_BASE must already be in canonical absolute form"
[[ "$TARGET_DIR" == "$ALLOWED_BASE/"* ]] || \
  fail "DEPLOY_TARGET_DIR must be below DEPLOY_ALLOWED_BASE ($ALLOWED_BASE)"

COMMIT_ID="$(git rev-parse --short=12 HEAD 2>/dev/null || printf 'nogit')"
RELEASE_ID="${DEPLOY_RELEASE_ID:-$(date -u +'%Y%m%dT%H%M%SZ')-${COMMIT_ID}-$$-${RANDOM}}"
[[ "$RELEASE_ID" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || \
  fail "DEPLOY_RELEASE_ID must start with a letter or number and may contain only letters, numbers, dots, underscores, and hyphens"

REMOTE_RELEASE="$TARGET_DIR/releases/$RELEASE_ID"
SSH_OPTIONS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
RELEASE_DIR=""
RELEASE_TMP_BASE=""
REMOTE_LOCK_HELD=0
REMOTE_RELEASE_CREATED=0
DEPLOY_SUCCEEDED=0
PREVIOUS_TARGET=""

detect_libc_family() {
  local ldd_output

  command -v ldd >/dev/null 2>&1 || return 1
  ldd_output="$(ldd --version 2>&1 || true)"
  case "$ldd_output" in
    *musl*) printf 'musl' ;;
    *GLIBC*|*glibc*|*'GNU libc'*) printf 'glibc' ;;
    *) return 1 ;;
  esac
}

preflight_platform() {
  local local_kernel local_arch local_libc local_node_platform local_node_abi
  local remote_platform remote_kernel remote_arch remote_libc remote_node_platform remote_node_abi

  local_kernel="$(uname -s)"
  [[ "$local_kernel" == "Linux" ]] || \
    fail "native standalone releases must be built on Linux; use matching Linux CI/container instead of deploying from $local_kernel"
  local_arch="$(uname -m)"
  local_libc="$(detect_libc_family)" || \
    fail "could not identify the local Linux libc family"
  local_node_platform="$(node -p 'process.platform')"
  local_node_abi="$(node -p 'process.versions.modules')"
  [[ "$local_node_platform" == "linux" ]] || \
    fail "the active Node.js runtime is not a Linux runtime"

  if ! remote_platform="$(ssh "${SSH_OPTIONS[@]}" -- "$SERVER" bash -s -- \
    "$TARGET_DIR" "$ALLOWED_BASE" <<'REMOTE_PLATFORM'
set -Eeuo pipefail
target_dir="$1"
allowed_base="$2"

command -v realpath >/dev/null 2>&1 || {
  printf 'realpath is required on the target server\n' >&2
  exit 1
}
command -v node >/dev/null 2>&1 || {
  printf 'node is required on the target server\n' >&2
  exit 1
}
command -v ldd >/dev/null 2>&1 || {
  printf 'ldd is required to identify the target libc\n' >&2
  exit 1
}

canonical_base="$(realpath -m -- "$allowed_base")"
canonical_target="$(realpath -m -- "$target_dir")"
[[ "$canonical_base" == "$allowed_base" && "$canonical_target" == "$target_dir" && "$canonical_target" == "$canonical_base/"* ]] || {
  printf 'target deployment path is not canonical or is outside its allowed base\n' >&2
  exit 1
}

kernel="$(uname -s)"
arch="$(uname -m)"
ldd_output="$(ldd --version 2>&1 || true)"
case "$ldd_output" in
  *musl*) libc_family='musl' ;;
  *GLIBC*|*glibc*|*'GNU libc'*) libc_family='glibc' ;;
  *)
    printf 'could not identify the target libc family\n' >&2
    exit 1
    ;;
esac
node_platform="$(node -p 'process.platform')"
node_abi="$(node -p 'process.versions.modules')"
printf '%s|%s|%s|%s|%s\n' "$kernel" "$arch" "$libc_family" "$node_platform" "$node_abi"
REMOTE_PLATFORM
)"; then
    fail "could not inspect the target runtime platform"
  fi

  IFS='|' read -r remote_kernel remote_arch remote_libc remote_node_platform remote_node_abi <<< "$remote_platform"
  [[ "$remote_kernel" == "Linux" && "$remote_node_platform" == "linux" ]] || \
    fail "the target must run Linux"
  [[ "$local_arch" == "$remote_arch" ]] || \
    fail "CPU architecture mismatch: build=$local_arch target=$remote_arch; build in matching CI/container"
  [[ "$local_libc" == "$remote_libc" ]] || \
    fail "libc mismatch: build=$local_libc target=$remote_libc; build in matching CI/container"
  [[ "$local_node_abi" == "$remote_node_abi" ]] || \
    fail "Node module ABI mismatch: build=$local_node_abi target=$remote_node_abi; use the same Node major/runtime"

  log "Platform preflight passed: Linux $local_arch, $local_libc, Node ABI $local_node_abi"
}

cleanup() {
  if [[ -n "$RELEASE_DIR" && -d "$RELEASE_DIR" ]]; then
    local resolved_release_dir
    resolved_release_dir="$(realpath -m -- "$RELEASE_DIR" 2>/dev/null || true)"
    if [[ -n "$RELEASE_TMP_BASE" && "$resolved_release_dir" == "$RELEASE_DIR" && "$RELEASE_DIR" == "$RELEASE_TMP_BASE/huiteen-release."* ]]; then
      rm -rf -- "$RELEASE_DIR"
    else
      printf '[%s] WARNING: refused to clean unexpected temporary path: %s\n' "$APP_NAME" "$RELEASE_DIR" >&2
    fi
  fi

  if [[ "$REMOTE_LOCK_HELD" == "1" ]]; then
    ssh "${SSH_OPTIONS[@]}" -- "$SERVER" bash -s -- \
      "$TARGET_DIR" "$RELEASE_ID" "$REMOTE_RELEASE_CREATED" "$DEPLOY_SUCCEEDED" <<'REMOTE_CLEANUP' \
      >/dev/null 2>&1 || true
set -u
target_dir="$1"
release_id="$2"
release_created="$3"
deploy_succeeded="$4"
lock_dir="$target_dir/.deploy-lock"

canonical_target="$(realpath -m -- "$target_dir" 2>/dev/null || true)"
if [[ "$canonical_target" == "$target_dir" && -f "$lock_dir/release-id" && "$(cat "$lock_dir/release-id")" == "$release_id" ]]; then
  if [[ "$release_created" == "1" && "$deploy_succeeded" != "1" ]]; then
    current_target="$(readlink "$target_dir/current" 2>/dev/null || true)"
    release_path="$target_dir/releases/$release_id"
    canonical_release="$(realpath -m -- "$release_path" 2>/dev/null || true)"
    if [[ "$current_target" != "releases/$release_id" && "$canonical_release" == "$release_path" && -d "$release_path" && ! -L "$release_path" ]]; then
      rm -rf -- "$release_path"
    fi
  fi
  rm -f -- "$lock_dir/release-id"
  rmdir -- "$lock_dir" 2>/dev/null || true
fi
REMOTE_CLEANUP
  fi
}
trap cleanup EXIT

contains_forbidden_files() {
  local root="$1"
  local forbidden_file

  [[ -e "$root/data" ]] && return 0
  forbidden_file="$(find "$root" -type f \
    \( -name '.env*' -o -iname '*.db' -o -iname '*.db-*' -o \
       -iname '*.sqlite' -o -iname '*.sqlite-*' -o -iname '*.sqlite3' -o \
       -iname '*.sqlite3-*' -o -iname '*-journal' \) \
    -print -quit)"
  [[ -n "$forbidden_file" ]]
}

restart_remote() {
  log "Restarting the remote application"
  ssh "${SSH_OPTIONS[@]}" -- "$SERVER" "$RESTART_COMMAND"
}

rollback_release() {
  [[ -n "$PREVIOUS_TARGET" ]] || return 1

  log "Rolling current back to $PREVIOUS_TARGET"
  ssh "${SSH_OPTIONS[@]}" -- "$SERVER" bash -s -- "$TARGET_DIR" "$RELEASE_ID" <<'REMOTE_ROLLBACK'
set -Eeuo pipefail
target_dir="$1"
release_id="$2"
canonical_target="$(realpath -m -- "$target_dir")"
[[ "$canonical_target" == "$target_dir" ]] || {
  printf 'deployment root is no longer canonical\n' >&2
  exit 1
}
cd "$target_dir"

current_target="$(readlink current)"
previous_target="$(readlink previous)"
[[ "$current_target" == "releases/$release_id" ]] || {
  printf 'current changed during deployment; refusing to overwrite it\n' >&2
  exit 1
}
[[ "$previous_target" =~ ^releases/[A-Za-z0-9][A-Za-z0-9._-]*$ && -d "$previous_target" && ! -L "$previous_target" && -f "$previous_target/server.js" ]] || {
  printf 'previous does not point to a valid release\n' >&2
  exit 1
}
[[ "$(realpath -m -- "$previous_target")" == "$target_dir/$previous_target" ]] || {
  printf 'previous resolves outside the managed release root\n' >&2
  exit 1
}

rollback_link=".current-rollback-$release_id"
ln -s "$previous_target" "$rollback_link"
mv -Tf "$rollback_link" current
REMOTE_ROLLBACK
}

fail_with_rollback() {
  local reason="$1"

  if ! rollback_release; then
    fail "$reason; no valid previous release was available for automatic rollback"
  fi

  if ! restart_remote; then
    fail "$reason; current was rolled back to $PREVIOUS_TARGET, but the rollback restart failed"
  fi

  fail "$reason; rolled back to $PREVIOUS_TARGET and restarted the service"
}

preflight_platform

log "Installing dependencies"
pnpm install --frozen-lockfile

log "Running checks"
pnpm lint
pnpm ts-check

log "Building production artifacts"
pnpm build

[[ -f .next/standalone/server.js ]] || fail ".next/standalone/server.js is missing"
[[ -d .next/static ]] || fail ".next/static is missing"
[[ -d public ]] || fail "public is missing"
[[ ! -e .next/standalone/data ]] || \
  fail "standalone output contains data/; refusing to package a possible private database"

RELEASE_TMP_BASE="$(realpath -m -- "${TMPDIR:-/tmp}")"
[[ "$RELEASE_TMP_BASE" != "/" && -d "$RELEASE_TMP_BASE" ]] || \
  fail "temporary directory base is missing or unsafe"
RELEASE_DIR="$(mktemp -d "$RELEASE_TMP_BASE/huiteen-release.XXXXXXXX")"
[[ "$(realpath -m -- "$RELEASE_DIR")" == "$RELEASE_DIR" && "$RELEASE_DIR" == "$RELEASE_TMP_BASE/huiteen-release."* ]] || \
  fail "mktemp returned an unexpected release directory"
cp -a .next/standalone/. "$RELEASE_DIR/"
mkdir -p "$RELEASE_DIR/.next/static" "$RELEASE_DIR/public"
cp -a .next/static/. "$RELEASE_DIR/.next/static/"
cp -a public/. "$RELEASE_DIR/public/"

if contains_forbidden_files "$RELEASE_DIR"; then
  fail "release output contains an environment file or SQLite artifact; refusing to upload it"
fi

log "Claiming remote deployment lock and unique release $RELEASE_ID"
if ! ssh "${SSH_OPTIONS[@]}" -- "$SERVER" bash -s -- "$TARGET_DIR" "$ALLOWED_BASE" "$REMOTE_RELEASE" "$RELEASE_ID" <<'REMOTE_PREPARE'
set -Eeuo pipefail
target_dir="$1"
allowed_base="$2"
remote_release="$3"
release_id="$4"

canonical_base="$(realpath -m -- "$allowed_base")"
canonical_target="$(realpath -m -- "$target_dir")"
canonical_release="$(realpath -m -- "$remote_release")"
[[ "$canonical_base" == "$allowed_base" && "$canonical_target" == "$target_dir" && "$canonical_target" == "$canonical_base/"* ]] || {
  printf 'deployment root failed canonical path validation\n' >&2
  exit 1
}
[[ "$canonical_release" == "$remote_release" && "$canonical_release" == "$canonical_target/releases/$release_id" ]] || {
  printf 'release path failed canonical path validation\n' >&2
  exit 1
}

mkdir -p "$target_dir/releases"
mkdir "$target_dir/.deploy-lock" || {
  printf 'another deployment is active (remove %s/.deploy-lock only after verifying it is stale)\n' "$target_dir" >&2
  exit 1
}
trap 'rm -f -- "$target_dir/.deploy-lock/release-id"; rmdir -- "$target_dir/.deploy-lock" 2>/dev/null || true' ERR
printf '%s\n' "$release_id" > "$target_dir/.deploy-lock/release-id"
mkdir "$remote_release"
trap - ERR
REMOTE_PREPARE
then
  fail "could not create the remote deployment lock and unique release directory"
fi
REMOTE_LOCK_HELD=1
REMOTE_RELEASE_CREATED=1

if ! ssh "${SSH_OPTIONS[@]}" -- "$SERVER" bash -s -- "$REMOTE_RELEASE" <<'REMOTE_BEFORE_UPLOAD'
set -Eeuo pipefail
remote_release="$1"
[[ -d "$remote_release" && ! -L "$remote_release" && "$(realpath -m -- "$remote_release")" == "$remote_release" ]]
REMOTE_BEFORE_UPLOAD
then
  fail "remote release directory is missing, non-canonical, or a symbolic link"
fi

log "Uploading release artifacts to $REMOTE_RELEASE"
rsync -az --delete -- "$RELEASE_DIR/" "$SERVER:$REMOTE_RELEASE/"

log "Validating the uploaded release"
if ! REMOTE_FORBIDDEN="$(ssh "${SSH_OPTIONS[@]}" -- "$SERVER" \
  "set -eu; test -d '$REMOTE_RELEASE'; test ! -L '$REMOTE_RELEASE'; test \"\$(realpath -m -- '$REMOTE_RELEASE')\" = '$REMOTE_RELEASE'; test -f '$REMOTE_RELEASE/server.js'; test ! -e '$REMOTE_RELEASE/data'; find '$REMOTE_RELEASE' -type f \( -name '.env*' -o -iname '*.db' -o -iname '*.db-*' -o -iname '*.sqlite' -o -iname '*.sqlite-*' -o -iname '*.sqlite3' -o -iname '*.sqlite3-*' -o -iname '*-journal' \) -print -quit")"; then
  fail "remote release validation failed"
fi
[[ -z "$REMOTE_FORBIDDEN" ]] || fail "remote release contains a forbidden file: $REMOTE_FORBIDDEN"

log "Atomically switching current to releases/$RELEASE_ID"
if ! PREVIOUS_TARGET="$(ssh "${SSH_OPTIONS[@]}" -- "$SERVER" bash -s -- "$TARGET_DIR" "$ALLOWED_BASE" "$RELEASE_ID" <<'REMOTE_SWITCH'
set -Eeuo pipefail
target_dir="$1"
allowed_base="$2"
release_id="$3"
canonical_base="$(realpath -m -- "$allowed_base")"
canonical_target="$(realpath -m -- "$target_dir")"
[[ "$canonical_base" == "$allowed_base" && "$canonical_target" == "$target_dir" && "$canonical_target" == "$canonical_base/"* ]] || {
  printf 'deployment root failed canonical path validation\n' >&2
  exit 1
}
cd "$target_dir"

new_target="releases/$release_id"
[[ -d "$new_target" && ! -L "$new_target" && -f "$new_target/server.js" ]] || {
  printf 'new release is incomplete\n' >&2
  exit 1
}
[[ "$(realpath -m -- "$new_target")" == "$target_dir/$new_target" ]] || {
  printf 'new release resolves outside the managed release root\n' >&2
  exit 1
}

previous_target=""
if [[ -L current ]]; then
  previous_target="$(readlink current)"
  [[ "$previous_target" =~ ^releases/[A-Za-z0-9][A-Za-z0-9._-]*$ && -d "$previous_target" && ! -L "$previous_target" && -f "$previous_target/server.js" ]] || {
    printf 'current does not point to a valid managed release\n' >&2
    exit 1
  }
  [[ "$(realpath -m -- "$previous_target")" == "$target_dir/$previous_target" ]] || {
    printf 'current resolves outside the managed release root\n' >&2
    exit 1
  }
  [[ ! -e previous || -L previous ]] || {
    printf 'previous exists but is not a symbolic link\n' >&2
    exit 1
  }
  previous_link=".previous-$release_id"
  ln -s "$previous_target" "$previous_link"
  mv -Tf "$previous_link" previous
elif [[ -e current ]]; then
  printf 'current exists but is not a symbolic link\n' >&2
  exit 1
fi

next_link=".current-$release_id"
ln -s "$new_target" "$next_link"
mv -Tf "$next_link" current
printf '%s' "$previous_target"
REMOTE_SWITCH
)"; then
  fail "could not atomically update the remote current link"
fi
[[ -z "$PREVIOUS_TARGET" || "$PREVIOUS_TARGET" =~ ^releases/[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || \
  fail "remote switch returned an invalid previous release target"

if [[ -n "$RESTART_COMMAND" ]]; then
  if ! restart_remote; then
    fail_with_rollback "remote restart failed"
  fi
else
  log "No DEPLOY_RESTART_COMMAND set; current was switched but the running process was not restarted"
fi

if [[ -n "$HEALTHCHECK_URL" ]]; then
  log "Running health check: $HEALTHCHECK_URL"
  if ! curl --fail --silent --show-error --location \
    --connect-timeout 5 --max-time 15 --retry 5 --retry-delay 2 --retry-all-errors \
    "$HEALTHCHECK_URL" >/dev/null; then
    fail_with_rollback "health check failed"
  fi
fi

DEPLOY_SUCCEEDED=1
ssh "${SSH_OPTIONS[@]}" -- "$SERVER" bash -s -- "$TARGET_DIR" "$RELEASE_ID" <<'REMOTE_UNLOCK'
set -Eeuo pipefail
target_dir="$1"
release_id="$2"
[[ "$(realpath -m -- "$target_dir")" == "$target_dir" ]] || {
  printf 'deployment root is no longer canonical; lock was not removed\n' >&2
  exit 1
}
lock_dir="$target_dir/.deploy-lock"
[[ -f "$lock_dir/release-id" && "$(cat "$lock_dir/release-id")" == "$release_id" ]] || {
  printf 'deployment lock ownership changed; lock was not removed\n' >&2
  exit 1
}
rm -f -- "$lock_dir/release-id"
rmdir -- "$lock_dir"
REMOTE_UNLOCK
REMOTE_LOCK_HELD=0

log "Deployment completed: releases/$RELEASE_ID is current"
