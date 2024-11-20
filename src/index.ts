import { NewMessage } from "telegram/events";
import { logger } from "./utils/logger";
import { config } from "./config/config";
import {
  authenticateClient,
  initializeClient,
} from "./services/telegramClient";
import { handleNewMessage } from "./services/messageClientHandler";
import { loadSession, saveSession } from "./utils/session";
import TelegramBot from "node-telegram-bot-api";
import { handleCallbackQueryServices } from "./services/handleCallbackQuery";

const bot = new TelegramBot(config.bot.TOKEN, { polling: true });


const clientSessionFilePath = config.client.SESSION_FILE;

handleCallbackQueryServices(bot);

(async () => {
  const clientSessionString = loadSession(clientSessionFilePath);

  const client = initializeClient(clientSessionString);

  try {
    logger.info("Запуск клиента и бота");
    const newClientSessionString = await authenticateClient(client);

    // Сохранение обновленных сессий
    saveSession(clientSessionFilePath, newClientSessionString);

    client.addEventHandler(
      (event) => handleNewMessage(client, event, bot),
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
