import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// 移除願望清單項目
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
        userId: z.string().min(1, "User ID required"),
      }),
      request
    );
    
    const { userId } = body;

    // 查找願望清單
    const { data: wishlist, error: findError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("userId", userId)
      .single();

    if (findError || !wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // 刪除願望清單項目
    await supabase
      .from("wishlist_items")
      .delete()
      .eq("wishlistId", wishlist.id)
      .eq("wineId", wineId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Wishlist API Error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/wishlist/${wineId}`, method: "DELETE", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to delete wishlist item"),
      requestId
    );
  }
}
