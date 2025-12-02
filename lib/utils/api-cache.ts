/**
 * API 響應緩存工具（優化任務 #16）
 * 提供統一的緩存策略和響應頭設置
 */

import { NextResponse } from "next/server";

export interface CacheOptions {
  maxAge?: number; // 最大緩存時間（秒）
  staleWhileRevalidate?: number; // stale-while-revalidate 時間（秒）
  private?: boolean; // 是否為私有緩存
  mustRevalidate?: boolean; // 是否必須重新驗證
}

/**
 * 為API響應添加緩存頭
 */
export function addCacheHeaders(
  response: NextResponse,
  options: CacheOptions = {}
): NextResponse {
  const {
    maxAge = 60, // 默認1分鐘
    staleWhileRevalidate = 120, // 默認2分鐘
    private: isPrivate = false,
    mustRevalidate = false,
  } = options;

  const directives = [
    isPrivate ? "private" : "public",
    `s-maxage=${maxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`,
    mustRevalidate ? "must-revalidate" : null,
  ].filter(Boolean);

  response.headers.set("Cache-Control", directives.join(", "));
  return response;
}

/**
 * 預定義的緩存策略
 */
export const cacheStrategies = {
  // 列表查詢：短暫緩存
  list: { maxAge: 60, staleWhileRevalidate: 120 },
  
  // 詳情查詢：中等緩存
  detail: { maxAge: 300, staleWhileRevalidate: 600 },
  
  // 靜態內容：長期緩存
  static: { maxAge: 3600, staleWhileRevalidate: 86400 },
  
  // 無緩存（敏感數據）
  noCache: { maxAge: 0, mustRevalidate: true },
};

