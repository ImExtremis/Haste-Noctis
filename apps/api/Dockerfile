ARG BUILD_SHA
ARG BUILD_NUMBER
ARG BUILD_TIMESTAMP
ARG RELEASE_CHANNEL=nightly

FROM node:24-bookworm-slim AS base

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

FROM base AS generator

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY packages/config/ ./packages/config/
COPY packages/constants/ ./packages/constants/

RUN pnpm install --frozen-lockfile --filter @noctis/config...
RUN pnpm --filter @noctis/config generate

FROM base AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
		build-essential \
		gcc \
		libssl-dev \
		pkg-config \
		openssl \
		libvips-dev \
		libsqlite3-dev \
		python3 && \
	rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY packages/ ./packages/
COPY noctis_api/package.json ./noctis_api/

RUN pnpm install --frozen-lockfile --prod

FROM node:24-bookworm-slim

ARG BUILD_SHA
ARG BUILD_NUMBER
ARG BUILD_TIMESTAMP
ARG RELEASE_CHANNEL

WORKDIR /usr/src/app/noctis_api

RUN apt-get update && apt-get install -y --no-install-recommends \
		curl \
		openssl \
		libimage-exiftool-perl \
		libvips \
		libvips-dev \
		libsqlite3-0 && \
	rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

COPY --from=deps /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=deps /usr/src/app/noctis_api/node_modules ./node_modules
COPY --from=deps /usr/src/app/packages /usr/src/app/packages
COPY --from=generator /usr/src/app/packages/config/src/ConfigSchema.json /usr/src/app/packages/config/src/ConfigSchema.json
COPY --from=generator /usr/src/app/packages/config/src/MasterZodSchema.generated.tsx /usr/src/app/packages/config/src/MasterZodSchema.generated.tsx
COPY tsconfigs /usr/src/app/tsconfigs
COPY noctis_api/package.json ./
COPY noctis_api/tsconfig.json noctis_api/tsconfig.worker.json ./
COPY noctis_api/src ./src

RUN mkdir -p /usr/src/app/.cache/corepack && \
	chown -R nobody:nogroup /usr/src/app
RUN mkdir -p /data/sqlite && chown -R nobody:nogroup /data

ENV HOME=/usr/src/app
ENV COREPACK_HOME=/usr/src/app/.cache/corepack
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV BUILD_SHA=${BUILD_SHA}
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV RELEASE_CHANNEL=${RELEASE_CHANNEL}

USER nobody

EXPOSE 8080

CMD ["pnpm", "start"]
