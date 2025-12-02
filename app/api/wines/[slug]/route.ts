import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const { slug } = await params;

    const supabase = createServerSupabaseClient();
    
    // 先查詢 wineryId，然後分別查詢 wine 和 winery（避免 RLS 問題）
    // 注意：foodPairing、tastingNotes、flavorProfile 存儲在 images JSON 字段中
    const { data: wine, error } = await supabase
      .from("wines")
      .select(`
        id,
        nameZh,
        nameEn,
        slug,
        descriptionZh,
        descriptionEn,
        storyZh,
        storyEn,
        mainImageUrl,
        images,
        region,
        country,
        vintage,
        grapeVarieties,
        price,
        alcoholContent,
        servingTemp,
        ratings,
        stock,
        stockAlert,
        warehouse,
        category,
        wineryId
      `)
      .eq("slug", slug)
      .eq("published", true)
      .single();
    
    // 如果有酒款，獲取酒莊信息
    let wineryData = null;
    if (wine && wine.wineryId) {
      const { data: winery, error: wineryError } = await supabase
        .from("wineries")
        .select(`
          id,
          nameZh,
          nameEn,
          descriptionZh,
          descriptionEn,
          storyZh,
          storyEn,
          logoUrl
        `)
        .eq("id", wine.wineryId)
        .single();
      
      if (!wineryError && winery) {
        wineryData = winery;
      }
    }
    
    const wineWithWinery = wine ? {
      ...wine,
      winery: wineryData
    } : null;

    if (error || !wineWithWinery) {
      logger.warn("Wine not found", { requestId, slug, error });
      // 返回友好的 404 響應，而不是錯誤響應
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "酒款不存在",
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 404 }
      );
    }

    // Q21優化：定義類型接口，消除any
    interface WineRatings {
      decanter?: number;
      jamesSuckling?: number;
      robertParker?: number;
    }
    
    const wineWithNumbers = {
      ...wineWithWinery,
      price: Number(wineWithWinery.price),
      ratings: (wineWithWinery.ratings as WineRatings | null) || null,
    };

    const duration = Date.now() - startTime;
    logger.logRequest("GET", `/api/wines/${slug}`, 200, duration, { requestId, slug });

    return NextResponse.json({ wine: wineWithNumbers }, { status: 200 });
  } catch (error) {
    // Q21優化：消除any類型
    const { slug } = await params;
    const duration = Date.now() - startTime;
    logger.error(
      "Error fetching wine by slug",
      error instanceof Error ? error : new Error("Unknown error"),
      { requestId, slug }
    );
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
    logger.logRequest("GET", `/api/wines/${slug}`, statusCode, duration, { requestId });
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to fetch wine"),
      requestId
    );
  }
}
