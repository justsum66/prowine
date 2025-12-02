import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import AdminDashboardClient from "./AdminDashboardClient";

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await checkAdminAuth();

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminDashboardClient admin={admin} />;
}

