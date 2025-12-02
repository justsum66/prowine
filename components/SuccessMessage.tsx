"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { LiveRegion } from "./AccessibilityHelpers";

interface SuccessMessageProps {
  message: string | null;
  onDismiss?: () => void;
  id?: string;
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
}

/**
 * 成功訊息組件（P1 BATCH19）
 * 無障礙設計：使用 ARIA live regions
 */
export default function SuccessMessage({
  message,
  onDismiss,
  id = "success-message",
  className = "",
  autoHide = true,
  autoHideDelay = 5000,
}: SuccessMessageProps) {
  // 自動隱藏（P1 BATCH19）
  if (autoHide && message && onDismiss) {
    setTimeout(() => {
      onDismiss();
    }, autoHideDelay);
  }

  return (
    <>
      {/* ARIA Live Region（P1 BATCH19） */}
      {message && (
        <LiveRegion
          message={message}
          priority="polite"
          className="sr-only"
        />
      )}

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            id={id}
            className={`
              flex items-start gap-3
              p-4 rounded-lg
              bg-green-50 dark:bg-green-900/20
              border border-green-200 dark:border-green-800
              ${className}
            `}
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {message}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="
                  p-1 rounded
                  text-green-600 dark:text-green-400
                  hover:bg-green-100 dark:hover:bg-green-900/40
                  transition-colors
                  min-h-[32px] min-w-[32px]
                  focus:outline-none focus:ring-2 focus:ring-green-500
                "
                aria-label="關閉成功訊息"
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

