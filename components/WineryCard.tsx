"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, Wine, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useState, useMemo } from "react";
import { getValidImageUrl } from "@/lib/utils/image-utils";
import { createLinkProps } from "@/lib/utils/button-props";
import { TOUCH_STYLES } from "@/lib/utils/touch-handlers";

interface WineryCardProps {
  id: string;
  slug?: string;
  nameZh: string;
  nameEn: string;
  region?: string;
  country?: string;
  imageUrl?: string;
  logoUrl?: string; // 重要：酒莊 LOGO
  wineCount?: number;
  featured?: boolean;
  description?: string;
}

function WineryCard({
  id,
  slug,
  nameZh,
  nameEn,
  region,
  country,
  logoUrl,
  wineCount,
  featured,
  description,
}: WineryCardProps) {
  // 使用state來處理LOGO錯誤，避免重複渲染
  const [logoError, setLogoError] = useState(false);
  // 使用 useMemo 優化LOGO URL計算，避免每次渲染都執行
  // 只要有logoUrl就嘗試顯示，不依賴isValidImageUrl的嚴格檢查
  const currentLogoUrl = useMemo(() => {
    if (logoError) {
      return getValidImageUrl(null, 'winery', 0);
    }
    // 如果有logoUrl，直接使用（讓瀏覽器處理加載錯誤）
    if (logoUrl) {
      return logoUrl;
    }
    return getValidImageUrl(null, 'winery', 0);
  }, [logoUrl, logoError]);

  const handleLogoError = () => {
    if (!logoError) {
      setLogoError(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="group relative h-full"
      data-winery-card="true"
    >
      <Link 
        href={`/wineries/${slug || id}`} 
        {...createLinkProps(undefined, {
          className: "block h-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-2xl",
        })}
        aria-label={`${nameZh}${nameEn ? ` (${nameEn})` : ''}酒莊${region ? ` - ${region}` : ''}${country ? `, ${country}` : ''}${wineCount !== undefined ? `，${wineCount}款精選酒款` : ''}`}
        role="article"
      >
        <motion.div
          whileHover={{ 
            rotateY: 3,
            rotateX: -2,
            scale: 1.02,
            z: 20
          }}
          transition={{ 
            duration: 0.5, 
            ease: [0.4, 0, 0.2, 1],
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="relative h-full flex flex-col bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-premium border border-neutral-100 dark:border-neutral-700 hover:shadow-premium-lg hover:border-accent-gold/30 dark:hover:border-accent-gold/40 transition-all duration-500 perspective-3d card-3d"
          style={{ 
            transformStyle: "preserve-3d",
            perspective: "1000px",
            ...TOUCH_STYLES,
            pointerEvents: "auto",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* 2026高端設計：圖片容器 - 液態背景動畫 */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 overflow-hidden flex items-center justify-center">
            {/* 液態背景裝飾 */}
            <motion.div
              className="absolute inset-0 liquid-bg opacity-30"
              animate={{
                borderRadius: [
                  "60% 40% 30% 70% / 60% 30% 70% 40%",
                  "30% 60% 70% 40% / 50% 60% 30% 60%",
                  "70% 30% 40% 60% / 30% 70% 60% 40%",
                  "40% 70% 60% 30% / 70% 40% 50% 30%",
                  "60% 40% 30% 70% / 60% 30% 70% 40%",
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* 精選徽章 */}
            {featured && (
              <div className="absolute top-6 left-6 z-20">
                <span className="badge-premium">
                  精選酒莊
                </span>
              </div>
            )}

            {/* 酒莊 LOGO - 主要顯示內容 */}
            {currentLogoUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1 }}
                className="relative z-10"
              >
                <div className="relative w-48 h-48 glass-card-heavy rounded-full p-8 shadow-2xl border-2 border-white/30 flex items-center justify-center liquid-shine">
                  <Image
                    src={currentLogoUrl}
                    alt={`${nameZh} Logo`}
                    width={160}
                    height={160}
                    className="object-contain"
                    loading={featured ? "eager" : "lazy"}
                    quality={90}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    unoptimized={!!(currentLogoUrl && currentLogoUrl.startsWith('http') && !currentLogoUrl.includes('unsplash'))}
                    onError={handleLogoError}
                    onLoadingComplete={() => {
                      // LOGO加載成功，不做任何事
                    }}
                  />
                  {/* 光環效果 */}
                  <div className="absolute inset-0 rounded-full border-2 border-accent-gold/20 animate-pulse"></div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <div className="text-primary-300 text-6xl font-serif font-bold mb-2">
                  {nameZh.charAt(0)}
                </div>
                <div className="text-primary-400 text-sm font-medium">
                  {nameZh}
                </div>
              </div>
            )}

            {/* 位置徽章 */}
            {(region || country) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
              >
                <div className="px-5 py-2.5 glass-card-medium rounded-full flex items-center gap-2 shadow-xl border border-white/30">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-bold text-neutral-900">
                    {region || country}
                  </span>
                </div>
              </motion.div>
            )}

            {/* 酒款數量 */}
            {wineCount !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
              >
                <div className="px-5 py-3 glass-card-medium rounded-full shadow-xl border border-white/30 flex items-center gap-2">
                  <Wine className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-bold text-neutral-900">
                    {wineCount} 款精選
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* 精緻內容區域 */}
          <div className="p-4 md:p-8 flex-1 flex flex-col bg-white">
            {/* 酒莊名稱 */}
            <div className="mb-3 md:mb-4">
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-neutral-900 mb-1.5 md:mb-2 group-hover:text-primary-600 transition-colors duration-300 leading-tight" id={`winery-card-${id}-title`}>
                {nameZh}
              </h3>
              <p className="text-xs md:text-sm text-neutral-500 font-medium italic" id={`winery-card-${id}-description`}>
                {nameEn}
              </p>
            </div>

            {/* 位置資訊 */}
            {(region || country) && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-600 mb-4 md:mb-5">
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-500" />
                <span className="font-semibold">
                  {region && country ? `${region}, ${country}` : region || country}
                </span>
              </div>
            )}

            {/* 描述 */}
            {description && (
              <p className="text-neutral-600 text-xs md:text-sm leading-relaxed mb-4 md:mb-6 line-clamp-2 md:line-clamp-3 flex-1">
                {description}
              </p>
            )}

            {/* CTA */}
            <div className="mt-auto pt-4 md:pt-5 border-t border-neutral-200">
              <motion.div
                whileHover={{ x: 8 }}
                className="flex items-center justify-between cursor-pointer min-h-[44px] md:min-h-[auto] focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 rounded"
                tabIndex={0}
                role="button"
                aria-label={`探索 ${nameZh} 酒莊故事`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    window.location.href = `/wineries/${slug || id}`;
                  }
                }}
              >
                <span className="text-xs md:text-sm font-bold text-neutral-700 group-hover:text-primary-600 transition-colors tracking-wide">
                  探索酒莊故事
                </span>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-primary-600 group-hover:translate-x-2 transition-transform duration-300" />
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default memo(WineryCard);
