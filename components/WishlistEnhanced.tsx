"use client";

import { useState } from "react";
import {
  Heart,
  Share2,
  Trash2,
  Bell,
  CheckSquare,
  Square,
  Folder,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import WineCard from "@/components/WineCard";
import { logger } from "@/lib/utils/logger-production";

type WishlistCategory = "all" | "favorites" | "inquiry" | "inquired";

interface WishlistItem {
  id: string;
  wineId: string;
  nameZh: string;
  nameEn: string;
  wineryName: string;
  price: number;
  imageUrl?: string;
  region?: string;
  category?: WishlistCategory;
  priceAlert?: boolean;
}

export default function WishlistEnhanced() {
  const { items, removeItem, isLoading } = useWishlist();
  const [selectedCategory, setSelectedCategory] =
    useState<WishlistCategory>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [priceAlerts, setPriceAlerts] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // 分類過濾（暫時所有項目都顯示，因為 category 尚未實現）
  const filteredItems = items;

  // 批量選擇
  const toggleSelect = (wineId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(wineId)) {
      newSelected.delete(wineId);
    } else {
      newSelected.add(wineId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.wineId)));
    }
  };

  // 批量刪除
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;
    for (const wineId of selectedItems) {
      await removeItem(wineId);
    }
    setSelectedItems(new Set());
  };

  // 分享願望清單
  const handleShare = async () => {
    const shareData = {
      title: "我的 ProWine 願望清單",
      text: `我收藏了 ${items.length} 款葡萄酒`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      logger.error(
        "Share failed",
        error instanceof Error ? error : new Error(String(error)),
        { component: "WishlistEnhanced", itemCount: items.length }
      );
    }
  };

  // 價格變動提醒
  const togglePriceAlert = async (wineId: string) => {
    const newPriceAlerts = new Set(priceAlerts);
    if (newPriceAlerts.has(wineId)) {
      newPriceAlerts.delete(wineId);
    } else {
      newPriceAlerts.add(wineId);
    }
    setPriceAlerts(newPriceAlerts);
    // TODO: 實現價格提醒 API
    logger.debug("Toggle price alert for:", { wineId, component: "WishlistEnhanced" });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-neutral-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-ivory">
      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-light text-neutral-900 mb-2">
              願望清單
            </h1>
            <p className="text-neutral-600 font-light">
              {items.length > 0
                ? `您有 ${items.length} 件收藏的酒款`
                : "收藏您喜愛的葡萄酒"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Copy className="w-4 h-4" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      分享
                    </>
                  )}
                </button>
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    刪除 ({selectedItems.size})
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Categories */}
        {items.length > 0 && (
          <div className="mb-8 flex items-center gap-4 overflow-x-auto pb-2">
            {[
              { id: "all", label: "全部", count: items.length },
              { id: "favorites", label: "收藏", count: 0 },
              { id: "inquiry", label: "待詢價", count: 0 },
              { id: "inquired", label: "已詢價", count: 0 },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as WishlistCategory)}
                className={`px-6 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary-600 text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        )}

        {/* Select All */}
        {filteredItems.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              {selectedItems.size === filteredItems.length ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              全選
            </button>
          </div>
        )}

        {/* Wine Grid */}
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium text-center py-16"
          >
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-6" />
            <h2 className="text-2xl font-serif font-light text-neutral-900 mb-4">
              {selectedCategory === "all"
                ? "願望清單是空的"
                : "此分類沒有酒款"}
            </h2>
            <p className="text-neutral-600 font-light">
              {selectedCategory === "all"
                ? "開始探索我們的精選酒款，將喜愛的葡萄酒加入願望清單"
                : "嘗試其他分類或添加更多酒款"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.wineId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleSelect(item.wineId)}
                  className={`absolute top-2 left-2 z-20 p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    selectedItems.has(item.wineId)
                      ? "bg-primary-600 text-white"
                      : "bg-white/95 backdrop-blur-sm text-neutral-700 hover:bg-white"
                  } shadow-lg border border-neutral-200`}
                  aria-label={selectedItems.has(item.wineId) ? "取消選擇" : "選擇此酒款"}
                >
                  {selectedItems.has(item.wineId) ? (
                    <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Square className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>

                {/* Price Alert Button */}
                <button
                  onClick={() => togglePriceAlert(item.wineId)}
                  className="absolute top-2 right-2 z-20 p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-white/95 backdrop-blur-sm text-neutral-700 hover:bg-white shadow-lg border border-neutral-200"
                  aria-label={priceAlerts.has(item.wineId) ? "取消價格變動提醒" : "設定價格變動提醒"}
                  title="價格變動提醒"
                >
                  <Bell className={`w-4 h-4 md:w-5 md:h-5 ${priceAlerts.has(item.wineId) ? "fill-current text-accent-gold" : ""}`} />
                </button>

                <WineCard
                  id={item.wineId}
                  nameZh={item.nameZh}
                  nameEn={item.nameEn}
                  wineryName={item.wineryName}
                  price={item.price}
                  region={item.region}
                  imageUrl={item.imageUrl}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

