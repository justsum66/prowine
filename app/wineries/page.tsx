"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import WineryCard from "@/components/WineryCard";
import WineryCardSkeleton from "@/components/WineryCardSkeleton";
import EmptyState from "@/components/EmptyState";
import { processImageUrl } from "@/lib/utils/image-utils";

interface Winery {
  id: string;
  slug?: string;
  nameZh: string;
  nameEn: string;
  region?: string;
  country?: string;
  logoUrl?: string;
  images?: string[] | unknown; // 添加 images 字段以支持 processImageUrl
  wineCount: number;
  featured: boolean;
  description?: string;
}

export default function WineriesPage() {
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchWineries = async () => {
      try {
        setIsLoading(true);
        // 性能優化：使用 Next.js 緩存策略（60秒緩存）
        const response = await fetch("/api/wineries", {
          next: { revalidate: 60 },
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (isMounted && data.wineries) {
          // 確保每個酒莊都有 slug
          const wineriesWithSlug = data.wineries.map((winery: any) => ({
            ...winery,
            slug: winery.slug || winery.id,
          }));
          setWineries(wineriesWithSlug);
        }
      } catch (error) {
        console.error("Failed to fetch wineries:", error);
        if (isMounted) {
          setWineries([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWineries();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
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
              酒莊風土
            </h1>
            <p className="text-xl text-neutral-300 leading-relaxed">
              探索來自世界頂級產區的傳奇酒莊
              <br />
              每一家酒莊都承載著獨特的歷史與釀酒哲學
            </p>
          </motion.div>
        </div>
      </section>

      {/* Wineries Grid */}
      <section className="py-12 md:py-16">
        <div className="container-custom px-4 md:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <WineryCardSkeleton key={index} />
              ))}
            </div>
          ) : wineries.length === 0 ? (
            <EmptyState
              variant="default"
              title="暫無酒莊資料"
              description="目前沒有可用的酒莊資料，請稍後再試"
              action={{
                label: "返回首頁",
                href: "/",
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {wineries.map((winery, index) => {
                // 使用 processImageUrl 處理logo URL，確保有效
                // 類型安全處理：確保 images 是數組或 null
                const imagesArray = Array.isArray(winery.images) ? winery.images : null;
                const logoUrl = processImageUrl(
                  winery.logoUrl,
                  imagesArray,
                  'winery',
                  index
                );
                
                return (
                  <WineryCard
                    key={winery.id}
                    id={winery.id}
                    slug={winery.slug}
                    nameZh={winery.nameZh}
                    nameEn={winery.nameEn}
                    region={winery.region}
                    country={winery.country}
                    logoUrl={logoUrl}
                    wineCount={winery.wineCount}
                    featured={winery.featured}
                    description={winery.description}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
