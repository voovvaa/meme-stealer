#!/bin/sh
set -e

# Цвета для вывода
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "${GREEN}[Web Entrypoint] Starting web interface...${NC}"

# Проверяем и создаем директорию sessions если нужно
if [ ! -d "/app/sessions" ]; then
    echo "${YELLOW}[Web Entrypoint] Creating /app/sessions directory...${NC}"
    mkdir -p /app/sessions
fi

# Устанавливаем права на директорию sessions для пользователя nextjs
echo "${YELLOW}[Web Entrypoint] Setting permissions for /app/sessions...${NC}"
chown -R nextjs:nodejs /app/sessions
chmod -R 755 /app/sessions

# Запускаем приложение от пользователя nextjs
echo "${GREEN}[Web Entrypoint] Starting Next.js server as nextjs user...${NC}"
exec gosu nextjs node server.js
