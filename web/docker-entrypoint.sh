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
# Важно: используем 775 для директорий и 664 для файлов, чтобы оба контейнера (bot и web)
# могли читать и писать в общие файлы (особенно SQLite базу данных)
echo "${YELLOW}[Web Entrypoint] Setting permissions for /app/sessions...${NC}"
chown -R nextjs:nodejs /app/sessions
# Устанавливаем 775 для директорий (rwxrwxr-x)
find /app/sessions -type d -exec chmod 775 {} \;
# Устанавливаем 664 для файлов (rw-rw-r--) - важно для SQLite WAL файлов
find /app/sessions -type f -exec chmod 664 {} \;

# Запускаем приложение от пользователя nextjs
echo "${GREEN}[Web Entrypoint] Starting Next.js server as nextjs user...${NC}"
cd /app/web
exec gosu nextjs npx next start
