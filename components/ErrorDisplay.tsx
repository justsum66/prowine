"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { LiveRegion } from "./AccessibilityHelpers";

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  id?: string;
  className?: string;
  priority?: "polite" | "assertive";
}

/**
 * 錯誤顯示組件（P1 BATCH19）
 * 無障礙設計：使用 ARIA live regions 和 role="alert"
 */
export default function ErrorDisplay({
  error,
  onDismiss,
  id = "error-display",
  className = "",
  priority = "assertive",
}: ErrorDisplayProps) {
  const errorRef = useRef<HTMLDivElement>(null);

  // 自動聚焦到錯誤訊息（無障礙設計 P1 BATCH19）
  useEffect(() => {
    if (error && errorRef.current) {
      // 延遲聚焦，確保動畫完成
      setTimeout(() => {
        errorRef.current?.focus();
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [error]);

  return (
    <>
      {/* ARIA Live Region（P1 BATCH19） */}
      {error && (
        <LiveRegion
          message={error}
          priority={priority}
          className="sr-only"
        />
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            ref={errorRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            role="alert"
            aria-live={priority}
            aria-atomic="true"
            id={id}
            className={`
              flex items-start gap-3
              p-4 rounded-lg
              bg-red-50 dark:bg-red-900/20
              border border-red-200 dark:border-red-800
              ${className}
            `}
            tabIndex={-1}
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="
                  p-1 rounded
                  text-red-600 dark:text-red-400
                  hover:bg-red-100 dark:hover:bg-red-900/40
                  transition-colors
                  min-h-[32px] min-w-[32px]
                  focus:outline-none focus:ring-2 focus:ring-red-500
                "
                aria-label="關閉錯誤訊息"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

