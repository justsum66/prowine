import { NextRequest } from "next/server";
import { rateLimiter, defaultRateLimit } from "./rate-limiter";
import { generateRequestId } from "./error-handler";
import { logger } from "./logger";

export interface ApiContext {
  requestId: string;
  startTime: number;
  ip?: string;
  userAgent?: string;
}

/**
 * API 中間件：提供統一的請求處理
 */
export function createApiContext(request: NextRequest): ApiContext {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;

  return {
    requestId,
    startTime,
    ip,
    userAgent,
  };
}

/**
 * 應用速率限制
 */
export function applyRateLimit(
  request: NextRequest,
  limit = defaultRateLimit
): void {
  rateLimiter.check(request, limit);
}

/**
 * 記錄 API 請求
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  context: ApiContext
): void {
  const duration = Date.now() - context.startTime;
  logger.logRequest(method, path, statusCode, duration, {
    requestId: context.requestId,
    ip: context.ip,
  });
}

