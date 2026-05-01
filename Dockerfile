#
# Build stage 0
#
FROM node:18-bookworm-slim AS build-stage

RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node src/ ./src

RUN npm install
RUN npm run build

#
# Build stage 1
#
FROM node:18-bookworm-slim

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
