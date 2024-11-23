import { TelegramClient } from "telegram";
import { NewMessageEvent } from "telegram/events";
import { Api } from "telegram";
import { logger } from "../utils/logger";
import TelegramBot from "node-telegram-bot-api";
import { config } from "../config/config";

const getSendingOption = (
  title: string,
  id: number,
  username?: string,
): TelegramBot.SendPhotoOptions => {
  const inlineKeyboard: TelegramBot.InlineKeyboardButton[][] = [
    [
      {
        text: "🤙 Опубликовать",
        callback_data: "publish_image",
      },
    ],
  ];

  if (username) {
    inlineKeyboard.push([
      {
        text: `${title}`,
        url: `https://t.me/${username}/${id}`,
      },
    ]);
  }

  return {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  };
};
export const handleNewMessage = async (
  client: TelegramClient,
  event: NewMessageEvent,
  bot: TelegramBot,
) => {
  try {
    const message = event.message;
    const sender = await message.getSender();

    if (message.text.toLowerCase().includes("реклама")) {
      logger.info("Получено сообщение с рекламой, скип");
      return;
    }

    if (sender instanceof Api.Channel) {
      const { title: channelTitle, username: chanelUsername } = sender;

      if (
        message.media instanceof Api.MessageMediaPhoto &&
        message.media.photo
      ) {
        logger.info(`Получено фото из канала ${channelTitle}`);

        const photoBuffer = await client.downloadMedia(message.media);

        if (photoBuffer) {
          bot.sendPhoto(
            `@${config.CHANEL_WITH_STEELED_MEM_USERNAME}`,
            photoBuffer,
            getSendingOption(channelTitle, message.id, chanelUsername),
            { filename: crypto.randomUUID(), contentType: "image/*" },
          );
        }

        logger.info("Фото отправлено в ворованные мемы.");
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Ошибка обработки сообщения: ${err.message}`);
    }
  }
};
