"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 從 URL 參數讀取錯誤訊息（OAuth 回調錯誤）
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // 清除 URL 中的錯誤參數
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "登入失敗，請檢查您的帳號密碼");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google 登入失敗");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-ivory flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium"
        >
          <h1 className="text-3xl font-serif font-light text-neutral-900 mb-2 text-center">
            會員登入
          </h1>
          <p className="text-neutral-600 text-sm text-center mb-8 font-light">
            登入您的 ProWine 帳號
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                電子郵件
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              <span>{isLoading ? "登入中..." : "登入"}</span>
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">或</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="mt-6 w-full px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-neutral-700">使用 Google 登入</span>
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-neutral-600">
            <p className="font-light">
              還沒有帳號？{" "}
              <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                立即註冊
              </Link>
            </p>
          </div>

          {/* 測試賬號提示 */}
          <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <p className="text-xs text-neutral-600 mb-2 font-medium">測試賬號：</p>
            <div className="space-y-1 text-xs text-neutral-500 font-mono">
              <div>Admin: admin@prowine.com.tw / prowine123456</div>
              <div>B2C: b2c@prowine.com.tw / prowine123456</div>
              <div>B2B: b2b@prowine.com.tw / prowine123456</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-20 bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">載入中...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

