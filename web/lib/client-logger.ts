/**
 * Client-side logger wrapper для React компонентов
 * Обеспечивает consistent logging между server (pino) и client (console)
 */

type LogContext = {
  component?: string;
  action?: string;
  [key: string]: unknown;
};

/**
 * Форматирует error для логирования
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * Client-side logger для компонентов
 */
export const clientLogger = {
  /**
   * Логирует ошибку с контекстом
   */
  error(context: LogContext, error: unknown): void {
    const prefix = context.component
      ? `[${context.component}${context.action ? `:${context.action}` : ""}]`
      : "[Error]";

    console.error(prefix, formatError(error), context, error);
  },

  /**
   * Логирует предупреждение
   */
  warn(context: LogContext, message: string): void {
    const prefix = context.component
      ? `[${context.component}${context.action ? `:${context.action}` : ""}]`
      : "[Warning]";

    console.warn(prefix, message, context);
  },

  /**
   * Логирует информацию (для development)
   */
  info(context: LogContext, message: string): void {
    if (process.env.NODE_ENV === "development") {
      const prefix = context.component
        ? `[${context.component}${context.action ? `:${context.action}` : ""}]`
        : "[Info]";

      console.log(prefix, message, context);
    }
  },
};
