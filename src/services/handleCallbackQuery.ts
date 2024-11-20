import TelegramBot from "node-telegram-bot-api";
import { logger } from "../utils/logger";
import { config } from "../config/config";

const handleCallbackQuery = async (
  bot: TelegramBot,
  callbackQuery: TelegramBot.CallbackQuery,
) => {
  const { data, message } = callbackQuery;

  if (data === "publish_image" && message) {
    const photoId = message.photo
      ? message.photo[message.photo.length - 1].file_id
      : null;
    if (photoId) {
      try {
        await bot.sendPhoto(config.CHANEL_TO_PUBLISH, photoId);
        logger.info(
          `Фото опубликовано в канале ${config.CHANEL_TO_PUBLISH} file_id: ${photoId}`,
        );

        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Фото успешно опубликовано!",
        });
      } catch (error) {
        logger.error(`Ошибка при публикации фото: ${(error as Error).message}`);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ошибка при публикации.",
        });
      }
    }
  }
};

export const handleCallbackQueryServices = (bot: TelegramBot) => {
  bot.on("callback_query", (callbackQuery) => {
    logger.info(`Получен callback_query: ${callbackQuery.data}`);
    handleCallbackQuery(bot, callbackQuery);
  });

  logger.info("Обработчики Telegram бота успешно инициализированы");
};
