import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取文章列表
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
        category: z.string().optional(),
        published: z.string().optional().transform((val) => val === "true"),
      }),
      searchParams
    );
    
    const page = typeof queryParams.page === "number" ? queryParams.page : 1;
    const limit = typeof queryParams.limit === "number" ? queryParams.limit : 20;
    const search = queryParams.search || "";
    const category = queryParams.category;
    const published = queryParams.published;

    const supabase = createServerSupabaseClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("articles")
      .select(`
        id,
        titleZh,
        titleEn,
        slug,
        category,
        published,
        featured,
        views,
        createdAt,
        updatedAt,
        wineries (
          id,
          nameZh,
          nameEn
        )
      `, { count: "exact" });

    if (search) {
      query = query.or(`titleZh.ilike.%${search}%,titleEn.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (published !== undefined && published !== null) {
      query = query.eq("published", published);
    }

    query = query.order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: articles, error, count } = await query;

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error fetching articles",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/admin/articles", requestId }
      );
      return createErrorResponse(new Error("獲取文章列表失敗"), requestId);
    }

    return NextResponse.json({
      articles: articles || [],
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
      "Admin articles GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/articles", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// POST - 創建新文章
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
        titleZh: z.string().min(1, "中文標題不能為空"),
        titleEn: z.string().min(1, "英文標題不能為空"),
        contentZh: z.string().min(1, "中文內容不能為空"),
        contentEn: z.string().min(1, "英文內容不能為空"),
        category: z.string().min(1, "分類不能為空"),
        tags: z.array(z.string()).optional().default([]),
        featuredImage: z.string().url().optional().or(z.literal("")),
        images: z.array(z.string().url()).optional().nullable(),
        wineryId: z.string().optional().nullable(),
        published: z.boolean().optional().default(false),
        featured: z.boolean().optional().default(false),
        seoTitleZh: z.string().optional(),
        seoTitleEn: z.string().optional(),
        seoDescriptionZh: z.string().optional(),
        seoDescriptionEn: z.string().optional(),
      }),
      request
    );
    
    const {
      titleZh,
      titleEn,
      contentZh,
      contentEn,
      category,
      tags = [],
      featuredImage,
      images,
      wineryId,
      published = false,
      featured = false,
      seoTitleZh,
      seoTitleEn,
      seoDescriptionZh,
      seoDescriptionEn,
    } = body;

    // 生成 slug
    const slug = titleEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const supabase = createServerSupabaseClient();

    // 檢查 slug 是否已存在
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: "此 slug 已存在" }, { status: 400 });
    }

    // 創建文章
    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        titleZh,
        titleEn,
        slug,
        contentZh,
        contentEn,
        category,
        tags: Array.isArray(tags) ? tags : [],
        featuredImage,
        images: images || null,
        wineryId: wineryId || null,
        published,
        featured,
        publishedAt: published ? new Date().toISOString() : null,
        seoTitleZh,
        seoTitleEn,
        seoDescriptionZh,
        seoDescriptionEn,
      })
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error creating article",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: "/api/admin/articles", requestId }
      );
      return createErrorResponse(new Error("創建文章失敗"), requestId);
    }

    await createAuditLog(
      admin.id,
      "CREATE",
      "ARTICLE",
      article.id,
      { titleZh, titleEn, published },
      request
    );

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Admin articles POST error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/articles", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

