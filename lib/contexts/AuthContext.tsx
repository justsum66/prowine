"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  membershipLevel: "REGULAR" | "VIP" | "PREMIUM";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // 改為 false，避免初始渲染阻塞

  const refreshUser = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // 從資料庫獲取完整用戶資料
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user || userData);
        } else {
          // 如果 API 失敗，使用基本資料
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            membershipLevel: "REGULAR",
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to refresh user", error instanceof Error ? error : new Error(String(error)));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    await refreshUser();
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;
    await refreshUser();
  };

  const signInWithGoogle = async () => {
    try {
      const supabase = createClient();
      
      // 獲取當前站點 URL（支持開發和生產環境）
      // 確保使用完整的 URL，包括協議
      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      
      // 如果沒有設置環境變數，使用當前頁面的 origin
      if (!siteUrl && typeof window !== "undefined") {
        siteUrl = window.location.origin;
      }
      
      // 確保 URL 格式正確（必須包含協議）
      if (!siteUrl?.startsWith("http://") && !siteUrl?.startsWith("https://")) {
        siteUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      }
      
      // 確保 redirectTo URL 是完整的絕對路徑
      // Supabase 需要完整的 URL，包括協議和域名
      const redirectTo = `${siteUrl}/auth/callback`;
      
      // Q22優化：使用logger替代console.log（僅在開發環境中輸出）
      logger.debug("Google OAuth redirectTo:", redirectTo);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          // 移除可能導致問題的 queryParams
          // Google OAuth 可能不支援某些自定義參數
        },
      });

      if (error) {
        // Q22優化：使用logger替代console.error
        logger.error("Google OAuth error", error);
        throw error;
      }

      // signInWithOAuth 會自動重定向，不需要手動處理
      // 如果返回 data.url，可以在新窗口打開（可選）
      if (data?.url) {
        // 確保重定向到正確的 URL
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      // Q22優化：使用logger替代console.error
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to initiate Google sign-in", errorObj);
      throw errorObj;
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    // 延遲載入，避免阻塞初始渲染
    const timer = setTimeout(() => {
      refreshUser();
    }, 100);

    // 監聽認證狀態變化
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

