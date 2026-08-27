FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y git python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

RUN git clone --depth 1 https://github.com/ThreeHats/foundryvtt-rest-api-relay.git .

RUN pnpm install --frozen-lockfile

RUN cd node_modules/.pnpm/sqlite3@*/node_modules/sqlite3 && npm run install

EXPOSE 3010

CMD ["pnpm", "local:sqlite"]

