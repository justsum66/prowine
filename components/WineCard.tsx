"use client";

import Image from "next/image";
import { Heart, Share2, Eye, Star } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useState, useMemo } from "react";
import { getValidImageUrl } from "@/lib/utils/image-utils";
import { createClickHandler, TOUCH_STYLES, navigateToUrl } from "@/lib/utils/touch-handlers";
import { createButtonProps } from "@/lib/utils/button-props";
import { highlightText } from "@/lib/utils/highlight-text";
import WineQuickView from "@/components/WineQuickView";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import ShareButton from "@/components/ShareButton";
import { useToast } from "@/components/Toast";

interface WineCardProps {
  id: string;
  nameZh: string;
  nameEn: string;
  wineryName: string;
  price: number;
  imageUrl?: string;
  region?: string;
  vintage?: number;
  rating?: number;
  featured?: boolean;
  bestseller?: boolean;
  slug?: string;
  searchKeyword?: string; // 搜索關鍵字（P1 BATCH14：用於高亮）
  onQuickView?: (wine: any) => void; // 快速查看回調（P1 BATCH16）
  onAddToComparison?: (wine: any) => void; // 加入比較回調（P1 BATCH16）
  comparisonWines?: any[]; // 已選比較酒款（P1 BATCH16）
}

function WineCard({
  id,
  slug,
  nameZh,
  nameEn,
  wineryName,
  price,
  imageUrl,
  region,
  vintage,
  rating,
  featured,
  bestseller,
  searchKeyword,
  onQuickView,
  onAddToComparison,
  comparisonWines = [],
}: WineCardProps) {
  const router = useRouter();
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlist();
  const toast = useToast();
  // 使用state來處理圖片錯誤，避免重複渲染
  const [imageError, setImageError] = useState(false);
  // 使用 useMemo 優化圖片URL計算，避免每次渲染都執行
  const currentImageUrl = useMemo(() => 
    imageError ? getValidImageUrl(null, 'wine', 0) : getValidImageUrl(imageUrl, 'wine', 0),
    [imageUrl, imageError]
  );

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
    }
  };

  const wineUrl = `/wines/${slug || id}`;
  
  const handleCardClick = () => {
    navigateToUrl(wineUrl, router);
  };

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="group relative h-full"
        data-wine-card="true"
      >
      <motion.div
        whileHover={{ 
          rotateY: 5,
          rotateX: -5,
          scale: 1.02,
          z: 20
        }}
        transition={{ 
          duration: 0.4, 
          type: "spring",
          stiffness: 300,
          damping: 25,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="relative h-full flex flex-col bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-premium border border-neutral-100 dark:border-neutral-700 hover:shadow-premium-lg hover:border-accent-gold/20 dark:hover:border-accent-gold/30 transition-all duration-500 cursor-pointer touch-manipulation group/card focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 perspective-3d card-3d"
        style={{ 
          transformStyle: "preserve-3d",
          perspective: "1000px",
          ...TOUCH_STYLES,
          pointerEvents: "auto",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onClick={createClickHandler(handleCardClick, { preventDefault: true })}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCardClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        role="article"
        aria-label={`${nameZh}${nameEn ? ` (${nameEn})` : ''} - ${wineryName}酒莊${vintage ? ` ${vintage}年份` : ''}葡萄酒，價格 NT$ ${price.toLocaleString()}`}
        tabIndex={0}
      >
          {/* 圖片容器 */}
          <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
            {currentImageUrl ? (
              <>
                <Image
                  src={currentImageUrl}
                  alt={`${nameZh}${nameEn ? ` (${nameEn})` : ''} - ${wineryName}酒莊${vintage ? ` ${vintage}年份` : ''}葡萄酒`}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  priority={featured}
                  loading={featured ? "eager" : "lazy"} // 圖片懶加載優化（P1 BATCH17）
                  quality={90} // 圖片品質優化（P1 BATCH17）
                  fetchPriority={featured ? "high" : "auto"} // 資源優先級優化（P1 BATCH17）
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  onError={handleImageError}
                  unoptimized={currentImageUrl?.includes('prowine.com.tw') || currentImageUrl?.includes('cloudinary.com')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <div className="text-primary-300 text-5xl font-serif font-light">{nameZh.charAt(0)}</div>
              </div>
            )}
            
            {/* 徽章 */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {featured && (
                <span className="badge-premium">
                  精選
                </span>
              )}
              {bestseller && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-accent-burgundy to-accent-burgundy-dark text-white text-[10px] font-medium tracking-wider uppercase shadow-md rounded-sm">
                  熱銷
                </span>
              )}
            </div>

            {/* 2026高端設計：快速操作 - 玻璃態按鈕組 */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-auto">
              {onQuickView && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                {...createButtonProps(
                  () => {
                    onQuickView({
                      id,
                      slug,
                      nameZh,
                      nameEn,
                      wineryName,
                      price,
                      imageUrl,
                      region,
                      vintage,
                      rating,
                      featured,
                      bestseller,
                    });
                  },
                  {
                    className: "p-2.5 glass-button rounded-full hover:bg-white/20 transition-colors shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] micro-lift ripple-effect",
                    "aria-label": `快速查看 ${nameZh}`,
                    preventDefault: true,
                  }
                )}
                aria-describedby={`wine-card-${id}-description`}
                title="快速查看"
              >
                  <Eye className="w-4 h-4 text-neutral-700" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                {...createButtonProps(
                  () => {
                    if (isInWishlist(id)) {
                      removeFromWishlist(id);
                      toast.info("已從願望清單移除");
                    } else {
                      addToWishlist({
                        id,
                        nameZh,
                        nameEn: nameEn || "",
                        wineryName,
                        price,
                        imageUrl: imageUrl || "",
                        region: region || "",
                      });
                      toast.success("已加入願望清單");
                    }
                  },
                  {
                    className: `p-2.5 glass-button rounded-full hover:bg-white/20 transition-colors shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] micro-lift ripple-effect ${
                      isInWishlist(id) ? "bg-primary-50/80 border-primary-300" : ""
                    }`,
                    "aria-label": isInWishlist(id) ? `從願望清單移除 ${nameZh}` : `將 ${nameZh} 加入願望清單`,
                    preventDefault: true,
                  }
                )}
              >
                <Heart className={`w-4 h-4 ${isInWishlist(id) ? "text-primary-600 fill-primary-600" : "text-neutral-700"}`} />
              </motion.button>
              <div className="relative">
                <ShareButton
                  title={nameZh}
                  url={`${typeof window !== "undefined" ? window.location.origin : ""}/wines/${slug || id}`}
                  text={`${nameZh} - ${wineryName}酒莊${vintage ? ` ${vintage}年份` : ""}葡萄酒`}
                  size="sm"
                  className="p-2.5 glass-button rounded-full hover:bg-white/20 transition-colors shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] min-w-[44px] micro-lift ripple-effect"
                />
              </div>
            </div>

            {/* 高端設計：評分顯示 - 金色高亮，更明顯 */}
            {rating && (
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-gradient-to-r from-accent-gold/95 to-accent-gold-dark/95 backdrop-blur-md rounded-full shadow-xl border-2 border-accent-gold/50 flex items-center gap-2"
                  style={{
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <Star className="w-4 h-4 text-neutral-900 fill-neutral-900" />
                  <span className="text-sm font-bold text-neutral-900 tracking-wide">
                    {rating}/100
                  </span>
                </motion.div>
              </div>
            )}
          </div>

          {/* 內容區域 */}
          <div className="p-4 md:p-6 flex-1 flex flex-col bg-white">
            <div className="text-[10px] text-primary-600 dark:text-accent-gold font-medium tracking-wider uppercase mb-2" aria-label={`酒莊：${wineryName}`}>
              {wineryName}
            </div>

            <h3 className="font-serif text-lg md:text-xl font-light text-neutral-900 dark:text-neutral-100 mb-1.5 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-accent-gold transition-colors duration-200 leading-tight" id={`wine-card-${id}-title`}>
              {searchKeyword ? (
                highlightText(nameZh, searchKeyword, {
                  highlightClassName: "bg-accent-gold/30 text-neutral-900 font-medium",
                }) as React.ReactNode
              ) : (
                nameZh
              )}
            </h3>
            <p className="text-xs md:text-xs text-neutral-500 dark:text-neutral-400 mb-3 md:mb-4 line-clamp-1 italic font-light" id={`wine-card-${id}-description`}>
              {searchKeyword ? (
                highlightText(nameEn, searchKeyword, {
                  highlightClassName: "bg-accent-gold/30 text-neutral-900 font-medium italic",
                }) as React.ReactNode
              ) : (
                nameEn
              )}
            </p>

            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-5">
              {region && (
                <span className="font-medium px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300">
                  {region}
                </span>
              )}
              {vintage && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-600">•</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{vintage}</span>
                </>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
              <div>
                {/* 高端設計：價格展示優化 - 32px字體，金色高亮 */}
                <motion.div
                  key={price}
                  initial={{ scale: 1.1, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="text-[28px] md:text-[32px] font-serif font-bold text-primary-600 dark:text-accent-gold mb-0.5 leading-tight"
                  style={{
                    textShadow: '0 2px 8px rgba(212, 175, 55, 0.15)',
                  }}
                >
                  <span className="text-[20px] md:text-[24px] align-top">NT$</span>{' '}
                  <span className="gold-gradient-animated bg-clip-text text-transparent">
                    {price.toLocaleString()}
                  </span>
                </motion.div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-light tracking-wide">詢價</div>
              </div>
              <button
                {...createButtonProps(
                  handleCardClick,
                  {
                    className: "px-4 py-2.5 md:py-2 bg-neutral-900 dark:bg-neutral-700 text-white text-xs md:text-xs font-medium hover:bg-primary-600 dark:hover:bg-primary-500 transition-all duration-200 flex items-center justify-center gap-1.5 rounded-md shadow-sm md:min-h-[36px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] micro-lift ripple-effect",
                    "aria-label": `查看 ${nameZh} 詳細資訊`,
                    preventDefault: true,
                  }
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>查看</span>
              </button>
            </div>
          </div>
        </motion.div>
    </motion.div>
  );
}

export default memo(WineCard);
