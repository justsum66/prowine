"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wine, Building2, BookOpen, User, Home } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/wines", label: "佳釀", icon: Wine },
  { href: "/wineries", label: "酒莊", icon: Building2 },
  { href: "/knowledge", label: "學堂", icon: BookOpen },
  { href: "/account", label: "我的", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // 隱藏底部導航的頁面
  const hiddenPaths = ["/admin", "/login", "/register"];
  const shouldHide = hiddenPaths.some((path) => pathname?.startsWith(path));

  if (shouldHide) return null;

  const handleNavClick = (href: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-50 safe-area-inset-bottom" 
      style={{ pointerEvents: 'auto' }}
      role="navigation"
      aria-label="主要導航"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-h-[44px] touch-manipulation relative focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded ${
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={`${item.label}${isActive ? "（當前頁面）" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => handleNavClick(item.href, e)}
              onTouchEnd={(e) => handleNavClick(item.href, e)}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary-600 dark:bg-primary-400 rounded-b-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

