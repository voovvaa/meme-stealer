FROM node:22-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy and build shared package first
COPY packages/shared/package*.json ./packages/shared/
WORKDIR /app/packages/shared
RUN npm ci

COPY packages/shared ./
RUN npm run build

# Copy and install web dependencies
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy built shared package
COPY --from=deps /app/packages/shared ./packages/shared

# Copy web with dependencies
WORKDIR /app/web
COPY --from=deps /app/web/node_modules ./node_modules
COPY web .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install gosu for step-down from root
RUN apk add --no-cache gosu

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs --ingroup nodejs

# Copy necessary files from standalone output
COPY --from=builder /app/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./.next/static

# Copy shared package with compiled code and dependencies
COPY --from=builder --chown=nextjs:nodejs /app/packages/shared ./packages/shared

# Copy better-sqlite3 native bindings to the correct location
# The standalone build expects dependencies in /app/node_modules/
COPY --from=builder --chown=nextjs:nodejs /app/web/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Copy entrypoint
COPY web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3333

ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

# Entrypoint установит права и запустит сервер от nextjs
ENTRYPOINT ["/docker-entrypoint.sh"]
