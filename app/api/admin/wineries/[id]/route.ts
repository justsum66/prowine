import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validatePathParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { idSchema } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取單個酒莊詳情
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

    const { data: winery, error } = await supabase
      .from("wineries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !winery) {
      return createErrorResponse(new Error("酒莊不存在"), requestId);
    }

    return NextResponse.json({ winery });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin winery GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/wineries/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// PUT - 更新酒莊
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
        nameZh: z.string().optional(),
        nameEn: z.string().optional(),
        descriptionZh: z.string().optional(),
        descriptionEn: z.string().optional(),
        storyZh: z.string().optional(),
        storyEn: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        logoUrl: z.string().url().optional().or(z.literal("")),
        images: z.array(z.string().url()).optional().nullable(),
        featured: z.boolean().optional(),
      }).passthrough(), // 允許額外字段
      request
    );
    const supabase = createServerSupabaseClient();

    // 獲取原始數據
    const { data: oldWinery } = await supabase
      .from("wineries")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldWinery) {
      return createErrorResponse(new Error("酒莊不存在"), requestId);
    }

    // 更新酒莊
    const { data: winery, error } = await supabase
      .from("wineries")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error updating winery",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/wineries/${id}`, requestId }
      );
      return createErrorResponse(new Error("更新酒莊失敗"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface ChangeRecord {
      from: unknown;
      to: unknown;
    }
    
    // 創建審計日誌
    const changes: Record<string, ChangeRecord> = {};
    Object.keys(body).forEach((key) => {
      if (oldWinery[key] !== body[key]) {
        changes[key] = { from: oldWinery[key], to: body[key] };
      }
    });

    await createAuditLog(admin.id, "UPDATE", "WINERY", id, changes, request);

    return NextResponse.json({ winery });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin winery PUT error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/wineries/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// DELETE - 刪除酒莊
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

    // 檢查是否存在
    const { data: winery } = await supabase
      .from("wineries")
      .select("id, nameZh, nameEn")
      .eq("id", id)
      .single();

    if (!winery) {
      return createErrorResponse(new Error("酒莊不存在"), requestId);
    }

    // 檢查是否有關聯的酒款
    const { count: wineCount } = await supabase
      .from("wines")
      .select("*", { count: "exact", head: true })
      .eq("wineryId", id);

    if (wineCount && wineCount > 0) {
      return createErrorResponse(
        new Error(`無法刪除，該酒莊仍有 ${wineCount} 個酒款`),
        requestId
      );
    }

    // 刪除酒莊
    const { error } = await supabase.from("wineries").delete().eq("id", id);

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error deleting winery",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/wineries/${id}`, requestId }
      );
      return createErrorResponse(new Error("刪除酒莊失敗"), requestId);
    }

    // 創建審計日誌
    await createAuditLog(
      admin.id,
      "DELETE",
      "WINERY",
      id,
      { nameZh: winery.nameZh, nameEn: winery.nameEn },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin winery DELETE error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/wineries/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

