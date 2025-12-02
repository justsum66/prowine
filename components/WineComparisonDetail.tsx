"use client";

import { useState } from "react";
import { X, Share2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { logger } from "@/lib/utils/logger-production";

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

interface WineComparisonDetailProps {
  wines: Wine[];
  onClose: () => void;
}

export default function WineComparisonDetail({
  wines,
  onClose,
}: WineComparisonDetailProps) {
  const [copied, setCopied] = useState(false);

  // 計算差異（找出最高和最低值）
  const getPriceRange = () => {
    const prices = wines.map((w) => w.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const getVintageRange = () => {
    const vintages = wines.filter((w) => w.vintage).map((w) => w.vintage!);
    if (vintages.length === 0) return null;
    return { min: Math.min(...vintages), max: Math.max(...vintages) };
  };

  const getRatingRange = () => {
    const ratings = wines.filter((w) => w.rating).map((w) => w.rating!);
    if (ratings.length === 0) return null;
    return { min: Math.min(...ratings), max: Math.max(...ratings) };
  };

  const priceRange = getPriceRange();
  const vintageRange = getVintageRange();
  const ratingRange = getRatingRange();

  // 判斷是否為最佳值（用於高亮）
  const isBestPrice = (price: number) => price === priceRange.min;
  const isBestVintage = (vintage: number | undefined) =>
    vintage && vintageRange && vintage === vintageRange.max;
  const isBestRating = (rating: number | undefined) =>
    rating && ratingRange && rating === ratingRange.max;

  // 分享功能
  const handleShare = async () => {
    const shareData = {
      title: "ProWine 酒款比較",
      text: `我比較了 ${wines.length} 款葡萄酒`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // 複製連結
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      logger.error(
        "Share failed",
        error instanceof Error ? error : new Error(String(error)),
        { component: "WineComparisonDetail", wineCount: wines.length }
      );
    }
  };

  // 複製比較結果
  const handleCopy = async () => {
    const comparisonText = wines
      .map(
        (w, i) =>
          `${i + 1}. ${w.nameZh} (${w.nameEn})\n   價格: NT$ ${w.price.toLocaleString()}\n   年份: ${w.vintage || "N/A"}\n   評分: ${w.rating || "N/A"}/100`
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(comparisonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error(
        "Copy failed",
        error instanceof Error ? error : new Error(String(error)),
        { component: "WineComparisonDetail" }
      );
    }
  };

  if (wines.length < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-2xl font-serif font-bold text-neutral-900">
                酒款比較
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                並排對比 {wines.length} 款葡萄酒
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Copy className="w-4 h-4" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    複製
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="flex-1 overflow-auto p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-200">
                    <th className="text-left p-4 font-semibold text-neutral-900 sticky left-0 bg-white z-10">
                      項目
                    </th>
                    {wines.map((wine) => (
                      <th
                        key={wine.id}
                        className="text-center p-4 min-w-[200px] border-l border-neutral-200"
                      >
                        <div className="flex flex-col items-center gap-3">
                          {wine.imageUrl && (
                            <div className="relative w-24 h-32 rounded-lg overflow-hidden">
                              <Image
                                src={wine.imageUrl}
                                alt={wine.nameZh}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-neutral-900 mb-1">
                              {wine.nameZh}
                            </h3>
                            <p className="text-xs text-neutral-500">
                              {wine.nameEn}
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              {wine.wineryName}
                            </p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 價格 */}
                  <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-4 font-medium text-neutral-700 sticky left-0 bg-white z-10">
                      價格
                    </td>
                    {wines.map((wine) => (
                      <td
                        key={wine.id}
                        className={`p-4 text-center border-l border-neutral-200 ${
                          isBestPrice(wine.price)
                            ? "bg-green-50 font-bold text-green-700"
                            : ""
                        }`}
                      >
                        NT$ {wine.price.toLocaleString()}
                        {isBestPrice(wine.price) && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            最低
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* 年份 */}
                  {vintageRange && (
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-4 font-medium text-neutral-700 sticky left-0 bg-white z-10">
                        年份
                      </td>
                      {wines.map((wine) => (
                        <td
                          key={wine.id}
                          className={`p-4 text-center border-l border-neutral-200 ${
                            isBestVintage(wine.vintage)
                              ? "bg-blue-50 font-bold text-blue-700"
                              : ""
                          }`}
                        >
                          {wine.vintage || "N/A"}
                          {isBestVintage(wine.vintage) && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              最新
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* 評分 */}
                  {ratingRange && (
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-4 font-medium text-neutral-700 sticky left-0 bg-white z-10">
                        評分
                      </td>
                      {wines.map((wine) => (
                        <td
                          key={wine.id}
                          className={`p-4 text-center border-l border-neutral-200 ${
                            isBestRating(wine.rating)
                              ? "bg-yellow-50 font-bold text-yellow-700"
                              : ""
                          }`}
                        >
                          {wine.rating ? `${wine.rating}/100` : "N/A"}
                          {isBestRating(wine.rating) && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                              最高
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* 產區 */}
                  <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="p-4 font-medium text-neutral-700 sticky left-0 bg-white z-10">
                      產區
                    </td>
                    {wines.map((wine) => (
                      <td
                        key={wine.id}
                        className="p-4 text-center border-l border-neutral-200"
                      >
                        {wine.region || "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* 葡萄品種 */}
                  {wines.some((w) => w.grapeVarieties && w.grapeVarieties.length > 0) && (
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-4 font-medium text-neutral-700 sticky left-0 bg-white z-10">
                        葡萄品種
                      </td>
                      {wines.map((wine) => (
                        <td
                          key={wine.id}
                          className="p-4 text-center border-l border-neutral-200"
                        >
                          {wine.grapeVarieties && wine.grapeVarieties.length > 0
                            ? wine.grapeVarieties.join(", ")
                            : "N/A"}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* 酒精濃度 */}
                  {wines.some((w) => w.alcoholContent) && (
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-4 font-medium text-neutral-700 sticky left-0 bg-white z-10">
                        酒精濃度
                      </td>
                      {wines.map((wine) => (
                        <td
                          key={wine.id}
                          className="p-4 text-center border-l border-neutral-200"
                        >
                          {wine.alcoholContent ? `${wine.alcoholContent}%` : "N/A"}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

