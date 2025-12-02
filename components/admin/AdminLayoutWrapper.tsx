"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";
import AdminLayoutClient from "./AdminLayoutClient";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, isLoading } = useAdminAuth();
  const checkingRef = useRef(false);
  const lastPathnameRef = useRef<string | null>(null);

  const isLoginPage = pathname === "/admin/login" || pathname?.endsWith("/admin/login");

  useEffect(() => {
    // 登入頁面：不需要檢查，直接返回
    if (isLoginPage) {
      lastPathnameRef.current = pathname;
      return;
    }

    // 如果路徑沒有變化，不執行
    if (lastPathnameRef.current === pathname) {
      return;
    }
    lastPathnameRef.current = pathname;

    // 防止重複檢查
    if (checkingRef.current) {
      return;
    }

    // 如果已經有 admin 資料，不需要重定向
    if (admin) {
      return;
    }

    // 等待載入完成
    if (isLoading) {
      return;
    }

    // 檢查認證狀態
    checkingRef.current = true;
    
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/me");
        if (!response.ok) {
          // 未認證，重定向到登入頁面
          router.replace("/admin/login");
        }
      } catch (error) {
        // Q22優化：使用logger替代console.error
        logger.error("Auth check failed", error instanceof Error ? error : new Error(String(error)));
        router.replace("/admin/login");
      } finally {
        checkingRef.current = false;
      }
    };

    checkAuth();
  }, [pathname, admin, isLoading, isLoginPage, router]);

  // 登入頁面：直接渲染 children，不等待任何載入
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 其他 admin 頁面：需要認證
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">載入中...</p>
        </div>
      </div>
    );
  }

  // 如果沒有 admin 資料，顯示載入中（等待認證檢查完成）
  if (!admin) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">驗證中...</p>
        </div>
      </div>
    );
  }

  // 已認證：渲染完整 layout
  return <AdminLayoutClient admin={admin}>{children}</AdminLayoutClient>;
}

