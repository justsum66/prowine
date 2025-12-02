"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Globe, Wine } from "lucide-react";
import { motion } from "framer-motion";
import WineryDetailSkeleton from "@/components/WineryDetailSkeleton";
import { processImageUrl, isValidImageUrl } from "@/lib/utils/image-utils";
import WineCard from "@/components/WineCard";
import StructuredData from "@/components/StructuredData";
import Breadcrumb from "@/components/Breadcrumb";

export default function WineryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [winery, setWinery] = useState<any>(null);
  const [wines, setWines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 性能優化：使用 Next.js 緩存策略（300秒緩存，詳情頁更新頻率較低）
        // 獲取酒莊資料（先嘗試用 slug，如果失敗則用 id）
        let wineryResponse = await fetch(`/api/wineries?slug=${slug}`, {
          next: { revalidate: 300 },
        });
        
        // 如果 slug 查詢失敗，嘗試用 id 查詢
        if (!wineryResponse.ok) {
          wineryResponse = await fetch(`/api/wineries?id=${slug}`, {
            next: { revalidate: 300 },
          });
        }

        if (!wineryResponse.ok) {
          throw new Error("無法載入酒莊資料");
        }

        const wineryData = await wineryResponse.json();
        const wineries = wineryData.wineries || wineryData.data?.wineries || [];
        const wineryInfo = wineries[0];

        if (!wineryInfo) {
          setError("找不到此酒莊");
          return;
        }

        setWinery(wineryInfo);

        // 性能優化：使用 Next.js 緩存策略
        // 獲取該酒莊的酒款
        const winesResponse = await fetch(`/api/wines?wineryId=${wineryInfo.id}&published=true&limit=100`, {
          next: { revalidate: 300 },
        });

        if (winesResponse.ok) {
          const winesData = await winesResponse.json();
          const wineryWines = winesData.data?.wines || winesData.wines || [];
          
          // 處理圖片URL，確保每個酒款都有有效的圖片
          const { processImageUrl } = require("@/lib/utils/image-utils");
          const winesWithImages = wineryWines.map((wine: any, index: number) => ({
            ...wine,
            mainImageUrl: processImageUrl(
              wine.mainImageUrl,
              wine.images,
              'wine',
              index
            ),
          }));
          
          setWines(winesWithImages);
        } else {
          // 即使API失敗，也記錄錯誤但不阻止頁面顯示
          console.warn("Failed to fetch winery wines:", winesResponse.status);
          setWines([]);
        }
      } catch (err: any) {
        setError(err.message || "載入失敗");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (isLoading) {
    return <WineryDetailSkeleton />;
  }

  if (error || !winery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 text-lg mb-4">{error || "找不到此酒莊"}</p>
          <Link
            href="/wineries"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
            style={{ minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent' }}
            aria-label="返回酒莊列表"
          >
            <ArrowLeft className="w-4 h-4" />
            返回酒莊列表
          </Link>
        </div>
      </div>
    );
  }

  const logoUrl = processImageUrl(winery.logoUrl, winery.images, 'winery', 0);
  // 只要有logoUrl就顯示，processImageUrl已經處理了fallback
  const hasLogo = !!winery.logoUrl || (winery.images && Array.isArray(winery.images) && winery.images.length > 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* SEO 結構化數據 */}
      {winery && (
        <StructuredData
          type="winery"
          data={{
            name: winery.nameZh,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/wineries/${winery.slug || winery.id}`,
            logo: winery.logoUrl,
            description: winery.descriptionZh || winery.descriptionEn,
            region: winery.region,
            country: winery.country,
          }}
        />
      )}
      {/* Header with Breadcrumb */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container-custom py-4">
          {winery && (
            <Breadcrumb
              items={[
                { name: "酒莊風土", url: "/wineries" },
                { name: winery.nameZh, url: `/wineries/${slug}` },
              ]}
              className="mb-4"
            />
          )}
          <Link
            href="/wineries"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
            style={{ minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent' }}
            aria-label="返回酒莊列表"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回酒莊列表</span>
          </Link>
        </div>
      </section>

      {/* Winery Hero */}
      <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white py-8 md:py-12 lg:py-16">
        <div className="container-custom px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square max-w-xs mx-auto md:mx-0 bg-white/10 rounded-lg p-8 flex items-center justify-center"
            >
              {winery.logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${winery.nameZh} Logo`}
                  fill
                  className="object-contain p-4"
                  priority
                  unoptimized={true}
                  onError={(e) => {
                    // LOGO加載失敗時，顯示首字母
                    const target = e.target as HTMLImageElement;
                    if (target.parentElement) {
                      target.style.display = 'none';
                      const fallback = target.parentElement.querySelector('.logo-fallback');
                      if (fallback) {
                        (fallback as HTMLElement).style.display = 'flex';
                      }
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl md:text-7xl font-serif font-bold text-white/80">
                    {winery.nameZh.charAt(0)}
                  </span>
                </div>
              )}
              {/* Fallback: 如果LOGO加載失敗，顯示首字母 */}
              <div className="logo-fallback absolute inset-0 flex items-center justify-center" style={{ display: winery.logoUrl ? 'none' : 'flex' }}>
                <span className="text-6xl md:text-7xl font-serif font-bold text-white/80">
                  {winery.nameZh.charAt(0)}
                </span>
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight">
                {winery.nameZh}
              </h1>
              {winery.nameEn && (
                <p className="text-lg md:text-xl text-neutral-300 italic">{winery.nameEn}</p>
              )}

              <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-neutral-300">
                {winery.region && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{winery.region}</span>
                  </div>
                )}
                {winery.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{winery.country}</span>
                  </div>
                )}
                {winery.website && (
                  <a
                    href={winery.website.startsWith('http') ? winery.website : `https://${winery.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors group touch-manipulation focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-800 rounded px-2 py-1"
                    style={{ minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent' }}
                    aria-label={`訪問 ${winery.nameZh} 官方網站（新視窗開啟）`}
                  >
                    <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:underline">官方網站</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Description */}
      {(winery.descriptionZh || winery.descriptionEn) && (
        <section className="py-6 md:py-8 lg:py-12 bg-white">
          <div className="container-custom px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 mb-3 md:mb-4">關於酒莊</h2>
              <div className="prose prose-sm md:prose-base max-w-none">
                <p className="text-sm md:text-base text-neutral-600 leading-relaxed whitespace-pre-line">
                  {winery.descriptionZh || winery.descriptionEn || "這家酒莊以其精湛的釀酒工藝和對品質的堅持而聞名。"}
                </p>
              </div>
              {winery.website && (
                <div className="mt-4 md:mt-6">
                  <a
                    href={winery.website.startsWith('http') ? winery.website : `https://${winery.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base min-h-[44px] md:min-h-[auto]"
                    aria-label={`訪問 ${winery.nameZh} 官方網站`}
                  >
                    <Globe className="w-4 h-4 md:w-5 md:h-5" />
                    <span>訪問官方網站</span>
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Story */}
      {(winery.storyZh || winery.storyEn) && (
        <section className="py-6 md:py-8 lg:py-12 bg-neutral-50">
          <div className="container-custom px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 mb-3 md:mb-4">酒莊故事</h2>
              <div className="prose prose-sm md:prose-base max-w-none">
                <p className="text-sm md:text-base text-neutral-600 leading-relaxed whitespace-pre-line">
                  {winery.storyZh || winery.storyEn || "這家酒莊擁有悠久的釀酒傳統，致力於生產高品質的葡萄酒。"}
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Wines */}
      {wines.length > 0 && (
        <section className="py-6 md:py-8 lg:py-12 bg-white">
          <div className="container-custom px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 mb-4 md:mb-6 flex items-center gap-2">
                <Wine className="w-5 h-5 md:w-6 md:h-6" />
                酒莊酒款 ({wines.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {wines.map((wine: any) => (
                  <WineCard
                    key={wine.id}
                    id={wine.id}
                    slug={wine.slug || wine.id}
                    nameZh={wine.nameZh}
                    nameEn={wine.nameEn}
                    wineryName={winery.nameZh}
                    price={wine.price}
                    imageUrl={wine.mainImageUrl}
                    region={wine.region}
                    vintage={wine.vintage}
                    rating={wine.ratings?.decanter || wine.ratings?.jamesSuckling || wine.ratings?.robertParker}
                    featured={wine.featured}
                    bestseller={wine.bestseller}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}

