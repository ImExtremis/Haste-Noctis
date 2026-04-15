ARG BUILD_SHA
ARG BUILD_NUMBER
ARG BUILD_TIMESTAMP
ARG RELEASE_CHANNEL=nightly

FROM node:24-bookworm-slim AS base

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY packages/ ./packages/
COPY noctis_admin/package.json ./noctis_admin/

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY tsconfigs /usr/src/app/tsconfigs
COPY noctis_admin/tsconfig.json ./noctis_admin/
COPY noctis_admin/src ./noctis_admin/src
COPY noctis_admin/public ./noctis_admin/public

WORKDIR /usr/src/app/noctis_admin
RUN pnpm --filter @noctis/config generate
RUN pnpm build:css

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY packages/ ./packages/
COPY noctis_admin/package.json ./noctis_admin/

RUN pnpm install --frozen-lockfile --prod

COPY --from=build /usr/src/app/packages/admin/public /usr/src/app/packages/admin/public

FROM node:24-bookworm-slim

ARG BUILD_SHA
ARG BUILD_NUMBER
ARG BUILD_TIMESTAMP
ARG RELEASE_CHANNEL

WORKDIR /usr/src/app/noctis_admin

RUN apt-get update && apt-get install -y --no-install-recommends \
	curl && \
	rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

COPY --from=prod-deps /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=prod-deps /usr/src/app/noctis_admin/node_modules ./node_modules
COPY --from=prod-deps /usr/src/app/packages /usr/src/app/packages
COPY --from=build /usr/src/app/packages/config/src/ConfigSchema.json /usr/src/app/packages/config/src/ConfigSchema.json
COPY --from=build /usr/src/app/packages/config/src/MasterZodSchema.generated.tsx /usr/src/app/packages/config/src/MasterZodSchema.generated.tsx
COPY tsconfigs /usr/src/app/tsconfigs
COPY --from=build /usr/src/app/noctis_admin/tsconfig.json ./tsconfig.json
COPY --from=build /usr/src/app/noctis_admin/src ./src
COPY --from=build /usr/src/app/noctis_admin/public ./public
COPY noctis_admin/package.json ./

RUN mkdir -p /usr/src/app/.cache/corepack && \
	chown -R nobody:nogroup /usr/src/app

ENV HOME=/usr/src/app
ENV COREPACK_HOME=/usr/src/app/.cache/corepack
ENV NODE_ENV=production
ENV NOCTIS_ADMIN_PORT=8080
ENV BUILD_SHA=${BUILD_SHA}
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV RELEASE_CHANNEL=${RELEASE_CHANNEL}

USER nobody

EXPOSE 8080

CMD ["pnpm", "start"]
