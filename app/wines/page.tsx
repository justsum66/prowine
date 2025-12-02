"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Grid, List, MapPin, Calendar, Star, Wine } from "lucide-react";
import WineCard from "@/components/WineCard";
import WineCardSkeleton from "@/components/WineCardSkeleton";
import EmptyState from "@/components/EmptyState";
import SearchAndFilter from "@/components/SearchAndFilter";
import Pagination from "@/components/Pagination";
import { logger } from "@/lib/utils/logger-production";

interface Wine {
  id: string;
  slug?: string;
  nameZh: string;
  nameEn?: string;
  wineryName?: string;
  price: number;
  imageUrl?: string;
  region?: string;
  country?: string;
  vintage?: number;
  rating?: number;
  category: string;
  featured: boolean;
  bestseller: boolean;
}

type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc" | "vintage-desc" | "name-asc";
type ViewMode = "grid" | "list";

function WinesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // 從 URL 讀取頁碼
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    if (page !== currentPage && page >= 1) {
      setCurrentPage(page);
    }
  }, [searchParams, currentPage]);

  // 從 URL 參數構建查詢字符串
  const buildQueryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", itemsPerPage.toString());
    params.set("page", currentPage.toString());
    params.set("published", "true");
    
    const search = searchParams.get("search");
    const region = searchParams.get("region");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minVintage = searchParams.get("minVintage");
    const maxVintage = searchParams.get("maxVintage");
    const category = searchParams.get("category");
    const minRating = searchParams.get("minRating");
    const sort = searchParams.get("sort");
    
    if (search) params.set("search", search);
    if (region) params.set("region", region);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minVintage) params.set("minVintage", minVintage);
    if (maxVintage) params.set("maxVintage", maxVintage);
    if (category) params.set("category", category);
    if (minRating) params.set("minRating", minRating);
    if (sort) params.set("sort", sort);
    
    return params.toString();
  }, [searchParams, currentPage]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchWines = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 性能優化：使用 Next.js 緩存策略（30秒緩存，列表頁更新頻率較高）
        const response = await fetch(`/api/wines?${buildQueryString}`, {
          next: { revalidate: 30 },
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (isMounted && data.wines) {
          // 更新分頁信息
          const total = data.total || data.wines.length;
          const pages = Math.ceil(total / itemsPerPage);
          setTotalItems(total);
          setTotalPages(pages > 0 ? pages : 1);

          // 格式化酒款數據
          let formattedWines: Wine[] = data.wines.map((wine: any, index: number) => {
            // 使用 processImageUrl 處理圖片URL，確保有效
            const { processImageUrl } = require("@/lib/utils/image-utils");
            const imageUrl = processImageUrl(
              wine.mainImageUrl,
              wine.images,
              'wine',
              index
            );
            
            return {
              id: wine.id,
              slug: wine.slug || wine.id,
              nameZh: wine.nameZh || wine.nameEn || "未知酒款",
              nameEn: wine.nameEn || "",
              wineryName: wine.winery?.nameZh || wine.winery?.nameEn || "未知酒莊",
              price: typeof wine.price === "number" ? wine.price : parseFloat(String(wine.price)) || 0,
              imageUrl: imageUrl,
              region: wine.region,
              country: wine.country,
              vintage: wine.vintage,
              rating: wine.ratings?.decanter || wine.ratings?.jamesSuckling || wine.ratings?.robertParker || undefined,
              category: wine.category || "RED_WINE",
              featured: wine.featured || false,
              bestseller: wine.bestseller || false,
            };
          });

          // 客戶端排序（如果 API 不支持）
          const sortParam = searchParams.get("sort") as SortOption;
          if (sortParam && sortParam !== "default") {
            formattedWines = sortWines(formattedWines, sortParam);
          }

          setWines(formattedWines);
        }
      } catch (error) {
        logger.error("Failed to fetch wines", error instanceof Error ? error : new Error(String(error)));
        if (isMounted) {
          setError(error instanceof Error ? error.message : "載入酒款資料失敗");
          setWines([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWines();
    
    return () => {
      isMounted = false;
    };
  }, [buildQueryString, searchParams]);

  // 排序函數
  const sortWines = (winesToSort: Wine[], sortOption: SortOption): Wine[] => {
    const sorted = [...winesToSort];
    switch (sortOption) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating-desc":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "vintage-desc":
        return sorted.sort((a, b) => (b.vintage || 0) - (a.vintage || 0));
      case "name-asc":
        return sorted.sort((a, b) => a.nameZh.localeCompare(b.nameZh, "zh-TW"));
      default:
        return sorted;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              精品酒款
            </h1>
            <p className="text-xl text-neutral-300 leading-relaxed">
              探索來自世界頂級產區的優質葡萄酒
              <br />
              每一款都承載著獨特的風土與釀酒工藝
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter */}
      <SearchAndFilter />

      {/* Wines Grid */}
      <section className="py-12 md:py-16">
        <div className="container-custom px-4 md:px-6">
          {/* 視圖切換和結果統計 */}
          {!isLoading && wines.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                找到 <span className="font-medium text-neutral-900 dark:text-neutral-100">{wines.length}</span> 款酒
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    viewMode === "grid"
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                  aria-label="網格視圖"
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    viewMode === "list"
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                  aria-label="列表視圖"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <WineCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                重新載入
              </button>
            </div>
          ) : wines.length === 0 ? (
            <EmptyState
              variant="wine"
              title="暫無酒款資料"
              description="目前沒有可用的酒款，請稍後再試或聯繫客服"
              action={{
                label: "返回首頁",
                href: "/",
              }}
            />
          ) : viewMode === "list" ? (
            <div className="space-y-4">
              {wines.map((wine) => (
                <motion.div
                  key={wine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 md:p-6 hover:shadow-lg transition-shadow"
                >
                  <Link
                    href={`/wines/${wine.slug || wine.id}`}
                    className="flex flex-col md:flex-row gap-4 md:gap-6"
                  >
                    <div className="relative w-full md:w-32 h-48 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                      {wine.imageUrl ? (
                        <Image
                          src={wine.imageUrl}
                          alt={wine.nameZh}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Wine className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">
                          {wine.wineryName}
                        </div>
                        <h3 className="text-lg md:text-xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-1">
                          {wine.nameZh}
                        </h3>
                        {wine.nameEn && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 italic mb-2">
                            {wine.nameEn}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                          {wine.region && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {wine.region}
                            </span>
                          )}
                          {wine.vintage && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {wine.vintage}
                            </span>
                          )}
                          {wine.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-accent-gold fill-accent-gold" />
                              {wine.rating}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="text-right">
                          <div className="text-2xl md:text-3xl font-serif font-bold text-primary-600 dark:text-accent-gold">
                            NT$ {wine.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">詢價</div>
                        </div>
                        <button className="px-4 py-2 bg-neutral-900 dark:bg-neutral-700 text-white text-sm font-medium hover:bg-primary-600 dark:hover:bg-primary-500 transition-colors rounded-md min-h-[44px]">
                          查看詳情
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {wines.map((wine) => (
                <WineCard
                  key={wine.id}
                  id={wine.id}
                  slug={wine.slug}
                  nameZh={wine.nameZh}
                  nameEn={wine.nameEn || ""}
                  wineryName={wine.wineryName || "未知酒莊"}
                  price={wine.price}
                  imageUrl={wine.imageUrl}
                  region={wine.region}
                  vintage={wine.vintage}
                  rating={wine.rating}
                  featured={wine.featured}
                  bestseller={wine.bestseller}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function WinesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-24">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
                精品酒款
              </h1>
            </div>
          </div>
        </section>
        <section className="py-12 md:py-16">
          <div className="container-custom px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <WineCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </section>
      </div>
    }>
      <WinesPageContent />
    </Suspense>
  );
}
