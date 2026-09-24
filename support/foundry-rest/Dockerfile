FROM golang:1.26.1-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /src

RUN git clone --depth 1 https://github.com/ThreeHats/foundryvtt-rest-api-relay.git .

WORKDIR /src/go-relay

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /relay ./cmd/server/


FROM node:22-alpine AS frontend

RUN apk add --no-cache git

WORKDIR /src

RUN git clone --depth 1 https://github.com/ThreeHats/foundryvtt-rest-api-relay.git .

WORKDIR /src/frontend

RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm run build


FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /relay /app/relay
COPY --from=frontend /src/public-dist/ /app/static/public-dist/

ENV PORT=3010
ENV DB_TYPE=sqlite
ENV STATIC_DIR=/app/static
ENV DATA_DIR=/app/data
ENV MONTHLY_REQUEST_LIMIT=0

VOLUME /app/data

EXPOSE 3010

CMD ["/app/relay"]

