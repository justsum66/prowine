"use client";

import { motion } from "framer-motion";

interface WineryCardSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * 酒莊卡片專用骨架屏
 * 匹配WineryCard組件的佈局和尺寸
 */
export default function WineryCardSkeleton({ count = 1, className = "" }: WineryCardSkeletonProps) {
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
          {/* 圖片背景區域 */}
          <div className="relative h-64 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 animate-pulse">
            {/* Logo 區域（圓形） */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-white/80 dark:bg-neutral-600 rounded-full animate-pulse" />
            </div>
          </div>
          
          {/* 內容區域 */}
          <div className="p-6 text-center space-y-3">
            {/* 酒莊名稱 */}
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-2/3 mx-auto" />
            
            {/* 產區 */}
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2 mx-auto" />
            
            {/* 酒款數量 */}
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/3 mx-auto" />
          </div>
        </motion.div>
      ))}
    </>
  );
}

