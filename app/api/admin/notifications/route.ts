import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取通知列表
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證查詢參數
    const searchParams = request.nextUrl.searchParams;
    const queryParams = validateQueryParams(
      z.object({
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
        unreadOnly: z.string().optional().transform((val) => val === "true"),
      }),
      searchParams
    );
    
    const limit = typeof queryParams.limit === "number" ? queryParams.limit : 50;
    const unreadOnly = queryParams.unreadOnly === true;

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from("admin_notifications")
      .select("*")
      .eq("adminId", admin.id)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Get notifications error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/notifications", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("獲取通知失敗"),
      requestId
    );
  }
}

// POST - 創建通知
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證請求體
    const { adminId, type, title, message, link } = await validateRequestBody(
      z.object({
        adminId: z.string().min(1, "管理員ID不能為空"),
        type: z.string().min(1, "通知類型不能為空"),
        title: z.string().min(1, "標題不能為空"),
        message: z.string().min(1, "訊息不能為空"),
        link: z.string().url().optional().or(z.literal("")),
      }),
      request
    );

    const supabase = createServerSupabaseClient();

    const { data: notification, error } = await supabase
      .from("admin_notifications")
      .insert({
        adminId,
        type,
        title,
        message,
        link,
        read: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ notification });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Create notification error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/notifications", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("創建通知失敗"),
      requestId
    );
  }
}

