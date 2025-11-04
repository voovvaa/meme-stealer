import { stdin as input, stdout as output } from "process";
import { createInterface } from "readline/promises";

export const ask = async (question: string): Promise<string> => {
  const rl = createInterface({ input, output, terminal: true });
  try {
    const answer = await rl.question(`${question.trim()} `);
    return answer.trim();
  } finally {
    rl.close();
  }
};
