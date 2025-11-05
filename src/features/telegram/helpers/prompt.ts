import { stdin as input, stdout as output } from "process";
import { createInterface } from "readline/promises";
import { readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { logger } from "../../../core/logger.js";

const AUTH_CODE_FILE = path.join(process.cwd(), "sessions", "auth_code.txt");
const AUTH_PASSWORD_FILE = path.join(process.cwd(), "sessions", "auth_password.txt");

/**
 * Ждет файл с кодом авторизации (для Docker без TTY)
 */
const waitForAuthFile = async (filePath: string, timeout: number = 180000): Promise<string> => {
  logger.info({ filePath, timeoutSec: timeout / 1000 }, "Ожидаем файл с кодом авторизации...");

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (existsSync(filePath)) {
      try {
        const content = await readFile(filePath, "utf-8");
        await unlink(filePath); // Удаляем файл после чтения
        const code = content.trim();
        if (code) {
          logger.info({ codeLength: code.length }, "Код получен из файла");
          return code;
        }
      } catch (error) {
        logger.error({ error }, "Ошибка чтения файла с кодом");
      }
    }

    // Ждем 1 секунду перед следующей проверкой
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Таймаут ожидания кода авторизации");
};

export const ask = async (question: string): Promise<string> => {
  logger.info({ question, isTTY: input.isTTY }, "Запрос ввода...");

  // Определяем какой файл использовать
  const isPasswordRequest = question.toLowerCase().includes("пароль");
  const authFile = isPasswordRequest ? AUTH_PASSWORD_FILE : AUTH_CODE_FILE;

  // В Docker без TTY используем файловый метод
  if (!input.isTTY) {
    logger.info({ authFile }, "TTY недоступен, используем файловый метод");
    logger.warn("⚠️  Откройте веб-интерфейс и перейдите на /auth для ввода кода авторизации");
    return await waitForAuthFile(authFile);
  }

  // Если TTY доступен - используем стандартный readline
  try {
    const rl = createInterface({ input, output, terminal: false });
    logger.info("Readline создан, задаем вопрос...");

    const answer = await rl.question(`${question.trim()} `);
    logger.info({ answerLength: answer.length }, "Получен ответ");

    rl.close();
    return answer.trim();
  } catch (error) {
    logger.error({ err: error, question }, "Ошибка при запросе ввода");
    throw error;
  }
};
