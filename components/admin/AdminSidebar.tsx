"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Wine,
  Building2,
  FileText,
  Image as ImageIcon,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Package,
  FileCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface AdminSidebarProps {
  admin: {
    role: string;
  };
}

const menuItems = [
  { href: "/admin", label: "儀表板", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "CUSTOMER_SERVICE"] },
  { href: "/admin/wines", label: "酒款管理", icon: Wine, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { href: "/admin/wineries", label: "酒莊管理", icon: Building2, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { href: "/admin/articles", label: "文章管理", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { href: "/admin/images", label: "圖片管理", icon: ImageIcon, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { href: "/admin/users", label: "會員管理", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/orders", label: "詢價單管理", icon: ShoppingCart, roles: ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SERVICE"] },
  { href: "/admin/analytics", label: "數據分析", icon: BarChart3, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/audit-logs", label: "審計日誌", icon: FileCheck, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/admin/settings", label: "系統設定", icon: Settings, roles: ["SUPER_ADMIN"] },
];

export default function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(admin.role)
  );

  return (
    <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 min-h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

