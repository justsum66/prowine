import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";

// GET - 獲取未讀通知數量
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    const supabase = createServerSupabaseClient();

    const { count, error } = await supabase
      .from("admin_notifications")
      .select("*", { count: "exact", head: true })
      .eq("adminId", admin.id)
      .eq("read", false);

    if (error) {
      throw error;
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Get unread count error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/notifications/unread-count", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("獲取未讀數量失敗"),
      requestId
    );
  }
}

