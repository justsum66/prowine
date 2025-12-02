import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validatePathParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { idSchema } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取單個酒款詳情
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

    const { data: wine, error } = await supabase
      .from("wines")
      .select(`
        *,
        wineries (
          id,
          nameZh,
          nameEn,
          logoUrl
        )
      `)
      .eq("id", id)
      .single();

    if (error || !wine) {
      return createErrorResponse(new Error("酒款不存在"), requestId);
    }

    return NextResponse.json({ wine });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin wine GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/wines/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// PUT - 更新酒款
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
        wineryId: z.string().optional(),
        category: z.enum([
          "SPARKLING_WINE",
          "WHITE_WINE",
          "RED_WINE",
          "ROSE_WINE",
          "DESSERT_WINE",
          "FORTIFIED_WINE",
        ]).optional(),
        price: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined) return undefined;
          if (typeof val === "string") {
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
          }
          return val;
        }),
        stock: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined) return undefined;
          if (typeof val === "string") return parseInt(val, 10) || undefined;
          return val;
        }),
        stockAlert: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined) return undefined;
          if (typeof val === "string") return parseInt(val, 10) || undefined;
          return val;
        }),
        vintage: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined || val === null) return null;
          if (typeof val === "string") return parseInt(val, 10) || null;
          return val;
        }),
        alcoholContent: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (val === undefined || val === null) return null;
          if (typeof val === "string") {
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
          }
          return val;
        }),
        published: z.boolean().optional(),
        featured: z.boolean().optional(),
        bestseller: z.boolean().optional(),
      }).passthrough(), // 允許額外字段
      request
    );
    const supabase = createServerSupabaseClient();

    // 獲取原始數據（用於審計日誌）
    const { data: oldWine } = await supabase
      .from("wines")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldWine) {
      return createErrorResponse(new Error("酒款不存在"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface WineUpdateData {
      [key: string]: unknown;
      price?: number;
      priceRange?: string;
      vintage?: number | null;
      alcoholContent?: number | null;
      stock?: number;
      stockAlert?: number;
    }
    
    // 如果價格改變，重新計算價位等級
    let priceRange = oldWine.priceRange;
    if (body.price !== undefined) {
      const priceNum = typeof body.price === "number" ? body.price : parseFloat(String(body.price));
      if (priceNum < 800) priceRange = "480-800";
      else if (priceNum < 1500) priceRange = "801-1500";
      else if (priceNum < 3000) priceRange = "1501-3000";
      else if (priceNum < 5000) priceRange = "3001-5000";
      else priceRange = "5000+";
    }

    // 準備更新數據
    const updateData: WineUpdateData = { ...body };
    if (body.price !== undefined) {
      updateData.price = typeof body.price === "number" ? body.price : parseFloat(String(body.price));
      updateData.priceRange = priceRange;
    }
    if (body.vintage !== undefined) {
      updateData.vintage = body.vintage;
    }
    if (body.alcoholContent !== undefined) {
      updateData.alcoholContent = body.alcoholContent;
    }
    if (body.stock !== undefined) {
      updateData.stock = typeof body.stock === "number" ? body.stock : parseInt(String(body.stock), 10);
    }
    if (body.stockAlert !== undefined) {
      updateData.stockAlert = typeof body.stockAlert === "number" ? body.stockAlert : parseInt(String(body.stockAlert), 10);
    }

    // 更新酒款
    const { data: wine, error } = await supabase
      .from("wines")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error updating wine",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/wines/${id}`, requestId }
      );
      return createErrorResponse(new Error("更新酒款失敗"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface ChangeRecord {
      from: unknown;
      to: unknown;
    }
    
    // 創建審計日誌（記錄變更）
    const changes: Record<string, ChangeRecord> = {};
    Object.keys(updateData).forEach((key) => {
      if (oldWine[key] !== updateData[key]) {
        changes[key] = { from: oldWine[key], to: updateData[key] };
      }
    });

    await createAuditLog(
      admin.id,
      "UPDATE",
      "WINE",
      id,
      changes,
      request
    );

    return NextResponse.json({ wine });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin wine PUT error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/wines/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// DELETE - 刪除酒款
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
    const { data: wine } = await supabase
      .from("wines")
      .select("id, nameZh, nameEn")
      .eq("id", id)
      .single();

    if (!wine) {
      return createErrorResponse(new Error("酒款不存在"), requestId);
    }

    // 軟刪除：設置為未發布
    const { error } = await supabase
      .from("wines")
      .update({ published: false })
      .eq("id", id);

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error deleting wine",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/wines/${id}`, requestId }
      );
      return createErrorResponse(new Error("刪除酒款失敗"), requestId);
    }

    // 創建審計日誌
    await createAuditLog(
      admin.id,
      "DELETE",
      "WINE",
      id,
      { nameZh: wine.nameZh, nameEn: wine.nameEn },
      request
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin wine DELETE error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/wines/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

