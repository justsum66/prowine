import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { wishlistAddSchema, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// 獲取願望清單
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    // 訪客模式：使用 localStorage 存儲（暫時返回空）
    if (!userId && sessionId) {
      return NextResponse.json({ items: [] });
    }

    if (!userId) {
      return NextResponse.json({ items: [] });
    }

    // 查找或創建願望清單
    let { data: wishlist, error: findError } = await supabase
      .from("wishlists")
      .select(`
        id,
        wishlist_items (
          id,
          wineId,
          wines (
            id,
            nameZh,
            nameEn,
            price,
            mainImageUrl,
            region,
            wineries (
              nameZh,
              nameEn
            )
          )
        )
      `)
      .eq("userId", userId)
      .single();

    if (findError || !wishlist) {
      // 創建新願望清單
      const { data: newWishlist, error: createError } = await supabase
        .from("wishlists")
        .insert({ userId })
        .select()
        .single();

      if (createError || !newWishlist) {
        return NextResponse.json({ items: [] });
      }

      return NextResponse.json({ items: [] });
    }

    // Q21優化：定義類型接口，消除any
    interface WishlistItem {
      id: string;
      wineId: string;
      wines?: {
        id: string;
        nameZh?: string;
        nameEn?: string;
        price?: number | string;
        mainImageUrl?: string;
        region?: string;
        wineries?: {
          nameZh?: string;
          nameEn?: string;
        } | Array<{
          nameZh?: string;
          nameEn?: string;
        }>;
      } | Array<{
        id: string;
        nameZh?: string;
        nameEn?: string;
        price?: number | string;
        mainImageUrl?: string;
        region?: string;
        wineries?: {
          nameZh?: string;
          nameEn?: string;
        } | Array<{
          nameZh?: string;
          nameEn?: string;
        }>;
      }>;
    }

    const items = ((wishlist.wishlist_items || []) as WishlistItem[]).map((item: WishlistItem) => {
      const wine = Array.isArray(item.wines) ? item.wines[0] : item.wines;
      const winery = wine && Array.isArray(wine.wineries) ? wine.wineries[0] : (wine?.wineries as { nameZh?: string; nameEn?: string } | undefined);
      
      return {
        id: item.id,
        wineId: item.wineId,
        nameZh: wine?.nameZh,
        nameEn: wine?.nameEn,
        wineryName: winery?.nameZh || winery?.nameEn,
        price: wine?.price ? Number(wine.price) : 0,
        imageUrl: wine?.mainImageUrl || undefined,
        region: wine?.region || undefined,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    const requestId = generateRequestId();
    const errorMessage = error instanceof Error ? error.message : "Wishlist API Error";
    logger.error(
      errorMessage,
      error instanceof Error ? error : new Error("Wishlist API Error"),
      { endpoint: "/api/wishlist", method: "GET", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to fetch wishlist"),
      requestId
    );
  }
}

// 添加商品到願望清單
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const supabase = createServerSupabaseClient();
    
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(wishlistAddSchema.extend({
      sessionId: z.string().optional(),
      userId: z.string().optional(),
    }), request);
    
    const { wineId, sessionId, userId } = body;

    // 訪客模式：暫時存儲在 localStorage（前端處理）
    if (!userId) {
      return NextResponse.json({ success: true, guest: true });
    }

    // 查找或創建願望清單
    let { data: wishlist, error: findError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("userId", userId)
      .single();

    if (findError || !wishlist) {
      // 創建新願望清單
      const { data: newWishlist, error: createError } = await supabase
        .from("wishlists")
        .insert({ userId })
        .select()
        .single();

      if (createError || !newWishlist) {
        return NextResponse.json({ error: "Failed to create wishlist" }, { status: 500 });
      }

      wishlist = newWishlist;
    }

    // 檢查是否已存在
    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    const { data: existing, error: checkError } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("wishlistId", wishlist.id)
      .eq("wineId", wineId)
      .single();

    if (!existing && checkError) {
      // 添加新項目
      await supabase
        .from("wishlist_items")
        .insert({
          wishlistId: wishlist.id,
          wineId,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    const errorMessage = error instanceof Error ? error.message : "Wishlist API Error";
    logger.error(
      errorMessage,
      error instanceof Error ? error : new Error("Wishlist API Error"),
      { endpoint: "/api/wishlist", method: "POST", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to add item to wishlist"),
      requestId
    );
  }
}
