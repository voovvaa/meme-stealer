import { isNumericId, normalizeChannelUsername } from "../../../utils/helpers";

export const ensureChannelAllowed = (specifiers: string[]) => {
  const idSet = new Set<string>();
  const usernameSet = new Set<string>();

  for (const spec of specifiers) {
    const trimmed = spec.trim();
    if (!trimmed) {
      continue;
    }

    if (isNumericId(trimmed)) {
      idSet.add(trimmed);
      continue;
    }

    usernameSet.add(normalizeChannelUsername(trimmed));
  }

  return (chatId: number | string, username: string | null): boolean => {
    if (idSet.has(chatId.toString())) {
      return true;
    }

    if (username) {
      return usernameSet.has(normalizeChannelUsername(username));
    }

    return false;
  };
};
