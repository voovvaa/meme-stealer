import { stdin as input, stdout as output } from "process";
import { createInterface } from "readline/promises";
import { logger } from "../../core/logger.js";

export const ask = async (question: string): Promise<string> => {
  logger.info({ question, isTTY: input.isTTY }, "Создаем readline интерфейс...");

  try {
    const rl = createInterface({ input, output, terminal: false }); // terminal: false для неинтерактивного режима
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
