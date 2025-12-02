/**
 * Next.js 16 Instrumentation Hook
 * 用於初始化 Sentry
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 動態導入 Sentry 服務端配置
    try {
      // @ts-ignore - 動態導入，類型檢查在運行時
      await import("./sentry.server.config");
    } catch (error) {
      // Sentry 配置文件可能不存在或未配置，靜默忽略
      if (process.env.NODE_ENV === "development") {
        console.warn("Sentry server config not found, skipping initialization");
      }
    }
  }
  
  if (process.env.NEXT_RUNTIME === "edge") {
    // 動態導入 Sentry Edge 配置
    try {
      // @ts-ignore - 動態導入，類型檢查在運行時
      await import("./sentry.edge.config");
    } catch (error) {
      // Sentry 配置文件可能不存在或未配置，靜默忽略
      if (process.env.NODE_ENV === "development") {
        console.warn("Sentry edge config not found, skipping initialization");
      }
    }
  }
}

