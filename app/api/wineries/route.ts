import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";
import { rateLimiter, defaultRateLimit } from "@/lib/api/rate-limiter";
import { addCacheHeaders, cacheStrategies } from "@/lib/utils/api-cache";
import { wineryQuerySchema, validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";
import { SupabaseError, WineryData } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // 開發環境禁用速率限制，生產環境啟用
    if (process.env.NODE_ENV === "production") {
      try {
        rateLimiter.check(request, defaultRateLimit);
      } catch (rateLimitError) {
        return createErrorResponse(rateLimitError as Error, requestId);
      }
    }
    
    // Q42優化：使用Zod驗證查詢參數
    const validatedParams = validateQueryParams(
      wineryQuerySchema.extend({
        slug: z.string().optional(),
        id: z.string().optional(),
      }),
      request.nextUrl.searchParams
    );
    
    const {
      search = "",
      region,
      country,
      featured,
      limit,
      slug,
      id,
    } = validatedParams;
    
    // 使用 Supabase 查詢
    const supabase = createServerSupabaseClient();
    
    // 構建查詢（優化：只選擇需要的欄位）
    let query = supabase
      .from("wineries")
      .select(`
        id,
        nameZh,
        nameEn,
        slug,
        descriptionZh,
        descriptionEn,
        storyZh,
        storyEn,
        region,
        country,
        website,
        logoUrl,
        images,
        featured,
        createdAt
      `, { count: "exact" });

    // 應用過濾條件
    // 支持 slug 和 id 查詢（已從validatedParams獲取）
    if (slug) {
      query = query.eq("slug", slug);
    } else if (id) {
      query = query.eq("id", id);
    }
    
    if (featured === true) {
      query = query.eq("featured", true);
    }
    
    if (search) {
      query = query.or(`nameZh.ilike.%${search}%,nameEn.ilike.%${search}%,descriptionZh.ilike.%${search}%,descriptionEn.ilike.%${search}%`);
    }
    
    if (region) {
      query = query.eq("region", region);
    }
    
    if (country) {
      query = query.eq("country", country);
    }
    
    // 排序
    query = query.order("createdAt", { ascending: false });
    
    // 應用 limit（如果提供）
    if (limit) {
      query = query.limit(limit);
    }
    
    logger.info("Executing Supabase query", { requestId, featured, limit });

    // Q21優化：使用類型接口，消除any
    let wineries: WineryData[] = [];
    let error: SupabaseError | null = null;

    try {
      // 執行 Supabase 查詢（直接 await）
      const { data: queryData, error: queryError } = await query;

      logger.info("Supabase wineries query result", { 
        requestId, 
        dataLength: queryData?.length || 0, 
        error: queryError?.message || null,
        featured,
        limit
      });

      if (queryError) {
        logger.error("Supabase query error", queryError, { requestId });
        error = queryError;
      } else {
        wineries = (queryData as WineryData[]) || [];
      }
    } catch (queryError) {
      logger.error("Supabase query error or timeout", queryError instanceof Error ? queryError : new Error("Unknown error"), { requestId });
      // 超時或查詢錯誤時返回空結果
      return NextResponse.json({ wineries: [] }, { status: 200 });
    }
    
    if (error) {
      logger.error("Supabase query error", error instanceof Error ? error : new Error(error.message || "Unknown error"), { requestId });
      return NextResponse.json({ wineries: [] }, { status: 200 });
    }

    // Q21優化：使用類型接口，消除any
    const wineriesWithCount = wineries.map((winery: WineryData) => ({
      ...winery,
      wineCount: 0, // 暫時設為 0，避免 N+1 查詢問題（可後續優化）
    }));
    
    // 如果需要真實的酒款數量，可以批量查詢（但會增加查詢時間）
    // 目前先返回 0，避免首頁載入過慢

    const duration = Date.now() - startTime;
    logger.logRequest("GET", "/api/wineries", 200, duration, {
      requestId,
      count: wineriesWithCount.length,
    });

    // 添加響應緩存頭（優化任務 #16）
    const response = NextResponse.json({ wineries: wineriesWithCount }, { status: 200 });

    // 為列表查詢添加緩存（1分鐘），詳情查詢不緩存
    if (!slug && !id) {
      addCacheHeaders(response, cacheStrategies.list);
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Error fetching wineries", error instanceof Error ? error : new Error("Unknown error"), { requestId });
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
    logger.logRequest("GET", "/api/wineries", statusCode, duration, { requestId });
    return createErrorResponse(error instanceof Error ? error : new Error("Failed to fetch wineries"), requestId);
  }
}
