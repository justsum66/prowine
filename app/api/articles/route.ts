import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const supabase = createServerSupabaseClient();
    
    // Q42優化：使用Zod驗證查詢參數
    const validatedParams = validateQueryParams(
      z.object({
        search: z.string().optional().default(""),
        category: z.string().optional(),
        limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "20") || 20))),
      }),
      request.nextUrl.searchParams
    );
    
    const { search = "", category, limit = 20 } = validatedParams;

    // 構建查詢
    let query = supabase
      .from("articles")
      .select("*")
      .eq("published", true);

    if (search) {
      // 轉義特殊字符
      const escapedSearch = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(`titleZh.ilike.%${escapedSearch}%,titleEn.ilike.%${escapedSearch}%,contentZh.ilike.%${escapedSearch}%,contentEn.ilike.%${escapedSearch}%`);
      // 注意：tags 陣列搜尋需要額外處理，目前先不包含
    }

    if (category) {
      query = query.eq("category", category);
    }

    query = query.order("publishedAt", { ascending: false }).limit(limit);

    const { data: articles, error } = await query;

    if (error) {
      // Q22優化：使用logger替代console.error
      // Q21優化：處理Supabase錯誤類型
      const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : "Unknown error";
      logger.error(
        "Error fetching articles",
        error instanceof Error ? error : new Error(errorMessage),
        { endpoint: "/api/articles", requestId }
      );
      return createErrorResponse(
        error instanceof Error ? error : new Error("Failed to fetch articles"),
        requestId
      );
    }

    return NextResponse.json({ articles: articles || [] });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Error fetching articles",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/articles", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to fetch articles"),
      requestId
    );
  }
}
