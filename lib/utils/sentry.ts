/**
 * Sentry 錯誤追蹤集成
 * 提供統一的錯誤追蹤接口
 * 注意：如果未安裝 @sentry/nextjs，所有功能會優雅降級
 */

interface SentryConfig {
  dsn?: string;
  environment?: string;
  enabled?: boolean;
}

class SentryService {
  private initialized = false;
  private config: SentryConfig = {
    enabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true",
    environment: process.env.NODE_ENV || "development",
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };

  /**
   * 初始化 Sentry（客戶端）
   */
  async initClient() {
    if (!this.config.enabled || !this.config.dsn || typeof window === "undefined") {
      return;
    }

    try {
      // 動態導入 @sentry/nextjs 以避免增加 bundle 大小
      // 注意：如果未安裝 @sentry/nextjs，此導入會失敗，這是預期的
      const Sentry = await import("@sentry/nextjs").catch(() => null);
      if (!Sentry) {
        return; // Sentry 未安裝，跳過初始化
      }
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        tracesSampleRate: this.config.environment === "production" ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [],
        beforeSend(event: any, hint: any) {
          // 過濾敏感信息
          if (event.request) {
            if (event.request.headers) {
              delete event.request.headers["authorization"];
              delete event.request.headers["cookie"];
            }
            if (event.request.data) {
              const data = event.request.data as Record<string, unknown>;
              if (typeof data === "object" && data !== null) {
                const sensitiveKeys = ["password", "token", "apiKey", "secret"];
                sensitiveKeys.forEach((key) => {
                  if (key in data) {
                    data[key] = "***";
                  }
                });
              }
            }
          }
          return event;
        },
      });

      this.initialized = true;
    } catch (error) {
      // Sentry 初始化失敗，靜默失敗
    }
  }

  /**
   * 初始化 Sentry（服務端）
   */
  async initServer() {
    if (!this.config.enabled || !this.config.dsn || typeof window !== "undefined") {
      return;
    }

    try {
      // 動態導入 @sentry/nextjs
      // @ts-ignore
      const Sentry = await import("@sentry/nextjs").catch(() => null);
      if (!Sentry) {
        return; // Sentry 未安裝，跳過初始化
      }
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        tracesSampleRate: this.config.environment === "production" ? 0.1 : 1.0,
        integrations: [],
        beforeSend(event: any, hint: any) {
          // 過濾敏感信息
          if (event.request) {
            if (event.request.headers) {
              delete event.request.headers["authorization"];
              delete event.request.headers["cookie"];
            }
          }
          return event;
        },
      });

      this.initialized = true;
    } catch (error) {
      // Sentry 初始化失敗，靜默失敗
    }
  }

  /**
   * 捕獲異常
   */
  captureException(error: Error, context?: Record<string, unknown>) {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      // 動態導入
      import("@sentry/nextjs").then((Sentry: any) => {
        Sentry.captureException(error, {
          contexts: {
            custom: context || {},
          },
        });
      }).catch(() => {
        // Sentry 未安裝，靜默失敗
      });
    } catch (err) {
      // 靜默失敗
    }
  }

  /**
   * 捕獲消息
   */
  captureMessage(message: string, level: "info" | "warning" | "error" = "error", context?: Record<string, unknown>) {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      import("@sentry/nextjs").then((Sentry: any) => {
        Sentry.captureMessage(message, {
          level: level as "info" | "warning" | "error" | "fatal" | "debug",
          contexts: {
            custom: context || {},
          },
        });
      }).catch(() => {
        // Sentry 未安裝，靜默失敗
      });
    } catch (err) {
      // 靜默失敗
    }
  }

  /**
   * 設置用戶上下文
   */
  setUser(user: { id?: string; email?: string; username?: string }) {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      }).catch(() => {
        // Sentry 未安裝，靜默失敗
      });
    } catch (err) {
      // 靜默失敗
    }
  }

  /**
   * 清除用戶上下文
   */
  clearUser() {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.setUser(null);
      }).catch(() => {
        // Sentry 未安裝，靜默失敗
      });
    } catch (err) {
      // 靜默失敗
    }
  }

  /**
   * 添加麵包屑（用於追蹤用戶操作）
   */
  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: "info" | "warning" | "error"; data?: Record<string, unknown> }) {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.addBreadcrumb({
          message: breadcrumb.message,
          category: breadcrumb.category,
          level: breadcrumb.level as "info" | "warning" | "error" | "fatal" | "debug",
          data: breadcrumb.data,
        });
      }).catch(() => {
        // Sentry 未安裝，靜默失敗
      });
    } catch (err) {
      // 靜默失敗
    }
  }
}

export const sentry = new SentryService();

// 導出便捷函數
export const captureException = (error: Error, context?: Record<string, unknown>) => {
  sentry.captureException(error, context);
};

export const captureMessage = (message: string, level?: "info" | "warning" | "error", context?: Record<string, unknown>) => {
  sentry.captureMessage(message, level, context);
};
