"use client";

import { useState } from "react";
import Image from "next/image";
import { Utensils, Search } from "lucide-react";
import { motion } from "framer-motion";

interface FoodPairing {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  matchScore: number; // 0-100
}

interface FoodPairingProps {
  pairings: FoodPairing[];
  wineName?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

/**
 * 配餐建議視覺化組件（P2）
 * 展示推薦搭配食物和配餐說明
 */
export default function FoodPairing({
  pairings,
  wineName,
  onSearch,
  className = "",
}: FoodPairingProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  // 按匹配度排序
  const sortedPairings = [...pairings].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <section className={className}>
      <div className="mb-6">
        <h3 className="text-2xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-2">
          配餐建議
        </h3>
        {wineName && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            為 {wineName} 精心挑選的搭配
          </p>
        )}
      </div>

      {/* 配餐搜尋 */}
      {onSearch && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜尋配餐建議..."
              className="
                w-full pl-12 pr-4 py-3
                bg-white dark:bg-neutral-800
                border border-neutral-300 dark:border-neutral-600
                rounded-lg
                text-neutral-900 dark:text-neutral-100
                placeholder:text-neutral-400
                focus:outline-none focus:ring-2 focus:ring-primary-500
                transition-all
              "
            />
          </div>
        </div>
      )}

      {/* 配餐卡片網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPairings.map((pairing, index) => (
          <motion.div
            key={pairing.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="
              relative
              bg-white dark:bg-neutral-800
              rounded-lg overflow-hidden
              border border-neutral-200 dark:border-neutral-700
              hover:shadow-lg transition-shadow
              group
            "
          >
            {/* 圖片 */}
            {pairing.imageUrl ? (
              <div className="relative aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                <Image
                  src={pairing.imageUrl}
                  alt={pairing.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center">
                <Utensils className="w-12 h-12 text-primary-300 dark:text-primary-600" />
              </div>
            )}

            {/* 內容 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {pairing.name}
                </h4>
                {/* 匹配度標籤 */}
                <div className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${pairing.matchScore >= 80 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : pairing.matchScore >= 60
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                  }
                `}>
                  {pairing.matchScore}% 匹配
                </div>
              </div>

              {/* 分類標籤 */}
              <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded mb-2">
                {pairing.category}
              </span>

              {/* 描述 */}
              <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                {pairing.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {pairings.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <Utensils className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p>暫無配餐建議</p>
        </div>
      )}
    </section>
  );
}

