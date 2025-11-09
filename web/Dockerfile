FROM node:22-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files from web directory (context is now project root)
COPY web/package*.json ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# HACK: Copy bot types so web can import them via @bot-types/*
# Web's tsconfig.json has: "@bot-types/*": ["../src/types/*"]
# So we copy src/types to /src/types (parent of /app)
COPY src/types /src/types

# Copy all web source code
COPY web/ .

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

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint
COPY web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3333

ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

# Entrypoint установит права и запустит сервер от nextjs
ENTRYPOINT ["/docker-entrypoint.sh"]
