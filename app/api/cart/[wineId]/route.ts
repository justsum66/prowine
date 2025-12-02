import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { cartUpdateSchema, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// 更新購物車項目數量
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ wineId: string }> }
) {
  const requestId = generateRequestId();
  const { wineId } = await params;
  try {
    const supabase = createServerSupabaseClient();
    
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(
      cartUpdateSchema.extend({
        sessionId: z.string().optional(),
        userId: z.string().optional(),
      }),
      request
    );
    
    const { quantity, sessionId, userId } = body;

    // 查找購物車
    let cartQuery = supabase
      .from("carts")
      .select("id");

    if (userId) {
      cartQuery = cartQuery.eq("userId", userId);
    } else if (sessionId) {
      cartQuery = cartQuery.eq("sessionId", sessionId);
    }

    const { data: carts, error: findError } = await cartQuery.limit(1);

    if (findError || !carts || carts.length === 0) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cartId = carts[0].id;

    // 查找購物車項目
    const { data: item, error: itemError } = await supabase
      .from("cart_items")
      .select("id")
      .eq("cartId", cartId)
      .eq("wineId", wineId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (quantity === 0) {
      // 刪除項目
      await supabase
        .from("cart_items")
        .delete()
        .eq("id", item.id);
    } else {
      // 更新數量
      await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", item.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Cart API Error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/cart/${wineId}`, method: "PUT", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to update cart item"),
      requestId
    );
  }
}

// 移除購物車項目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ wineId: string }> }
) {
  const requestId = generateRequestId();
  const { wineId } = await params;
  try {
    const supabase = createServerSupabaseClient();
    
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(
      z.object({
        sessionId: z.string().optional(),
        userId: z.string().optional(),
      }),
      request
    );
    
    const { sessionId, userId } = body;

    // 查找購物車
    let cartQuery = supabase
      .from("carts")
      .select("id");

    if (userId) {
      cartQuery = cartQuery.eq("userId", userId);
    } else if (sessionId) {
      cartQuery = cartQuery.eq("sessionId", sessionId);
    }

    const { data: carts, error: findError } = await cartQuery.limit(1);

    if (findError || !carts || carts.length === 0) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cartId = carts[0].id;

    // 刪除購物車項目
    await supabase
      .from("cart_items")
      .delete()
      .eq("cartId", cartId)
      .eq("wineId", wineId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Cart API Error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/cart/${wineId}`, method: "DELETE", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to delete cart item"),
      requestId
    );
  }
}
