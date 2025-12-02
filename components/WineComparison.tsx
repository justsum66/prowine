"use client";

import { useState } from "react";
import { X, Trash2, GitCompare, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import WineComparisonDetail from "./WineComparisonDetail";

interface Wine {
  id: string;
  nameZh: string;
  nameEn: string;
  wineryName: string;
  price: number;
  region?: string;
  vintage?: number;
  rating?: number;
  imageUrl?: string;
  category?: string;
  alcoholContent?: number;
  grapeVarieties?: string[];
}

interface WineComparisonProps {
  wines: Wine[];
  onRemove: (wineId: string) => void;
  onClear: () => void;
}

export default function WineComparison({
  wines,
  onRemove,
  onClear,
}: WineComparisonProps) {
  const [showDetail, setShowDetail] = useState(false);
  
  if (wines.length === 0) return null;

  // 快速比較：點擊面板打開詳細比較（P2）
  const handleQuickCompare = () => {
    if (wines.length >= 2) {
      setShowDetail(true);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-600 shadow-2xl z-50"
    >
      <div className="container-custom py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              比較酒款 ({wines.length}/4)
            </span>
            {wines.length >= 2 && (
              <>
                <button
                  onClick={handleQuickCompare}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="打開詳細比較"
                >
                  <Maximize2 className="w-4 h-4" />
                  詳細比較
                </button>
                <button
                  onClick={onClear}
                  className="text-sm text-red-600 hover:text-red-700 font-medium min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2"
                  aria-label="清除所有比較酒款"
                >
                  清除全部
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClear}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-label="關閉比較面板"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {wines.map((wine) => (
              <motion.div
                key={wine.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative bg-neutral-50 rounded-lg p-4 border-2 border-primary-200"
              >
                <button
                  onClick={() => onRemove(wine.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                  aria-label={`移除 ${wine.nameZh} 的比較`}
                >
                  <X className="w-4 h-4" />
                </button>

                {wine.imageUrl && (
                  <div className="aspect-square mb-3 relative rounded-lg overflow-hidden">
                    <Image
                      src={wine.imageUrl}
                      alt={wine.nameZh}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <h4 className="font-semibold text-sm text-neutral-900 mb-1 line-clamp-2">
                  {wine.nameZh}
                </h4>
                <p className="text-xs text-neutral-600 mb-2">
                  {wine.wineryName}
                </p>
                <div className="space-y-1 text-xs">
                  {wine.vintage && (
                    <p className="text-neutral-600">年份：{wine.vintage}</p>
                  )}
                  {wine.region && (
                    <p className="text-neutral-600">產區：{wine.region}</p>
                  )}
                  <p className="text-primary-600 font-semibold">
                    NT$ {wine.price.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {wines.length < 4 &&
            Array.from({ length: 4 - wines.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-4 flex items-center justify-center text-neutral-400 text-sm"
              >
                選擇酒款進行比較
              </div>
            ))}
        </div>

        {wines.length >= 2 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleQuickCompare}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
              aria-label="開始比較選中的酒款"
            >
              <Maximize2 className="w-4 h-4" />
              詳細比較
            </button>
          </div>
        )}
      </div>

      {/* 詳細比較視窗 */}
      {showDetail && (
        <WineComparisonDetail
          wines={wines}
          onClose={() => setShowDetail(false)}
        />
      )}
    </motion.div>
  );
}

