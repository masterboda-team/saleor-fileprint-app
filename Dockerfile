FROM node:20-bullseye AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apt install --no-cache libc6-compat
WORKDIR /app

# Get PNPM version from package.json
RUN export PNPM_VERSION=$(cat package.json | jq '.engines.pnpm' | sed -E 's/[^0-9.]//g')

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@$PNPM_VERSION
RUN pnpm i --frozen-lockfile --prefer-offline

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

ENV NEXT_OUTPUT=standalone

ARG APL_FILE_PATH
ENV APL_FILE_PATH=${APL_FILE_PATH}

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

ARG SALEOR_API_URL
ENV SALEOR_API_URL=${SALEOR_API_URL}

ARG SALEOR_APP_TOKEN
ENV SALEOR_APP_TOKEN=${SALEOR_APP_TOKEN}

ARG SALEOR_APP_ID
ENV SALEOR_APP_ID=${SALEOR_APP_ID}

ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}

ARG NEXT_MEDIA_DIR
ENV NEXT_MEDIA_DIR=${NEXT_MEDIA_DIR}

ARG NEXT_BASE_PATH
ENV NEXT_BASE_PATH=${NEXT_BASE_PATH}

ENV ALLOW_ALL_CORS=true

# Get PNPM version from package.json
RUN export PNPM_VERSION=$(cat package.json | jq '.engines.pnpm' | sed -E 's/[^0-9.]//g')
RUN npm install -g pnpm@$PNPM_VERSION

# Generate Prisma client
RUN pnpm prisma generate

# Install mupdf
RUN apt update && apt install -y mupdf-tools libvips-dev libvips
# RUN pnpm add @img/sharp-libvips-linuxmusl-x64
# RUN pnpm add sharp

RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

ARG APL_FILE_PATH
ENV APL_FILE_PATH=${APL_FILE_PATH}

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

ARG SALEOR_API_URL
ENV SALEOR_API_URL=${SALEOR_API_URL}

ARG SALEOR_APP_TOKEN
ENV SALEOR_APP_TOKEN=${SALEOR_APP_TOKEN}

ARG SALEOR_APP_ID
ENV SALEOR_APP_ID=${SALEOR_APP_ID}

ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}

ARG NEXT_MEDIA_DIR
ENV NEXT_MEDIA_DIR=${NEXT_MEDIA_DIR}

ARG NEXT_BASE_PATH
ENV NEXT_BASE_PATH=${NEXT_BASE_PATH}

ENV ALLOW_ALL_CORS=true

RUN apt update && apt install -y mupdf-tools libvips-dev libvips

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# RUN mkdir -p /app/media && chown -R nextjs:nodejs /app/media && chmod -R 755 /app/media

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# USER nextjs

CMD ["node", "server.js"]
