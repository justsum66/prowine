import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { cartItemSchema, cartUpdateSchema, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// 獲取購物車
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    if (!sessionId && !userId) {
      return NextResponse.json({ items: [] });
    }

    // 查找購物車
    let cartQuery = supabase
      .from("carts")
      .select(`
        id,
        cart_items (
          id,
          wineId,
          quantity,
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
      `);

    if (userId) {
      cartQuery = cartQuery.eq("userId", userId);
    } else if (sessionId) {
      cartQuery = cartQuery.eq("sessionId", sessionId);
    }

    const { data: carts, error: cartError } = await cartQuery.limit(1);

    if (cartError || !carts || carts.length === 0) {
      // 如果沒有購物車，創建一個
      const { data: newCart, error: createError } = await supabase
        .from("carts")
        .insert({
          userId: userId || null,
          sessionId: sessionId || null,
        })
        .select()
        .single();

      if (createError || !newCart) {
        return NextResponse.json({ items: [] });
      }

      return NextResponse.json({ items: [] });
    }

    // Q21優化：定義類型接口，消除any
    interface CartItem {
      id: string;
      wineId: string;
      quantity: number;
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

    const cart = carts[0];
    const items = ((cart.cart_items || []) as CartItem[]).map((item: CartItem) => {
      const wine = Array.isArray(item.wines) ? item.wines[0] : item.wines;
      const winery = wine && Array.isArray(wine.wineries) ? wine.wineries[0] : (wine?.wineries as { nameZh?: string; nameEn?: string } | undefined);
      
      return {
        id: item.id,
        wineId: item.wineId,
        nameZh: wine?.nameZh,
        nameEn: wine?.nameEn,
        wineryName: winery?.nameZh || winery?.nameEn,
        price: wine?.price ? Number(wine.price) : 0,
        quantity: item.quantity,
        imageUrl: wine?.mainImageUrl || undefined,
        region: wine?.region || undefined,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    const requestId = generateRequestId();
    const errorMessage = error instanceof Error ? error.message : "Cart API Error";
    logger.error(
      errorMessage,
      error instanceof Error ? error : new Error("Cart API Error"),
      { endpoint: "/api/cart", method: "GET", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to fetch cart"),
      requestId
    );
  }
}

// 添加商品到購物車
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const supabase = createServerSupabaseClient();
    
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(cartItemSchema.extend({
      sessionId: z.string().optional(),
      userId: z.string().optional(),
    }), request);
    
    const { wineId, quantity, sessionId, userId } = body;

    // 查找或創建購物車
    let cartQuery = supabase
      .from("carts")
      .select("id");

    if (userId) {
      cartQuery = cartQuery.eq("userId", userId);
    } else if (sessionId) {
      cartQuery = cartQuery.eq("sessionId", sessionId);
    }

    const { data: carts, error: findError } = await cartQuery.limit(1);

    let cartId: string;

    if (findError || !carts || carts.length === 0) {
      // 創建新購物車
      const { data: newCart, error: createError } = await supabase
        .from("carts")
        .insert({
          userId: userId || null,
          sessionId: sessionId || null,
        })
        .select()
        .single();

      if (createError || !newCart) {
        return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });
      }

      cartId = newCart.id;
    } else {
      cartId = carts[0].id;
    }

    // 檢查商品是否已在購物車中
    const { data: existingItem, error: checkError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cartId", cartId)
      .eq("wineId", wineId)
      .single();

    if (existingItem && !checkError) {
      // 更新數量
      await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);
    } else {
      // 添加新商品
      await supabase
        .from("cart_items")
        .insert({
          cartId,
          wineId,
          quantity,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    const errorMessage = error instanceof Error ? error.message : "Cart API Error";
    logger.error(
      errorMessage,
      error instanceof Error ? error : new Error("Cart API Error"),
      { endpoint: "/api/cart", method: "POST", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to add item to cart"),
      requestId
    );
  }
}

// 清空購物車
export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const supabase = createServerSupabaseClient();
    
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(z.object({
      sessionId: z.string().optional(),
      userId: z.string().optional(),
    }), request);
    
    const { sessionId, userId } = body;

    let cartQuery = supabase
      .from("carts")
      .select("id");

    if (userId) {
      cartQuery = cartQuery.eq("userId", userId);
    } else if (sessionId) {
      cartQuery = cartQuery.eq("sessionId", sessionId);
    }

    const { data: carts, error } = await cartQuery.limit(1);

    if (error || !carts || carts.length === 0) {
      return NextResponse.json({ success: true });
    }

    const cartId = carts[0].id;

    // 刪除所有購物車項目
    await supabase
      .from("cart_items")
      .delete()
      .eq("cartId", cartId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    const errorMessage = error instanceof Error ? error.message : "Cart API Error";
    logger.error(
      errorMessage,
      error instanceof Error ? error : new Error("Cart API Error"),
      { endpoint: "/api/cart", method: "DELETE", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to clear cart"),
      requestId
    );
  }
}
