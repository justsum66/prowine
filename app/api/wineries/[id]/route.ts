import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const { id } = await params;

    const supabase = createServerSupabaseClient();
    
    const { data: winery, error } = await supabase
      .from("wineries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !winery) {
      logger.warn("Winery not found", { requestId, id, error });
      // 返回友好的 404 響應
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "酒莊不存在",
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        { status: 404 }
      );
    }

    // 獲取酒款數量和酒款列表
    const { count: wineCount, data: wines } = await supabase
      .from("wines")
      .select(`
        id,
        nameZh,
        nameEn,
        slug,
        price,
        mainImageUrl,
        vintage,
        region,
        country,
        featured,
        bestseller
      `, { count: "exact" })
      .eq("wineryId", id)
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("bestseller", { ascending: false })
      .order("vintage", { ascending: false })
      .limit(20);

    const wineryWithWines = {
      ...winery,
      wineCount: wineCount || 0,
      wines: wines || [],
    };

    const duration = Date.now() - startTime;
    logger.logRequest("GET", `/api/wineries/${id}`, 200, duration, { requestId, id });

    return NextResponse.json({ winery: wineryWithWines }, { status: 200 });
  } catch (error) {
    // Q21優化：消除any類型
    const duration = Date.now() - startTime;
    const resolvedParams = await params;
    logger.error(
      "Error fetching winery by id",
      error instanceof Error ? error : new Error("Unknown error"),
      { requestId, id: resolvedParams.id }
    );
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
    logger.logRequest("GET", `/api/wineries/${resolvedParams.id}`, statusCode, duration, { requestId });
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to fetch winery"),
      requestId
    );
  }
}
