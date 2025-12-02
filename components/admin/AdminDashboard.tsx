"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wine,
  Building2,
  FileText,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Users,
  DollarSign,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/admin/Toast";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminDashboardSkeleton from "./AdminDashboardSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

// 動態導入圖表組件，減少初始 bundle 大小約 80KB
const InquiryTrendsChart = dynamic(() => import("@/components/admin/InquiryTrendsChart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  ),
});

const TopWinesChart = dynamic(() => import("@/components/admin/TopWinesChart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  ),
});

interface DashboardStats {
  totalWines: number;
  totalWineries: number;
  totalArticles: number;
  totalInquiries: number;
  totalUsers: number;
  lowStockWines: number;
  todayInquiries: number;
  monthlyRevenue: number;
  inquiryTrends: Array<{ date: string; count: number }>;
  topWines: Array<{ name: string; inquiries: number }>;
}

interface AdminDashboardProps {
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function AdminDashboard({ admin }: AdminDashboardProps) {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const error = await response.json();
        showToast("error", error.error || "載入統計數據失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch dashboard stats", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "載入統計數據失敗");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const statCards = [
    {
      title: "酒款總數",
      value: stats?.totalWines || 0,
      icon: Wine,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "酒莊總數",
      value: stats?.totalWineries || 0,
      icon: Building2,
      color: "bg-green-500",
      change: "+5%",
    },
    {
      title: "文章總數",
      value: stats?.totalArticles || 0,
      icon: FileText,
      color: "bg-purple-500",
      change: "+8%",
    },
    {
      title: "詢價單",
      value: stats?.totalInquiries || 0,
      icon: ShoppingCart,
      color: "bg-orange-500",
      change: `今日: ${stats?.todayInquiries || 0}`,
    },
    {
      title: "會員總數",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-pink-500",
      change: "+15%",
    },
    {
      title: "低庫存警示",
      value: stats?.lowStockWines || 0,
      icon: AlertCircle,
      color: "bg-red-500",
      change: "需處理",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          儀表板
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          歡迎回來，{admin.name}！
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                    {card.value}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {card.change}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inquiry Trends */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            詢價單趨勢
          </h2>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            }
          >
            <InquiryTrendsChart data={stats?.inquiryTrends || []} />
          </Suspense>
        </div>

        {/* Top Wines */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            熱門酒款
          </h2>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            }
          >
            <TopWinesChart data={stats?.topWines || []} />
          </Suspense>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          快速操作
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/wines/new"
            className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Wine className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-neutral-900 dark:text-neutral-100">新增酒款</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              添加新的酒款到系統
            </p>
          </a>
          <a
            href="/admin/wineries/new"
            className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Building2 className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-neutral-900 dark:text-neutral-100">新增酒莊</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              添加新的酒莊到系統
            </p>
          </a>
          <a
            href="/admin/articles/new"
            className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <FileText className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-neutral-900 dark:text-neutral-100">新增文章</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              發布新的文章內容
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}

