/**
 * API 安全工具
 * 提供 API key 驗證、請求簽名、IP 白名單等功能
 */

import { NextRequest } from "next/server";
import { ApiError, ApiErrorCode } from "@/lib/api/error-handler";
import crypto from "crypto";

/**
 * API Key 驗證
 */
export interface ApiKeyConfig {
  key: string;
  name: string;
  permissions: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

class ApiKeyManager {
  private keys: Map<string, ApiKeyConfig> = new Map();

  /**
   * 註冊 API Key
   */
  registerKey(config: ApiKeyConfig): void {
    this.keys.set(config.key, config);
  }

  /**
   * 驗證 API Key
   */
  validateKey(key: string | null): {
    valid: boolean;
    config?: ApiKeyConfig;
    error?: string;
  } {
    if (!key) {
      return {
        valid: false,
        error: "API Key 未提供",
      };
    }

    const config = this.keys.get(key);
    if (!config) {
      return {
        valid: false,
        error: "無效的 API Key",
      };
    }

    return {
      valid: true,
      config,
    };
  }

  /**
   * 檢查權限
   */
  hasPermission(key: string, permission: string): boolean {
    const config = this.keys.get(key);
    if (!config) {
      return false;
    }

    return config.permissions.includes(permission) || config.permissions.includes("*");
  }
}

export const apiKeyManager = new ApiKeyManager();

/**
 * 請求簽名驗證
 */
export interface SignedRequest {
  signature: string;
  timestamp: number;
  nonce: string;
}

/**
 * 生成請求簽名
 */
export function generateRequestSignature(
  method: string,
  path: string,
  body: string,
  timestamp: number,
  nonce: string,
  secret: string
): string {
  const message = `${method}${path}${body}${timestamp}${nonce}`;
  return crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
}

/**
 * 驗證請求簽名
 */
export function verifyRequestSignature(
  request: NextRequest,
  secret: string,
  maxAge: number = 5 * 60 * 1000 // 5 分鐘
): {
  valid: boolean;
  error?: string;
} {
  const signature = request.headers.get("X-Signature");
  const timestamp = request.headers.get("X-Timestamp");
  const nonce = request.headers.get("X-Nonce");

  if (!signature || !timestamp || !nonce) {
    return {
      valid: false,
      error: "缺少簽名參數",
    };
  }

  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) {
    return {
      valid: false,
      error: "無效的時間戳",
    };
  }

  // 檢查時間戳是否在有效範圍內
  const now = Date.now();
  if (Math.abs(now - timestampNum) > maxAge) {
    return {
      valid: false,
      error: "請求已過期",
    };
  }

  // 驗證簽名
  // 注意：需要從請求中獲取 body，這在 Next.js 中可能需要特殊處理
  const method = request.method;
  const path = request.nextUrl.pathname;
  const body = ""; // 在實際使用中，需要從請求中讀取 body

  const expectedSignature = generateRequestSignature(
    method,
    path,
    body,
    timestampNum,
    nonce,
    secret
  );

  // 使用時間安全的比較
  if (!constantTimeEqual(signature, expectedSignature)) {
    return {
      valid: false,
      error: "簽名驗證失敗",
    };
  }

  return { valid: true };
}

/**
 * 時間安全的字符串比較
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * IP 白名單管理
 */
class IPWhitelistManager {
  private whitelist: Set<string> = new Set();
  private blacklist: Set<string> = new Set();

  /**
   * 添加 IP 到白名單
   */
  addToWhitelist(ip: string): void {
    this.whitelist.add(ip);
  }

  /**
   * 添加 IP 到黑名單
   */
  addToBlacklist(ip: string): void {
    this.blacklist.add(ip);
  }

  /**
   * 檢查 IP 是否在白名單中
   */
  isWhitelisted(ip: string): boolean {
    return this.whitelist.has(ip);
  }

  /**
   * 檢查 IP 是否在黑名單中
   */
  isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip);
  }

  /**
   * 驗證 IP 訪問權限
   */
  validateIP(ip: string): {
    allowed: boolean;
    reason?: string;
  } {
    if (this.isBlacklisted(ip)) {
      return {
        allowed: false,
        reason: "IP 已被封禁",
      };
    }

    if (this.whitelist.size > 0 && !this.isWhitelisted(ip)) {
      return {
        allowed: false,
        reason: "IP 不在白名單中",
      };
    }

    return { allowed: true };
  }
}

export const ipWhitelistManager = new IPWhitelistManager();

/**
 * 從請求中提取真實 IP 地址
 */
export function getClientIP(request: NextRequest): string {
  // 優先檢查代理頭
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for 可能包含多個 IP，取第一個
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // 回退到連接 IP（在 Next.js 中可能不可用）
  return "unknown";
}

/**
 * API 安全中間件
 */
export async function validateApiSecurity(
  request: NextRequest,
  options: {
    requireApiKey?: boolean;
    requireSignature?: boolean;
    checkIPWhitelist?: boolean;
    apiSecret?: string;
  } = {}
): Promise<{
  valid: boolean;
  error?: string;
  apiKey?: string;
}> {
  const {
    requireApiKey = false,
    requireSignature = false,
    checkIPWhitelist = false,
    apiSecret,
  } = options;

  // 檢查 IP 白名單
  if (checkIPWhitelist) {
    const ip = getClientIP(request);
    const ipValidation = ipWhitelistManager.validateIP(ip);
    if (!ipValidation.allowed) {
      throw new ApiError(
        ApiErrorCode.FORBIDDEN,
        ipValidation.reason || "IP 訪問被拒絕",
        403
      );
    }
  }

  // 檢查 API Key
  let apiKey: string | undefined;
  if (requireApiKey) {
    const key = request.headers.get("X-API-Key");
    const validation = apiKeyManager.validateKey(key);
    if (!validation.valid) {
      throw new ApiError(
        ApiErrorCode.UNAUTHORIZED,
        validation.error || "API Key 驗證失敗",
        401
      );
    }
    apiKey = key || undefined;
  }

  // 檢查請求簽名
  if (requireSignature) {
    if (!apiSecret) {
      throw new ApiError(
        ApiErrorCode.INTERNAL_ERROR,
        "API 密鑰未配置",
        500
      );
    }

    const validation = await verifyRequestSignature(request, apiSecret);
    if (!validation.valid) {
      throw new ApiError(
        ApiErrorCode.UNAUTHORIZED,
        validation.error || "請求簽名驗證失敗",
        401
      );
    }
  }

  return {
    valid: true,
    apiKey,
  };
}

