import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義類型接口，消除any
interface WineryWithCount {
  id: string;
  nameZh: string;
  nameEn?: string;
  [key: string]: unknown;
  wineCount: number;
}

// GET - 獲取酒莊列表
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    // Q42優化：使用Zod驗證查詢參數
    const searchParams = request.nextUrl.searchParams;
    const queryParams = validateQueryParams(
      z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
        search: z.string().optional().default(""),
        featured: z.string().optional().transform((val) => val === "true"),
      }),
      searchParams
    );
    
    const page = typeof queryParams.page === "number" ? queryParams.page : 1;
    const limit = typeof queryParams.limit === "number" ? queryParams.limit : 20;
    const search = queryParams.search || "";
    const featured = queryParams.featured;

    const supabase = createServerSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("wineries")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`nameZh.ilike.%${search}%,nameEn.ilike.%${search}%`);
    }

    if (featured !== undefined && featured !== null) {
      query = query.eq("featured", featured);
    }

    query = query.order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: wineries, error, count } = await query;

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error fetching wineries",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/admin/wineries", requestId }
      );
      return createErrorResponse(new Error("獲取酒莊列表失敗"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    // 獲取每個酒莊的酒款數量
    const wineriesWithCount: WineryWithCount[] = await Promise.all(
      (wineries || []).map(async (winery) => {
        const { count: wineCount } = await supabase
          .from("wines")
          .select("*", { count: "exact", head: true })
          .eq("wineryId", winery.id);

        return {
          ...winery,
          wineCount: wineCount || 0,
        };
      })
    );

    return NextResponse.json({
      wineries: wineriesWithCount,
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
      "Admin wineries GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/wineries", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// POST - 創建新酒莊
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdminRole(request, "EDITOR");
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(
      z.object({
        nameZh: z.string().min(1, "中文名稱不能為空"),
        nameEn: z.string().min(1, "英文名稱不能為空"),
        descriptionZh: z.string().optional(),
        descriptionEn: z.string().optional(),
        storyZh: z.string().optional(),
        storyEn: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        logoUrl: z.string().url().optional().or(z.literal("")),
        images: z.array(z.string().url()).optional().nullable(),
        featured: z.boolean().optional().default(false),
      }),
      request
    );
    
    const {
      nameZh,
      nameEn,
      descriptionZh,
      descriptionEn,
      storyZh,
      storyEn,
      region,
      country,
      website,
      logoUrl,
      images,
      featured = false,
    } = body;

    // 生成 slug
    const slug = nameEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const supabase = createServerSupabaseClient();

    // 檢查 slug 是否已存在
    const { data: existing } = await supabase
      .from("wineries")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: "此 slug 已存在" }, { status: 400 });
    }

    // 創建酒莊
    const { data: winery, error } = await supabase
      .from("wineries")
      .insert({
        nameZh,
        nameEn,
        slug,
        descriptionZh,
        descriptionEn,
        storyZh,
        storyEn,
        region,
        country,
        website,
        logoUrl,
        images: images || null,
        featured,
      })
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error creating winery",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/admin/wineries", requestId }
      );
      return createErrorResponse(new Error("創建酒莊失敗"), requestId);
    }

    // 創建審計日誌
    await createAuditLog(
      admin.id,
      "CREATE",
      "WINERY",
      winery.id,
      { nameZh, nameEn, featured },
      request
    );

    return NextResponse.json({ winery }, { status: 201 });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Admin wineries POST error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/wineries", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

