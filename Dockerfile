#
# Build stage 0
#
FROM node:22-bookworm-slim AS build-stage

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node .npmrc ./
COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node nest-cli.json ./
COPY --chown=node:node nx.json ./
COPY --chown=node:node typings.ts ./
COPY --chown=node:node apps/ ./apps
COPY --chown=node:node libs/ ./libs
COPY --chown=node:node src/ ./src

RUN npm ci
RUN npm run build
RUN npm prune --omit=dev

#
# Build stage 1
#
FROM node:22-bookworm-slim

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node --from=build-stage /home/node/app/dist /home/node/app/dist
COPY --chown=node:node --from=build-stage /home/node/app/node_modules /home/node/app/node_modules
COPY --chown=node:node --from=build-stage /home/node/app/package*.json /home/node/app/

RUN mkdir -p /home/node/logs

ARG RELEASE_NUMBER="1.0"
ENV RELEASE=${RELEASE_NUMBER}

CMD ["npm", "run", "start:prod"]
