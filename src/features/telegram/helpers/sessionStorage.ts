import { readFile, writeFile } from "fs/promises";

import { ensureDirectoryForFile } from "../../../utils/helpers";

export const loadSessionString = async (path: string): Promise<string> => {
  try {
    const buffer = await readFile(path, { encoding: "utf-8" });
    return buffer.trim();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "";
    }
    throw error;
  }
};

export const saveSessionString = async (path: string, session: string): Promise<void> => {
  ensureDirectoryForFile(path);
  await writeFile(path, session, { encoding: "utf-8" });
};
