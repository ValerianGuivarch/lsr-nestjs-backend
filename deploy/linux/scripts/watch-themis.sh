#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENV_FILE="${APP_ENV_FILE:-$ROOT/.env}"
STATE_DIR="${THEMIS_WATCH_STATE_DIR:-$HOME/.cache/lsr}"
LOCK_FILE="$STATE_DIR/themis-watch.lock"
DONE_FILE="$STATE_DIR/themis-watch.done"

TARGET_URL='https://indiv.themisweb.fr/0614/fListeManifs.aspx?idstructure=0614&groupid=6140093'
INTERVAL_SECONDS="${THEMIS_WATCH_INTERVAL_SECONDS:-1}"

mkdir -p "$STATE_DIR"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[themis-watch] already running"
  exit 0
fi

if [[ -f "$DONE_FILE" ]]; then
  echo "[themis-watch] notification already sent; nothing to do"
  exit 0
fi

env_value() {
  local key="$1"
  local value=""
  if [[ -f "$ENV_FILE" ]]; then
    value="$(grep -m1 -E "^$key=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)"
  fi
  value="${value%$'\r'}"
  if [[ "${#value}" -ge 2 ]]; then
    if [[ "${value:0:1}" == '"' && "${value: -1}" == '"' ]] || [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi
  printf '%s' "$value"
}

NTFY_URL="$(env_value NTFY_URL)"
NTFY_TOPIC="$(env_value NTFY_TOPIC)"
NTFY_TOKEN="$(env_value NTFY_TOKEN)"
NTFY_URL="${NTFY_URL:-https://ntfy.sh}"

if [[ -z "$NTFY_TOPIC" ]]; then
  echo "[themis-watch] NTFY_TOPIC is not configured in $ENV_FILE" >&2
  exit 1
fi

echo "[themis-watch] started; checking every ${INTERVAL_SECONDS}s"

while true; do
  body="$(mktemp)"
  result="$(
    curl -sS -L       --connect-timeout 3       --max-time 8       -H 'Cache-Control: no-cache'       -A 'Mozilla/5.0 availability-check/1.0'       -o "$body"       -w '%{http_code}\n%{url_effective}'       "$TARGET_URL" 2>/dev/null || true
  )"

  status="$(printf '%s\n' "$result" | sed -n '1p')"
  final_url="$(printf '%s\n' "$result" | sed -n '2p')"

  available=false
  if [[ "$status" =~ ^2[0-9][0-9]$ || "$status" =~ ^3[0-9][0-9]$ ]]; then
    if [[ "$final_url" != *'/maintenance_0614.htm'* ]] && ! grep -qiE 'ouvre à 9h|site est temporairement inaccessible' "$body"; then
      available=true
    fi
  fi

  rm -f "$body"

  if [[ "$available" == true ]]; then
    echo "[themis-watch] available: status=$status url=$final_url"

    notify_args=(
      -fsS
      -X POST
      -H 'Title: Billetterie FIJ disponible'
      -H 'Priority: urgent'
      -H 'Tags: tada,ticket'
      -H "Click: $TARGET_URL"
      --data-binary 'La billetterie Themis semble disponible. Ouvre le site maintenant.'
    )
    if [[ -n "$NTFY_TOKEN" ]]; then
      notify_args+=(-H "Authorization: Bearer $NTFY_TOKEN")
    fi

    if curl "${notify_args[@]}" "${NTFY_URL%/}/$NTFY_TOPIC" >/dev/null; then
      date -Is > "$DONE_FILE"
      echo "[themis-watch] notification sent; stopping"
      exit 0
    fi

    echo "[themis-watch] notification failed; retrying in 2s" >&2
    sleep 2
    continue
  fi

  if [[ "$status" == '429' ]]; then
    sleep 5
  else
    sleep "$INTERVAL_SECONDS"
  fi
done
