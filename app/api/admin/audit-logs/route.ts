import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取審計日誌列表
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
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
        search: z.string().optional().default(""),
        entity: z.string().optional(),
        action: z.string().optional(),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
      searchParams
    );
    
    const page = typeof queryParams.page === "number" ? queryParams.page : 1;
    const limit = typeof queryParams.limit === "number" ? queryParams.limit : 50;
    const search = queryParams.search || "";
    const entity = queryParams.entity;
    const action = queryParams.action;
    const sortBy = queryParams.sortBy || "createdAt";
    const sortOrder = queryParams.sortOrder || "desc";

    const supabase = createServerSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("audit_logs")
      .select(
        `
        *,
        admins (
          id,
          email,
          name
        )
      `,
        { count: "exact" }
      );

    // 搜索過濾（搜索操作類型或實體類型）
    if (search) {
      query = query.or(`action.ilike.%${search}%,entity.ilike.%${search}%`);
    }

    // 實體類型過濾
    if (entity) {
      query = query.eq("entity", entity);
    }

    // 操作類型過濾
    if (action) {
      query = query.ilike("action", `%${action}%`);
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 分頁
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error fetching audit logs",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/admin/audit-logs", requestId }
      );
      return createErrorResponse(new Error("獲取審計日誌失敗"), requestId);
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Admin audit logs GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/audit-logs", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

