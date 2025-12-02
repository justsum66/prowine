import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { convertToCSV } from "@/lib/utils/csv-export";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義類型接口，消除any
interface WineExportData {
  ID: string;
  中文名稱: string;
  英文名稱: string | undefined;
  Slug: string;
  分類: string;
  價格: number;
  庫存: number;
  庫存警示: number;
  已發布: string;
  推薦: string;
  熱銷: string;
  "酒莊（中文）": string;
  "酒莊（英文）": string;
  創建時間: string;
}

interface WineryRelation {
  nameZh?: string;
  nameEn?: string;
}

// GET - 匯出酒款數據為CSV
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
        format: z.enum(["csv", "json"]).optional().default("csv"),
      }),
      searchParams
    );
    
    const format = queryParams.format || "csv";

    const supabase = createServerSupabaseClient();

    // 獲取所有酒款（或根據篩選條件）
    const { data: wines, error } = await supabase
      .from("wines")
      .select(`
        id,
        nameZh,
        nameEn,
        slug,
        category,
        price,
        stock,
        stockAlert,
        published,
        featured,
        bestseller,
        wineries:wineryId (
          nameZh,
          nameEn
        )
      `)
      .order("createdAt", { ascending: false });

    if (error) {
      throw error;
    }

    if (format === "json") {
      return NextResponse.json({ wines }, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="wines-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    // 轉換為CSV格式
    const headers = [
      "ID",
      "中文名稱",
      "英文名稱",
      "Slug",
      "分類",
      "價格",
      "庫存",
      "庫存警示",
      "已發布",
      "推薦",
      "熱銷",
      "酒莊（中文）",
      "酒莊（英文）",
      "創建時間",
    ];

    // Q21優化：使用類型接口，消除any
    interface WineWithWinery {
      id: string;
      nameZh: string;
      nameEn?: string;
      slug: string;
      category: string;
      price: number;
      stock: number;
      stockAlert: number;
      published: boolean;
      featured: boolean;
      bestseller: boolean;
      createdAt?: string;
      wineries?: WineryRelation | null;
    }
    
    const csvData: WineExportData[] = (wines as unknown as WineWithWinery[]).map((wine) => ({
      ID: wine.id,
      中文名稱: wine.nameZh,
      英文名稱: wine.nameEn,
      Slug: wine.slug,
      分類: wine.category,
      價格: wine.price,
      庫存: wine.stock,
      庫存警示: wine.stockAlert,
      已發布: wine.published ? "是" : "否",
      推薦: wine.featured ? "是" : "否",
      熱銷: wine.bestseller ? "是" : "否",
      "酒莊（中文）": wine.wineries?.nameZh || "",
      "酒莊（英文）": wine.wineries?.nameEn || "",
      創建時間: wine.createdAt ? new Date(wine.createdAt).toLocaleString("zh-TW") : "",
    }));

    const csvContent = convertToCSV(csvData, headers);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="wines-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Export error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/wines/export", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("匯出失敗"),
      requestId
    );
  }
}

