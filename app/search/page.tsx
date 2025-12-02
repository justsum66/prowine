"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Wine, Building2 } from "lucide-react";
import Link from "next/link";
import WineCard from "@/components/WineCard";
import WineryCard from "@/components/WineryCard";
import WineCardSkeleton from "@/components/WineCardSkeleton";
import WineryCardSkeleton from "@/components/WineryCardSkeleton";
import { motion } from "framer-motion";
import { HighlightText } from "@/lib/utils/search-highlight";
import { logger } from "@/lib/utils/logger-production";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wines, setWines] = useState<any[]>([]);
  const [wineries, setWineries] = useState<any[]>([]);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (response.ok) {
          const allResults = data.results || [];
          setWines(allResults.filter((r: any) => r.type === "wine"));
          setWineries(allResults.filter((r: any) => r.type === "winery"));
          setResults(allResults);
        }
      } catch (error) {
        logger.error(
          "Search error",
          error instanceof Error ? error : new Error(String(error)),
          { component: "SearchPage", query }
        );
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  if (!query) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="container-custom py-16">
          <div className="text-center">
            <Search className="w-16 h-16 text-neutral-300 mx-auto mb-6" />
            <h1 className="text-3xl font-serif font-light text-neutral-900 mb-4">
              搜尋酒款與酒莊
            </h1>
            <p className="text-neutral-600 font-light">
              請在搜尋框輸入關鍵字
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-custom py-12">
        {/* 搜尋標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light text-neutral-900 mb-2">
            搜尋結果
          </h1>
          <p className="text-neutral-600 font-light">
            關鍵字：<span className="font-medium text-primary-600">"{query}"</span>
            {results.length > 0 && (
              <span className="ml-2">找到 {results.length} 個結果</span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-16">
            {/* 酒款骨架屏 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Wine className="w-5 h-5 text-neutral-300" aria-hidden="true" />
                <h2 className="text-2xl font-serif font-light text-neutral-300">
                  搜尋中...
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <WineCardSkeleton key={index} />
                ))}
              </div>
            </section>
            {/* 酒莊骨架屏 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-5 h-5 text-neutral-300" aria-hidden="true" />
                <h2 className="text-2xl font-serif font-light text-neutral-300">
                  搜尋中...
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, index) => (
                  <WineryCardSkeleton key={index} />
                ))}
              </div>
            </section>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center">
            <Search className="w-16 h-16 text-neutral-300 mx-auto mb-6" aria-hidden="true" />
            <h2 className="text-2xl font-serif font-light text-neutral-900 mb-2">
              找不到相關結果
            </h2>
            <p className="text-neutral-600 font-light mb-6">
              請嘗試其他關鍵字或瀏覽我們的精選酒款
            </p>
            <Link
              href="/wines"
              className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-900 text-neutral-900 font-medium text-sm tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300 min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
              aria-label="前往瀏覽所有酒款"
            >
              瀏覽所有酒款
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {/* 酒款結果 */}
            {wines.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Wine className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  <h2 className="text-2xl font-serif font-light text-neutral-900">
                    酒款 ({wines.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {wines.map((wine, index) => (
                    <motion.div
                      key={wine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <WineCard
                        id={wine.id}
                        nameZh={wine.nameZh}
                        nameEn={wine.nameEn}
                        wineryName={wine.wineryName || ""}
                        price={wine.price || 0}
                        region={wine.region}
                        imageUrl={wine.imageUrl}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* 酒莊結果 */}
            {wineries.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  <h2 className="text-2xl font-serif font-light text-neutral-900">
                    酒莊 ({wineries.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {wineries.map((winery, index) => (
                    <motion.div
                      key={winery.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (wines.length + index) * 0.1 }}
                    >
                      <WineryCard
                        id={winery.id}
                        nameZh={winery.nameZh}
                        nameEn={winery.nameEn}
                        region={winery.region}
                        logoUrl={winery.logoUrl}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 pb-20">
          <div className="container-custom py-16">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" aria-hidden="true"></div>
              <p className="text-neutral-600 font-light">載入中...</p>
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

