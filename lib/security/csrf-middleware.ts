/**
 * CSRF 保護中間件
 * 為所有需要 CSRF 保護的 API 路由提供統一的中間件
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken, csrfProtection } from "@/lib/utils/csrf-protection";
import { ApiError, ApiErrorCode } from "@/lib/api/error-handler";

/**
 * CSRF 保護配置
 */
export interface CSRFConfig {
  /**
   * 是否啟用 CSRF 保護
   */
  enabled?: boolean;
  
  /**
   * 需要 CSRF 保護的 HTTP 方法
   */
  protectedMethods?: string[];
  
  /**
   * 跳過 CSRF 檢查的路徑
   */
  skipPaths?: string[];
  
  /**
   * 自定義錯誤消息
   */
  errorMessage?: string;
}

const DEFAULT_CONFIG: Required<CSRFConfig> = {
  enabled: true,
  protectedMethods: ["POST", "PUT", "PATCH", "DELETE"],
  skipPaths: [],
  errorMessage: "CSRF token 驗證失敗",
};

/**
 * CSRF 保護中間件
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CSRFConfig = {}
): Promise<NextResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 如果 CSRF 保護未啟用，直接執行處理器
  if (!finalConfig.enabled) {
    return handler(request);
  }

  // 檢查是否應該跳過此路徑
  const pathname = request.nextUrl.pathname;
  if (finalConfig.skipPaths.some((path) => pathname.startsWith(path))) {
    return handler(request);
  }

  // 檢查 HTTP 方法是否需要保護
  const method = request.method;
  if (!finalConfig.protectedMethods.includes(method)) {
    return handler(request);
  }

  // 驗證 CSRF token
  const isValid = await verifyCSRFToken(request);
  if (!isValid) {
    throw new ApiError(
      ApiErrorCode.FORBIDDEN,
      finalConfig.errorMessage,
      403
    );
  }

  // 執行實際的處理器
  return handler(request);
}

/**
 * 創建帶有 CSRF 保護的 API 路由處理器
 */
export function createCSRFProtectedHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: CSRFConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return withCSRFProtection(request, handler, config);
  };
}

/**
 * 檢查請求是否需要 CSRF 保護
 */
export function requiresCSRFProtection(request: NextRequest): boolean {
  const method = request.method;
  const protectedMethods = ["POST", "PUT", "PATCH", "DELETE"];
  
  return protectedMethods.includes(method);
}

