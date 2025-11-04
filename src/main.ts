import { logger } from "./core/logger";
import { initTelegramClient } from "./features/telegram/client";

const run = async () => {
  await initTelegramClient();
  logger.info("MTProto клиент успешно запущен и ожидает новые сообщения.");

  // 🧠 держим процесс живым, чтобы контейнер не завершался
  await new Promise(() => {});
};

run().catch((error) => {
  logger.error({ err: error }, "Критическая ошибка при запуске MTProto клиента");
  process.exit(1);
});
