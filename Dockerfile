# ---------- STAGE 1: DEPENDENCIES ----------
FROM node:20-bullseye-slim AS deps

WORKDIR /app

# Установка системных зависимостей для сборки native модулей
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copy and build shared package first
COPY packages/shared/package*.json ./packages/shared/
WORKDIR /app/packages/shared
RUN npm ci

COPY packages/shared ./
RUN npm run build

# Копируем только файлы зависимостей бота для кэширования слоя
WORKDIR /app
COPY package.json package-lock.json ./

# Устанавливаем все зависимости (включая dev) для сборки
RUN npm ci

# ---------- STAGE 2: BUILD ----------
FROM deps AS builder

WORKDIR /app

# Копируем built shared package
COPY --from=deps /app/packages/shared ./packages/shared

# Копируем исходный код бота
COPY . .

# Собираем проект
RUN npm run build

# ---------- STAGE 3: PRODUCTION DEPENDENCIES ----------
FROM node:20-bullseye-slim AS prod-deps

WORKDIR /app

# Установка системных зависимостей для сборки native модулей
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

# Copy built shared package
COPY packages/shared/package*.json ./packages/shared/
WORKDIR /app/packages/shared
RUN npm ci --omit=dev

COPY packages/shared ./
RUN npm run build

# Копируем package files бота
WORKDIR /app
COPY package.json package-lock.json ./

# Устанавливаем только production зависимости
RUN npm ci --omit=dev && npm cache clean --force

# ---------- STAGE 4: RUNTIME ----------
FROM node:20-bullseye-slim AS runner

# Метаданные образа
LABEL org.opencontainers.image.title="Meme Stealer"
LABEL org.opencontainers.image.description="Telegram meme aggregator bot"
LABEL org.opencontainers.image.vendor="voovvaa"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Устанавливаем gosu для безопасного переключения пользователя
RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/* \
  && gosu nobody true

# Создаем non-root пользователя для безопасности
# Используем фиксированный GID 1001 для совместимости с веб-контейнером
RUN groupadd -r -g 1001 nodejs && useradd -r -u 1001 -g nodejs nodejs

# Устанавливаем переменные окружения
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512"

# Копируем shared package
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/shared ./packages/shared

# Копируем production зависимости
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Копируем собранный код
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

# Копируем entrypoint скрипт
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Создаем директорию для сессий
RUN mkdir -p /app/sessions && chown -R nodejs:nodejs /app/sessions

# Объявляем volume
VOLUME ["/app/sessions"]

# Expose port для healthcheck (если будет добавлен)
# EXPOSE 3000

# Healthcheck (проверка что процесс запущен)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('fs').statSync('/app/sessions')" || exit 1

# Используем entrypoint для установки прав доступа
ENTRYPOINT ["docker-entrypoint.sh"]
