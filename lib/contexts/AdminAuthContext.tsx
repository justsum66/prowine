"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "CUSTOMER_SERVICE";
  active: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
  hasPermission: (requiredRole: AdminUser["role"]) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  const refreshAdmin = useCallback(async () => {
    // 防止重複執行
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const response = await fetch("/api/admin/auth/me");
      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin || null);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to refresh admin", error instanceof Error ? error : new Error(String(error)));
      setAdmin(null);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "登入失敗");
    }

    await refreshAdmin();
  }, [refreshAdmin]);

  const signOut = useCallback(async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAdmin(null);
    setIsLoading(false);
  }, []);

  const hasPermission = useCallback((requiredRole: AdminUser["role"]): boolean => {
    if (!admin || !admin.active) return false;

    const roleHierarchy = {
      SUPER_ADMIN: 4,
      ADMIN: 3,
      EDITOR: 2,
      CUSTOMER_SERVICE: 1,
    };

    return roleHierarchy[admin.role] >= roleHierarchy[requiredRole];
  }, [admin]);

  // 只在首次掛載時執行一次初始化
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 檢查當前路徑
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname || "";

      // 登入頁面：立即設置為不載入，不執行任何 API 請求
      if (currentPath === "/admin/login" || currentPath.endsWith("/admin/login")) {
        setIsLoading(false);
        return;
      }
      
      // 其他 admin 頁面：執行刷新
      if (currentPath.startsWith("/admin")) {
        refreshAdmin();
      } else {
        // 非 admin 頁面：設置為不載入
        setIsLoading(false);
      }
    } else {
      // 服務器端：設置為不載入
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依賴數組，只在首次掛載時執行一次

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        signIn,
        signOut,
        refreshAdmin,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

