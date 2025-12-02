import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { rateLimiter, strictRateLimit } from "@/lib/api/rate-limiter";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { paginationSchema, sortSchema } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取詢價單列表
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 速率限制（管理員API使用嚴格限制）
    if (process.env.NODE_ENV === "production") {
      try {
        rateLimiter.check(request, strictRateLimit);
      } catch (rateLimitError) {
        return createErrorResponse(rateLimitError as Error, requestId);
      }
    }
    
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
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
        search: z.string().optional().default(""),
        status: z.string().optional(),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
      searchParams
    );
    
    const page = typeof queryParams.page === "number" ? queryParams.page : 1;
    const limit = typeof queryParams.limit === "number" ? queryParams.limit : 20;
    const search = queryParams.search || "";
    const status = queryParams.status;
    const sortBy = queryParams.sortBy || "createdAt";
    const sortOrder = queryParams.sortOrder || "desc";

    const supabase = createServerSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("inquiries")
      .select(
        `
        id,
        name,
        email,
        phone,
        quantity,
        purpose,
        budget,
        notes,
        specialRequest,
        deliveryDate,
        status,
        assignedTo,
        response,
        respondedAt,
        respondedBy,
        createdAt,
        updatedAt,
        wineId,
        userId,
        wines (
          id,
          nameZh,
          nameEn,
          mainImageUrl
        ),
        users (
          id,
          email,
          name
        )
      `,
        { count: "exact" }
      );

    // 搜索過濾
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    // 狀態過濾
    if (status) {
      query = query.eq("status", status);
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 分頁
    query = query.range(offset, offset + limit - 1);

    const { data: inquiries, error, count } = await query;

    if (error) {
      logger.error("Error fetching inquiries", error, { requestId });
      return NextResponse.json({ error: "獲取詢價單列表失敗" }, { status: 500 });
    }

    return NextResponse.json({
      inquiries: inquiries || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    // Q21優化：消除any類型
    logger.error(
      "Admin inquiries GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/orders", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("獲取詢價單列表失敗"),
      requestId
    );
  }
}

