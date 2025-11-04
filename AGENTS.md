# Repository Guidelines

## Project Structure & Module Organization
Основная точка входа — `src/main.ts`, она инициализирует MTProto-клиента. Конфигурация, логирование и база размещены в `src/core` (`config/env.ts`, `logger.ts`, `db/memeRepository.ts`). MTProto-специфичная логика лежит в `src/features/telegram`: `client.ts` отвечает за авторизацию и старт клиента, `handlers/postHandler.ts` обрабатывает новые сообщения, `helpers/` содержит фильтр рекламы, матчинг каналов и работу с сессиями. Общие утилиты (в том числе хеширование) находятся в `src/utils`. Собранные артефакты попадают в `dist/`; новые runtime-модули добавляйте в `src/`, придерживаясь feature-based структуры.

## Build, Test, and Development Commands
Проект запускается через Node.js: `npm run dev` стартует приложение в dev-режиме, `npm run build` собирает бандл в `dist/`. Проверки качества: `npm run lint` (ESLint) и `npm run format` (Prettier). Перед коммитами убедитесь, что сборка и линтер проходят без ошибок.

## Coding Style & Naming Conventions
Код пишем на TypeScript (ESM). Используем Prettier с настройками из `.prettierrc` (точка с запятой, двойные кавычки, `printWidth=100`). ESLint конфигурирован с правилами `@typescript-eslint`, `import` и `unused-imports`; контролируйте порядок импортов и избегайте неиспользуемых сущностей. Файлы называем в `camelCase`/`kebab-case`, экспортируемые сущности — `camelCase` для функций и `PascalCase` для классов.

## Testing Guidelines
Автотестов пока нет. При добавлении функциональности создавайте интеграционные тесты, эмулируя MTProto-вызовы (можно через заглушки GramJS). Фиксируйте ручные проверки в PR, особенно для сценариев авторизации, копирования медиа и проверки дедупликации.

## Commit & Pull Request Guidelines
Следуем шаблону `<type>: <описание>` в нижнем регистре (`feature:`, `fix:`, `chore:` и т.д.). В коммитах избегаем лишних файлов (например, сессий). Для PR предоставляйте краткое описание изменений, перечисляйте запущенные команды (`npm run lint`, `npm run build`) и при необходимости прикладывайте логи клиентов. Ссылайтесь на задачи/тикеты.

## Environment & Secrets
Используем `.env` (из `dotenv-flow`), пример — `.env.example`. Обязательные переменные: `API_ID`, `API_HASH`, `PHONE_NUMBER`, `TARGET_CHANNEL_ID`, `SOURCE_CHANNEL_IDS`. По необходимости задайте `TELEGRAM_PASSWORD`, список `AD_KEYWORDS`, `SESSION_STORAGE_PATH` и `MEME_DB_PATH`. Файлы сессий и баз данных (каталог `sessions/`, включая `memes.sqlite`) не коммитим; обновления `.gitignore` делаем при добавлении новых чувствительных артефактов.
