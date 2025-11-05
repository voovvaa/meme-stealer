# Инструкция по запуску миграций

## Вариант 1: Внутри контейнера

1. Зайдите в контейнер бота:
```bash
docker exec -it meme-stealer-bot sh
```

2. Запустите миграции:
```bash
sqlite3 /app/sessions/memes.sqlite < /app/migrations.sql
```

3. Выйдите из контейнера:
```bash
exit
```

4. Перезапустите контейнеры:
```bash
docker-compose restart
```

## Вариант 2: На хосте (Synology)

1. Перейдите в директорию проекта:
```bash
cd /volume1/docker/meme-stealer
```

2. Запустите миграции напрямую:
```bash
sqlite3 sessions/memes.sqlite < migrations.sql
```

3. Перезапустите контейнеры:
```bash
docker-compose restart
```

## Проверка

После запуска миграций можно проверить структуру таблиц:

```bash
sqlite3 sessions/memes.sqlite "PRAGMA table_info(source_channels);"
sqlite3 sessions/memes.sqlite "PRAGMA table_info(filter_keywords);"
sqlite3 sessions/memes.sqlite "PRAGMA table_info(memes);"
```

Должны быть видны колонки:
- `source_channels.archived`
- `filter_keywords.archived`
- `memes.file_path`

## Примечание

Если какая-то колонка уже существует, SQLite выдаст ошибку "duplicate column name" - это нормально, просто пропустите эту миграцию.
