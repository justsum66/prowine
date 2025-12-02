"use client";

import { useState, useRef, useEffect, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface HorizontalCarouselProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

function HorizontalCarousel({
  children,
  title,
  subtitle,
  className = "",
}: HorizontalCarouselProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      return () => container.removeEventListener("scroll", checkScrollability);
    }
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === "left" 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <div className={`relative ${className}`}>
      {(title || subtitle) && (
        <div className="mb-8 text-center">
          {title && (
            <h2 className="text-2xl md:text-3xl font-serif font-light text-neutral-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-neutral-600 text-sm font-light">{subtitle}</p>
          )}
        </div>
      )}

      <div className="relative">
        {/* 左側滾動按鈕 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scroll("left");
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 border border-neutral-200 hidden md:flex items-center justify-center min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="向左滾動"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-700" />
          </button>
        )}

        {/* 滾動容器 - 手機版優化 */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2 md:px-0 snap-x snap-mandatory touch-pan-x"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
            overscrollBehaviorX: "contain",
            scrollSnapType: "x mandatory",
          }}
          role="region"
          aria-label={title || "橫向滾動內容"}
          tabIndex={0}
        >
          {children}
        </div>

        {/* 右側滾動按鈕 */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scroll("right");
              }
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 border border-neutral-200 hidden md:flex items-center justify-center min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="向右滾動"
          >
            <ChevronRight className="w-5 h-5 text-neutral-700" />
          </button>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// 使用 React.memo 優化性能（優化任務 #17）
export default memo(HorizontalCarousel);
