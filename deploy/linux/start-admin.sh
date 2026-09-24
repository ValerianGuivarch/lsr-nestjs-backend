#!/bin/sh
set -eu

if [ -n "${ADMIN_USERNAME:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  htpasswd -bcB /etc/nginx/.htpasswd "$ADMIN_USERNAME" "$ADMIN_PASSWORD" >/dev/null
else
  # Preserve the previous Vite behavior: without both variables, the admin
  # frontend starts without Basic Auth rather than failing the container.
  sed -i '/^[[:space:]]*auth_basic[[:space:]]/d' /etc/nginx/conf.d/default.conf
  sed -i '/^[[:space:]]*auth_basic_user_file[[:space:]]/d' /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'
