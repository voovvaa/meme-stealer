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

# Устанавливаем права 775 на директорию (владелец и группа могут писать)
chmod 775 /app/sessions

# Устанавливаем права на все файлы в директории sessions
# Это гарантирует, что nodejs сможет читать/изменять/удалять любые файлы
find /app/sessions -type f -exec chmod 664 {} \;
find /app/sessions -type f -exec chown nodejs:nodejs {} \;

# Создаем и устанавливаем права на директорию media
if [ ! -d "/app/media" ]; then
    echo "${YELLOW}[Entrypoint] Creating /app/media directory...${NC}"
    mkdir -p /app/media
fi
echo "${YELLOW}[Entrypoint] Setting permissions for /app/media...${NC}"
chown -R nodejs:nodejs /app/media
chmod 775 /app/media

# Устанавливаем права на все файлы в директории media
find /app/media -type f -exec chmod 664 {} \;
find /app/media -type f -exec chown nodejs:nodejs {} \;

# Переключаемся на пользователя nodejs и запускаем приложение
echo "${GREEN}[Entrypoint] Starting application as nodejs user...${NC}"
exec gosu nodejs node dist/main.js
