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

# Настройка доступа к Docker socket
if [ -S /var/run/docker.sock ]; then
    echo "${YELLOW}[Web Entrypoint] Configuring Docker socket access...${NC}"
    # Получаем GID группы, владеющей docker.sock
    DOCKER_SOCK_GID=$(stat -c '%g' /var/run/docker.sock)
    echo "${YELLOW}[Web Entrypoint] Docker socket GID: ${DOCKER_SOCK_GID}${NC}"

    # Создаем группу docker с таким же GID, если её нет
    if ! getent group docker >/dev/null 2>&1; then
        addgroup -g "${DOCKER_SOCK_GID}" docker
    fi

    # Добавляем пользователя nextjs в группу docker
    addgroup nextjs docker
    echo "${GREEN}[Web Entrypoint] User nextjs added to docker group${NC}"
else
    echo "${YELLOW}[Web Entrypoint] Warning: Docker socket not found at /var/run/docker.sock${NC}"
    echo "${YELLOW}[Web Entrypoint] Docker management features will not be available${NC}"
fi

# Запускаем приложение от пользователя nextjs
echo "${GREEN}[Web Entrypoint] Starting Next.js server as nextjs user...${NC}"
exec gosu nextjs node server.js
