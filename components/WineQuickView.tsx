"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ShoppingCart, Heart, Share2, GitCompare, Star, MapPin, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";
import { getValidImageUrl } from "@/lib/utils/image-utils";
import { useCart } from "@/lib/contexts/CartContext";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { highlightText } from "@/lib/utils/highlight-text";

interface WineQuickViewProps {
  wine: {
    id: string;
    slug?: string;
    nameZh: string;
    nameEn: string;
    wineryName: string;
    price: number;
    imageUrl?: string;
    region?: string;
    vintage?: number;
    rating?: number;
    description?: string;
    featured?: boolean;
    bestseller?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  searchKeyword?: string;
  onAddToComparison?: (wine: any) => void;
  comparisonWines?: any[];
}

/**
 * 快速查看模態框（P1 BATCH16）
 * 實現懸停/點擊顯示快速查看，支持直接加入購物車、比較等功能
 */
export default function WineQuickView({
  wine,
  isOpen,
  onClose,
  searchKeyword,
  onAddToComparison,
  comparisonWines = [],
}: WineQuickViewProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlist();
  const { trigger } = useHapticFeedback();
  const [imageError, setImageError] = useState(false);

  const imageUrl = imageError
    ? getValidImageUrl(null, "wine", 0)
    : getValidImageUrl(wine.imageUrl, "wine", 0);

  const isInWishlistState = isInWishlist(wine.id);
  const isInComparison = comparisonWines.some((w) => w.id === wine.id);
  const canAddToComparison = comparisonWines.length < 4 && !isInComparison;

  const handleAddToCart = () => {
    trigger({ type: "medium" });
    addItem({
      id: wine.id,
      nameZh: wine.nameZh,
      nameEn: wine.nameEn,
      price: wine.price,
      imageUrl: wine.imageUrl,
    }, 1);
    // 可以顯示成功提示
  };

  const handleToggleWishlist = () => {
    trigger({ type: "light" });
    if (isInWishlistState) {
      removeFromWishlist(wine.id);
    } else {
      addToWishlist({
        id: wine.id,
        nameZh: wine.nameZh,
        nameEn: wine.nameEn,
        price: wine.price,
        imageUrl: wine.imageUrl,
      });
    }
  };

  const handleAddToComparison = () => {
    if (onAddToComparison && canAddToComparison) {
      trigger({ type: "light" });
      onAddToComparison(wine);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnClickOutside={true}
      closeOnEscape={true}
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 圖片區域 */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={wine.nameZh}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={90}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-primary-300 text-6xl font-serif font-light">
                {wine.nameZh.charAt(0)}
              </div>
            </div>
          )}
          
          {/* 徽章 */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {wine.featured && (
              <span className="badge-premium">精選</span>
            )}
            {wine.bestseller && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-accent-burgundy to-accent-burgundy-dark text-white text-xs font-medium tracking-wider uppercase shadow-md rounded-sm">
                熱銷
              </span>
            )}
          </div>
        </div>

        {/* 內容區域 */}
        <div className="flex flex-col">
          {/* 酒莊名稱 */}
          <div className="text-xs text-primary-600 font-medium tracking-wider uppercase mb-2">
            {wine.wineryName}
          </div>

          {/* 酒款名稱 */}
          <h2 className="text-2xl md:text-3xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-2">
            {searchKeyword ? (
              highlightText(wine.nameZh, searchKeyword, {
                highlightClassName: "bg-accent-gold/30 text-neutral-900 font-medium",
              }) as React.ReactNode
            ) : (
              wine.nameZh
            )}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 italic mb-4">
            {searchKeyword ? (
              highlightText(wine.nameEn, searchKeyword, {
                highlightClassName: "bg-accent-gold/30 text-neutral-900 font-medium italic",
              }) as React.ReactNode
            ) : (
              wine.nameEn
            )}
          </p>

          {/* 評分 */}
          {wine.rating && (
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-accent-gold fill-accent-gold" />
              <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {wine.rating}/100
              </span>
            </div>
          )}

          {/* 產區和年份 */}
          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {wine.region && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{wine.region}</span>
              </div>
            )}
            {wine.vintage && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{wine.vintage}</span>
              </div>
            )}
          </div>

          {/* 價格 */}
          <div className="mb-6">
            <div className="text-3xl md:text-4xl font-serif font-bold text-primary-600 dark:text-accent-gold mb-1">
              NT$ {wine.price.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">詢價</div>
          </div>

          {/* 描述 */}
          {wine.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 line-clamp-4">
              {wine.description}
            </p>
          )}

          {/* 操作按鈕 */}
          <div className="flex flex-col gap-3 mt-auto">
            <button
              onClick={handleAddToCart}
              className="
                w-full px-6 py-3
                bg-neutral-900 dark:bg-primary-600
                text-white
                rounded-lg
                font-medium
                hover:bg-primary-600 dark:hover:bg-primary-700
                transition-colors
                min-h-[48px]
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>加入購物車</span>
              </div>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleToggleWishlist}
                className={`
                  flex-1 px-4 py-2
                  rounded-lg
                  font-medium
                  transition-colors
                  min-h-[44px]
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  ${
                    isInWishlistState
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-accent-gold"
                      : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  }
                `}
                aria-label={isInWishlistState ? "從願望清單移除" : "加入願望清單"}
              >
                <div className="flex items-center justify-center gap-2">
                  <Heart
                    className={`w-4 h-4 ${isInWishlistState ? "fill-current" : ""}`}
                  />
                  <span className="text-sm">
                    {isInWishlistState ? "已收藏" : "收藏"}
                  </span>
                </div>
              </button>

              {canAddToComparison && onAddToComparison && (
                <button
                  onClick={handleAddToComparison}
                  className="
                    flex-1 px-4 py-2
                    bg-neutral-100 dark:bg-neutral-700
                    text-neutral-700 dark:text-neutral-300
                    rounded-lg
                    font-medium
                    hover:bg-neutral-200 dark:hover:bg-neutral-600
                    transition-colors
                    min-h-[44px]
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                  "
                  aria-label="加入比較"
                >
                  <div className="flex items-center justify-center gap-2">
                    <GitCompare className="w-4 h-4" />
                    <span className="text-sm">比較</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

