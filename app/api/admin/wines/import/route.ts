import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { parseCSV, validateCSVData } from "@/lib/utils/csv-export";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";

// POST - 匯入酒款數據
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdminRole(request, "EDITOR");
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return createErrorResponse(new Error("未提供文件或文件格式無效"), requestId);
    }

    // 讀取文件內容
    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    // 驗證必填字段
    const requiredFields = ["中文名稱", "英文名稱", "分類", "價格"];
    const validation = validateCSVData(rows, requiredFields);

    if (!validation.valid) {
      return NextResponse.json(
        { error: "數據驗證失敗", errors: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Q21優化：定義類型接口，消除any
    interface ImportResults {
      successCount: number;
      failed: number;
      errors: string[];
    }
    
    const results: ImportResults = {
      successCount: 0,
      failed: 0,
      errors: [],
    };

    // 獲取所有酒莊（用於匹配）
    const { data: wineries } = await supabase.from("wineries").select("id, nameZh, nameEn");

    // 批量處理
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // 查找酒莊ID
        let wineryId: string | null = null;
        if (row["酒莊（中文）"] || row["酒莊（英文）"]) {
          const winery = wineries?.find(
            (w) =>
              w.nameZh === row["酒莊（中文）"] || w.nameEn === row["酒莊（英文）"]
          );
          wineryId = winery?.id || null;
        }

        // 生成slug
        const slug = row["Slug"] || generateSlug(row["中文名稱"]);

        // 處理價格範圍
        const price = parseFloat(row["價格"] || "0");
        let priceRange = row["價格範圍"] || "";
        if (!priceRange && price > 0) {
          if (price < 800) priceRange = "480-800";
          else if (price < 1500) priceRange = "801-1500";
          else if (price < 3000) priceRange = "1501-3000";
          else if (price < 5000) priceRange = "3001-5000";
          else priceRange = "5000+";
        }

        // 檢查是否已存在
        const { data: existing } = await supabase
          .from("wines")
          .select("id")
          .eq("slug", slug)
          .single();

        if (existing) {
          // 更新現有記錄
          const { error } = await supabase
            .from("wines")
            .update({
              nameZh: row["中文名稱"],
              nameEn: row["英文名稱"],
              category: row["分類"],
              price: price,
              priceRange: priceRange,
              stock: parseInt(row["庫存"] || "0"),
              stockAlert: parseInt(row["庫存警示"] || "10"),
              published: row["已發布"] === "是" || row["已發布"] === "true",
              featured: row["推薦"] === "是" || row["推薦"] === "true",
              bestseller: row["熱銷"] === "是" || row["熱銷"] === "true",
            })
            .eq("id", existing.id);

          if (error) throw error;
          results.successCount++;
        } else {
          // 創建新記錄
          if (!wineryId) {
            results.failed++;
            results.errors.push(`第 ${i + 2} 行: 找不到對應的酒莊`);
            continue;
          }

          const { error } = await supabase.from("wines").insert({
            nameZh: row["中文名稱"],
            nameEn: row["英文名稱"],
            slug: slug,
            wineryId: wineryId,
            category: row["分類"],
            price: price,
            priceRange: priceRange,
            stock: parseInt(row["庫存"] || "0"),
            stockAlert: parseInt(row["庫存警示"] || "10"),
            published: row["已發布"] === "是" || row["已發布"] === "true",
            featured: row["推薦"] === "是" || row["推薦"] === "true",
            bestseller: row["熱銷"] === "是" || row["熱銷"] === "true",
          });

          if (error) throw error;
          results.successCount++;
        }
      } catch (error) {
        // Q21優化：消除any類型
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.failed++;
        results.errors.push(`第 ${i + 2} 行: ${errorMessage}`);
      }
    }

    // 創建審計日誌
    await createAuditLog(
      admin.id,
      "BATCH_IMPORT",
      "WINE",
      null,
      { total: rows.length, success: results.successCount, failed: results.failed },
      request
    );

    return NextResponse.json({
      success: true,
      total: rows.length,
      successCount: results.successCount,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Import error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/wines/import", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("匯入失敗"),
      requestId
    );
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

