import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取酒款列表（管理員版本，包含未發布的）
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
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
        search: z.string().optional().default(""),
        published: z.string().optional().transform((val) => val === "true"),
        category: z.string().optional(),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
      searchParams
    );
    
    const page = typeof queryParams.page === "number" ? queryParams.page : 1;
    const limit = typeof queryParams.limit === "number" ? queryParams.limit : 20;
    const search = queryParams.search || "";
    const published = queryParams.published;
    const category = queryParams.category;
    const sortBy = queryParams.sortBy || "createdAt";
    const sortOrder = queryParams.sortOrder || "desc";

    const supabase = createServerSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("wines")
      .select(`
        id,
        slug,
        nameZh,
        nameEn,
        category,
        price,
        stock,
        stockAlert,
        published,
        featured,
        bestseller,
        mainImageUrl,
        wineryId,
        createdAt,
        updatedAt,
        wineries (
          id,
          nameZh,
          nameEn
        )
      `, { count: "exact" });

    // 搜索過濾
    if (search) {
      query = query.or(`nameZh.ilike.%${search}%,nameEn.ilike.%${search}%`);
    }

    // 發布狀態過濾
    if (published !== undefined && published !== null) {
      query = query.eq("published", published);
    }

    // 分類過濾
    if (category) {
      query = query.eq("category", category);
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // 分頁
    query = query.range(offset, offset + limit - 1);

    const { data: wines, error, count } = await query;

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error fetching wines",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/admin/wines", requestId }
      );
      return createErrorResponse(new Error("獲取酒款列表失敗"), requestId);
    }

    return NextResponse.json({
      wines: wines || [],
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
      "Admin wines GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/wines", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// POST - 創建新酒款
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
        wineryId: z.string().min(1, "酒莊ID不能為空"),
        category: z.enum([
          "SPARKLING_WINE",
          "WHITE_WINE",
          "RED_WINE",
          "ROSE_WINE",
          "DESSERT_WINE",
          "FORTIFIED_WINE",
        ]),
        price: z.union([z.string(), z.number()]).transform((val) => {
          if (typeof val === "string") {
            const num = parseFloat(val);
            if (isNaN(num) || num <= 0) throw new Error("價格必須大於0");
            return num;
          }
          if (val <= 0) throw new Error("價格必須大於0");
          return val;
        }),
        stock: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined) return 0;
          if (typeof val === "string") return parseInt(val, 10) || 0;
          return val;
        }).default(0),
        stockAlert: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined) return 10;
          if (typeof val === "string") return parseInt(val, 10) || 10;
          return val;
        }).default(10),
        descriptionZh: z.string().optional(),
        descriptionEn: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
        vintage: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined || val === null) return null;
          if (typeof val === "string") return parseInt(val, 10) || null;
          return val;
        }),
        grapeVarieties: z.array(z.string()).optional().default([]),
        alcoholContent: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined || val === null) return null;
          if (typeof val === "string") {
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
          }
          return val;
        }),
        servingTemp: z.string().optional(),
        mainImageUrl: z.string().url().optional().or(z.literal("")),
        images: z.array(z.string().url()).optional().nullable(),
        ratings: z.record(z.string(), z.unknown()).optional().nullable(),
        published: z.boolean().optional().default(false),
        featured: z.boolean().optional().default(false),
        bestseller: z.boolean().optional().default(false),
        seoTitleZh: z.string().optional(),
        seoTitleEn: z.string().optional(),
        seoDescriptionZh: z.string().optional(),
        seoDescriptionEn: z.string().optional(),
        keywords: z.array(z.string()).optional().default([]),
      }),
      request
    );
    
    const {
      nameZh,
      nameEn,
      wineryId,
      category,
      price,
      stock = 0,
      stockAlert = 10,
      descriptionZh,
      descriptionEn,
      region,
      country,
      vintage,
      grapeVarieties = [],
      alcoholContent,
      servingTemp,
      mainImageUrl,
      images,
      ratings,
      published = false,
      featured = false,
      bestseller = false,
      seoTitleZh,
      seoTitleEn,
      seoDescriptionZh,
      seoDescriptionEn,
      keywords = [],
    } = body;

    // 生成 slug
    const slug = `${nameEn.toLowerCase().replace(/\s+/g, "-")}-${vintage || new Date().getFullYear()}`;

    const supabase = createServerSupabaseClient();

    // 檢查 slug 是否已存在
    const { data: existing } = await supabase
      .from("wines")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: "此 slug 已存在" }, { status: 400 });
    }

    // 計算價位等級
    const priceNum = typeof price === "number" ? price : parseFloat(price);
    let priceRange = "";
    if (priceNum < 800) priceRange = "480-800";
    else if (priceNum < 1500) priceRange = "801-1500";
    else if (priceNum < 3000) priceRange = "1501-3000";
    else if (priceNum < 5000) priceRange = "3001-5000";
    else priceRange = "5000+";

    // 創建酒款
    const { data: wine, error } = await supabase
      .from("wines")
      .insert({
        nameZh,
        nameEn,
        slug,
        wineryId,
        category,
        price: priceNum,
        priceRange,
        stock: typeof stock === "number" ? stock : parseInt(String(stock), 10),
        stockAlert: typeof stockAlert === "number" ? stockAlert : parseInt(String(stockAlert), 10),
        descriptionZh,
        descriptionEn,
        region,
        country,
        vintage: vintage ?? null,
        grapeVarieties: Array.isArray(grapeVarieties) ? grapeVarieties : [],
        alcoholContent: alcoholContent ?? null,
        servingTemp,
        mainImageUrl,
        images: images || null,
        ratings: ratings || null,
        published,
        featured,
        bestseller,
        seoTitleZh,
        seoTitleEn,
        seoDescriptionZh,
        seoDescriptionEn,
        keywords: Array.isArray(keywords) ? keywords : [],
      })
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error creating wine",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/admin/wines", requestId }
      );
      return createErrorResponse(new Error("創建酒款失敗"), requestId);
    }

    // 創建審計日誌
    await createAuditLog(
      admin.id,
      "CREATE",
      "WINE",
      wine.id,
      { nameZh, nameEn, price: priceNum, published },
      request
    );

    return NextResponse.json({ wine }, { status: 201 });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Admin wines POST error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/wines", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

