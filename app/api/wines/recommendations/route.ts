import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義類型接口，消除any
interface WineRecommendation {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  wineryName: string;
  price: number;
  imageUrl?: string;
  mainImageUrl?: string;
  region?: string;
  vintage?: number;
  category: string;
  reason: string;
}

interface CollaborativeWine {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  price: number | string;
  mainImageUrl?: string;
  imageUrl?: string;
  region?: string;
  vintage?: number;
  category: string;
  wineries?: {
    id: string;
    nameZh?: string;
    nameEn?: string;
  } | null;
}

/**
 * 個人化推薦系統 API
 * 基於瀏覽歷史、協同過濾和 AI 推薦
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Q42優化：使用Zod驗證查詢參數
    const validatedParams = validateQueryParams(
      z.object({
        wineId: z.string().min(1, "wineId is required"),
        userId: z.string().optional(),
        limit: z.string().optional().transform((val) => Math.min(20, Math.max(1, parseInt(val || "4") || 4))),
      }),
      request.nextUrl.searchParams
    );
    
    const { wineId, userId, limit = 4 } = validatedParams;

    const supabase = createServerSupabaseClient();

    // 1. 獲取當前酒款資訊
    const { data: currentWine, error: wineError } = await supabase
      .from("wines")
      .select(
        `
        *,
        wineries (
          id,
          nameZh,
          nameEn,
          region,
          country
        )
      `
      )
      .eq("id", wineId)
      .single();

    if (wineError || !currentWine) {
      return NextResponse.json(
        { error: "Wine not found" },
        { status: 404 }
      );
    }

    // 2. 基於相似性的推薦（同酒莊、同產區、同類別）
    const { data: similarWines, error: similarError } = await supabase
      .from("wines")
      .select(
        `
        *,
        wineries (
          id,
          nameZh,
          nameEn
        )
      `
      )
      .eq("published", true)
      .neq("id", wineId)
      .or(
        `wineryId.eq.${currentWine.wineryId},region.eq.${currentWine.region || ""},category.eq.${currentWine.category || ""}`
      )
      .limit(limit * 2);

    // Q21優化：使用類型接口，消除any
    // 3. 如果用戶已登入，使用協同過濾
    let collaborativeRecommendations: CollaborativeWine[] = [];
    if (userId) {
      // 先獲取用戶的願望清單 ID
      const { data: userWishlistRecord } = await supabase
        .from("wishlists")
        .select("id")
        .eq("userId", userId)
        .single();

      if (userWishlistRecord) {
        // 獲取用戶的願望清單項目
        const { data: userWishlist } = await supabase
          .from("wishlist_items")
          .select("wineId")
          .eq("wishlistId", userWishlistRecord.id)
          .limit(10);

        if (userWishlist && userWishlist.length > 0) {
        const wineIds = userWishlist.map((item) => item.wineId);
        // 找到其他用戶也喜歡這些酒款的推薦
        const { data: collaborative } = await supabase
          .from("wishlist_items")
          .select("wineId, wishlistId")
          .in("wineId", wineIds)
          .neq("wishlistId", userWishlistRecord.id)
          .limit(20);

        if (collaborative) {
          // 統計最常被一起收藏的酒款
          const wineCounts: Record<string, number> = {};
          collaborative.forEach((item) => {
            wineCounts[item.wineId] = (wineCounts[item.wineId] || 0) + 1;
          });

          const topWineIds = Object.entries(wineCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id]) => id);

          if (topWineIds.length > 0) {
            const { data: collaborativeWines } = await supabase
              .from("wines")
              .select(
                `
                *,
                wineries (
                  id,
                  nameZh,
                  nameEn
                )
              `
              )
              .in("id", topWineIds)
              .eq("published", true)
              .neq("id", wineId);

            if (collaborativeWines) {
              collaborativeRecommendations = collaborativeWines;
            }
          }
        }
        }
      }
    }

    // 4. 使用 AI 生成推薦理由（如果配置了 API Key）
    let aiExplanation = "";
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (apiKey && currentWine) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `作為葡萄酒專家，請為以下酒款推薦 ${limit} 款相似的葡萄酒，並簡短說明推薦理由（每款不超過 20 字）：

當前酒款：
- 名稱：${currentWine.nameZh} (${currentWine.nameEn})
- 產區：${currentWine.region || "未知"}
- 類別：${currentWine.category}
- 年份：${currentWine.vintage || "未知"}
- 葡萄品種：${Array.isArray(currentWine.grapeVarieties) ? currentWine.grapeVarieties.join(", ") : "未知"}

請推薦相似的酒款並說明理由。`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiExplanation = response.text();
      } catch (aiError) {
        // Q22優化：使用logger替代console.error
        logger.error(
          "AI recommendation error",
          aiError instanceof Error ? aiError : new Error("AI error"),
          { endpoint: "/api/wines/recommendations", requestId, wineId }
        );
        // AI 失敗不影響推薦結果
      }
    }

    // 5. 合併推薦結果並去重
    const allRecommendations = [
      ...collaborativeRecommendations,
      ...(similarWines || []),
    ];

    // 去重並限制數量
    const uniqueRecommendations = Array.from(
      new Map(
        allRecommendations.map((wine) => [wine.id, wine])
      ).values()
    ).slice(0, limit);

    // Q21優化：使用類型接口，消除any
    // 格式化返回數據
    const formatted: WineRecommendation[] = uniqueRecommendations.map((wine: CollaborativeWine) => ({
      id: wine.id,
      slug: wine.slug,
      nameZh: wine.nameZh,
      nameEn: wine.nameEn,
      wineryName:
        (wine.wineries && (typeof wine.wineries === 'object' && !Array.isArray(wine.wineries)))
          ? (wine.wineries.nameZh || wine.wineries.nameEn || "未知酒莊")
          : "未知酒莊",
      price: Number(wine.price || 0),
      imageUrl: wine.mainImageUrl || wine.imageUrl,
      mainImageUrl: wine.mainImageUrl || wine.imageUrl,
      region: wine.region,
      vintage: wine.vintage,
      category: wine.category,
      reason: aiExplanation || "相似酒款推薦",
    }));

    return NextResponse.json({
      recommendations: formatted,
      explanation: aiExplanation,
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Recommendation API Error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/wines/recommendations", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to get recommendations"),
      requestId
    );
  }
}

