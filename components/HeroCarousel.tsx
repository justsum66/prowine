"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipe } from "@/lib/hooks/useSwipe";
import { optimizeImageUrl } from "@/lib/utils/image-optimization";
import { logger } from "@/lib/utils/logger-production";

interface HeroImage {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

const heroImages: HeroImage[] = [
  {
    src: "https://images.unsplash.com/photo-1506377247727-4b5c465f6e3a?w=1920&q=90",
    alt: "納帕谷酒莊葡萄園",
    title: "探索世界頂級",
    subtitle: "精品葡萄酒",
  },
  {
    src: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1920&q=90",
    alt: "波爾多酒莊",
    title: "傳承百年工藝",
    subtitle: "經典與優雅",
  },
  {
    src: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=1920&q=90",
    alt: "葡萄酒莊園",
    title: "每一瓶都訴說著",
    subtitle: "獨特的風土故事",
  },
  {
    src: "https://images.unsplash.com/photo-1506377247727-4b5c465f6e3a?w=1920&q=90",
    alt: "精緻葡萄酒",
    title: "精選自 30+ 世界頂級酒莊",
    subtitle: "100+ 臻選佳釀",
  },
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [optimizedImages, setOptimizedImages] = useState<Record<number, string>>({});

  // 優化圖片（使用 Comet API）
  useEffect(() => {
    const optimizeImages = async () => {
      const optimized: Record<number, string> = {};
      for (let i = 0; i < heroImages.length; i++) {
        try {
          const optimizedUrl = await optimizeImageUrl(heroImages[i].src, "comet");
          optimized[i] = optimizedUrl;
        } catch (error) {
          logger.error(
            `優化圖片 ${i} 失敗`,
            error instanceof Error ? error : new Error(String(error)),
            { component: "HeroCarousel", imageIndex: i, imageSrc: heroImages[i].src }
          );
          optimized[i] = heroImages[i].src; // 使用原始 URL
        }
      }
      setOptimizedImages(optimized);
    };

    optimizeImages();
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, []);

  // 手勢交互（P1 BATCH5）：滑動切換輪播
  const swipe = useSwipe({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    threshold: 50,
    preventDefault: false, // 允許原生滾動
  });

  // 自動輪播（6秒間隔，更慢更優雅）
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000); // 從3秒改為6秒

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // 5秒後恢復自動播放
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // 鍵盤導航支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      id="hero-carousel"
      role="region"
      aria-label="精選酒款輪播"
      tabIndex={0}
    >
      <AnimatePresence mode="wait">
        {heroImages.map((image, index) => {
          if (index !== currentIndex) return null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={optimizedImages[index] || image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                quality={90}
                sizes="100vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/80" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-transparent" />
              
              {/* 2026高端設計：液態背景動畫 */}
              <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl liquid-bg animate-liquid-flow"></div>
              <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-accent-gold/10 rounded-full blur-3xl liquid-bg animate-liquid-flow" style={{ animationDelay: "2s" }}></div>
              
              {/* 2026高端設計：額外的液態裝飾層 */}
              <motion.div
                className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-accent-gold/5 to-primary-600/5 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 文字內容 - 極簡微動畫 */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="container-custom relative z-20 py-24">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* 裝飾元素 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
              className="inline-block mb-10"
            >
              <div className="relative w-12 h-12 border border-accent-gold/40 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-accent-gold rounded-full"></div>
              </div>
            </motion.div>

            {/* 主標題 - 表達性字體設計（P1 優化：增大字體、漸變填充） */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-light text-white mb-6 leading-[1.1] tracking-tight">
              <motion.span
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="block font-light bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/90"
              >
                {heroImages[currentIndex].title || "探索世界頂級"}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="block text-accent-gold mt-2 font-light bg-clip-text text-transparent bg-gradient-to-r from-accent-gold via-accent-gold-light to-accent-gold"
              >
                {heroImages[currentIndex].subtitle || "精品葡萄酒"}
              </motion.span>
            </h1>

            {/* 副標題 - 2026高端設計：玻璃態卡片樣式 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="glass-card-medium rounded-2xl p-6 md:p-8 mb-10 max-w-3xl mx-auto"
            >
            <motion.p
              className="text-base md:text-lg text-white/95 mb-4 leading-relaxed font-light tracking-wide"
            >
              探索世界頂級酒莊的風土密碼，每一滴都承載著時間與土地的故事
            </motion.p>
            <motion.span 
              className="text-accent-gold/95 font-light text-sm md:text-base block liquid-shine"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.8 }}
            >
              精選全球30+頂級酒莊，為您開啟葡萄酒的藝術之旅
            </motion.span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* 導航按鈕 */}
      <button
        onClick={goToPrevious}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToPrevious();
          }
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 glass-button rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 touch-manipulation micro-lift ripple-effect"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="上一張輪播圖"
        aria-controls="hero-carousel"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToNext();
          }
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 glass-button rounded-full hover:bg-white/20 transition-all duration-300 border border-white/20 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 touch-manipulation micro-lift ripple-effect"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="下一張輪播圖"
        aria-controls="hero-carousel"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* 指示器 */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2"
        role="tablist"
        aria-label="輪播圖指示器"
      >
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goToSlide(index);
              }
            }}
            className={`h-1.5 rounded-full transition-all duration-300 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 touch-manipulation ripple-effect ${
              index === currentIndex
                ? "w-8 bg-accent-gold shadow-lg shadow-accent-gold/50"
                : "w-1.5 bg-white/40 hover:bg-white/60 hover:w-2"
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label={`前往第 ${index + 1} 張輪播圖`}
            aria-selected={index === currentIndex}
            role="tab"
            tabIndex={index === currentIndex ? 0 : -1}
          ></button>
        ))}
      </div>

      {/* 滾動指示器 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-5 h-8 border border-white/30 rounded-full flex justify-center backdrop-blur-sm"
        >
          <div className="w-1 h-2 bg-white/50 rounded-full mt-1.5"></div>
        </motion.div>
      </motion.div>
    </div>
  );
}

