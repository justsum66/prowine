import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { rateLimiter, strictRateLimit } from "@/lib/api/rate-limiter";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義類型接口，消除any
interface InquiryTrend {
  date: string;
  count: number;
}

interface UserTrend {
  date: string;
  count: number;
}

interface StatusCounts {
  PENDING: number;
  IN_PROGRESS: number;
  RESPONDED: number;
  CLOSED: number;
}

// GET - 獲取數據分析
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 速率限制（管理員API使用嚴格限制）
    if (process.env.NODE_ENV === "production") {
      try {
        rateLimiter.check(request, strictRateLimit);
      } catch (rateLimitError) {
        return createErrorResponse(rateLimitError as Error, requestId);
      }
    }
    
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
        period: z.enum(["week", "month", "year"]).optional().default("week"),
      }),
      searchParams
    );
    
    const period = queryParams.period || "week";

    const supabase = createServerSupabaseClient();

    // 計算時間範圍
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 獲取基礎統計
    const [winesResult, wineriesResult, articlesResult, inquiriesResult, usersResult] =
      await Promise.all([
        supabase.from("wines").select("id", { count: "exact", head: true }),
        supabase.from("wineries").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("inquiries").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }),
      ]);

    // 獲取時間範圍內的數據
    const [periodInquiries, periodUsers] = await Promise.all([
      supabase
        .from("inquiries")
        .select("createdAt, status")
        .gte("createdAt", startDate.toISOString()),
      supabase
        .from("users")
        .select("createdAt")
        .gte("createdAt", startDate.toISOString()),
    ]);

    // 處理詢價趨勢數據（按日期分組）
    const trendsMap: Record<string, number> = {};
    periodInquiries.data?.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
      });
      trendsMap[date] = (trendsMap[date] || 0) + 1;
    });

    const inquiryTrends = Object.entries(trendsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Q21優化：使用類型接口
    const statusCounts: StatusCounts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      RESPONDED: 0,
      CLOSED: 0,
    };
    periodInquiries.data?.forEach((item) => {
      if (item.status in statusCounts) {
        statusCounts[item.status as keyof StatusCounts]++;
      }
    });

    // 處理會員註冊趨勢
    const usersMap: Record<string, number> = {};
    periodUsers.data?.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
      });
      usersMap[date] = (usersMap[date] || 0) + 1;
    });

    const userTrends = Object.entries(usersMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      summary: {
        totalWines: winesResult.count || 0,
        totalWineries: wineriesResult.count || 0,
        totalArticles: articlesResult.count || 0,
        totalInquiries: inquiriesResult.count || 0,
        totalUsers: usersResult.count || 0,
      },
      period: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        periodInquiries: periodInquiries.data?.length || 0,
        periodUsers: periodUsers.data?.length || 0,
      },
      trends: {
        inquiryTrends,
        userTrends,
        statusCounts,
      },
    });
  } catch (error) {
    // Q21優化：消除any類型
    logger.error(
      "Admin analytics GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/analytics", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("獲取數據分析失敗"),
      requestId
    );
  }
}

