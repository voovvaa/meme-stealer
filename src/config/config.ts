import dotenv from "dotenv";

dotenv.config();

export const config = {
  CHANEL_WITH_STEELED_MEM_USERNAME:
    process.env.CHANEL_WITH_STEELED_MEM_USERNAME!,
  CHANEL_TO_PUBLISH: process.env.CHANEL_TO_PUBLISH!,
  ALLOWED_CHANEL:
    (process.env.ALLOWED_CHANEL && process.env.ALLOWED_CHANEL.split(",")) || [],
  client: {
    API_ID: Number(process.env.API_ID),
    API_HASH: process.env.API_HASH!,
    SESSION_FILE: "sessionClient.txt",
    PHONE_NUMBER: process.env.PHONE_NUMBER!,
    TELEGRAM_PASSWORD: process.env.TELEGRAM_PASSWORD!,
  },
  bot: {
    TOKEN: process.env.BOT_TOKEN!,
  },
};

if (
  !config.client.API_ID ||
  !config.client.API_HASH ||
  !config.client.PHONE_NUMBER ||
  !config.client.TELEGRAM_PASSWORD ||
  !config.bot.TOKEN ||
  !config.CHANEL_WITH_STEELED_MEM_USERNAME ||
  !config.CHANEL_TO_PUBLISH
) {
  throw new Error("Необходимо задать все переменные окружения в .env");
}
