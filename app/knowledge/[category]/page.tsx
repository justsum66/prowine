"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, BookOpen, Heart, GraduationCap, TestTube } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
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
  publishedAt?: string;
  readTime?: string;
}

const categoryInfo: Record<string, { name: string; description: string; icon: any }> = {
  WINE_KNOWLEDGE: {
    name: "趣談葡萄酒",
    description: "探索葡萄酒的歷史、文化與趣聞",
    icon: BookOpen,
  },
  HEALTH_BENEFITS: {
    name: "葡萄酒與健康",
    description: "了解適量飲用葡萄酒的健康益處",
    icon: Heart,
  },
  TASTING_TIPS: {
    name: "品飲技巧與保存",
    description: "學習專業的品酒技巧與保存方法",
    icon: GraduationCap,
  },
  PAIRING_TIPS: {
    name: "配餐建議",
    description: "探索葡萄酒與美食的完美搭配",
    icon: TestTube,
  },
};

function CategoryPageContent() {
  const params = useParams();
  const category = params?.category as string;
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/articles");
        const data = await response.json();
        if (data.articles) {
          // 過濾特定分類的文章
          const filtered = data.articles.filter(
            (article: Article) => article.category === category
          );
          setArticles(filtered);
        }
      } catch (error) {
        logger.error(
          "Failed to fetch articles",
          error instanceof Error ? error : new Error(String(error)),
          { component: "CategoryPage", category }
        );
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (category) {
      fetchArticles();
    }
  }, [category]);

  const categoryData = categoryInfo[category] || {
    name: "未知分類",
    description: "",
    icon: BookOpen,
  };
  const Icon = categoryData.icon;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container-custom py-12">
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回知識庫
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Icon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900">
                {categoryData.name}
              </h1>
              <p className="text-neutral-600 mt-2">{categoryData.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="container-custom py-12">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-600 text-lg">
              {categoryData.name} 分類中暫無文章
            </p>
            <Link
              href="/knowledge"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              返回知識庫首頁
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/knowledge/article/${article.slug}`}>
                  <div className="card hover:shadow-xl transition-all duration-300 h-full cursor-pointer">
                    {article.featuredImage && (
                      <div className="aspect-video relative rounded-t-lg overflow-hidden mb-4">
                        <Image
                          src={article.featuredImage}
                          alt={article.titleZh}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-2 line-clamp-2">
                      {article.titleZh}
                    </h3>
                    <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                      {article.contentZh?.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      {article.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.publishedAt).toLocaleDateString("zh-TW")}
                        </div>
                      )}
                      {article.readTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CategoryPageContent />
    </Suspense>
  );
}

