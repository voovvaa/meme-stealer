import { initConfig } from "./core/config/env.js";
import { logger } from "./core/logger.js";
import { configWatcher } from "./core/services/configWatcher.js";
import { initTelegramClient } from "./features/telegram/client.js";

const run = async () => {
  // Инициализируем конфигурацию перед стартом
  await initConfig();
  logger.info("Конфигурация загружена");

  await initTelegramClient();
  logger.info("MTProto клиент успешно запущен и ожидает новые сообщения.");

  // Запускаем отслеживание изменений конфигурации
  configWatcher.start();
  logger.info("ConfigWatcher запущен и отслеживает изменения конфигурации");

  // 🧠 держим процесс живым, чтобы контейнер не завершался
  await new Promise(() => {});
};

run().catch((error) => {
  logger.error({ err: error }, "Критическая ошибка при запуске MTProto клиента");
  process.exit(1);
});
