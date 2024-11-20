import fs from "fs";
import { logger } from "./logger";

export function loadSession(sessionFilePath: string) {
  if (fs.existsSync(sessionFilePath)) {
    const sessionString = fs.readFileSync(sessionFilePath, "utf-8");
    logger.info(`Сессия загружена из файла.`);
    return sessionString;
  } else {
    logger.info(`Сессия не найдена, потребуется авторизация.`);
    return "";
  }
}

// Функция для сохранения сессии в файл
export function saveSession(sessionFilePath: string, sessionString: string) {
  if (sessionString) {
    fs.writeFileSync(sessionFilePath, sessionString, "utf-8");
    logger.info(`Сессия успешно сохранена.`);
  }
}
