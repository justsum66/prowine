"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Wine, Award, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import WineCard from "@/components/WineCard";
import WineryCard from "@/components/WineryCard";
import HorizontalCarousel from "@/components/HorizontalCarousel";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import WineCardSkeleton from "@/components/WineCardSkeleton";
import WineryCardSkeleton from "@/components/WineryCardSkeleton";
import EmptyState from "@/components/EmptyState";
import { processImageUrl } from "@/lib/utils/image-utils";
import { logger } from "@/lib/api/logger";
import dynamic from "next/dynamic";

// Q21優化：定義類型接口，消除any類型
interface ApiWine {
  id: string;
  slug?: string;
  nameZh?: string;
  nameEn?: string;
  winery?: {
    nameZh?: string;
    nameEn?: string;
  };
  wineryName?: string;
  price?: number | string;
  region?: string;
  vintage?: number | null;
  ratings?: {
    decanter?: number;
    jamesSuckling?: number;
    robertParker?: number;
  };
  featured?: boolean;
  bestseller?: boolean;
  mainImageUrl?: string;
  images?: string[] | unknown;
}

interface ApiWinery {
  id: string;
  slug?: string;
  nameZh?: string;
  nameEn?: string;
  region?: string;
  country?: string;
  wineCount?: number;
  _count?: {
    wines?: number;
  };
  featured?: boolean;
  descriptionZh?: string;
  descriptionEn?: string;
  logoUrl?: string;
  images?: string[] | unknown;
}

interface FormattedWine {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  wineryName: string;
  price: number;
  region: string;
  vintage: number | null;
  rating: number | null;
  featured: boolean;
  bestseller: boolean;
  imageUrl: string;
}

interface FormattedWinery {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  region: string;
  country: string;
  wineCount: number;
  featured: boolean;
  description: string;
  logoUrl: string;
}

// 代碼分割優化（P1 BATCH10）：動態導入 HeroCarousel（保持 SSR，因為是首屏關鍵內容）
const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"), {
  ssr: true,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-b from-neutral-900 to-neutral-800 animate-pulse" />
  ),
});

export default function HomePage() {
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  
  // 滾動進度指示器（P1 交互優化）
  const scrollProgressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const [featuredWines, setFeaturedWines] = useState<any[]>([]);
  const [featuredWineries, setFeaturedWineries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); // 改為 false，避免阻塞初始渲染
  const fetchingRef = useRef(false); // 防止重複請求
  const wineCarouselRef = useRef<HTMLDivElement>(null);
  const wineryCarouselRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // 從 API 獲取數據（並行請求優化，添加請求鎖防止重複）
  useEffect(() => {
    // 防止重複請求
    if (fetchingRef.current) {
      return;
    }
    
    let isMounted = true;
    fetchingRef.current = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 並行請求 wines 和 wineries，大幅減少載入時間
        // 性能優化：使用 Next.js 緩存策略（revalidate 60s）
        const [winesResponse, wineriesResponse] = await Promise.all([
          fetch("/api/wines?featured=true&limit=6&published=true", {
            next: { revalidate: 60 }, // 60秒緩存，提升性能
          }),
          fetch("/api/wineries?featured=true&limit=5", {
            next: { revalidate: 60 }, // 60秒緩存，提升性能
          }),
        ]);
        
        // 處理 wines 響應
        if (!winesResponse.ok) {
          // Q22優化：使用logger替代console.error
          logger.error(
            `Wines API error: ${winesResponse.status}`,
            new Error(`Wines API error: ${winesResponse.status}`),
            { status: winesResponse.status, endpoint: "/api/wines" }
          );
          if (isMounted) setFeaturedWines([]);
        } else {
          const winesData = await winesResponse.json();
          const wines: ApiWine[] = winesData.data?.wines || winesData.wines || [];
          
          if (isMounted && wines && wines.length > 0) {
            // Q21優化：使用類型接口，消除any
            const formattedWines: FormattedWine[] = wines.slice(0, 6).map((wine: ApiWine, index: number) => ({
              id: wine.id,
              slug: wine.slug || wine.id, // 確保有 slug
              nameZh: wine.nameZh || "未知酒款",
              nameEn: wine.nameEn || "",
              wineryName: wine.winery?.nameZh || wine.winery?.nameEn || wine.wineryName || "未知酒莊",
              price: Number(wine.price) || 0,
              region: wine.region || "",
              vintage: wine.vintage || null,
              rating: wine.ratings?.decanter || wine.ratings?.jamesSuckling || wine.ratings?.robertParker || null,
              featured: wine.featured || false,
              bestseller: wine.bestseller || false,
              imageUrl: processImageUrl(wine.mainImageUrl, Array.isArray(wine.images) ? wine.images : null, 'wine', index),
            }));
            setFeaturedWines(formattedWines);
          } else if (isMounted) {
            setFeaturedWines([]);
          }
        }

        // 處理 wineries 響應
        if (!wineriesResponse.ok) {
          // Q22優化：使用logger替代console.error
          logger.error(
            `Wineries API error: ${wineriesResponse.status}`,
            new Error(`Wineries API error: ${wineriesResponse.status}`),
            { status: wineriesResponse.status, endpoint: "/api/wineries" }
          );
          if (isMounted) setFeaturedWineries([]);
        } else {
          const wineriesData = await wineriesResponse.json();
          const wineries: ApiWinery[] = wineriesData.data?.wineries || wineriesData.wineries || [];
          
          if (isMounted && wineries && Array.isArray(wineries) && wineries.length > 0) {
            // Q21優化：使用類型接口，消除any
            const formattedWineries: FormattedWinery[] = wineries.slice(0, 5).map((winery: ApiWinery, index: number) => ({
              id: winery.id,
              slug: winery.slug || winery.id, // 確保有 slug
              nameZh: winery.nameZh || "未知酒莊",
              nameEn: winery.nameEn || "",
              region: winery.region || "",
              country: winery.country || "",
              wineCount: winery.wineCount || winery._count?.wines || 0,
              featured: winery.featured || false,
              description: winery.descriptionZh || winery.descriptionEn || "",
              logoUrl: processImageUrl(winery.logoUrl, Array.isArray(winery.images) ? winery.images : null, 'winery', index),
            }));
            setFeaturedWineries(formattedWineries);
          } else if (isMounted) {
            setFeaturedWineries([]);
          }
        }
      } catch (error) {
        // Q22優化：使用logger替代console.error
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
        logger.error(
          errorMessage,
          error instanceof Error ? error : new Error("Failed to fetch data"),
          { error: errorMessage }
        );
        if (isMounted) {
          setFeaturedWines([]);
          setFeaturedWineries([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          fetchingRef.current = false;
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
      fetchingRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* 滾動進度指示器（P1 交互優化） */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-gold via-primary-600 to-accent-gold z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Hero Section - 沉浸式視覺敘事（P1 視覺設計升級） */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 使用新的 HeroCarousel 組件 */}
        <HeroCarousel />
        
        {/* 有機形狀裝飾元素（P1 優化） */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* 流動的有機形狀 SVG */}
          <svg className="absolute top-20 right-10 w-96 h-96 opacity-20" viewBox="0 0 400 400" aria-hidden="true">
            <defs>
              <linearGradient id="organicGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#722f37" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M200,100 Q250,50 300,100 T400,100 Q350,150 300,200 T200,300 Q150,250 100,300 T0,200 Q50,150 100,100 T200,100 Z"
              fill="url(#organicGradient1)"
              className="animate-float"
            />
          </svg>
          <svg className="absolute bottom-32 left-10 w-80 h-80 opacity-15" viewBox="0 0 400 400" aria-hidden="true">
            <defs>
              <linearGradient id="organicGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#722f37" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M100,200 Q150,150 200,200 T300,200 Q250,250 200,300 T100,300 Q50,250 0,200 T100,200 Z"
              fill="url(#organicGradient2)"
              className="animate-float"
              style={{ animationDelay: "2s" }}
            />
          </svg>
        </div>
        
        {/* CTA 按鈕層 - Glassmorphism 2.0 效果（P1 優化） */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href="/wines"
                className="px-8 py-4 bg-accent-gold text-neutral-900 font-medium text-sm tracking-wider uppercase hover:bg-accent-gold/90 transition-all duration-300 rounded-3xl shadow-gold hover:shadow-gold-lg touch-manipulation min-h-[44px] flex items-center justify-center relative overflow-hidden group liquid-shine ripple-effect"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {/* 2026高端設計：液態光澤效果 */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                <span className="flex items-center gap-2 relative z-10">
                  探索精選佳釀
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href="/wineries"
                className="px-8 py-4 border-2 border-white/60 text-white font-medium text-sm tracking-wider uppercase hover:bg-white/20 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl touch-manipulation min-h-[44px] flex items-center justify-center relative overflow-hidden group glass-button ripple-effect micro-lift"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {/* 2026高端設計：Glassmorphism 2.0 多層次深度感 */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl"></div>
                <div className="absolute inset-0 backdrop-blur-xl rounded-3xl"></div>
                <span className="flex items-center gap-2 relative z-10">
                  <Wine className="w-4 h-4 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                  酒莊風土
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Glassmorphism 2.0 卡片設計（P1 優化） */}
      {/* 留白藝術優化（P1 BATCH3）：py-24 md:py-32 已實現，增加不對稱留白 */}
      <section className="py-24 md:py-32 lg:py-40 bg-gradient-to-b from-white via-ivory to-white relative overflow-hidden">
        {/* 動態漸變背景（P1 BATCH2 優化） */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 根據時間變化的漸變背景 */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-accent-gold/10 to-primary-100/20"
            animate={{
              background: [
                "linear-gradient(135deg, rgba(125, 96, 73, 0.1) 0%, rgba(212, 175, 55, 0.05) 50%, rgba(125, 96, 73, 0.1) 100%)",
                "linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(125, 96, 73, 0.05) 50%, rgba(212, 175, 55, 0.1) 100%)",
                "linear-gradient(135deg, rgba(125, 96, 73, 0.1) 0%, rgba(212, 175, 55, 0.05) 50%, rgba(125, 96, 73, 0.1) 100%)",
              ],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* 有機形狀背景裝飾 */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-200/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-glow"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-gold/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse-glow" style={{ animationDelay: "1s" }}></div>
          
          {/* 流動線條動畫（P1 BATCH2 優化） */}
          <svg className="absolute inset-0 w-full h-full opacity-5" aria-hidden="true">
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#7d6049" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0,200 Q200,100 400,200 T800,200 T1200,200 T1600,200"
              stroke="url(#flowGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0, 0.5, 0],
                x: [0, 100, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* 視覺層次優化（P1 BATCH3）：字體大小層級、顏色對比 */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 dark:from-accent-gold dark:via-accent-gold/90 dark:to-accent-gold">
              侍酒師嚴選
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto leading-relaxed font-light">
              九年專業經驗，為您精心挑選來自世界30+頂級酒莊的精品佳釀
            </p>
          </motion.div>

          {/* Bento Grid 佈局（P1 BATCH2 優化）- 不規則網格創造視覺節奏 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative auto-rows-fr">
            {[
              {
                icon: Wine,
                title: "精選酒款",
                description: "嚴選來自法國、美國、西班牙等頂級產區的精品葡萄酒，每一瓶都經過專業侍酒師認證",
                size: "normal", // normal, large, wide
              },
              {
                icon: Award,
                title: "專業服務",
                description: "AI 侍酒師推薦，為您找到最適合的葡萄酒。結合專業知識與智能科技，提供個人化建議",
                size: "normal",
              },
              {
                icon: Users,
                title: "貼心服務",
                description: "24/7 AI 客服，隨時為您解答疑問。從選酒到詢價，全程專業協助",
                size: "normal",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.6, type: "spring", stiffness: 100 }}
                className="relative group"
              >
                {/* Glassmorphism 2.0 卡片 */}
                <motion.div
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    rotateY: 2,
                    rotateX: -1,
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20 
                  }}
                  style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
                  className="relative h-full p-8 rounded-3xl backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border border-white/20 dark:border-white/10 shadow-premium hover:shadow-premium-lg transition-all duration-500"
                >
                  {/* 多層次深度感 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-primary-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 backdrop-blur-xl rounded-3xl"></div>
                  
                  {/* 微妙的內發光效果 */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 text-center">
                    {/* 圖標系統升級（P1 BATCH3）：統一尺寸、細線風格、動畫效果 */}
                    <motion.div
                      whileHover={{ 
                        rotate: [0, -5, 5, -5, 0],
                        scale: 1.1,
                        y: -4
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ 
                        duration: 0.5,
                        type: "tween",
                        ease: "easeInOut"
                      }}
                      className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-primary-200 group-hover:to-primary-300 dark:group-hover:from-primary-800/40 dark:group-hover:to-primary-700/30 transition-all duration-300 shadow-lg group-hover:shadow-gold"
                    >
                      <feature.icon className="w-10 h-10 text-primary-700 dark:text-accent-gold stroke-[1.5]" />
                    </motion.div>
                    <h3 className="text-2xl font-serif font-light mb-4 text-neutral-900 group-hover:text-primary-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed text-base font-light">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Wines Section - 動態漸變背景優化（P1 BATCH2） */}
      {/* 留白藝術優化（P1 BATCH3）：不對稱留白創造視覺動感 */}
      <section className="py-28 md:py-36 lg:py-44 bg-gradient-to-b from-ivory via-white to-ivory relative overflow-hidden">
        {/* 動態漸變背景裝飾 */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(125, 96, 73, 0.06) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), radial-gradient(circle at 20% 50%, rgba(125, 96, 73, 0.06) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(125, 96, 73, 0.06) 0%, transparent 50%)",
              ],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-neutral-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600">
              精選自世界頂級酒莊的珍釀
            </h2>
            <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed font-light">
              每一瓶都是故事的開始，為您精心挑選的完美佳釀
            </p>
          </motion.div>

          {isLoading ? (
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 grid gap-4 md:gap-6">
              <WineCardSkeleton count={3} />
            </div>
          ) : featuredWines.length === 0 ? (
            <EmptyState
              variant="wine"
              title="正在為您載入臻選佳釀"
              description="請稍候，我們正在為您準備精選酒款"
            />
          ) : (
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 hidden md:block">
              {featuredWines.map((wine, index) => (
              <motion.div
                key={wine.id}
                initial={{ opacity: 0, y: 40, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  delay: index * 0.05, 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100
                }}
                style={{ 
                  zIndex: featuredWines.length - index,
                }}
                className="relative"
              >
                {/* 3D 卡片效果包裝器（P1 優化） */}
                <motion.div
                  whileHover={{ 
                    rotateY: 5, 
                    rotateX: -5,
                    scale: 1.02,
                    z: 20
                  }}
                  transition={{ 
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  style={{ 
                    transformStyle: "preserve-3d",
                    perspective: "1000px"
                  }}
                  className="relative"
                >
                  <WineCard
                    id={wine.id}
                    slug={wine.slug}
                    nameZh={wine.nameZh}
                    nameEn={wine.nameEn}
                    wineryName={wine.wineryName}
                    price={wine.price}
                    imageUrl={wine.imageUrl}
                    region={wine.region}
                    vintage={wine.vintage}
                    rating={wine.rating}
                    featured={wine.featured}
                    bestseller={wine.bestseller}
                  />
                </motion.div>
              </motion.div>
              ))}
            </div>
          )}
          
          {/* 手機版：橫向滾動輪播 */}
          {!isLoading && featuredWines.length > 0 && (
            <div className="md:hidden -mx-4 px-4">
              <div 
                ref={wineCarouselRef}
                className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory -mx-2 px-2"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-x",
                }}
                onTouchStart={(e) => {
                  // 暫停自動滾動
                  if (autoScrollRef.current) {
                    clearInterval(autoScrollRef.current);
                  }
                  // 允許橫向滾動，但不阻止卡片點擊
                  const target = e.target as HTMLElement;
                  const card = target.closest('[data-wine-card]');
                  if (card) {
                    // 如果是卡片區域，允許點擊
                    return;
                  }
                }}
                onTouchEnd={() => {
                  // 5秒後恢復自動滾動
                  setTimeout(() => {
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      const interval = setInterval(() => {
                        if (wineCarouselRef.current) {
                          const container = wineCarouselRef.current;
                          const scrollAmount = container.clientWidth * 0.85;
                          const maxScroll = container.scrollWidth - container.clientWidth;
                          
                          if (container.scrollLeft >= maxScroll - 10) {
                            container.scrollTo({ left: 0, behavior: "smooth" });
                          } else {
                            container.scrollTo({ 
                              left: container.scrollLeft + scrollAmount, 
                              behavior: "smooth" 
                            });
                          }
                        }
                      }, 4000);
                      autoScrollRef.current = interval;
                    }
                  }, 5000);
                }}
              >
                <div className="flex gap-4" style={{ width: "max-content" }}>
                  {featuredWines.map((wine) => (
                    <div 
                      key={wine.id} 
                      className="flex-shrink-0 w-[85vw] sm:w-80 snap-center"
                      style={{ 
                        touchAction: "manipulation",
                        pointerEvents: "auto",
                        WebkitTapHighlightColor: "transparent",
                      }}
                      data-wine-card="true"
                    >
                      <WineCard
                        id={wine.id}
                        slug={wine.slug}
                        nameZh={wine.nameZh}
                        nameEn={wine.nameEn}
                        wineryName={wine.wineryName}
                        price={wine.price}
                        imageUrl={wine.imageUrl}
                        region={wine.region}
                        vintage={wine.vintage}
                        rating={wine.rating}
                        featured={wine.featured}
                        bestseller={wine.bestseller}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-10">
            <a
              href="/wines"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-neutral-900 text-neutral-900 font-medium text-xs tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300 touch-manipulation min-h-[44px]"
              style={{ 
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.preventDefault();
                router.push("/wines");
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push("/wines");
              }}
            >
              探索我們的精選葡萄酒收藏
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Featured Wineries Section - 動態漸變背景優化（P1 BATCH2） */}
      {/* 留白藝術優化（P1 BATCH3）：呼吸感避免擁擠 */}
      <section className="py-28 md:py-36 lg:py-44 bg-gradient-to-b from-white via-ivory to-white relative overflow-hidden">
        {/* 動態漸變背景裝飾 */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 30% 30%, rgba(125, 96, 73, 0.06) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)",
                "radial-gradient(circle at 70% 30%, rgba(125, 96, 73, 0.06) 0%, transparent 60%), radial-gradient(circle at 30% 70%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)",
                "radial-gradient(circle at 30% 30%, rgba(125, 96, 73, 0.06) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)",
              ],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              精選酒莊
            </h2>
            <p className="section-subtitle">
              探索世界頂級酒莊的傳奇故事
            </p>
          </motion.div>

          {isLoading ? (
            <div className="md:grid md:grid-cols-2 md:gap-8 grid gap-6 md:gap-8">
              <WineryCardSkeleton count={2} />
            </div>
          ) : featuredWineries.length === 0 ? (
            <EmptyState
              variant="default"
              title="正在為您載入精選酒莊"
              description="請稍候，我們正在為您準備精選酒莊資訊"
            />
          ) : (
            <div className="md:grid md:grid-cols-2 md:gap-8 hidden md:block">
              {featuredWineries.map((winery, index) => (
              <motion.div
                key={winery.id}
                initial={{ opacity: 0, y: 40, rotate: index % 2 === 0 ? 1.5 : -1.5 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  delay: index * 0.08, 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100
                }}
                style={{ 
                  zIndex: featuredWineries.length - index,
                }}
                className="relative"
              >
                <WineryCard {...winery} />
              </motion.div>
              ))}
            </div>
          )}
          
          {/* 手機版：橫向滾動輪播 */}
          {!isLoading && featuredWineries.length > 0 && (
            <div className="md:hidden -mx-4 px-4">
              <div 
                ref={wineryCarouselRef}
                className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory -mx-2 px-2"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-x",
                }}
                onTouchStart={(e) => {
                  // 暫停自動滾動
                  if (autoScrollRef.current) {
                    clearInterval(autoScrollRef.current);
                  }
                  // 允許橫向滾動，但不阻止卡片點擊
                  const target = e.target as HTMLElement;
                  const card = target.closest('[data-winery-card]');
                  if (card) {
                    // 如果是卡片區域，允許點擊
                    return;
                  }
                }}
                onTouchEnd={() => {
                  // 5秒後恢復自動滾動
                  setTimeout(() => {
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      const interval = setInterval(() => {
                        if (wineryCarouselRef.current) {
                          const container = wineryCarouselRef.current;
                          const scrollAmount = container.clientWidth * 0.85;
                          const maxScroll = container.scrollWidth - container.clientWidth;
                          
                          if (container.scrollLeft >= maxScroll - 10) {
                            container.scrollTo({ left: 0, behavior: "smooth" });
                          } else {
                            container.scrollTo({ 
                              left: container.scrollLeft + scrollAmount, 
                              behavior: "smooth" 
                            });
                          }
                        }
                      }, 4000);
                      autoScrollRef.current = interval;
                    }
                  }, 5000);
                }}
              >
                <div className="flex gap-4" style={{ width: "max-content" }}>
                  {featuredWineries.map((winery) => (
                    <div 
                      key={winery.id} 
                      className="flex-shrink-0 w-[85vw] sm:w-80 snap-center"
                      style={{ 
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                      }}
                      data-winery-card="true"
                    >
                      <WineryCard {...winery} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-center mt-10">
            <a
              href="/wineries"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-neutral-900 text-neutral-900 font-medium text-xs tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300 touch-manipulation min-h-[44px]"
              style={{ 
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.preventDefault();
                router.push("/wineries");
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push("/wineries");
              }}
            >
              發現適合您的完美佳釀
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
