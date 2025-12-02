import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validatePathParams } from "@/lib/api/zod-schemas";
import { idSchema } from "@/lib/api/zod-schemas";

// PUT - 標記通知為已讀
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證路徑參數
    const { id } = await validatePathParams(idSchema, params);
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("admin_notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("adminId", admin.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Mark notification as read error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/notifications/[id]/read", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("標記失敗"),
      requestId
    );
  }
}

