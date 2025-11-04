import { TelegramClient } from "telegram";
import type { LogLevel } from "telegram/extensions/Logger";
import { StringSession } from "telegram/sessions/index.js";

import { registerChannelPostHandler } from "./handlers/postHandler.js";
import { ask } from "./helpers/prompt.js";
import { loadSessionString, saveSessionString } from "./helpers/sessionStorage.js";
import { env } from "../../core/config/env.js";
import { logger } from "../../core/logger.js";

const createClientInstance = (
  sessionString: string,
): { client: TelegramClient; stringSession: StringSession } => {
  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, env.apiId, env.apiHash, {
    connectionRetries: 10,
    requestRetries: 5,
    retryDelay: 2000,
    autoReconnect: true,
    timeout: 30,
  });

  return { client, stringSession };
};

const requestPhoneCode = async (): Promise<string> => {
  const code = await ask("Введите код подтверждения из Telegram:");
  if (!code) {
    logger.warn("Код подтверждения пуст, попробуйте снова.");
    return requestPhoneCode();
  }
  return code;
};

const resolvePassword = async (): Promise<string> => {
  if (env.telegramPassword) {
    return env.telegramPassword;
  }

  const answer = await ask(
    "Введите пароль двухфакторной аутентификации (оставьте пустым, если его нет):",
  );

  if (!answer) {
    logger.warn("Пароль 2FA не указан, возвращаем пустую строку.");
  }

  return answer;
};

const ensureAuthorization = async (client: TelegramClient) => {
  await client.start({
    phoneNumber: async () => env.phoneNumber,
    phoneCode: requestPhoneCode,
    password: resolvePassword,
    onError: (error) => {
      logger.error({ err: error }, "Ошибка авторизации MTProto клиента");
      throw error;
    },
  });

  logger.info("Авторизация MTProto клиента выполнена.");
};

export const initTelegramClient = async (): Promise<TelegramClient> => {
  const sessionString = await loadSessionString(env.sessionStoragePath);
  const { client, stringSession } = createClientInstance(sessionString);
  client.setLogLevel("warn" as LogLevel);

  await ensureAuthorization(client);

  const newSession = stringSession.save();
  if (newSession && newSession !== sessionString) {
    await saveSessionString(env.sessionStoragePath, newSession);
    logger.debug({ path: env.sessionStoragePath }, "Сессия обновлена и сохранена");
  }

  registerChannelPostHandler(client);

  const allowedSources = env.sourceChannelIds.map((x) => x.toString());
  logger.info({ sources: allowedSources, target: env.targetChannelId }, "MTProto клиент запущен.");

  return client;
};
