"use client";

import { motion } from "framer-motion";

interface WineCardSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * 酒款卡片專用骨架屏
 * 匹配WineCard組件的佈局和尺寸
 */
export default function WineCardSkeleton({ count = 1, className = "" }: WineCardSkeletonProps) {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className={`bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-700 ${className}`}
        >
          {/* 圖片區域 - 匹配 WineCard 的 aspect-[3/4] */}
          {/* 漸進式圖片載入優化（P1 BATCH3） */}
          <div className="aspect-[3/4] bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100 dark:from-neutral-700 via-neutral-800 to-neutral-700 animate-pulse relative overflow-hidden">
            {/* Shimmer 效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          
          {/* 內容區域 */}
          <div className="p-4 space-y-3">
            {/* 標題 */}
            <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
            
            {/* 副標題 */}
            <div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
            
            {/* 產區/年份 */}
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-2/3" />
            
            {/* 價格 */}
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/3 mt-2" />
          </div>
        </motion.div>
      ))}
    </>
  );
}

