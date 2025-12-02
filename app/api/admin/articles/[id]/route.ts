import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validatePathParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { idSchema } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET, PUT, DELETE - 文章 CRUD 操作
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdminRole(request, "EDITOR");
    if (authCheck) return authCheck;

    // Q42優化：使用Zod驗證路徑參數
    const { id } = await validatePathParams(idSchema, params);
    const supabase = createServerSupabaseClient();

    const { data: article, error } = await supabase
      .from("articles")
      .select(`
        *,
        wineries (
          id,
          nameZh,
          nameEn
        )
      `)
      .eq("id", id)
      .single();

    if (error || !article) {
      return createErrorResponse(new Error("文章不存在"), requestId);
    }

    return NextResponse.json({ article });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin article GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/articles/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdminRole(request, "EDITOR");
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證路徑參數和請求體
    const { id } = await validatePathParams(idSchema, params);
    const body = await validateRequestBody(
      z.object({
        titleZh: z.string().optional(),
        titleEn: z.string().optional(),
        contentZh: z.string().optional(),
        contentEn: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        featuredImage: z.string().url().optional().or(z.literal("")),
        images: z.array(z.string().url()).optional().nullable(),
        wineryId: z.string().optional().nullable(),
        published: z.boolean().optional(),
        featured: z.boolean().optional(),
        seoTitleZh: z.string().optional(),
        seoTitleEn: z.string().optional(),
        seoDescriptionZh: z.string().optional(),
        seoDescriptionEn: z.string().optional(),
      }).passthrough(), // 允許額外字段
      request
    );
    const supabase = createServerSupabaseClient();

    const { data: oldArticle } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldArticle) {
      return createErrorResponse(new Error("文章不存在"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface ArticleUpdateData {
      [key: string]: unknown;
      publishedAt?: string;
    }
    
    // 如果發布狀態改變為已發布，設置發布時間
    const updateData: ArticleUpdateData = { ...body };
    if (body.published && !oldArticle.published && !oldArticle.publishedAt) {
      updateData.publishedAt = new Date().toISOString();
    }

    const { data: article, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error updating article",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/articles/${id}`, requestId }
      );
      return createErrorResponse(new Error("更新文章失敗"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface ChangeRecord {
      from: unknown;
      to: unknown;
    }
    
    const changes: Record<string, ChangeRecord> = {};
    Object.keys(updateData).forEach((key) => {
      if (oldArticle[key] !== updateData[key]) {
        changes[key] = { from: oldArticle[key], to: updateData[key] };
      }
    });

    await createAuditLog(admin.id, "UPDATE", "ARTICLE", id, changes, request);

    return NextResponse.json({ article });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin article PUT error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/articles/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdminRole(request, "ADMIN");
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證路徑參數
    const { id } = await validatePathParams(idSchema, params);
    const supabase = createServerSupabaseClient();

    const { data: article } = await supabase
      .from("articles")
      .select("id, titleZh, titleEn")
      .eq("id", id)
      .single();

    if (!article) {
      return createErrorResponse(new Error("文章不存在"), requestId);
    }

    // 軟刪除：設置為未發布
    const { error } = await supabase
      .from("articles")
      .update({ published: false })
      .eq("id", id);

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error deleting article",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/articles/${id}`, requestId }
      );
      return createErrorResponse(new Error("刪除文章失敗"), requestId);
    }

    await createAuditLog(
      admin.id,
      "DELETE",
      "ARTICLE",
      id,
      { titleZh: article.titleZh, titleEn: article.titleEn },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin article DELETE error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/articles/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

