import { env, initConfig } from "./core/config/env.js";
import { logger } from "./core/logger.js";
import { configWatcher } from "./core/services/configWatcher.js";
import { createTelegramClientCleanup, registerCleanup, setupShutdownHandlers } from "./core/shutdown.js";
import { initTelegramClient } from "./features/telegram/client.js";
import { registerChannelPostHandler } from "./features/telegram/handlers/postHandler.js";
import { PostQueue } from "./features/telegram/services/postQueue.js";

/**
 * Главная функция приложения
 */
const run = async () => {
  // Инициализируем конфигурацию перед стартом
  await initConfig();
  logger.info("Конфигурация загружена");

  // Инициализируем Telegram клиент и очередь
  let { client, postQueue } = await initTelegramClient();
  logger.info("MTProto клиент успешно запущен и ожидает новые сообщения");

  // Отслеживаем текущее состояние очереди
  let currentQueueEnabled = env.enableQueue;

  // Регистрируем cleanup для Telegram клиента
  registerCleanup(createTelegramClientCleanup(client));

  // Регистрируем cleanup для ConfigWatcher
  registerCleanup(() => {
    configWatcher.stop();
  });

  // Регистрируем cleanup для PostQueue
  registerCleanup(() => {
    if (postQueue) {
      postQueue.stop();
    }
  });

  // Регистрируем callback для перерегистрации обработчика при изменении конфигурации
  configWatcher.onReload(() => {
    logger.info("Перерегистрация обработчика постов после перезагрузки конфигурации");

    // Проверяем, изменилась ли настройка очереди
    if (env.enableQueue !== currentQueueEnabled) {
      logger.info(
        { oldValue: currentQueueEnabled, newValue: env.enableQueue },
        "Обнаружено изменение настройки enableQueue",
      );

      if (env.enableQueue) {
        // Очередь была выключена, теперь включается
        if (postQueue) {
          postQueue.stop();
        }
        postQueue = new PostQueue(client);
        postQueue.start();
        logger.info("Очередь публикаций включена и запущена");
      } else {
        // Очередь была включена, теперь выключается
        if (postQueue) {
          postQueue.stop();
          postQueue = undefined;
          logger.info("Очередь публикаций остановлена");
        }
      }

      currentQueueEnabled = env.enableQueue;
    }

    // Перерегистрируем обработчик с актуальной очередью
    registerChannelPostHandler(client, postQueue);
  });

  // Запускаем отслеживание изменений конфигурации
  configWatcher.start();
  logger.info("ConfigWatcher запущен и отслеживает изменения конфигурации");

  // Устанавливаем обработчики сигналов завершения
  setupShutdownHandlers();

  logger.info("Бот успешно запущен и готов к работе");
};

// Запускаем приложение
run().catch((error) => {
  logger.error({ err: error }, "Критическая ошибка при запуске приложения");
  process.exit(1);
});
