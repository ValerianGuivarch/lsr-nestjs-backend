#!/bin/sh
set -eu

: "${ADMIN_USERNAME:?ADMIN_USERNAME is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"

htpasswd -bcB /etc/nginx/.htpasswd "$ADMIN_USERNAME" "$ADMIN_PASSWORD" >/dev/null
exec nginx -g 'daemon off;'
