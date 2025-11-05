#!/usr/bin/env tsx

/**
 * Скрипт миграции конфигурации из .env файлов в базу данных
 *
 * Использование:
 *   npm run migrate-config
 */

import dotenvFlow from "dotenv-flow";

import { configRepository } from "../core/db/configRepository.js";
import { logger } from "../core/logger.js";

dotenvFlow.config();

const splitEnvList = (value?: string): string[] =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

async function migrate() {
  try {
    logger.info("Начинается миграция конфигурации из .env в базу данных...");

    // Проверяем, есть ли уже конфигурация в БД
    const existingConfig = configRepository.getConfig();
    if (existingConfig) {
      logger.warn("Конфигурация уже существует в базе данных!");
      const answer = process.argv.includes("--force");

      if (!answer) {
        logger.warn("Используйте --force для перезаписи существующей конфигурации");
        process.exit(1);
      }

      logger.info("Перезапись существующей конфигурации...");
    }

    // Читаем переменные окружения
    const apiId = Number(process.env.API_ID);
    const apiHash = process.env.API_HASH;
    const phoneNumber = process.env.PHONE_NUMBER;
    const telegramPassword = process.env.TELEGRAM_PASSWORD || null;
    const targetChannelId = process.env.TARGET_CHANNEL_ID;
    const enableQueue = process.env.ENABLE_QUEUE === "true" || process.env.ENABLE_QUEUE === "1";
    const publishIntervalMin = Number(process.env.PUBLISH_INTERVAL_MIN) || 60;
    const publishIntervalMax = Number(process.env.PUBLISH_INTERVAL_MAX) || 300;

    // Валидация
    if (!apiId || !apiHash || !phoneNumber || !targetChannelId) {
      logger.error("Не все обязательные параметры заданы в .env");
      process.exit(1);
    }

    // Сохраняем основную конфигурацию
    configRepository.saveConfig({
      apiId,
      apiHash,
      phoneNumber,
      telegramPassword,
      targetChannelId,
      enableQueue,
      publishIntervalMin,
      publishIntervalMax,
    });

    logger.info("Основная конфигурация сохранена");

    // Мигрируем каналы-источники
    const sourceChannelIds = splitEnvList(process.env.SOURCE_CHANNEL_IDS);
    if (sourceChannelIds.length > 0) {
      logger.info(`Миграция ${sourceChannelIds.length} каналов-источников...`);

      for (const channelId of sourceChannelIds) {
        try {
          configRepository.addSourceChannel({ channelId, enabled: true });
        } catch (error) {
          if (error instanceof Error && error.message.includes("уже существует")) {
            logger.debug({ channelId }, "Канал уже существует, пропуск");
          } else {
            throw error;
          }
        }
      }

      logger.info(`Мигрировано каналов-источников: ${sourceChannelIds.length}`);
    }

    // Мигрируем ключевые слова для фильтрации
    const adKeywords = splitEnvList(process.env.AD_KEYWORDS);
    if (adKeywords.length > 0) {
      logger.info(`Миграция ${adKeywords.length} ключевых слов...`);

      for (const keyword of adKeywords) {
        try {
          configRepository.addFilterKeyword({ keyword, enabled: true });
        } catch (error) {
          if (error instanceof Error && error.message.includes("уже существует")) {
            logger.debug({ keyword }, "Ключевое слово уже существует, пропуск");
          } else {
            throw error;
          }
        }
      }

      logger.info(`Мигрировано ключевых слов: ${adKeywords.length}`);
    }

    // Сбрасываем флаг needs_reload
    configRepository.clearNeedsReload();

    logger.info("✅ Миграция успешно завершена!");
    logger.info("Теперь можно запускать бота. Он будет использовать конфигурацию из БД.");
    logger.info("Вы можете удалить переменные из .env (кроме MEME_DB_PATH, SESSION_STORAGE_PATH, LOG_LEVEL)");

  } catch (error) {
    logger.error({ err: error }, "Ошибка миграции");
    process.exit(1);
  }
}

migrate();
