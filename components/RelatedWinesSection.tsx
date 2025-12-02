"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import WineCard from "@/components/WineCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { logger } from "@/lib/utils/logger-production";

interface RelatedWinesSectionProps {
  wineId?: string;
}

interface Recommendation {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  wineryName: string;
  price: number;
  imageUrl?: string;
  region?: string;
  vintage?: number;
  category?: string;
  reason?: string;
}

export default function RelatedWinesSection({
  wineId,
}: RelatedWinesSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    if (!wineId) return;

    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/wines/recommendations?wineId=${wineId}&limit=4`
        );
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations || []);
          setExplanation(data.explanation || "");
        }
      } catch (error) {
        logger.error(
          "Failed to fetch recommendations",
          error instanceof Error ? error : new Error(String(error)),
          { component: "RelatedWinesSection", wineId }
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [wineId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-600">
        暫無推薦酒款
      </div>
    );
  }

  return (
    <div>
      {explanation && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-neutral-600 mb-6 text-center max-w-2xl mx-auto"
        >
          {explanation}
        </motion.p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((wine, index) => (
          <motion.div
            key={wine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
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
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

