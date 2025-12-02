"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Package,
  Mail,
  FileText,
  Building2,
  Download,
  Calendar,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import AdminDashboardSkeleton from "@/components/admin/AdminDashboardSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

// 動態導入圖表組件，減少初始 bundle 大小約 80KB
const InquiryTrendsChart = dynamic(
  () => import("@/components/admin/AnalyticsCharts").then((mod) => ({ default: mod.InquiryTrendsChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    ),
  }
);

const StatusDistributionChart = dynamic(
  () => import("@/components/admin/AnalyticsCharts").then((mod) => ({ default: mod.StatusDistributionChart })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    ),
  }
);

interface AnalyticsData {
  summary: {
    totalWines: number;
    totalWineries: number;
    totalArticles: number;
    totalInquiries: number;
    totalUsers: number;
  };
  period: {
    period: string;
    startDate: string;
    endDate: string;
    periodInquiries: number;
    periodUsers: number;
  };
  trends: {
    inquiryTrends: { date: string; count: number }[];
    userTrends: { date: string; count: number }[];
    statusCounts: {
      PENDING: number;
      IN_PROGRESS: number;
      RESPONDED: number;
      CLOSED: number;
    };
  };
}

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<string>("week");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        const error = await response.json();
        showToast("error", error.error || "載入分析數據失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch analytics", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "載入分析數據失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) {
      showToast("warning", "沒有數據可匯出");
      return;
    }

    // 準備 CSV 數據
    const csvRows: string[] = [];
    
    // 標題
    csvRows.push("ProWine 數據分析報告");
    csvRows.push(`時間範圍: ${period === "week" ? "本週" : period === "month" ? "本月" : "本年"}`);
    csvRows.push("");

    // 總覽數據
    csvRows.push("總覽統計");
    csvRows.push(`總酒款數,${data.summary.totalWines}`);
    csvRows.push(`總酒莊數,${data.summary.totalWineries}`);
    csvRows.push(`總文章數,${data.summary.totalArticles}`);
    csvRows.push(`總詢價單數,${data.summary.totalInquiries}`);
    csvRows.push(`總會員數,${data.summary.totalUsers}`);
    csvRows.push("");

    // 期間數據
    csvRows.push("期間統計");
    csvRows.push(`期間詢價單數,${data.period.periodInquiries}`);
    csvRows.push(`期間新增會員,${data.period.periodUsers}`);
    csvRows.push("");

    // 詢價趨勢
    csvRows.push("詢價趨勢");
    csvRows.push("日期,詢價數");
    data.trends.inquiryTrends.forEach((item) => {
      csvRows.push(`${item.date},${item.count}`);
    });
    csvRows.push("");

    // 狀態統計
    csvRows.push("詢價狀態統計");
    csvRows.push(`待處理,${data.trends.statusCounts.PENDING}`);
    csvRows.push(`處理中,${data.trends.statusCounts.IN_PROGRESS}`);
    csvRows.push(`已回覆,${data.trends.statusCounts.RESPONDED}`);
    csvRows.push(`已完成,${data.trends.statusCounts.CLOSED}`);

    // 創建 CSV 內容
    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prowine-analytics-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("success", "數據匯出成功！");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-600 dark:text-neutral-400">無法載入數據</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">數據分析</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            查看網站營運數據與趨勢分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          >
            <option value="week">本週</option>
            <option value="month">本月</option>
            <option value="year">本年</option>
          </select>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            匯出 CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">總瀏覽量</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {data.summary.totalWines + data.summary.totalWineries}
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">總詢價單</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {data.summary.totalInquiries}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                +{data.period.periodInquiries} 本{period === "week" ? "週" : period === "month" ? "月" : "年"}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">總會員數</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {data.summary.totalUsers}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                +{data.period.periodUsers} 本{period === "week" ? "週" : period === "month" ? "月" : "年"}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">總酒款數</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {data.summary.totalWines}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">總酒莊數</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {data.summary.totalWineries}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 詢價趨勢圖 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              詢價趨勢
            </h2>
            <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            }
          >
            <InquiryTrendsChart data={data.trends.inquiryTrends} />
          </Suspense>
        </motion.div>

        {/* 詢價狀態統計 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              詢價狀態分布
            </h2>
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            }
          >
            <StatusDistributionChart
              data={[
                { name: "待處理", value: data.trends.statusCounts.PENDING },
                { name: "處理中", value: data.trends.statusCounts.IN_PROGRESS },
                { name: "已回覆", value: data.trends.statusCounts.RESPONDED },
                { name: "已完成", value: data.trends.statusCounts.CLOSED },
              ]}
            />
          </Suspense>
        </motion.div>
      </div>

      {/* Period Info */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            時間範圍資訊
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">時間範圍</p>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">
              {period === "week" ? "本週" : period === "month" ? "本月" : "本年"}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">開始日期</p>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">
              {new Date(data.period.startDate).toLocaleDateString("zh-TW")}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">結束日期</p>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">
              {new Date(data.period.endDate).toLocaleDateString("zh-TW")}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 dark:text-neutral-400">期間詢價單</p>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mt-1">
              {data.period.periodInquiries} 筆
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
