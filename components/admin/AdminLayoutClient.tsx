"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// 動態導入 Admin 組件，減少初始 bundle 大小
const AdminHeader = dynamic(
  () => import("@/components/admin/AdminHeader"),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
      </div>
    ),
  }
);

const AdminSidebar = dynamic(
  () => import("@/components/admin/AdminSidebar"),
  {
    ssr: false,
    loading: () => (
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
      </aside>
    ),
  }
);

interface AdminLayoutClientProps {
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  children: React.ReactNode;
}

/**
 * Admin Layout 客戶端組件
 * 處理 AdminHeader 和 AdminSidebar 的動態導入
 */
export default function AdminLayoutClient({ admin, children }: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors">
      <Suspense
        fallback={
          <div className="h-16 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          </div>
        }
      >
        <AdminHeader admin={admin} />
      </Suspense>
      <div className="flex">
        <Suspense
          fallback={
            <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 min-h-[calc(100vh-4rem)] flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            </aside>
          }
        >
          <AdminSidebar admin={admin} />
        </Suspense>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

