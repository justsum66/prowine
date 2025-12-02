"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, Search, BookOpen, GraduationCap, Heart, TestTube, Share2, Eye, Facebook, MessageCircle, Copy, Check, ArrowUp, Type } from "lucide-react";
import KnowledgePageSkeleton from "@/components/KnowledgePageSkeleton";
import dynamic from "next/dynamic";

// 動態導入互動工具組件（減少初始bundle大小）
const FlavorWheel = dynamic(() => import("@/components/FlavorWheel"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  ),
});

const WineQuiz = dynamic(() => import("@/components/WineQuiz"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  ),
});
import { createButtonProps } from "@/lib/utils/button-props";
import { logger } from "@/lib/utils/logger-production";

interface Article {
  id: string;
  titleZh: string;
  titleEn: string;
  slug: string;
  contentZh: string;
  contentEn: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  views: number;
  publishedAt?: string;
  readTime?: string;
}

const categories = [
  {
    id: "WINE_KNOWLEDGE",
    name: "趣談葡萄酒",
    description: "探索葡萄酒的歷史、文化與趣聞",
    icon: BookOpen,
  },
  {
    id: "HEALTH_BENEFITS",
    name: "葡萄酒與健康",
    description: "了解適量飲用葡萄酒的健康益處",
    icon: Heart,
  },
  {
    id: "TASTING_TIPS",
    name: "品飲技巧與保存",
    description: "學習專業的品酒技巧與保存方法",
    icon: GraduationCap,
  },
  {
    id: "PAIRING_TIPS",
    name: "配餐建議",
    description: "探索葡萄酒與美食的完美搭配",
    icon: TestTube,
  },
];

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showFlavorWheel, setShowFlavorWheel] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sharedArticleId, setSharedArticleId] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 載入收藏列表和字體大小
  useEffect(() => {
    const savedFavorites = localStorage.getItem("articleFavorites");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    const savedFontSize = localStorage.getItem("articleFontSize") as "small" | "medium" | "large" | null;
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);

  // 監聽滾動，更新進度條
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const progress = (scrollY / (documentHeight - windowHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 初始計算
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 下拉刷新
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY !== null && window.scrollY === 0) {
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY;
      if (diff > 50 && !isRefreshing) {
        setIsRefreshing(true);
        // 重新載入文章
        fetch("/api/articles")
          .then((res) => res.json())
          .then((data) => {
            if (data.articles) {
              setArticles(data.articles);
            }
          })
          .finally(() => {
            setTimeout(() => {
              setIsRefreshing(false);
              setTouchStartY(null);
            }, 1000);
          });
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  // 字體大小切換
  const changeFontSize = () => {
    const sizes: ("small" | "medium" | "large")[] = ["small", "medium", "large"];
    const currentIndex = sizes.indexOf(fontSize);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    setFontSize(nextSize);
    localStorage.setItem("articleFontSize", nextSize);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "small":
        return "text-sm";
      case "large":
        return "text-lg";
      default:
        return "text-base";
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles");
        const data = await response.json();
        if (data.articles) {
          setArticles(data.articles);
          // 提取所有標籤
          const tags = new Set<string>();
          data.articles.forEach((article: Article) => {
            article.tags?.forEach((tag) => tags.add(tag));
          });
          setAllTags(Array.from(tags).sort());
        }
      } catch (error) {
        logger.error(
          "Failed to fetch articles",
          error instanceof Error ? error : new Error(String(error)),
          { component: "KnowledgePage" }
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // 計算閱讀時間（每分鐘200字）
  const calculateReadTime = (content: string): string => {
    const words = content.length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} 分鐘`;
  };

  // 高亮搜尋關鍵字
  const highlightSearch = (text: string, query: string): React.ReactElement => {
    if (!query) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // 收藏/取消收藏
  const toggleFavorite = (articleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(articleId)) {
      newFavorites.delete(articleId);
    } else {
      newFavorites.add(articleId);
    }
    setFavorites(newFavorites);
    localStorage.setItem("articleFavorites", JSON.stringify(Array.from(newFavorites)));
  };

  // 分享文章
  const handleShare = async (article: Article, platform?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = `${window.location.origin}/knowledge/articles/${article.slug}`;
    const title = article.titleZh;
    const text = article.contentZh?.substring(0, 100) || "";

    try {
      if (platform === "facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank"
        );
      } else if (platform === "line") {
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
          "_blank"
        );
      } else if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setSharedArticleId(article.id);
        setTimeout(() => setSharedArticleId(null), 2000);
      }
    } catch (error) {
      logger.error(
        "Share failed",
        error instanceof Error ? error : new Error(String(error)),
        { component: "KnowledgePage", articleId: article.id, articleSlug: article.slug }
      );
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.titleZh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.contentZh?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const matchesTag = !selectedTag || article.tags?.includes(selectedTag);
    return matchesSearch && matchesCategory && matchesTag;
  });

  return (
    <div
      className="min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 - 手機版 */}
      {isRefreshing && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>重新載入中...</span>
          </div>
        </div>
      )}

      {/* 閱讀進度條 - 手機版頂部固定 */}
      <div className="fixed top-20 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-800 z-40 md:hidden">
        <motion.div
          className="h-full bg-primary-600"
          style={{
            width: `${scrollProgress}%`,
          }}
        />
      </div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-neutral-50 py-16 md:py-20 lg:py-24">
        <div className="container-custom px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-neutral-900 mb-4 md:mb-6 leading-tight">
              品酩學堂
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-neutral-600 leading-relaxed">
              深入探索葡萄酒的世界
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>
              從歷史文化到品飲技巧，豐富您的葡萄酒知識
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Interactive Tools */}
      <section className="bg-white border-b border-neutral-200 sticky top-20 z-30">
        <div className="container-custom py-4 md:py-6 px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
            {/* 搜尋框 */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋文章、標籤..."
                className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base md:text-base min-h-[44px] md:min-h-[auto]"
                aria-label="搜尋文章、標籤"
              />
            </div>

            {/* 互動工具按鈕 */}
            <div className="flex gap-2 md:gap-3">
              <button
                {...createButtonProps(
                  () => setShowFlavorWheel(!showFlavorWheel),
                  {
                    className: "px-4 md:px-6 py-2.5 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium flex items-center justify-center gap-2 text-sm md:text-base md:min-h-[auto] flex-1 md:flex-none",
                    "aria-label": "開啟風味輪盤",
                  }
                )}
              >
                <TestTube className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">風味輪盤</span>
                <span className="sm:hidden">風味</span>
              </button>
              <button
                {...createButtonProps(
                  () => setShowQuiz(!showQuiz),
                  {
                    className: "px-4 md:px-6 py-2.5 md:py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 active:bg-primary-100 transition-colors font-medium flex items-center justify-center gap-2 text-sm md:text-base md:min-h-[auto] flex-1 md:flex-none",
                    "aria-label": "開啟知識測驗",
                  }
                )}
              >
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">知識測驗</span>
                <span className="sm:hidden">測驗</span>
              </button>
              {/* 字體大小調整 - 手機版 */}
              <button
                {...createButtonProps(
                  changeFontSize,
                  {
                    className: "md:hidden px-4 py-2.5 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors",
                    "aria-label": "調整字體大小",
                  }
                )}
              >
                <Type className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 分類篩選 - 手機版橫向滾動優化 */}
          <div className="flex flex-nowrap md:flex-wrap gap-2 mt-3 md:mt-4 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:scrollbar-default">
            <button
              {...createButtonProps(
                () => setSelectedCategory(null),
                {
                  className: `px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap md:min-h-[auto] ${
                    selectedCategory === null
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`,
                  "aria-label": "顯示全部文章",
                }
              )}
              aria-pressed={selectedCategory === null}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                {...createButtonProps(
                  () => setSelectedCategory(cat.id),
                  {
                    className: `px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center gap-1.5 md:gap-2 whitespace-nowrap md:min-h-[auto] ${
                      selectedCategory === cat.id
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`,
                    "aria-label": `篩選 ${cat.name} 分類`,
                  }
                )}
                aria-pressed={selectedCategory === cat.id}
              >
                <cat.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="sm:hidden">{cat.name.replace(/葡萄酒|與|建議|保存/g, '')}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Tools Modal */}
      <AnimatePresence>
        {showFlavorWheel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFlavorWheel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-4 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4 md:mx-0"
            >
              <FlavorWheel 
                profile={{
                  fruity: 50,
                  floral: 50,
                  spicy: 50,
                  earthy: 50,
                  oaky: 50,
                  tannic: 50,
                }}
              />
            </motion.div>
          </motion.div>
        )}

        {showQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuiz(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-4 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 md:mx-0"
            >
              <WineQuiz onClose={() => setShowQuiz(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-6 md:mb-8">
            知識分類
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/knowledge/${category.id}`} className="block h-full">
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="card hover:shadow-xl transition-all duration-300 h-full cursor-pointer group"
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-3 md:mb-4 flex items-center justify-center group-hover:from-primary-200 group-hover:to-primary-300 transition-colors">
                      <category.icon className="w-10 h-10 md:w-12 md:h-12 text-primary-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-lg md:text-xl font-serif font-semibold text-neutral-900 mb-1.5 md:mb-2 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-neutral-600 text-xs md:text-sm leading-relaxed">
                      {category.description}
                    </p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 標籤雲 - 桌機版 */}
      {allTags.length > 0 && (
        <section className="hidden lg:block py-8 bg-white border-b border-neutral-200">
          <div className="container-custom px-4 md:px-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">熱門標籤</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedTag === null
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                全部
              </button>
              {allTags.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTag === tag
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="container-custom px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900">
              最新文章
            </h2>
            <Link
              href="/knowledge/all"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2 text-sm md:text-base min-h-[44px] md:min-h-[auto] items-center"
              aria-label="查看全部文章"
            >
              查看全部
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>

          {isLoading ? (
            <KnowledgePageSkeleton />
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-neutral-600 text-lg">找不到相關文章</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {filteredArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/knowledge/articles/${article.slug}`} className="block h-full">
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="card hover:shadow-xl transition-all duration-300 h-full group"
                    >
                      {article.featuredImage && (
                        <div className="aspect-video bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-lg mb-3 md:mb-4 relative overflow-hidden">
                          <Image
                            src={article.featuredImage}
                            alt={article.titleZh}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={85}
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-neutral-500 mb-2 md:mb-3">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                          {categories.find((c) => c.id === article.category)?.name || article.category}
                        </span>
                        {article.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(article.publishedAt).toLocaleDateString("zh-TW")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {article.readTime || (article.contentZh ? calculateReadTime(article.contentZh) : "5 分鐘")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{article.views || 0} 次瀏覽</span>
                        </div>
                      </div>
                      <h3 className={`text-lg md:text-xl lg:text-2xl font-serif font-semibold text-neutral-900 mb-2 md:mb-3 group-hover:text-primary-600 transition-colors leading-tight ${getFontSizeClass()}`}>
                        {searchQuery ? highlightSearch(article.titleZh, searchQuery) : article.titleZh}
                      </h3>
                      <p className={`${getFontSizeClass()} text-neutral-600 leading-relaxed mb-3 md:mb-4 line-clamp-2 md:line-clamp-3`}>
                        {searchQuery
                          ? highlightSearch(article.contentZh?.substring(0, 150) || "", searchQuery)
                          : `${article.contentZh?.substring(0, 150)}...`}
                      </p>
                      {/* 標籤 */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3 md:mb-4">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary-600 font-medium text-sm md:text-base group-hover:gap-3 transition-all">
                          <span>閱讀更多</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        {/* 收藏和分享按鈕 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleFavorite(article.id, e)}
                            className={`p-2 rounded-full transition-colors ${
                              favorites.has(article.id)
                                ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                                : "text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            }`}
                            aria-label={favorites.has(article.id) ? "取消收藏" : "收藏文章"}
                          >
                            <Heart
                              className={`w-4 h-4 ${favorites.has(article.id) ? "fill-current" : ""}`}
                            />
                          </button>
                          <div className="relative group">
                            <button
                              onClick={(e) => handleShare(article, undefined, e)}
                              className="p-2 rounded-full text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              aria-label="分享文章"
                            >
                              {sharedArticleId === article.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </button>
                            {/* 分享選單 - 桌機版 */}
                            <div className="absolute right-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                              <button
                                onClick={(e) => handleShare(article, "facebook", e)}
                                className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                aria-label="分享到 Facebook"
                              >
                                <Facebook className="w-4 h-4 text-blue-600" aria-hidden="true" />
                              </button>
                              <button
                                onClick={(e) => handleShare(article, "line", e)}
                                className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                aria-label="分享到 LINE"
                              >
                                <MessageCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
                              </button>
                              <button
                                onClick={(e) => handleShare(article, undefined, e)}
                                className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                aria-label="複製連結"
                              >
                                <Copy className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 手機版底部固定操作欄 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setShowFlavorWheel(!showFlavorWheel)}
            className="flex flex-col items-center gap-1 px-4 py-2 min-h-[44px] touch-manipulation"
            aria-label="風味輪盤"
          >
            <TestTube className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">風味</span>
          </button>
          <button
            onClick={() => setShowQuiz(!showQuiz)}
            className="flex flex-col items-center gap-1 px-4 py-2 min-h-[44px] touch-manipulation"
            aria-label="知識測驗"
          >
            <GraduationCap className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">測驗</span>
          </button>
          <button
            onClick={changeFontSize}
            className="flex flex-col items-center gap-1 px-4 py-2 min-h-[44px] touch-manipulation"
            aria-label="調整字體"
          >
            <Type className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">字體</span>
          </button>
        </div>
      </div>

    </div>
  );
}
