import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";
import { rateLimiter, defaultRateLimit } from "@/lib/api/rate-limiter";
import { addCacheHeaders, cacheStrategies } from "@/lib/utils/api-cache";
import { wineQuerySchema, validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";
import { SupabaseError, WineData } from "@/lib/api/types";

// Q21優化：定義Winery數據類型
interface WineryData {
  id: string;
  nameZh?: string;
  nameEn?: string;
  slug?: string;
  website?: string;
  logoUrl?: string;
}

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
      wineQuerySchema.extend({
        slug: z.string().optional(),
        id: z.string().optional(),
        wineryId: z.string().optional(),
        published: z.string().optional().transform((val) => val === "true"),
      }),
      request.nextUrl.searchParams
    );
    
    const {
      search = "",
      region,
      country,
      minPrice,
      maxPrice,
      minVintage,
      maxVintage,
      minRating,
      category,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
      featured,
      slug,
      id,
      wineryId,
    } = validatedParams;
    
    // Q42優化：額外驗證價格範圍（Zod已處理基本驗證）
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new Error("minPrice 不能大於 maxPrice");
    }

    // 使用 Supabase 查詢
    const supabase = createServerSupabaseClient();
    
    logger.info("Building Supabase query", { 
      requestId, 
      featured, 
      published: true,
      search,
      region,
      country,
      page,
      limit
    });
    
    // 構建查詢（優化：只選擇需要的欄位）
    // 先不查詢關係，避免 RLS 問題
    let query = supabase
      .from("wines")
      .select(`
        id,
        slug,
        nameZh,
        nameEn,
        descriptionZh,
        descriptionEn,
        storyZh,
        storyEn,
        category,
        region,
        country,
        vintage,
        price,
        mainImageUrl,
        images,
        ratings,
        featured,
        bestseller,
        published,
        createdAt,
        wineryId,
        grapeVarieties,
        alcoholContent,
        servingTemp,
        winery:wineries(id, nameZh, nameEn, slug, website)
      `, { count: "exact" });

    // 應用過濾條件
    query = query.eq("published", true);
    
    // 支持 slug 和 id 查詢（已從validatedParams獲取）
    if (slug) {
      query = query.eq("slug", slug);
    } else if (id) {
      query = query.eq("id", id);
    }
    
    // 支持 wineryId 查詢（已從validatedParams獲取）
    if (wineryId) {
      query = query.eq("wineryId", wineryId);
    }
    
    if (featured === true) {
      query = query.eq("featured", true);
      logger.info("Applied featured filter", { requestId });
    }
    
    if (search) {
      query = query.or(`nameZh.ilike.%${search}%,nameEn.ilike.%${search}%,descriptionZh.ilike.%${search}%,descriptionEn.ilike.%${search}%,region.ilike.%${search}%,country.ilike.%${search}%`);
    }
    
    if (region) {
      query = query.eq("region", region);
    }
    
    if (country) {
      query = query.eq("country", country);
    }
    
    if (minPrice) {
      query = query.gte("price", minPrice);
    }
    
    if (maxPrice) {
      query = query.lte("price", maxPrice);
    }
    
    if (minVintage !== undefined) {
      query = query.gte("vintage", minVintage);
    }
    
    if (maxVintage !== undefined) {
      query = query.lte("vintage", maxVintage);
    }
    
    if (category) {
      query = query.eq("category", category);
    }
    
    if (wineryId) {
      query = query.eq("wineryId", wineryId);
    }
    
    // 排序
    const ascending = sortOrder === "asc";
    if (sortBy === "price") {
      query = query.order("price", { ascending });
    } else if (sortBy === "vintage") {
      query = query.order("vintage", { ascending });
    } else {
      query = query.order("createdAt", { ascending });
    }
    
    // 分頁
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    logger.info("Executing Supabase query", { requestId, page, limit, featured });

    // Q21優化：使用類型接口，消除any
    let wines: WineData[] = [];
    let count = 0;
    let error: SupabaseError | null = null;

    try {
      // 執行 Supabase 查詢（直接 await）
      const { data: queryData, error: queryError, count: queryCount } = await query;

      logger.info("Supabase query result", { 
        requestId, 
        dataLength: queryData?.length || 0, 
        count: queryCount,
        error: queryError?.message || null,
        featured,
        published: true
      });

      if (queryError) {
        // Q21優化：使用類型接口，消除any
        const queryErrorMessage = queryError instanceof Error ? queryError.message : (queryError as { message?: string }).message || "Unknown error";
        const errorDetails = queryError instanceof Error ? undefined : (queryError as { details?: string }).details;
        const errorHint = queryError instanceof Error ? undefined : (queryError as { hint?: string }).hint;
        const errorCode = queryError instanceof Error ? undefined : (queryError as { code?: string }).code;
        
        const supabaseError: SupabaseError = {
          message: queryErrorMessage,
          details: errorDetails,
          hint: errorHint,
          code: errorCode,
        };
        
        logger.error("Supabase query error", queryError instanceof Error ? queryError : new Error(queryErrorMessage), { 
          requestId,
          errorCode: supabaseError.code,
          errorMessage: supabaseError.message,
          errorDetails: supabaseError.details,
          errorHint: supabaseError.hint
        });
        error = supabaseError;
        
        // 如果是 RLS 錯誤，記錄詳細信息
        if (queryErrorMessage.includes('RLS') || queryErrorMessage.includes('policy')) {
          logger.error("RLS policy error detected", queryError instanceof Error ? queryError : new Error(queryErrorMessage), { requestId, errorMessage: queryErrorMessage });
        }
      } else {
        // 處理 winery 關聯數據（可能是數組）
        wines = ((queryData || []) as unknown[]).map((item: unknown) => {
          const wine = item as Record<string, unknown>;
          const winery = wine.winery;
          return {
            ...wine,
            winery: Array.isArray(winery) ? winery[0] : winery,
          } as WineData;
        });
        count = queryCount || 0;
        
        logger.info("Query successful", { 
          requestId, 
          winesCount: wines.length, 
          totalCount: count 
        });
        
        // 如果有數據，為每個酒款獲取酒莊信息（如果查詢中沒有包含 winery 關聯）
        if (wines.length > 0 && !wines[0]?.winery) {
          const wineryIds = [...new Set(wines.map((w: WineData) => w.wineryId).filter(Boolean))];
          if (wineryIds.length > 0) {
            const { data: wineriesData, error: wineriesError } = await supabase
              .from("wineries")
              .select("id, nameZh, nameEn, slug, website, logoUrl")
              .in("id", wineryIds);
            
            if (wineriesError) {
              const errorMessage = wineriesError instanceof Error ? wineriesError.message : (wineriesError as { message?: string }).message || "Unknown error";
              logger.error("Error fetching wineries", wineriesError instanceof Error ? wineriesError : new Error(errorMessage), { requestId });
            } else {
              const wineriesMap = new Map((wineriesData as WineryData[] || []).map((w: WineryData) => [w.id, w]));
              wines = wines.map((wine: WineData) => ({
                ...wine,
                winery: wineriesMap.get(wine.wineryId) || null,
              }));
            }
          }
        }
      }
    } catch (queryError) {
      const error = queryError instanceof Error ? queryError : new Error(String(queryError));
      logger.error("Supabase query error or timeout", error, { requestId });
      // 超時或查詢錯誤時返回空結果
      return NextResponse.json({ 
        wines: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }, { status: 200 });
    }
    
    if (error) {
      const errorMsg = error.message || "Unknown error";
      logger.error("Supabase query error", new Error(errorMsg), { requestId });
      return NextResponse.json({ 
        wines: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }, { status: 200 });
    }

    // Q21優化：使用類型接口，消除any
    const winesWithNumbers = wines.map((wine: WineData) => ({
      ...wine,
      price: Number(wine.price) || 0,
      ratings: wine.ratings || null,
    }));

    const total = count || 0;
    const duration = Date.now() - startTime;
    logger.logRequest("GET", "/api/wines", 200, duration, {
      requestId,
      page,
      limit,
      total,
    });

    // 添加響應緩存頭（優化任務 #16）
    const response = NextResponse.json({
      wines: winesWithNumbers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });

    // 為列表查詢添加緩存（1分鐘），詳情查詢不緩存
    if (!slug && !id) {
      addCacheHeaders(response, cacheStrategies.list);
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Error fetching wines", error instanceof Error ? error : new Error("Unknown error"), { requestId });
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
    logger.logRequest("GET", "/api/wines", statusCode, duration, { requestId });
    return createErrorResponse(error instanceof Error ? error : new Error("Failed to fetch wines"), requestId);
  }
}
