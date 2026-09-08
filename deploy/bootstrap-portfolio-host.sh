#!/usr/bin/env bash
set -euo pipefail

config_dir="/etc/huiteen-portfolio"
config_file="${config_dir}/portfolio.env"

install -d -o root -g root -m 0700 "${config_dir}"

if [[ -e "${config_file}" ]]; then
  echo "Portfolio environment already exists; leaving it unchanged."
  exit 0
fi

admin_password="$(openssl rand -hex 24)"
session_secret="$(openssl rand -hex 32)"
tracking_secret="$(openssl rand -hex 32)"
temporary_file="$(mktemp "${config_dir}/portfolio.env.XXXXXX")"

cleanup() {
  rm -f -- "${temporary_file}"
}
trap cleanup EXIT

umask 077
printf '%s\n' \
  'ANALYTICS_ADMIN_PASSWORD='"${admin_password}" \
  'ANALYTICS_SESSION_SECRET='"${session_secret}" \
  'ANALYTICS_TRACKING_SECRET='"${tracking_secret}" \
  'ANALYTICS_TRUST_PROXY=true' \
  'ANALYTICS_IP_GEOLOCATION_ENABLED=false' \
  'ANALYTICS_RETENTION_DAYS=90' \
  'ANALYTICS_SUMMARY_EMAIL_ENABLED=false' \
  'ANALYTICS_PUBLIC_BASE_URL=https://huiteen.com' \
  'ANALYTICS_EMAIL_MIN_DURATION_MS=10000' \
  > "${temporary_file}"

chown root:root "${temporary_file}"
chmod 0600 "${temporary_file}"
mv -- "${temporary_file}" "${config_file}"
trap - EXIT

echo "Created ${config_file} with generated production secrets (contents not printed)."
