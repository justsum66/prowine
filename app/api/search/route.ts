import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { fuzzyMatch, calculateRelevanceScore } from "@/lib/utils/fuzzy-search";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { searchQuerySchema, validateQueryParams } from "@/lib/api/zod-schemas";

// Q21優化：定義類型接口，消除any
interface WineSearchResult {
  id: string;
  nameZh: string;
  nameEn?: string;
  region?: string;
  price?: number | string;
  mainImageUrl?: string;
  wineries?: {
    nameZh?: string;
    nameEn?: string;
  } | Array<{
    nameZh?: string;
    nameEn?: string;
  }>;
}

interface WinerySearchResult {
  id: string;
  nameZh: string;
  nameEn?: string;
  region?: string;
}

interface SearchResult {
  id: string;
  type: "wine" | "winery";
  nameZh: string;
  nameEn: string;
  wineryName?: string;
  region?: string;
  price?: number;
  imageUrl?: string;
  relevanceScore?: number;
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 先檢查查詢參數是否存在
    const queryParam = request.nextUrl.searchParams.get("q");
    
    // 如果查詢參數為空或未提供，返回空結果（400 錯誤不符合 RESTful 規範，空查詢應該返回空結果）
    if (!queryParam || queryParam.trim().length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }
    
    // 如果查詢參數長度小於 2，返回驗證錯誤（400）
    if (queryParam.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "搜索關鍵字至少需要2個字元",
            details: [
              {
                path: "q",
                message: "搜索關鍵字至少需要2個字元",
              },
            ],
          },
        },
        { status: 400 }
      );
    }
    
    // Q42優化：使用Zod驗證查詢參數（現在可以安全地驗證，因為已經檢查了長度）
    const validatedParams = validateQueryParams(searchQuerySchema, request.nextUrl.searchParams);
    const query = validatedParams.q.trim();

    const results: SearchResult[] = [];

    try {
      const supabase = createServerSupabaseClient();
      
      // 轉義特殊字符（防止 SQL 注入）
      const escapedQuery = query.replace(/%/g, "\\%").replace(/_/g, "\\_");
      
      // 搜尋酒款
      const { data: wines, error: winesError } = await supabase
        .from("wines")
        .select(`
          id,
          nameZh,
          nameEn,
          region,
          price,
          mainImageUrl,
          wineries (
            nameZh,
            nameEn
          )
        `)
        .eq("published", true)
        .or(`nameZh.ilike.%${escapedQuery}%,nameEn.ilike.%${escapedQuery}%,descriptionZh.ilike.%${escapedQuery}%,descriptionEn.ilike.%${escapedQuery}%,region.ilike.%${escapedQuery}%`)
        .limit(10);

      if (winesError) {
        // Q22優化：使用logger替代console.error
        const errorMessage = winesError instanceof Error ? winesError.message : (winesError as { message?: string }).message || "Wines search error";
        logger.error(
          "Wines search error",
          winesError instanceof Error ? winesError : new Error(errorMessage),
          { endpoint: "/api/search", requestId, query: escapedQuery }
        );
      }

      // 搜尋酒莊
      const { data: wineries, error: wineriesError } = await supabase
        .from("wineries")
        .select(`
          id,
          nameZh,
          nameEn,
          region
        `)
        .or(`nameZh.ilike.%${escapedQuery}%,nameEn.ilike.%${escapedQuery}%,descriptionZh.ilike.%${escapedQuery}%,descriptionEn.ilike.%${escapedQuery}%,region.ilike.%${escapedQuery}%,country.ilike.%${escapedQuery}%`)
        .limit(10);

      if (wineriesError) {
        // Q22優化：使用logger替代console.error
        const errorMessage = wineriesError instanceof Error ? wineriesError.message : (wineriesError as { message?: string }).message || "Wineries search error";
        logger.error(
          "Wineries search error",
          wineriesError instanceof Error ? wineriesError : new Error(errorMessage),
          { endpoint: "/api/search", requestId, query: escapedQuery }
        );
      }

      // Q21優化：使用類型接口，消除any
      // 轉換酒款結果
      if (wines) {
        for (const wine of wines as WineSearchResult[]) {
          const winery = Array.isArray(wine.wineries) ? wine.wineries[0] : (wine.wineries as { nameZh?: string; nameEn?: string } | undefined);
          results.push({
            id: wine.id,
            type: "wine",
            nameZh: wine.nameZh || "",
            nameEn: wine.nameEn || "",
            wineryName: winery?.nameZh || winery?.nameEn || undefined,
            region: wine.region || undefined,
            price: wine.price ? Number(wine.price) : undefined,
            imageUrl: wine.mainImageUrl || undefined,
          });
        }
      }

      // Q21優化：使用類型接口，消除any
      // 轉換酒莊結果
      if (wineries) {
        for (const winery of wineries as WinerySearchResult[]) {
          results.push({
            id: winery.id,
            type: "winery",
            nameZh: winery.nameZh || "",
            nameEn: winery.nameEn || "",
            region: winery.region || undefined,
          });
        }
      }

      // 計算相關性分數並應用模糊搜尋
      const scoredResults = results
        .map((result) => ({
          ...result,
          relevanceScore: calculateRelevanceScore(
            {
              nameZh: result.nameZh,
              nameEn: result.nameEn,
              region: result.region,
            },
            query
          ),
        }))
        // 過濾：只保留相關性分數 > 0 的結果（包含模糊匹配）
        .filter((result) => {
          if (result.relevanceScore && result.relevanceScore > 0) return true;
          // 如果沒有分數，使用模糊匹配
          return (
            fuzzyMatch(result.nameZh, query) ||
            fuzzyMatch(result.nameEn, query) ||
            (result.region && fuzzyMatch(result.region, query))
          );
        })
        // 按相關性分數排序
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      const response = NextResponse.json({ results: scoredResults.slice(0, 20) });
      // 搜索結果短暫緩存（30秒）
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      return response;
    } catch (dbError) {
      // Q22優化：使用logger替代console.warn
      // 如果資料庫未連接或查詢失敗，返回範例結果
      logger.warn("Database search failed, returning mock results", {
        endpoint: "/api/search",
        requestId,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      
      // 範例結果（用於開發階段）
      const mockResults: SearchResult[] = [];
      
      if (query.toLowerCase().includes("napa") || query.toLowerCase().includes("納帕")) {
        mockResults.push({
          id: "1",
          type: "wine",
          nameZh: "Darioush Darius II 2021",
          nameEn: "Darioush Darius II 2021",
          wineryName: "Darioush Estate",
          region: "Napa Valley",
          price: 13500,
        });
      }
      
      if (query.toLowerCase().includes("darioush") || query.toLowerCase().includes("達里奧什")) {
        mockResults.push({
          id: "1",
          type: "winery",
          nameZh: "Darioush Estate",
          nameEn: "Darioush Estate",
          region: "Napa Valley",
        });
      }
      
      if (query.toLowerCase().includes("staglin") || query.toLowerCase().includes("斯塔格林")) {
        mockResults.push({
          id: "2",
          type: "wine",
          nameZh: "Staglin Family Salus Cabernet Sauvignon 2018",
          nameEn: "Staglin Family Salus Cabernet Sauvignon 2018",
          wineryName: "Staglin Family",
          region: "Napa Valley",
          price: 8500,
        });
      }
      
      if (query.toLowerCase().includes("jordan") || query.toLowerCase().includes("喬丹")) {
        mockResults.push({
          id: "3",
          type: "winery",
          nameZh: "Jordan Winery",
          nameEn: "Jordan Winery",
          region: "Sonoma County",
        });
      }
      
      return NextResponse.json({ results: mockResults });
    }
  } catch (error) {
    // Q22優化：使用logger替代console.error
    logger.error(
      "Search API Error",
      error instanceof Error ? error : new Error("Search API Error"),
      { endpoint: "/api/search", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("搜尋服務暫時無法使用"),
      requestId
    );
  }
}
