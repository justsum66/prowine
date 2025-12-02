"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import WineCard from "./WineCard";
import { 
  getUserBehaviorHistory, 
  analyzeUserPreferences, 
  calculateRecommendationScore,
  generateRecommendationReason,
  recordUserBehavior,
  type UserBehavior 
} from "@/lib/utils/ai-recommendation";
import { logger } from "@/lib/utils/logger-production";

interface PersonalizedRecommendationsProps {
  currentWineId?: string;
  limit?: number;
  className?: string;
  showReason?: boolean; // 顯示推薦理由（P2）
}

/**
 * 個人化推薦組件（P1 BATCH9, P2 增強）
 * 基於瀏覽歷史和用戶行為的 AI 智能推薦
 */
export default function PersonalizedRecommendations({
  currentWineId,
  limit = 4,
  className = "",
  showReason = true,
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendationReasons, setRecommendationReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        
        // 獲取用戶行為歷史（P2）
        const behaviors = getUserBehaviorHistory();
        const userPreferences = analyzeUserPreferences(behaviors);
        
        // 獲取瀏覽歷史（從 localStorage）
        const history = typeof window !== "undefined" 
          ? (() => {
              try {
                const stored = localStorage.getItem("wine_browsing_history");
                return stored ? JSON.parse(stored) : [];
              } catch {
                return [];
              }
            })()
          : [];
        
        // 構建推薦查詢
        const params = new URLSearchParams();
        if (currentWineId) {
          params.append("wineId", currentWineId);
        }
        if (history.length > 0) {
          params.append("similarTo", history.slice(0, 3).join(","));
        }
        params.append("limit", (limit * 2).toString()); // 獲取更多候選，用於 AI 評分

        const response = await fetch(`/api/wines/recommendations?${params}`);
        if (response.ok) {
          const data = await response.json();
          let candidateWines = data.recommendations || data.wines || [];

          // AI 評分和排序（P2）
          const scoredWines = candidateWines
            .map((wine: any) => {
              const score = calculateRecommendationScore(wine, userPreferences, behaviors);
              return { ...wine, recommendationScore: score.score, reason: score.reason };
            })
            .sort((a: any, b: any) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit);

          setRecommendations(scoredWines);

          // 生成推薦理由（P2）
          if (showReason) {
            const reasons: Record<string, string> = {};
            scoredWines.forEach((wine: any) => {
              reasons[wine.id] = generateRecommendationReason(wine, userPreferences);
            });
            setRecommendationReasons(reasons);
          }
        }
      } catch (error) {
        logger.error(
          "Failed to fetch recommendations",
          error instanceof Error ? error : new Error(String(error)),
          { component: "PersonalizedRecommendations", currentWineId, limit }
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentWineId, limit, showReason]);

  if (isLoading) {
    return (
      <div className={className}>
        <h3 className="text-2xl font-serif font-light mb-6">為您推薦</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
             <h3 className="text-2xl md:text-3xl font-serif font-light mb-6 text-neutral-900 dark:text-neutral-100">
               為您推薦
             </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {recommendations.map((wine, index) => (
            <motion.div
              key={wine.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative"
            >
              <WineCard
                id={wine.id}
                slug={wine.slug}
                nameZh={wine.nameZh}
                nameEn={wine.nameEn}
                wineryName={wine.wineryName || wine.winery?.nameZh || wine.winery?.nameEn}
                price={wine.price}
                imageUrl={wine.mainImageUrl || wine.imageUrl}
                region={wine.region}
                vintage={wine.vintage}
                rating={wine.rating}
              />
              {/* 推薦理由（P2） */}
              {showReason && recommendationReasons[wine.id] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 italic"
                >
                  {recommendationReasons[wine.id]}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/**
 * 獲取瀏覽歷史
 */
function getBrowsingHistory(): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const history = localStorage.getItem("wine_browsing_history");
    if (history) {
      return JSON.parse(history);
    }
  } catch (error) {
    logger.error(
      "Failed to get browsing history",
      error instanceof Error ? error : new Error(String(error)),
      { function: "getBrowsingHistory" }
    );
  }
  
  return [];
}

/**
 * 保存瀏覽歷史
 */
export function saveBrowsingHistory(wineId: string) {
  if (typeof window === "undefined") return;
  
  try {
    const history = getBrowsingHistory();
    // 移除重複項，添加到開頭
    const updated = [wineId, ...history.filter(id => id !== wineId)].slice(0, 20);
    localStorage.setItem("wine_browsing_history", JSON.stringify(updated));
  } catch (error) {
    logger.error(
      "Failed to save browsing history",
      error instanceof Error ? error : new Error(String(error)),
      { function: "saveBrowsingHistory", wineId }
    );
  }
}

