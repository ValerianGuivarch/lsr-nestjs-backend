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

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[deploy] refusing to deploy with tracked local changes" >&2
  exit 1
fi

git fetch --quiet https://github.com/ValerianGuivarch/lsr-nestjs-backend.git main
REMOTE_HEAD="$(git rev-parse FETCH_HEAD)"
if [[ "$REMOTE_HEAD" != "$VERSION" ]]; then
  echo "[deploy] requested version $VERSION is obsolete; main is $REMOTE_HEAD"
  exit 0
fi

if [[ "$(git rev-parse HEAD)" != "$VERSION" ]]; then
  echo "[deploy] dedicated checkout HEAD does not match requested version $VERSION" >&2
  exit 1
fi

export APP_VERSION="$VERSION"
RUNTIME_SOURCE_ROOT="${RUNTIME_SOURCE_ROOT:-/home/valou/services/lsr-nestjs-backend}"
SOURCE_ENV_FILE="$RUNTIME_SOURCE_ROOT/.env"
if [[ -f "$SOURCE_ENV_FILE" && "$(realpath "$SOURCE_ENV_FILE")" != "$(realpath -m "$ROOT/.env")" ]]; then
  cp -a "$SOURCE_ENV_FILE" "$ROOT/.env"
fi
if ! grep -q '^APP_STATE_DIR=' "$ROOT/.env"; then printf '\nAPP_STATE_DIR=/home/valou/services/lsr-nestjs-backend\n' >> "$ROOT/.env"; fi
if ! grep -q '^APP_STORAGE_DIR=' "$ROOT/.env"; then printf 'APP_STORAGE_DIR=/home/valou/services/lsr-nestjs-backend/storage\n' >> "$ROOT/.env"; fi
export APP_ENV_FILE="${APP_ENV_FILE:-$ROOT/.env}"

echo "[deploy] pulling images for $APP_VERSION"
docker compose --env-file "$APP_ENV_FILE" -f "$COMPOSE_FILE" pull

echo "[deploy] starting core containers"
docker compose --env-file "$APP_ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans --wait api-jdr api-yeardiary admin map web

echo "[deploy] starting optional Recalbox containers"
if ! docker compose --env-file "$APP_ENV_FILE" -f "$COMPOSE_FILE" up -d --wait api-recalbox web-recalbox; then
  echo "[deploy] warning: Recalbox services are unavailable; core deployment remains healthy" >&2
fi

echo "[deploy] refreshing MediaWiki stack from dedicated checkout"
MEDIAWIKI_LOCAL_SETTINGS_SOURCE="${MEDIAWIKI_LOCAL_SETTINGS_SOURCE:-$RUNTIME_SOURCE_ROOT/support/mediawiki/LocalSettings.php}"
if [[ ! -f "$MEDIAWIKI_LOCAL_SETTINGS_SOURCE" ]]; then
  echo "[deploy] MediaWiki LocalSettings source is missing: $MEDIAWIKI_LOCAL_SETTINGS_SOURCE" >&2
  exit 1
fi
rm -rf "$ROOT/support/mediawiki/LocalSettings.php"
cp -a "$MEDIAWIKI_LOCAL_SETTINGS_SOURCE" "$ROOT/support/mediawiki/LocalSettings.php"
docker compose --env-file "$APP_ENV_FILE" -f "$ROOT/support/mediawiki/docker-compose.yml" up -d

echo "[deploy] healthy: $APP_VERSION"
docker compose --env-file "$APP_ENV_FILE" -f "$COMPOSE_FILE" ps
