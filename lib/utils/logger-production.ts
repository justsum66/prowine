/**
 * 生產環境日誌系統
 * 替換所有 console.log，提供結構化日誌
 */

const isDev = process.env.NODE_ENV === "development";

interface LogLevel {
  INFO: "INFO";
  WARN: "WARN";
  ERROR: "ERROR";
  DEBUG: "DEBUG";
}

class ProductionLogger {
  private logToService(level: string, message: string, data?: any) {
    // 生產環境發送到 Sentry
    if (!isDev) {
      try {
        // 動態導入以避免增加 bundle 大小
        import("./sentry").then(({ sentry }) => {
          if (level === "ERROR" && data?.error instanceof Error) {
            sentry.captureException(data.error, data);
          } else if (level === "ERROR" || level === "WARN") {
            sentry.captureMessage(message, level.toLowerCase() as "error" | "warning", data);
          }
        }).catch(() => {
          // Sentry 未初始化或不可用時靜默失敗
        });
      } catch (err) {
        // Sentry 未初始化或不可用時靜默失敗
      }
    }
  }

  info(message: string, ...args: any[]) {
    if (isDev) {
      console.log(`[INFO] ${message}`, ...args);
    } else {
      this.logToService("INFO", message, args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    } else {
      this.logToService("WARN", message, args);
    }
  }

  error(message: string, error?: Error, ...args: any[]) {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, ...args);
    } else {
      this.logToService("ERROR", message, { error, ...args });
    }
  }

  debug(message: string, ...args: any[]) {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
    // 生產環境不輸出 debug
  }
}

export const logger = new ProductionLogger();

// 導出便捷函數
export const log = {
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  debug: logger.debug.bind(logger),
};

