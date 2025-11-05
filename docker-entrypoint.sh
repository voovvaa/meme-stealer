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

# Если есть файл сессии, устанавливаем на него права
if [ -f "/app/sessions/client.session" ]; then
    echo "${YELLOW}[Entrypoint] Setting permissions for session file...${NC}"
    chown nodejs:nodejs /app/sessions/client.session
    chmod 644 /app/sessions/client.session
fi

# Создаем и устанавливаем права на директорию media
if [ ! -d "/app/media" ]; then
    echo "${YELLOW}[Entrypoint] Creating /app/media directory...${NC}"
    mkdir -p /app/media
fi
echo "${YELLOW}[Entrypoint] Setting permissions for /app/media...${NC}"
chown -R nodejs:nodejs /app/media
chmod -R 755 /app/media

# Запуск миграций базы данных
echo "${GREEN}[Entrypoint] Running database migrations...${NC}"
gosu nodejs node dist/scripts/runMigrations.js
if [ $? -ne 0 ]; then
    echo "${RED}[Entrypoint] Migrations failed! Exiting...${NC}"
    exit 1
fi
echo "${GREEN}[Entrypoint] Migrations completed successfully${NC}"

# Переключаемся на пользователя nodejs и запускаем приложение
echo "${GREEN}[Entrypoint] Starting application as nodejs user...${NC}"
exec gosu nodejs node dist/main.js
