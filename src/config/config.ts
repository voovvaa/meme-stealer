import dotenv from "dotenv";

dotenv.config();

export const config = {
  API_ID: Number(process.env.API_ID),
  API_HASH: process.env.API_HASH,
  SESSION_FILE: "session.txt",
  CHANEL_WITH_STEELED_MEM: process.env.CHANEL_WITH_STEELED_MEM,
  ALLOWED_CHANEL:
    (process.env.ALLOWED_CHANEL && process.env.ALLOWED_CHANEL.split(",")) || [],
  PHONE_NUMBER: process.env.PHONE_NUMBER,
  TELEGRAM_PASSWORD: process.env.TELEGRAM_PASSWORD,
};

if (
  !config.API_ID ||
  !config.API_HASH ||
  !config.CHANEL_WITH_STEELED_MEM ||
  !config.PHONE_NUMBER ||
  !config.TELEGRAM_PASSWORD
) {
  throw new Error("Необходимо задать все переменные окружения в .env");
}
