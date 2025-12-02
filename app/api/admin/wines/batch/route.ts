import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義類型接口，消除any
interface BatchResult {
  success: boolean;
  count: number;
}

// POST - 批量操作
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
        action: z.enum(["publish", "unpublish", "feature", "unfeature", "update", "delete"]),
        wineIds: z.array(z.string().min(1)).min(1, "至少需要一個酒款ID"),
        data: z.record(z.string(), z.unknown()).optional(),
      }),
      request
    );
    
    const { action, wineIds, data } = body;

    const supabase = createServerSupabaseClient();
    // Q21優化：使用類型接口，消除any
    let result: BatchResult | null = null;

    switch (action) {
      case "publish":
        // 批量發布
        const { error: publishError } = await supabase
          .from("wines")
          .update({ published: true })
          .in("id", wineIds);

        if (publishError) throw publishError;
        result = { success: true, count: wineIds.length };
        break;

      case "unpublish":
        // 批量取消發布
        const { error: unpublishError } = await supabase
          .from("wines")
          .update({ published: false })
          .in("id", wineIds);

        if (unpublishError) throw unpublishError;
        result = { success: true, count: wineIds.length };
        break;

      case "feature":
        // 批量設置為推薦
        const { error: featureError } = await supabase
          .from("wines")
          .update({ featured: true })
          .in("id", wineIds);

        if (featureError) throw featureError;
        result = { success: true, count: wineIds.length };
        break;

      case "unfeature":
        // 批量取消推薦
        const { error: unfeatureError } = await supabase
          .from("wines")
          .update({ featured: false })
          .in("id", wineIds);

        if (unfeatureError) throw unfeatureError;
        result = { success: true, count: wineIds.length };
        break;

      case "update":
        // 批量更新欄位
        if (!data) {
          return createErrorResponse(new Error("批量更新需要 data 參數"), requestId);
        }

        // Q21優化：處理價格範圍，消除any
        const updateData: Record<string, unknown> = { ...data };
        if (data.price !== undefined) {
          const priceValue = data.price;
          const priceNum = typeof priceValue === "number" 
            ? priceValue 
            : parseFloat(String(priceValue));
          if (!isNaN(priceNum)) {
            if (priceNum < 800) updateData.priceRange = "480-800";
            else if (priceNum < 1500) updateData.priceRange = "801-1500";
            else if (priceNum < 3000) updateData.priceRange = "1501-3000";
            else if (priceNum < 5000) updateData.priceRange = "3001-5000";
            else updateData.priceRange = "5000+";
          }
        }

        const { error: updateError } = await supabase
          .from("wines")
          .update(updateData)
          .in("id", wineIds);

        if (updateError) throw updateError;
        result = { success: true, count: wineIds.length };
        break;

      case "delete":
        // 批量刪除（軟刪除）
        const { error: deleteError } = await supabase
          .from("wines")
          .update({ published: false })
          .in("id", wineIds);

        if (deleteError) throw deleteError;
        result = { success: true, count: wineIds.length };
        break;

      default:
        return NextResponse.json({ error: "不支援的操作" }, { status: 400 });
    }

    // 創建審計日誌
    await createAuditLog(
      admin.id,
      `BATCH_${action.toUpperCase()}`,
      "WINE",
      null,
      { action, wineIds, count: wineIds.length },
      request
    );

    return NextResponse.json(result);
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Batch operation error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/wines/batch", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("批量操作失敗"),
      requestId
    );
  }
}

