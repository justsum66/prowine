"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface InfiniteScrollProps {
  children: React.ReactNode;
  onLoadMore: () => void | Promise<void>;
  hasMore: boolean;
  isLoading?: boolean;
  threshold?: number;
  showLoadMoreButton?: boolean;
  loadMoreText?: string;
  className?: string;
}

/**
 * 無限滾動組件（P1 BATCH8）
 * 支持自動載入和「載入更多」按鈕
 */
export default function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading = false,
  threshold = 200,
  showLoadMoreButton = true,
  loadMoreText = "載入更多",
  className = "",
}: InfiniteScrollProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading || !showLoadMoreButton) return;

    // 使用 Intersection Observer 檢測是否接近底部
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, threshold, showLoadMoreButton]);

  useEffect(() => {
    if (shouldLoad && hasMore && !isLoading) {
      setShouldLoad(false);
      onLoadMore();
    }
  }, [shouldLoad, hasMore, isLoading, onLoadMore]);

  return (
    <div className={className}>
      {children}
      
      {/* 載入更多按鈕或自動載入觸發點 */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {showLoadMoreButton ? (
            <motion.button
              onClick={() => onLoadMore()}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-6 py-3
                bg-primary-600 text-white
                rounded-lg
                font-medium
                hover:bg-primary-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                min-h-[44px]
                focus:outline-none focus:ring-2 focus:ring-primary-500
              `}
            >
              {isLoading ? "載入中..." : loadMoreText}
            </motion.button>
          ) : (
            isLoading && (
              <div className="text-center text-neutral-600 dark:text-neutral-400">
                載入中...
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

