#!/bin/sh
set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}[Entrypoint] Starting meme-stealer...${NC}"

# Проверяем существование директории sessions
if [ ! -d "/app/sessions" ]; then
    echo "${YELLOW}[Entrypoint] Creating /app/sessions directory...${NC}"
    mkdir -p /app/sessions
fi

# Устанавливаем права доступа на директорию sessions
echo "${YELLOW}[Entrypoint] Setting permissions for /app/sessions...${NC}"
chown -R nodejs:nodejs /app/sessions
chmod -R 755 /app/sessions

# Если есть файл базы данных, устанавливаем на него права
if [ -f "/app/sessions/memes.sqlite" ]; then
    echo "${YELLOW}[Entrypoint] Setting permissions for database file...${NC}"
    chown nodejs:nodejs /app/sessions/memes.sqlite
    chmod 644 /app/sessions/memes.sqlite
fi

# Переключаемся на пользователя nodejs и запускаем приложение
echo "${GREEN}[Entrypoint] Starting application as nodejs user...${NC}"
exec gosu nodejs node dist/main.js
