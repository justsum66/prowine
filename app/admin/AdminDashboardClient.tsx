"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// 動態導入 AdminDashboard，減少初始 bundle 大小約 150KB
// 在 Client Component 中使用 ssr: false
const AdminDashboard = dynamic(() => import("@/components/admin/AdminDashboard"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  ),
});

// Q21優化：定義類型接口，消除any
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
}

interface AdminDashboardClientProps {
  admin: AdminUser;
}

export default function AdminDashboardClient({ admin }: AdminDashboardClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <AdminDashboard admin={admin} />
    </Suspense>
  );
}

