import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { fuzzySearch } from "@/lib/utils/fuzzy-search";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";

/**
 * 模糊搜尋 API（P2）
 * 支持即時搜尋建議和模糊匹配
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Q42優化：使用Zod驗證查詢參數
    const validatedParams = validateQueryParams(
      z.object({
        q: z.string().optional().default(""),
        limit: z.string().optional().transform((val) => Math.min(50, Math.max(1, parseInt(val || "10") || 10))),
      }),
      request.nextUrl.searchParams
    );
    
    const { q: query = "", limit = 10 } = validatedParams;

    if (!query.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const supabase = createServerSupabaseClient();

    // 獲取所有酒款（用於模糊搜尋）
    const { data: wines, error } = await supabase
      .from("wines")
      .select("id, nameZh, nameEn, slug, wineryId, category, region")
      .eq("published", true)
      .limit(100); // 限制搜尋範圍以提高性能

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Failed to fetch wines",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/wines/search", requestId, query }
      );
      return NextResponse.json({ suggestions: [] });
    }

    // 執行模糊搜尋
    const searchResults = fuzzySearch(
      wines || [],
      query,
      ["nameZh", "nameEn", "region", "category"],
      {
        minScore: 0.3,
        maxResults: limit,
      }
    );

    // 格式化建議結果
    const suggestions = searchResults.map((result) => ({
      id: result.item.id,
      text: result.item.nameZh || result.item.nameEn,
      nameZh: result.item.nameZh,
      nameEn: result.item.nameEn,
      slug: result.item.slug,
      type: "wine" as const,
      score: result.score,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    logger.error(
      "Search API error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/wines/search", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("搜尋失敗"),
      requestId
    );
  }
}

