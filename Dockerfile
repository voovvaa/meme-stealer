# ---------- СТАДИЯ 1: УСТАНОВКА ЗАВИСИМОСТЕЙ ----------
FROM oven/bun:latest AS deps

WORKDIR /app

# Кешируем зависимости
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


# ---------- СТАДИЯ 2: ПРОДАКШН ----------
FROM oven/bun:latest AS runner

WORKDIR /app

# Копируем зависимости (node_modules/bun_modules)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/bun.lock ./bun.lock
COPY --from=deps /app/package.json ./package.json

# Копируем исходники
COPY . .

RUN mkdir -p /app/sessions
VOLUME ["/app/sessions"]

CMD ["bun", "src/main.ts"]