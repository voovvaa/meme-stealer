import { TelegramClient } from "telegram";
import { NewMessageEvent } from "telegram/events";
import { Api } from "telegram";
import { logger } from "../utils/logger";
import { config } from "../config/config";

export const handleNewMessage = async (
  client: TelegramClient,
  event: NewMessageEvent,
) => {
  try {
    const message = event.message;
    const sender = await message.getSender();

    if (sender instanceof Api.Channel) {
      const { title: channelTitle, username: channelUsername } = sender;

      if (
        message.media instanceof Api.MessageMediaPhoto &&
        message.media.photo
      ) {
        logger.info(`Получено фото из канала ${channelTitle}`);
        await client.sendFile(config.CHANEL_WITH_STEELED_MEM!, {
          file: message.media.photo,
          caption: `Фото из канала ${channelTitle}`,
        });
        logger.info("Фото успешно отправлено.");
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Ошибка обработки сообщения: ${err.message}`);
    }
  }
};
