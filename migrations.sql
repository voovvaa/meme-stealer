-- Миграции для meme-stealer
-- Запустить руками внутри контейнера или подключившись к SQLite БД

-- 1. Добавляем колонку archived в source_channels (если её нет)
ALTER TABLE source_channels ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_source_channels_archived ON source_channels(archived);

-- 2. Добавляем колонку archived в filter_keywords (если её нет)
ALTER TABLE filter_keywords ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_filter_keywords_archived ON filter_keywords(archived);

-- 3. Добавляем колонку file_path в memes (если её нет)
ALTER TABLE memes ADD COLUMN file_path TEXT;

-- Готово! После выполнения можно перезапустить контейнеры
