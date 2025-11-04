import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export const ensureDirectoryForFile = (filePath: string) => {
  const directory = dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
};

export const normalizeChannelUsername = (value: string): string =>
  value.replace(/^@/, "").toLowerCase();

export const isNumericId = (value: string): boolean => /^-?\d+$/.test(value);

/**
 * Гарантирует, что данные представлены в виде Buffer
 */
export const ensureBuffer = (data: Buffer | Uint8Array): Buffer =>
  Buffer.isBuffer(data) ? data : Buffer.from(data);
