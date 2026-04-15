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

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY packages/ ./packages/
COPY noctis_app_proxy/package.json ./noctis_app_proxy/

RUN pnpm install --frozen-lockfile --prod

FROM node:24-bookworm-slim

ARG BUILD_SHA
ARG BUILD_NUMBER
ARG BUILD_TIMESTAMP
ARG RELEASE_CHANNEL

WORKDIR /usr/src/app/noctis_app_proxy

RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	curl && \
	rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

COPY --from=deps /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=deps /usr/src/app/noctis_app_proxy/node_modules ./node_modules
COPY --from=deps /usr/src/app/packages /usr/src/app/packages
COPY --from=generator /usr/src/app/packages/config/src/ConfigSchema.json /usr/src/app/packages/config/src/ConfigSchema.json
COPY --from=generator /usr/src/app/packages/config/src/MasterZodSchema.generated.tsx /usr/src/app/packages/config/src/MasterZodSchema.generated.tsx
COPY tsconfigs /usr/src/app/tsconfigs
COPY noctis_app_proxy/package.json ./
COPY noctis_app_proxy/tsconfig.json ./
COPY noctis_app_proxy/src ./src

COPY apps/web/dist/ ./assets/

RUN mkdir -p /usr/src/app/.cache/corepack && \
	chown -R nobody:nogroup /usr/src/app

ENV HOME=/usr/src/app
ENV COREPACK_HOME=/usr/src/app/.cache/corepack
ENV NODE_ENV=production
ENV PORT=8080
ENV BUILD_SHA=${BUILD_SHA}
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV RELEASE_CHANNEL=${RELEASE_CHANNEL}

USER nobody

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
	CMD curl -f http://localhost:8080/_health || exit 1

CMD ["pnpm", "start"]
