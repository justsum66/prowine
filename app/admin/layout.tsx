import type { Metadata } from "next";
import { AdminAuthProvider } from "@/lib/contexts/AdminAuthContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { AdminProviders } from "@/components/admin/AdminProviders";
import AdminLayoutWrapper from "@/components/admin/AdminLayoutWrapper";

export const metadata: Metadata = {
  title: "後台管理系統 | ProWine",
  description: "ProWine 後台管理系統",
  robots: "noindex, nofollow", // 後台不允許搜尋引擎索引
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 將認證檢查移到客戶端組件，避免服務器端路徑檢測問題
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <AdminProviders>
          <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
        </AdminProviders>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}

