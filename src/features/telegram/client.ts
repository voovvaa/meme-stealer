import { TelegramClient } from "telegram";
import { LogLevel } from "telegram/extensions/Logger";
import { StringSession } from "telegram/sessions";

import { registerChannelPostHandler } from "./handlers/postHandler";
import { ask } from "./helpers/prompt";
import { loadSessionString, saveSessionString } from "./helpers/sessionStorage";
import { env } from "../../core/config/env";
import { logger } from "../../core/logger";

const createClientInstance = (
  sessionString: string,
): { client: TelegramClient; stringSession: StringSession } => {
  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, env.apiId, env.apiHash, {
    connectionRetries: 5,
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
  logger.info(
    { path: env.sessionStoragePath, hasSession: sessionString.length > 0 },
    "Загружаем строку сессии MTProto",
  );

  if (sessionString.length === 0) {
    logger.warn(
      { path: env.sessionStoragePath },
      "Сохранённая сессия не найдена. Потребуется интерактивная авторизация.",
    );
  } else {
    logger.info("Используем ранее сохранённую сессию MTProto.");
  }

  const { client, stringSession } = createClientInstance(sessionString);
  client.setLogLevel(LogLevel.WARN);

  logger.info("Запускаем авторизацию MTProto клиента…");

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
