"use client";

import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  variant?: "card" | "text" | "image" | "list";
  className?: string;
  count?: number;
}

/**
 * 精品級骨架屏組件
 * 用於頁面載入時的優雅過渡
 */
export default function LoadingSkeleton({ 
  variant = "card", 
  className = "",
  count = 1 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count });

  if (variant === "card") {
    return (
      <>
        {skeletons.map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-premium border border-neutral-100 dark:border-neutral-700 ${className}`}
          >
            {/* 漸進式圖片載入優化（P1 BATCH3） */}
            <div className="aspect-[3/4] bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-700 animate-pulse relative overflow-hidden">
              {/* Shimmer 效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <div className="p-4 md:p-6 space-y-3">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/3 mt-4" />
            </div>
          </motion.div>
        ))}
      </>
    );
  }

  if (variant === "text") {
    return (
      <>
        {skeletons.map((_, i) => (
          <div key={i} className={`space-y-2 ${className}`}>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-full" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-4/6" />
          </div>
        ))}
      </>
    );
  }

  if (variant === "image") {
    return (
      <>
        {skeletons.map((_, i) => (
          <div
            key={i}
            className={`aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse ${className}`}
          />
        ))}
      </>
    );
  }

  if (variant === "list") {
    return (
      <>
        {skeletons.map((_, i) => (
          <div key={i} className={`flex gap-4 p-4 border-b border-neutral-200 dark:border-neutral-700 ${className}`}>
            <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return null;
}
