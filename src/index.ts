import fs from "fs";
import { NewMessage } from "telegram/events";
import { logger } from "./utils/logger";
import { config } from "./config/config";
import {
  authenticateClient,
  initializeClient,
} from "./services/telegramClient";
import { handleNewMessage } from "./services/messageHandler";

const sessionFilePath = config.SESSION_FILE;
let sessionString = "";

if (fs.existsSync(sessionFilePath)) {
  sessionString = fs.readFileSync(sessionFilePath, "utf-8");
  logger.info("Сессия загружена из файла.");
} else {
  logger.info("Сессия не найдена, потребуется авторизация.");
}

(async () => {
  const client = initializeClient(sessionString);

  try {
    logger.info("Запуск клиента...");
    const newSessionString = await authenticateClient(client);

    if (newSessionString) {
      fs.writeFileSync(sessionFilePath, newSessionString, "utf-8");
      logger.info("Сессия успешно сохранена.");
    }

    client.addEventHandler(
      (event) => handleNewMessage(client, event),
      // Слушаем только определенные каналы
      new NewMessage({ chats: config.ALLOWED_CHANEL }),
    );
    logger.info("Бот успешно запущен и ожидает новые сообщения.");
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Ошибка запуска бота: ${err.message}`);
    }
  }
})();
