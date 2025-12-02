"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAdminAuth } from "@/lib/contexts/AdminAuthContext";
import { Wine } from "lucide-react";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push("/admin");
    } catch (err: unknown) {
      // Q21優化：消除any類型
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj.message || "登入失敗，請檢查帳號密碼");
      // Q22優化：使用logger替代console.error
      logger.error("Admin login failed", errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  // 如果正在載入，顯示載入狀態（但設置超時，避免無限載入）
  const [showLoading, setShowLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 清除之前的計時器
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // 3秒後強制顯示頁面，避免無限載入
    loadingTimeoutRef.current = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    
    if (!authLoading) {
      setShowLoading(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [authLoading]);

  if (showLoading && authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-8 border border-neutral-200 dark:border-neutral-700">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary-600 p-3 rounded-lg">
              <Wine className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                ProWine
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                後台管理系統
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 min-h-[44px]"
                placeholder="admin@prowine.com.tw"
                aria-label="管理員電子郵件"
                aria-required="true"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                密碼
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 min-h-[44px]"
                placeholder="••••••••"
                aria-label="管理員密碼"
                aria-required="true"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={isLoading ? "登入中..." : "登入"}
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                  return;
                }
              }}
              onTouchEnd={(e) => {
                if (isLoading) {
                  e.preventDefault();
                  return;
                }
              }}
            >
              {isLoading ? "登入中..." : "登入"}
            </button>
          </form>

          {/* Demo Account Info */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
              測試帳號：admin@prowine.com.tw / prowine123456
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

