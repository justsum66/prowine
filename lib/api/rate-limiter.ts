import { NextRequest } from "next/server";
import { ApiError, ApiErrorCode } from "./error-handler";

interface RateLimitConfig {
  windowMs: number; // 時間窗口（毫秒）
  maxRequests: number; // 最大請求數
  keyGenerator?: (req: NextRequest) => string; // 自定義 key 生成器
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每分鐘清理過期的記錄
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }

  private getKey(req: NextRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req);
    }
    
    // 默認使用 IP 地址
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "unknown";
    return `rate_limit:${ip}`;
  }

  check(req: NextRequest, config: RateLimitConfig): void {
    const key = this.getKey(req, config);
    const now = Date.now();
    
    let record = this.requests.get(key);
    
    // 如果記錄不存在或已過期，創建新記錄
    if (!record || record.resetTime < now) {
      record = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.requests.set(key, record);
      return;
    }
    
    // 增加計數
    record.count++;
    
    // 檢查是否超過限制
    if (record.count > config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new ApiError(
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
        `請求過於頻繁，請在 ${retryAfter} 秒後再試`,
        429,
        { retryAfter }
      );
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// 單例實例
export const rateLimiter = new RateLimiter();

// 預設配置（企業級：更嚴格）
export const defaultRateLimit = {
  windowMs: 60 * 1000, // 1 分鐘
  maxRequests: 30, // 30 次請求（從 60 降低）
};

// 嚴格限制（用於敏感操作）
export const strictRateLimit = {
  windowMs: 60 * 1000, // 1 分鐘
  maxRequests: 5, // 5 次請求（從 10 降低）
};

// 極嚴格限制（用於登入、註冊等）
export const veryStrictRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 分鐘
  maxRequests: 3, // 3 次請求
};

// 管理員操作限制
export const adminRateLimit = {
  windowMs: 60 * 1000, // 1 分鐘
  maxRequests: 20, // 20 次請求
};

// API 端點限制
export const apiRateLimit = {
  windowMs: 60 * 1000, // 1 分鐘
  maxRequests: 100, // 100 次請求（公開 API）
};

