"use client";

import { useRouter } from "next/navigation";
import { LogOut, Bell, Settings, User } from "lucide-react";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { motion } from "framer-motion";

interface AdminHeaderProps {
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function AdminHeader({ admin }: AdminHeaderProps) {
  const router = useRouter();
  const { signOut } = useAdminAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/admin/login");
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "超級管理員",
    ADMIN: "管理員",
    EDITOR: "編輯",
    CUSTOMER_SERVICE: "客服",
  };

  return (
    <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            後台管理系統
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* Settings */}
          <button
            onClick={() => router.push("/admin/settings")}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            title="系統設定"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Admin Info */}
          <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {admin.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {roleLabels[admin.role] || admin.role}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="登出"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

