import { NextResponse } from "next/server";
import { logger } from "./logger";

export enum ApiErrorCode {
  // 客戶端錯誤 (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // 伺服器錯誤 (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  TIMEOUT = "TIMEOUT",
}

// Q21優化：消除any類型
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown> | string[] | string | number | boolean | null;
    timestamp: string;
    requestId?: string;
  };
}

// Q21優化：使用泛型替代any
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown> | string[] | string | number | boolean | null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createErrorResponse(
  error: Error | ApiError,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  let apiError: ApiError;
  
  if (error instanceof ApiError) {
    apiError = error;
  } else {
    // 判斷錯誤類型
    if (error.message.includes("not found") || error.message.includes("不存在")) {
      apiError = new ApiError(ApiErrorCode.NOT_FOUND, error.message, 404);
    } else if (
      error.message.toLowerCase().includes("unauthorized") || 
      error.message.toLowerCase().includes("未授權") ||
      error.message === "Unauthorized"
    ) {
      apiError = new ApiError(ApiErrorCode.UNAUTHORIZED, error.message, 401);
    } else if (error.message.includes("validation") || error.message.includes("驗證")) {
      apiError = new ApiError(ApiErrorCode.VALIDATION_ERROR, error.message, 400);
    } else if (error.message.includes("database") || error.message.includes("資料庫")) {
      apiError = new ApiError(ApiErrorCode.DATABASE_ERROR, "資料庫操作失敗", 500, error.message);
    } else {
      apiError = new ApiError(ApiErrorCode.INTERNAL_ERROR, "伺服器內部錯誤", 500, error.message);
    }
  }

  const isDev = process.env.NODE_ENV === "development";
  
  // 過濾敏感信息（生產環境不應洩露）
  const safeDetails = isDev 
    ? apiError.details 
    : sanitizeErrorDetails(apiError.details);

  // Q22優化：使用logger替代console.error
  // 注意：日誌中可能包含敏感信息，但不會返回給客戶端
  // 對於客戶端錯誤（4xx），使用 warn 級別；對於服務器錯誤（5xx），使用 error 級別
  if (apiError.statusCode >= 500) {
    logger.error(
      apiError.message,
      error instanceof Error ? error : new Error(apiError.message),
      {
        code: apiError.code,
        statusCode: apiError.statusCode,
        details: safeDetails,
        requestId,
      }
    );
  } else if (apiError.statusCode >= 400) {
    // 客戶端錯誤（4xx）記錄為警告，因為這是正常的業務邏輯
    logger.warn(
      apiError.message,
      {
        code: apiError.code,
        statusCode: apiError.statusCode,
        details: safeDetails,
        requestId,
      }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        details: safeDetails,
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: apiError.statusCode }
  );
}

/**
 * 清理錯誤詳情，移除敏感信息
 */
function sanitizeErrorDetails(
  details?: Record<string, unknown> | string[] | string | number | boolean | null
): Record<string, unknown> | string[] | string | number | boolean | null | undefined {
  if (!details) {
    return undefined;
  }

  if (typeof details === "string") {
    // 移除可能的敏感信息
    return details
      .replace(/password[=:]\s*[^\s,}]+/gi, "password=***")
      .replace(/token[=:]\s*[^\s,}]+/gi, "token=***")
      .replace(/key[=:]\s*[^\s,}]+/gi, "key=***")
      .replace(/secret[=:]\s*[^\s,}]+/gi, "secret=***")
      .replace(/api[_-]?key[=:]\s*[^\s,}]+/gi, "api_key=***");
  }

  if (typeof details === "object" && !Array.isArray(details)) {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ["password", "token", "key", "secret", "apiKey", "api_key", "authorization"];
    
    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = "***";
      } else if (typeof value === "string") {
        sanitized[key] = sanitizeErrorDetails(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  return details;
}

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"]
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

