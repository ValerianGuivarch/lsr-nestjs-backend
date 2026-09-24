#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT/deploy/linux/docker-compose.yml"
VERSION="${1:-}"
cd "$ROOT"

if [[ -z "$VERSION" ]]; then
  echo "usage: $0 <git-sha-or-image-tag>" >&2
  exit 2
fi

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
git merge --ff-only origin/main

if [[ "$(git rev-parse HEAD)" != "$VERSION" ]]; then
  echo "[deploy] main HEAD does not match requested version $VERSION" >&2
  exit 1
fi

export APP_VERSION="$VERSION"
export APP_ENV_FILE="${APP_ENV_FILE:-$ROOT/.env}"

echo "[deploy] pulling images for $APP_VERSION"
docker compose -f "$COMPOSE_FILE" pull

echo "[deploy] starting containers"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans --wait

echo "[deploy] healthy: $APP_VERSION"
docker compose -f "$COMPOSE_FILE" ps
