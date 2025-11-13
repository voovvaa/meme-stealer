import type { FilterKeyword } from "../../../types/database.js";

type FilterRule = {
  pattern: string;
  isRegex: boolean;
  regex?: RegExp;
};

/**
 * Создает функцию фильтрации с поддержкой обычных строк и regex паттернов
 * @param keywords - массив фильтров с информацией о типе (regex/обычный текст)
 * @returns функция для проверки текста на наличие рекламы
 */
export const buildAdFilter = (keywords: FilterKeyword[]) => {
  // Компилируем все фильтры заранее
  const rules: FilterRule[] = keywords.map((kw) => {
    const rule: FilterRule = {
      pattern: kw.keyword,
      isRegex: kw.isRegex,
    };

    // Если это regex, компилируем его заранее
    if (kw.isRegex) {
      try {
        rule.regex = new RegExp(kw.keyword, "i"); // case-insensitive
      } catch (error) {
        // Невалидный regex - пропускаем
        console.warn(`Invalid regex pattern: ${kw.keyword}`, error);
        return null;
      }
    }

    return rule;
  }).filter((rule): rule is FilterRule => rule !== null);

  return (text?: string | null, caption?: string | null): boolean => {
    if (!rules.length) {
      return false;
    }

    const content = [text ?? "", caption ?? ""].join(" ");

    return rules.some((rule) => {
      if (rule.isRegex && rule.regex) {
        // Проверка через regex
        return rule.regex.test(content);
      } else {
        // Простая проверка substring (case-insensitive)
        return content.toLowerCase().includes(rule.pattern.toLowerCase());
      }
    });
  };
};
