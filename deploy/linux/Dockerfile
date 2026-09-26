FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*
COPY package*.json .npmrc ./
RUN npm ci

FROM deps AS source
COPY . .
ENV NX_DAEMON=false NX_SKIP_NATIVE_FILE_CACHE=true NX_TUI=false

FROM source AS api-jdr-build
RUN npx nx build api-jdr

FROM source AS api-yeardiary-build
RUN npx nx build api-yeardiary

FROM source AS web-misc-build
RUN npm run build:web:misc

FROM source AS admin-jdr-build
RUN npm run build:admin-jdr

FROM source AS golarion-map-build
RUN npm run build:golarion-map

FROM node:22-bookworm-slim AS api-base
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0
COPY package*.json .npmrc ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

FROM api-base AS api-jdr
COPY --from=api-jdr-build /app/dist/api-jdr ./dist/api-jdr
COPY --from=source /app/apps/web-misc/src/pf2-mj/data ./seed
COPY --from=source /app/pf2e-val-toolkit ./pf2e-val-toolkit
ENV JDR_PORT=3333 PF2_DATA_ROOT=/app/seed
EXPOSE 3333
CMD ["node", "dist/api-jdr/main.js"]

FROM api-base AS api-yeardiary
COPY --from=api-yeardiary-build /app/dist/api-yeardiary ./dist/api-yeardiary
ENV YEARDIARY_PORT=8081
EXPOSE 8081
CMD ["node", "dist/api-yeardiary/main.js"]

FROM nginx:1.27-alpine AS web-misc
COPY deploy/linux/nginx-web.conf /etc/nginx/conf.d/default.conf
COPY --from=web-misc-build /app/dist/apps/web-misc /usr/share/nginx/html
EXPOSE 80

FROM nginx:1.27-alpine AS admin-jdr
RUN apk add --no-cache apache2-utils
COPY deploy/linux/nginx-admin.conf /etc/nginx/conf.d/default.conf
COPY deploy/linux/start-admin.sh /usr/local/bin/start-admin
RUN chmod +x /usr/local/bin/start-admin
COPY --from=admin-jdr-build /app/dist/apps/admin-jdr /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/start-admin"]


FROM node:22-bookworm-slim AS golarion-map
WORKDIR /app
ENV NODE_ENV=production GOLARION_MAP_HOST=0.0.0.0 GOLARION_MAP_PORT=4204 GOLARION_MAP_ASSETS_DIR=/app/map-assets
COPY --from=golarion-map-build /app/dist/apps/web-golarion-map ./dist/apps/web-golarion-map
COPY --from=source /app/apps/web-golarion-map/server.mjs ./apps/web-golarion-map/server.mjs
EXPOSE 4204
CMD ["node", "apps/web-golarion-map/server.mjs"]
