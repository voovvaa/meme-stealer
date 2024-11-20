import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { logger } from "../utils/logger";
import { config } from "../config/config";
// @ts-ignore
import input from "input";

export const initializeClient = (sessionString: string): TelegramClient => {
  return new TelegramClient(
    new StringSession(sessionString),
    config.API_ID,
    config.API_HASH!,
    {
      connectionRetries: 5,
    },
  );
};

export const authenticateClient = async (
  client: TelegramClient,
): Promise<string> => {
  await client.start({
    phoneNumber: config.PHONE_NUMBER!,
    password: async () => config.TELEGRAM_PASSWORD!,
    phoneCode: async () => await input.text("Введите код из Telegram: "),
    onError: (err) => {
      logger.error(`Ошибка авторизации: ${err.message}`);
      throw err;
    },
  });

  logger.info("Успешно вошли в аккаунт!");
  return client.session.save() as unknown as string;
};
