"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { logger } from "@/lib/utils/logger-production";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 記錄錯誤（使用 logger）
    // error 已經是 Error 類型，直接使用
    logger.error(
      "Application Error",
      error,
      {
        component: "ErrorPage",
        digest: error.digest,
      }
    );
  }, [error]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <AlertCircle className="w-24 h-24 text-accent-burgundy mx-auto mb-6" />
          </div>
          <h1 className="text-4xl font-serif font-light text-neutral-900 mb-4">
            發生錯誤
          </h1>
          <p className="text-neutral-600 mb-8 leading-relaxed">
            抱歉，應用程式發生了一個錯誤。
            <br />
            請稍後再試，或聯繫我們的客服團隊。
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mb-8 p-4 bg-neutral-100 rounded-lg text-left">
              <p className="text-sm text-neutral-700 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>重試</span>
            </button>
            <Link
              href="/"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              <span>返回首頁</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

