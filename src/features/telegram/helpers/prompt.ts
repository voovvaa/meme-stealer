import { stdin as input, stdout as output } from "process";
import { createInterface } from "readline/promises";

import { logger } from "../../../core/logger";

const ttyErrorMessage =
  "TTY is required for interactive prompts. Provide a saved session or run the container with an interactive terminal.";

export const ask = async (question: string): Promise<string> => {
  if (!input.isTTY || !output.isTTY) {
    logger.error({ question }, "Попытка запросить ввод без интерактивного TTY");
    throw new Error(ttyErrorMessage);
  }

  const rl = createInterface({ input, output, terminal: true });
  try {
    const answer = await rl.question(`${question.trim()} `);
    return answer.trim();
  } finally {
    rl.close();
  }
};
