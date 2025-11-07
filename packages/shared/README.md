# @meme-stealer/shared

Общий пакет для переиспользования кода между Telegram ботом и веб-админкой.

## Содержание

- **types** - TypeScript типы для всех сущностей
- **schemas** - Zod схемы для валидации входных данных
- **database** - Единое подключение к БД
- **repositories** - Репозитории для работы с данными
- **constants** - Константы приложения
- **utils** - Утилиты (transformers, validation)

## Использование

### Типы

```typescript
import { Config, SourceChannel, FilterKeyword, Post } from "@meme-stealer/shared";
```

### Валидация

```typescript
import {
  SourceChannelInputSchema,
  validate
} from "@meme-stealer/shared";

const result = validate(SourceChannelInputSchema, userInput);

if (!result.success) {
  console.error(result.error, result.details);
  return;
}

// result.data is typed and validated
const channel = result.data;
```

### Репозитории

```typescript
import {
  getDatabase,
  initializeDatabase,
  ChannelRepository
} from "@meme-stealer/shared";

// Инициализация БД
const db = getDatabase({ path: "./db.sqlite" });
initializeDatabase(db, { logger });

// Использование репозитория
const channelRepo = new ChannelRepository(db);
const channels = channelRepo.getAll();
```

### Константы

```typescript
import { PAGINATION, TIMELINE, CONFIG } from "@meme-stealer/shared";

console.log(PAGINATION.MAX_LIMIT); // 1000
console.log(TIMELINE.DEFAULT_DAYS); // 30
```

## Схемы валидации

### ConfigInputSchema
Валидация конфигурации бота:
- apiId: positive integer
- apiHash: string (1-255 chars)
- phoneNumber: valid phone format
- publishIntervalMin: 10-3600 seconds
- publishIntervalMax: 60-86400 seconds

### SourceChannelInputSchema
Валидация канала-источника:
- channelId: valid Telegram channel ID
- channelName: optional string (1-255 chars)
- enabled: boolean (default: true)

### FilterKeywordInputSchema
Валидация ключевого слова:
- keyword: string (1-255 chars), auto-lowercased and trimmed
- enabled: boolean (default: true)

### Query Schemas
- **PaginationSchema**: limit + offset валидация
- **GalleryPaginationSchema**: пагинация для галереи + hash filter
- **TimelineDaysSchema**: валидация days параметра (1-365)
- **IdParamSchema**: валидация ID параметра в URL

## Репозитории

### ConfigRepository
- `getConfig()` - получить конфигурацию
- `saveConfig(config)` - сохранить конфигурацию
- `setNeedsReload()` - установить флаг перезагрузки
- `clearNeedsReload()` - очистить флаг

### ChannelRepository
- `getAll()` - все каналы (включая архивные)
- `getEnabled()` - только активные каналы
- `add(input)` - добавить канал
- `update(id, input)` - обновить канал
- `archive(id)` - архивировать (soft delete)
- `unarchive(id)` - разархивировать
- `delete(id)` - удалить навсегда

### KeywordRepository
Аналогичный API как у ChannelRepository

### MemeRepository
- `hasHash(hash)` - проверить существование хеша
- `save(record)` - сохранить пост
- `getAll(limit, offset)` - получить с пагинацией
- `getByHash(hash)` - получить по хешу
- `getCount()` - общее количество
- `getPublishedCount()` - количество опубликованных

### StatsRepository
- `getMemeStats()` - общая статистика
- `getChannelStats()` - статистика по каналам
- `getTimelineStats(days)` - временная шкала
- `getGalleryPosts(limit, offset)` - посты для галереи
- `getGalleryPostsCount()` - количество постов в галерее
