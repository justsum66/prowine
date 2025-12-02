import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { getCache, setCache } from "@/lib/utils/cache";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";

// Q21優化：定義類型接口，消除any
interface InquiryItem {
  wineId?: string;
  wines?: {
    nameZh?: string;
  } | null;
}

interface WineInquiryCount {
  name: string;
  count: number;
}

interface InquiryTrend {
  date: string;
  count: number;
}

interface TopWine {
  name: string;
  inquiries: number;
}

interface DashboardStats {
  totalWines: number;
  totalWineries: number;
  totalArticles: number;
  totalInquiries: number;
  totalUsers: number;
  lowStockWines: number;
  todayInquiries: number;
  monthlyRevenue: number;
  inquiryTrends: InquiryTrend[];
  topWines: TopWine[];
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 檢查管理員身份
    const adminCheck = await requireAdmin(request);
    if (adminCheck) {
      return adminCheck;
    }

    // 嘗試從緩存獲取（緩存5分鐘）
    const cacheKey = "admin:dashboard:stats";
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = createServerSupabaseClient();

    // 並行獲取所有統計數據
    const [
      winesResult,
      wineriesResult,
      articlesResult,
      inquiriesResult,
      usersResult,
      lowStockResult,
      todayInquiriesResult,
    ] = await Promise.all([
      supabase.from("wines").select("id", { count: "exact", head: true }),
      supabase.from("wineries").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase.from("inquiries").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("wines")
        .select("id")
        .eq("published", true)
        .lt("stock", 10), // 低於安全庫存
      supabase
        .from("inquiries")
        .select("id")
        .gte("createdAt", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    // 獲取詢價趨勢（最近 7 天）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: inquiryTrendsData } = await supabase
      .from("inquiries")
      .select("createdAt")
      .gte("createdAt", sevenDaysAgo.toISOString())
      .order("createdAt", { ascending: true });

    // 處理詢價趨勢數據
    const trendsMap: Record<string, number> = {};
    inquiryTrendsData?.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString("zh-TW");
      trendsMap[date] = (trendsMap[date] || 0) + 1;
    });

    const inquiryTrends = Object.entries(trendsMap).map(([date, count]) => ({
      date,
      count,
    }));

    // 獲取熱門酒款（詢價次數最多的）
    const { data: topWinesData } = await supabase
      .from("inquiries")
      .select("wineId, wines!inner(nameZh)")
      .limit(10);

    // Q21優化：使用類型接口，消除any
    const wineInquiryCount: Record<string, WineInquiryCount> = {};
    (topWinesData as InquiryItem[])?.forEach((item: InquiryItem) => {
      if (item.wineId && item.wines?.nameZh) {
        if (!wineInquiryCount[item.wineId]) {
          wineInquiryCount[item.wineId] = {
            name: item.wines.nameZh,
            count: 0,
          };
        }
        wineInquiryCount[item.wineId].count++;
      }
    });

    const topWines = Object.values(wineInquiryCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        inquiries: item.count,
      }));

    // Q21優化：使用類型接口
    const stats: DashboardStats = {
      totalWines: winesResult.count || 0,
      totalWineries: wineriesResult.count || 0,
      totalArticles: articlesResult.count || 0,
      totalInquiries: inquiriesResult.count || 0,
      totalUsers: usersResult.count || 0,
      lowStockWines: lowStockResult.data?.length || 0,
      todayInquiries: todayInquiriesResult.data?.length || 0,
      monthlyRevenue: 0, // 待實現
      inquiryTrends,
      topWines,
    };

    // 緩存結果（5分鐘）
    await setCache(cacheKey, stats, { ttl: 300, tags: ["dashboard"] });

    return NextResponse.json(stats);
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Dashboard stats error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/dashboard/stats", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("獲取統計數據失敗"),
      requestId
    );
  }
}

