#
# Build stage 0
#
FROM node:16.15.0-alpine3.15 as build-stage

RUN apk --no-cache add --virtual builds-deps build-base python3

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
FROM node:16.15.0-alpine3.15

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node --from=build-stage /home/node/app/dist /home/node/app/dist
COPY --chown=node:node --from=build-stage /home/node/app/node_modules /home/node/app/node_modules
COPY --chown=node:node --from=build-stage /home/node/app/package*.json /home/node/app/

RUN mkdir -p /home/node/logs

ARG RELEASE_NUMBER=${RELEASE_NUMBER:-"1.0"}
ENV RELEASE=${RELEASE_NUMBER}

CMD npm run start:prod
