"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Wine, MapPin, Calendar, Star, Utensils, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import WineDetailSkeleton from "@/components/WineDetailSkeleton";
import { processImageUrl } from "@/lib/utils/image-utils";
import ImageGallery from "@/components/ImageGallery";
import FlavorWheel from "@/components/FlavorWheel";
import FoodPairing from "@/components/FoodPairing";
import QuickInquiryForm from "@/components/QuickInquiryForm";
import ScrollAnchorNav from "@/components/ScrollAnchorNav";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import { saveBrowsingHistory } from "@/components/PersonalizedRecommendations";
import { recordUserBehavior } from "@/lib/utils/ai-recommendation";
import { optimizeImageUrl } from "@/lib/utils/image-optimization"; // 圖片優化
import StructuredData from "@/components/StructuredData"; // SEO 結構化數據
import Breadcrumb from "@/components/Breadcrumb"; // SEO Breadcrumb
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export default function WineDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [wine, setWine] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [optimizedMainImage, setOptimizedMainImage] = useState<string | null>(null); // 優化後的主圖片
  
  // 滾動錨點導航區塊（P2）
  const anchorSections = [
    { id: "wine-detail", label: "酒款詳情" },
    { id: "tasting-notes", label: "品酒筆記" },
    { id: "flavor-profile", label: "風味輪" },
    { id: "food-pairing", label: "配餐建議" },
    { id: "recommendations", label: "相關推薦" },
  ];

  useEffect(() => {
    if (!slug) return;

    const fetchWine = async () => {
      try {
        setIsLoading(true);
        // 性能優化：使用 Next.js 緩存策略（300秒緩存，詳情頁更新頻率較低）
        // 先嘗試用 slug 查詢
        let response = await fetch(`/api/wines?slug=${slug}&published=true`, {
          next: { revalidate: 300 },
        });
        
        // 如果 slug 查詢失敗，嘗試用 id 查詢
        if (!response.ok) {
          response = await fetch(`/api/wines?id=${slug}&published=true`, {
            next: { revalidate: 300 },
          });
        }

        if (!response.ok) {
          throw new Error("無法載入酒款資料");
        }

        const data = await response.json();
        // 處理不同的API響應格式
        // /api/wines?slug=xxx 返回 { wines: [...] } 或 { data: { wines: [...] } }
        // /api/wines/[slug] 返回 { wine: {...} }
        const wineData = data.wine || data.data?.wine || data.data?.wines?.[0] || data.wines?.[0] || null;

        if (wineData) {
          // 從 images JSON 字段提取 tastingNotes、foodPairing、flavorProfile
          const imagesData = typeof wineData.images === 'object' && wineData.images !== null 
            ? wineData.images as any 
            : {};
          
          // 調試：檢查數據結構（使用JSON.stringify確保完整顯示）
          // Q22優化：使用logger替代console.log（僅在開發環境中輸出）
          logger.debug('🍷 酒款數據:', JSON.stringify({
            nameZh: wineData.nameZh,
            mainImageUrl: wineData.mainImageUrl,
            descriptionZh: wineData.descriptionZh?.substring(0, 100) || '空',
            descriptionEn: wineData.descriptionEn?.substring(0, 100) || '空',
            images: wineData.images,
            imagesData: imagesData,
            tastingNotes: imagesData.tastingNotes,
            foodPairing: imagesData.foodPairing,
            flavorProfile: imagesData.flavorProfile,
          }, null, 2));
          
          // 檢查是否有數據
          if (!wineData.descriptionZh && !wineData.descriptionEn) {
            // Q22優化：使用logger替代console.warn
            logger.warn('⚠️ 警告：酒品介紹為空，需要運行AI生成腳本');
          }
          if (!imagesData.tastingNotes) {
            logger.warn('⚠️ 警告：品酒筆記為空，需要運行AI生成腳本');
          }
          if (!imagesData.foodPairing) {
            logger.warn('⚠️ 警告：配餐建議為空，需要運行AI生成腳本');
          }
          if (!imagesData.flavorProfile) {
            logger.warn('⚠️ 警告：風味輪數據為空，將使用默認數據');
          }
          
          // 檢查圖片（特別檢查是否是錯誤的blog-kv-02.jpg）
          if (!wineData.mainImageUrl) {
            logger.warn('⚠️ 警告：mainImageUrl為空，將使用fallback圖片');
          } else if (wineData.mainImageUrl.includes('blog-kv-02.jpg') || wineData.mainImageUrl.includes('blog-kv-')) {
            logger.warn('⚠️ 警告：圖片URL是通用圖片（blog-kv），建議運行圖片修復腳本');
          } else {
            logger.debug('✅ 圖片URL:', wineData.mainImageUrl);
          }
          
          const enhancedWineData = {
            ...wineData,
            tastingNotes: wineData.tastingNotes || imagesData.tastingNotes || null,
            foodPairing: wineData.foodPairing || imagesData.foodPairing || null,
            flavorProfile: imagesData.flavorProfile || null,
          };
          
          setWine(enhancedWineData);
          // 記錄用戶行為（P2：AI 推薦）
          recordUserBehavior({
            wineId: enhancedWineData.id,
            action: 'view',
            timestamp: Date.now(),
            category: enhancedWineData.category,
            region: enhancedWineData.region,
            price: enhancedWineData.price,
          });
          // 保存瀏覽歷史
          saveBrowsingHistory(enhancedWineData.id);
          
          // 優化主圖片（使用 Comet API）
          // 優先使用 mainImageUrl，確保使用正確的 PROWINE 圖片
          // 如果 mainImageUrl 存在且有效，直接使用；否則才使用 processImageUrl
          const mainImageUrl = enhancedWineData.mainImageUrl && enhancedWineData.mainImageUrl.trim().length > 0
            ? enhancedWineData.mainImageUrl
            : processImageUrl(null, enhancedWineData.images, 'wine', 0);
          optimizeImageUrl(mainImageUrl, "comet").then(setOptimizedMainImage).catch(() => {
            // 如果優化失敗，使用原始圖片
            setOptimizedMainImage(null);
          });
        } else {
          setError("找不到此酒款");
        }
      } catch (err: any) {
        setError(err.message || "載入失敗");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWine();
  }, [slug]);

  if (isLoading) {
    return <WineDetailSkeleton />;
  }

  if (error || !wine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 text-lg mb-4">{error || "找不到此酒款"}</p>
          <Link
            href="/wines"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            返回酒款列表
          </Link>
        </div>
      </div>
    );
  }

  // 優先使用 mainImageUrl（確保使用正確的 PROWINE 圖片，不使用 fallback）
  // 如果 mainImageUrl 存在且不是錯誤的通用圖片，直接使用；否則才使用 processImageUrl（會fallback）
  // 過濾掉 blog-kv-02.jpg 等通用圖片
  const isValidMainImage = wine.mainImageUrl 
    && wine.mainImageUrl.trim().length > 0
    && !wine.mainImageUrl.includes('blog-kv-02.jpg')
    && !wine.mainImageUrl.includes('blog-kv-');
  
  const imageUrl = isValidMainImage
    ? (optimizedMainImage || wine.mainImageUrl)
    : (optimizedMainImage || processImageUrl(null, wine.images, 'wine', 0));
  
  // 調試：檢查圖片URL
  // Q22優化：使用logger替代console.log
  logger.debug('🖼️ 圖片URL:', JSON.stringify({
    mainImageUrl: wine.mainImageUrl,
    isValidMainImage: isValidMainImage,
    optimizedMainImage: optimizedMainImage,
    finalImageUrl: imageUrl,
  }, null, 2));
  
  // 如果圖片是blog-kv-02.jpg，警告用戶並使用fallback
  if (wine.mainImageUrl && wine.mainImageUrl.includes('blog-kv-02.jpg')) {
    // Q22優化：使用logger替代console.error
    logger.error('mainImageUrl是blog-kv-02.jpg（通用圖片），已過濾，使用fallback圖片', new Error('Invalid mainImageUrl'));
  }

  // 準備圖片畫廊（P2）
  // 安全處理 images 欄位（可能是數組、對象或 null）
  const extractImageUrls = (imagesData: any): string[] => {
    if (!imagesData) return [];
    
    // 如果是數組
    if (Array.isArray(imagesData)) {
      return imagesData
        .map((img: any) => {
          // 如果數組元素是對象，提取 url 屬性
          if (typeof img === 'object' && img !== null && img.url) {
            return img.url;
          }
          // 如果數組元素是字符串，直接使用
          if (typeof img === 'string') {
            return img;
          }
          return null;
        })
        .filter((url: string | null): url is string => url !== null);
    }
    
    // 如果是對象，嘗試提取圖片 URL
    if (typeof imagesData === 'object' && imagesData !== null) {
      const urls: string[] = [];
      
      // 檢查是否有 urls 數組
      if (Array.isArray(imagesData.urls)) {
        urls.push(...imagesData.urls.filter((url: any) => typeof url === 'string'));
      }
      
      // 檢查其他可能包含圖片 URL 的字段
      Object.values(imagesData).forEach((val: any) => {
        if (typeof val === 'string' && (val.includes('http') || val.includes('/'))) {
          urls.push(val);
        }
      });
      
      return urls;
    }
    
    return [];
  };
  
  const imageUrls = extractImageUrls(wine?.images);
  const galleryImages = imageUrls.length > 0
    ? imageUrls.map((url: string) => processImageUrl(url, wine?.images, 'wine', 0))
    : wine?.mainImageUrl 
    ? [processImageUrl(wine.mainImageUrl, wine?.images, 'wine', 0)]
    : [];

  // 風味輪數據（P2：從 flavorProfile 或 tastingNotes 提取，否則使用默認值）
  const flavorProfile = wine?.flavorProfile || (wine?.tastingNotes ? {
    fruity: 70,
    floral: 60,
    spicy: 50,
    earthy: 40,
    oaky: 65,
    tannic: 55,
  } : {
    fruity: 50,
    floral: 50,
    spicy: 50,
    earthy: 50,
    oaky: 50,
    tannic: 50,
  });

  // 配餐建議數據（P2）
  const foodPairings = wine?.foodPairing ? [
    ...(wine.foodPairing.chinese || []).map((food: string, idx: number) => ({
      id: `chinese-${idx}`,
      name: food,
      description: `與 ${wine.nameZh} 完美搭配，平衡酒體的層次感`,
      category: "中餐",
      matchScore: 85,
    })),
    ...(wine.foodPairing.western || []).map((food: string, idx: number) => ({
      id: `western-${idx}`,
      name: food,
      description: `與 ${wine.nameZh} 完美搭配，提升整體用餐體驗`,
      category: "西餐",
      matchScore: 80,
    })),
  ] : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* SEO 結構化數據 */}
      {wine && (
        <StructuredData
          type="product"
          data={{
            nameZh: wine.nameZh,
            nameEn: wine.nameEn,
            descriptionZh: wine.descriptionZh,
            descriptionEn: wine.descriptionEn,
            mainImageUrl: imageUrl,
            price: wine.price,
            winery: wine.winery || { nameZh: wine.wineryName || "", nameEn: "" },
            ratings: wine.ratings,
          }}
        />
      )}
      {/* 滾動錨點導航（P2） */}
      <ScrollAnchorNav sections={anchorSections} />

      {/* Header with Breadcrumb */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container-custom py-4">
          {wine && (
            <Breadcrumb
              items={[
                { name: "精品酒款", url: "/wines" },
                { name: wine.winery?.nameZh || wine.wineryName || "酒莊", url: wine.winery?.slug ? `/wineries/${wine.winery.slug}` : "/wineries" },
                { name: wine.nameZh, url: `/wines/${slug}` },
              ]}
              className="mb-4"
            />
          )}
          <Link
            href="/wines"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
            style={{ minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent' }}
            aria-label="返回酒款列表"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回酒款列表</span>
          </Link>
        </div>
      </section>

      {/* Wine Detail */}
      <section id="wine-detail" className="py-6 md:py-12">
        <div className="container-custom px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
            {/* Image（P2：支持點擊打開畫廊） */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer group touch-manipulation"
              onClick={() => {
                setGalleryIndex(0);
                setGalleryOpen(true);
              }}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: '44px',
                minWidth: '44px',
              }}
              role="button"
              tabIndex={0}
              aria-label="點擊查看大圖"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setGalleryIndex(0);
                  setGalleryOpen(true);
                }
              }}
            >
              <Image
                src={imageUrl}
                alt={wine.nameZh}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                priority
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                unoptimized={imageUrl?.includes('prowine.com.tw') || imageUrl?.includes('cloudinary.com')}
                onError={(e) => {
                  // 如果圖片加載失敗，嘗試使用fallback
                  const target = e.target as HTMLImageElement;
                  const fallbackUrl = processImageUrl(null, wine.images, 'wine', 0);
                  if (target.src !== fallbackUrl) {
                    target.src = fallbackUrl;
                  }
                }}
              />
              {/* 放大圖標提示（P2） */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Maximize2 className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-neutral-900 mb-2 leading-tight">
                  {wine.nameZh}
                </h1>
                {wine.nameEn && (
                  <p className="text-base md:text-lg text-neutral-600 italic">{wine.nameEn}</p>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
                {wine.winery && (
                  <Link
                    href={`/wineries/${wine.winery.slug || wine.winery.id}`}
                    className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
                    style={{ minHeight: '44px', minWidth: '44px', WebkitTapHighlightColor: 'transparent' }}
                    aria-label={`查看 ${wine.winery.nameZh || wine.winery.nameEn} 酒莊詳情`}
                  >
                    <Wine className="w-4 h-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    <span className="group-hover:underline">{wine.winery.nameZh || wine.winery.nameEn}</span>
                  </Link>
                )}
                {wine.region && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin className="w-4 h-4" />
                    <span>{wine.region}</span>
                  </div>
                )}
                {wine.vintage && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Calendar className="w-4 h-4" />
                    <span>{wine.vintage}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="py-4 md:py-5 border-y border-neutral-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-neutral-900">
                    NT$ {wine.price?.toLocaleString() || "詢價"}
                  </span>
                </div>
              </div>

              {/* Ratings */}
              {wine.ratings && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-neutral-900">評分</h3>
                  <div className="space-y-1 text-sm">
                    {wine.ratings.decanter && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>Decanter: {wine.ratings.decanter}</span>
                      </div>
                    )}
                    {wine.ratings.jamesSuckling && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>James Suckling: {wine.ratings.jamesSuckling}</span>
                      </div>
                    )}
                    {wine.ratings.robertParker && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>Robert Parker: {wine.ratings.robertParker}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">酒品介紹</h3>
                <div className="text-neutral-600 leading-relaxed whitespace-pre-line">
                  {wine.descriptionZh ? (
                    <p>{wine.descriptionZh}</p>
                  ) : wine.descriptionEn ? (
                    <p>{wine.descriptionEn}</p>
                  ) : (
                    <p className="text-neutral-500 italic">正在生成專業介紹中...</p>
                  )}
                </div>
              </div>

              {/* Tasting Notes */}
              {wine.tastingNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">品酒筆記</h3>
                  <div className="space-y-2 text-sm text-neutral-600">
                    {wine.tastingNotes.color && (
                      <p><strong>色澤：</strong>{wine.tastingNotes.color}</p>
                    )}
                    {wine.tastingNotes.aroma && (
                      <p><strong>香氣：</strong>{wine.tastingNotes.aroma}</p>
                    )}
                    {wine.tastingNotes.palate && (
                      <p><strong>口感：</strong>{wine.tastingNotes.palate}</p>
                    )}
                    {wine.tastingNotes.finish && (
                      <p><strong>餘韻：</strong>{wine.tastingNotes.finish}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Food Pairing */}
              {wine.foodPairing && (
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    餐酒搭配
                  </h3>
                  <div className="space-y-3">
                    {wine.foodPairing.chinese && wine.foodPairing.chinese.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-neutral-700 mb-1">中餐：</p>
                        <div className="flex flex-wrap gap-2">
                          {wine.foodPairing.chinese.map((food: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {wine.foodPairing.western && wine.foodPairing.western.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-neutral-700 mb-1">西餐：</p>
                        <div className="flex flex-wrap gap-2">
                          {wine.foodPairing.western.map((food: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </section>

      {/* 品酒筆記區塊（P2） */}
      {wine.tastingNotes && (
        <section id="tasting-notes" className="py-12 bg-white">
          <div className="container-custom px-4 md:px-6">
            <h2 className="text-3xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-8">
              品酒筆記
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
                {wine.tastingNotes.color && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">色澤</h3>
                    <p>{wine.tastingNotes.color}</p>
                  </div>
                )}
                {wine.tastingNotes.aroma && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">香氣</h3>
                    <p>{wine.tastingNotes.aroma}</p>
                  </div>
                )}
                {wine.tastingNotes.palate && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">口感</h3>
                    <p>{wine.tastingNotes.palate}</p>
                  </div>
                )}
                {wine.tastingNotes.finish && (
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">餘韻</h3>
                    <p>{wine.tastingNotes.finish}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 風味輪可視化（P2） */}
      <section id="flavor-profile" className="py-12 bg-neutral-50 dark:bg-neutral-900">
        <div className="container-custom px-4 md:px-6">
          <h2 className="text-3xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-8">
            風味輪
          </h2>
          <FlavorWheel profile={flavorProfile} />
        </div>
      </section>

      {/* 配餐建議視覺化（P2） */}
      <section id="food-pairing" className="py-12 bg-white">
        <div className="container-custom px-4 md:px-6">
          <h2 className="text-3xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-8">
            配餐建議
          </h2>
          {foodPairings.length > 0 ? (
            <FoodPairing
              pairings={foodPairings}
              wineName={wine.nameZh}
            />
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <p>正在生成配餐建議中...</p>
            </div>
          )}
        </div>
      </section>

      {/* 個人化推薦（P2：增強版） */}
      <section id="recommendations" className="py-12 bg-neutral-50 dark:bg-neutral-900">
        <div className="container-custom px-4 md:px-6">
          <PersonalizedRecommendations
            currentWineId={wine.id}
            limit={4}
            showReason={true}
          />
        </div>
      </section>

      {/* 全屏圖片畫廊（P2） */}
      <ImageGallery
        images={galleryImages}
        initialIndex={galleryIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title={wine.nameZh}
      />

      {/* 快速詢價表單（P2） */}
      <QuickInquiryForm
        wineId={wine.id}
        wineName={wine.nameZh}
        onSuccess={() => {
          // 記錄用戶行為
          recordUserBehavior({
            wineId: wine.id,
            action: 'add_to_cart',
            timestamp: Date.now(),
            category: wine.category,
            region: wine.region,
            price: wine.price,
          });
        }}
      />
    </div>
  );
}
