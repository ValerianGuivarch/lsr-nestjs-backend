#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT/deploy/linux/docker-compose.yml"
FORCE="${1:-}"
cd "$ROOT"

exec 9>"$ROOT/.deploy-main.lock"
if ! flock -n 9; then
  echo "[deploy] another deployment is already running"
  exit 0
fi

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "[deploy] refusing to deploy: checkout main first" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[deploy] refusing to deploy with tracked local changes" >&2
  exit 1
fi

git fetch --quiet origin main
current="$(git rev-parse HEAD)"
target="$(git rev-parse origin/main)"

if [[ "$current" == "$target" && "$FORCE" != "--force" ]]; then
  exit 0
fi

echo "[deploy] updating main: $current -> $target"
git merge --ff-only origin/main

export APP_VERSION="$(git rev-parse --short=12 HEAD)"
export APP_ENV_FILE="${APP_ENV_FILE:-$ROOT/.env}"

echo "[deploy] building images for $APP_VERSION"
docker compose -f "$COMPOSE_FILE" build

echo "[deploy] starting containers"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans --wait

echo "[deploy] healthy: $APP_VERSION"
docker compose -f "$COMPOSE_FILE" ps
