import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證請求體
    const subscription = await validateRequestBody(
      z.object({
        endpoint: z.string().url("無效的推送端點"),
      }),
      request
    );

    // 從資料庫刪除推送訂閱
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", subscription.endpoint);

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "刪除推送訂閱失敗",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/notifications/unsubscribe", requestId, userId: user.id }
      );
      return createErrorResponse(new Error("刪除訂閱失敗"), requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "取消訂閱推送通知失敗",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/notifications/unsubscribe", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("取消訂閱失敗"),
      requestId
    );
  }
}

