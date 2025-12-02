/**
 * 速率限制工具
 * 用於 API 路由和客戶端請求限制
 */

interface RateLimitConfig {
  windowMs: number; // 時間窗口（毫秒）
  max: number; // 最大請求數
  message?: string; // 錯誤消息
  skipSuccessfulRequests?: boolean; // 是否跳過成功請求
  skipFailedRequests?: boolean; // 是否跳過失敗請求
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每分鐘清理過期的記錄
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * 檢查是否超過速率限制
   */
  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store[key];

    // 如果記錄不存在或已過期，創建新記錄
    if (!record || now > record.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return {
        allowed: true,
        remaining: config.max - 1,
        resetTime: now + config.windowMs,
      };
    }

    // 如果未超過限制
    if (record.count < config.max) {
      record.count++;
      return {
        allowed: true,
        remaining: config.max - record.count,
        resetTime: record.resetTime,
      };
    }

    // 超過限制
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  /**
   * 清理過期的記錄
   */
  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  /**
   * 重置特定 key 的限制
   */
  reset(key: string) {
    delete this.store[key];
  }

  /**
   * 清除所有記錄
   */
  clear() {
    this.store = {};
  }

  /**
   * 銷毀清理定時器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// 創建全局實例
export const rateLimiter = new RateLimiter();

/**
 * 獲取客戶端標識符（IP 地址或用戶 ID）
 */
export function getClientIdentifier(request: Request): string {
  // 優先使用用戶 ID（如果已登錄）
  const userId = request.headers.get("x-user-id");
  if (userId) {
    return `user:${userId}`;
  }

  // 使用 IP 地址
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

/**
 * 速率限制中間件
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: Request): Promise<Response | null> => {
    const identifier = getClientIdentifier(request);
    const result = rateLimiter.check(identifier, config);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: config.message || "請求過於頻繁，請稍後再試",
            resetTime: result.resetTime,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": config.max.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 添加速率限制頭部
    const response = new Response();
    response.headers.set("X-RateLimit-Limit", config.max.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

    return null; // null 表示繼續處理請求
  };
}

/**
 * 預定義的速率限制配置
 */
export const rateLimitConfigs = {
  // API 路由：每分鐘 60 次請求
  api: {
    windowMs: 60 * 1000,
    max: 60,
    message: "API 請求過於頻繁，請稍後再試",
  },
  // 認證路由：每分鐘 5 次請求
  auth: {
    windowMs: 60 * 1000,
    max: 5,
    message: "認證請求過於頻繁，請稍後再試",
  },
  // 搜索路由：每分鐘 30 次請求
  search: {
    windowMs: 60 * 1000,
    max: 30,
    message: "搜索請求過於頻繁，請稍後再試",
  },
  // 表單提交：每小時 10 次
  form: {
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "表單提交過於頻繁，請稍後再試",
  },
};

