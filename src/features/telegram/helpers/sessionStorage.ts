import { readFile, writeFile, chmod } from "fs/promises";

import { ensureDirectoryForFile } from "../../../utils/helpers.js";
import { logger } from "../../../core/logger.js";

export const loadSessionString = async (path: string): Promise<string> => {
  try {
    const buffer = await readFile(path, { encoding: "utf-8" });
    logger.info({ path, length: buffer.length }, "Сессия загружена из файла");
    return buffer.trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logger.info({ path }, "Файл сессии не найден, будет создан новый");
      return "";
    }
    logger.error({ error, path }, "Ошибка загрузки сессии");
    throw error;
  }
};

export const saveSessionString = async (path: string, session: string): Promise<void> => {
  try {
    ensureDirectoryForFile(path);
    await writeFile(path, session, { encoding: "utf-8", mode: 0o644 });
    // Явно устанавливаем права на файл
    await chmod(path, 0o644);
    logger.info({ path, length: session.length }, "Сессия сохранена в файл");
  } catch (error) {
    logger.error({ error, path }, "Ошибка сохранения сессии");
    throw error;
  }
};
