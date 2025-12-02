/**
 * 生產環境專用安全配置
 * 防止代碼洩露、信息洩露和逆向工程
 */

/**
 * 生產環境安全檢查和清理
 * 移除所有可能洩露代碼或系統信息的功能
 */
export function enforceProductionSecurity(): void {
  if (process.env.NODE_ENV !== 'production') {
    return; // 僅在生產環境執行
  }

  // 移除 console 對象（防止代碼洩露）
  if (typeof window !== 'undefined') {
    // 客戶端：保留 error 和 warn，移除其他
    const noop = () => {};
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // 清空所有 console 方法
    Object.keys(console).forEach((key) => {
      if (key === 'error' || key === 'warn') {
        return; // 保留錯誤和警告
      }
      try {
        (console as any)[key] = noop;
      } catch (e) {
        // 忽略無法覆蓋的方法
      }
    });
    
    // 恢復 error 和 warn
    console.error = originalError;
    console.warn = originalWarn;
  }

  // 移除全局調試工具
  if (typeof window !== 'undefined') {
    // 防止 React DevTools
    if (process.env.NODE_ENV === 'production') {
      const noop = () => {};
      Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
        get: () => undefined,
        set: noop,
      });
    }
  }
}

/**
 * 清理響應中的敏感信息
 */
export function sanitizeResponse(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // 遞歸清理對象
  const cleaned = Array.isArray(data) ? [] : {};
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      
      // 跳過敏感字段
      const sensitiveKeys = [
        'password',
        'secret',
        'apiKey',
        'api_key',
        'accessToken',
        'access_token',
        'refreshToken',
        'refresh_token',
        'privateKey',
        'private_key',
      ];
      
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        continue; // 跳過敏感字段
      }
      
      if (typeof value === 'object' && value !== null) {
        (cleaned as any)[key] = sanitizeResponse(value);
      } else {
        (cleaned as any)[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * 生產環境 CSP 增強配置
 */
export const PRODUCTION_CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Next.js 需要
    // 不允許 'unsafe-eval' 在生產環境
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://browser.sentry-cdn.com", // Sentry
    "https://*.ingest.sentry.io", // Sentry
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Tailwind CSS 需要
    "https://fonts.googleapis.com",
  ],
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "http://prowine.com.tw", // 允許 HTTP（臨時）
  ],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://api.resend.com",
    "https://api.groq.com",
    "https://generativelanguage.googleapis.com",
    "https://openrouter.ai",
    "https://api.cloudinary.com",
    "https://www.google-analytics.com",
    "https://*.ingest.sentry.io", // Sentry
  ],
  "frame-src": [
    "'self'",
    "https://www.google.com",
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
  // 防止代碼洩露
  "worker-src": ["'self'", "blob:"],
  "child-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
};

/**
 * 檢查並防止 source map 洩露
 */
export function preventSourceMapLeakage(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // 在客戶端檢查是否有 source map 引用
  if (typeof window !== 'undefined') {
    // 監聽錯誤，移除 source map 信息
    const originalErrorHandler = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      // 清理錯誤堆棧中的文件路徑信息
      if (error && error.stack) {
        error.stack = error.stack
          .replace(/at .*?\(.*?\.map\)/g, '') // 移除 .map 引用
          .replace(/@.*?\.map/g, '') // 移除 source map 引用
          .replace(/webpack-internal.*/g, '') // 移除 webpack 內部信息
          .replace(/__webpack.*/g, ''); // 移除 webpack 模塊信息
      }
      
      if (originalErrorHandler) {
        return originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      return false;
    };
  }
}

