import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const admin = await checkAdminAuth();

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminDashboardClient admin={admin} />;
}

