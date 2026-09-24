#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
INTERVAL="${DEPLOY_POLL_SECONDS:-60}"

while true; do
  "$ROOT/deploy/linux/scripts/deploy-main.sh" || echo "[deploy-watch] deployment failed; current containers were left for inspection" >&2
  sleep "$INTERVAL"
done
