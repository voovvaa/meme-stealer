export const buildAdFilter = (keywords: string[]) => {
  const normalized = keywords.map((word) => word.toLowerCase());

  return (text?: string | null, caption?: string | null): boolean => {
    if (!normalized.length) {
      return false;
    }

    const content = [text ?? "", caption ?? ""].join(" ").toLowerCase();
    return normalized.some((word) => word.length > 0 && content.includes(word));
  };
};
