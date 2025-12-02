/**
 * AI 個人化推薦工具（P2）
 * 基於用戶行為的智能推薦算法
 */

export interface UserBehavior {
  wineId: string;
  action: 'view' | 'add_to_cart' | 'add_to_wishlist' | 'purchase';
  timestamp: number;
  category?: string;
  region?: string;
  price?: number;
}

export interface RecommendationScore {
  wineId: string;
  score: number;
  reason: string;
}

/**
 * 獲取用戶行為歷史
 */
export function getUserBehaviorHistory(): UserBehavior[] {
  if (typeof window === "undefined") return [];
  
  try {
    const history = localStorage.getItem("user_behavior_history");
    if (history) {
      return JSON.parse(history);
    }
  } catch (error) {
    console.error("Failed to get user behavior history:", error);
  }
  
  return [];
}

/**
 * 記錄用戶行為
 */
export function recordUserBehavior(behavior: UserBehavior) {
  if (typeof window === "undefined") return;
  
  try {
    const history = getUserBehaviorHistory();
    // 添加新行為，保留最近 100 條
    const updated = [behavior, ...history].slice(0, 100);
    localStorage.setItem("user_behavior_history", JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to record user behavior:", error);
  }
}

/**
 * 分析用戶偏好
 */
export function analyzeUserPreferences(behaviors: UserBehavior[]) {
  const preferences = {
    categories: {} as Record<string, number>,
    regions: {} as Record<string, number>,
    priceRange: { min: Infinity, max: 0, avg: 0 },
    favoriteWineries: {} as Record<string, number>,
  };

  behaviors.forEach((behavior) => {
    // 計算類別偏好（權重：purchase > add_to_cart > add_to_wishlist > view）
    const weight = behavior.action === 'purchase' ? 4 : 
                   behavior.action === 'add_to_cart' ? 3 :
                   behavior.action === 'add_to_wishlist' ? 2 : 1;
    
    if (behavior.category) {
      preferences.categories[behavior.category] = 
        (preferences.categories[behavior.category] || 0) + weight;
    }
    
    if (behavior.region) {
      preferences.regions[behavior.region] = 
        (preferences.regions[behavior.region] || 0) + weight;
    }
    
    if (behavior.price) {
      preferences.priceRange.min = Math.min(preferences.priceRange.min, behavior.price);
      preferences.priceRange.max = Math.max(preferences.priceRange.max, behavior.price);
    }
  });

  // 計算平均價格
  const prices = behaviors.filter(b => b.price).map(b => b.price!);
  if (prices.length > 0) {
    preferences.priceRange.avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  return preferences;
}

/**
 * 計算推薦分數
 */
export function calculateRecommendationScore(
  wine: any,
  userPreferences: ReturnType<typeof analyzeUserPreferences>,
  behaviors: UserBehavior[]
): RecommendationScore {
  let score = 0;
  const reasons: string[] = [];

  // 類別匹配（最高 30 分）
  if (wine.category && userPreferences.categories[wine.category]) {
    const categoryScore = Math.min(30, userPreferences.categories[wine.category] * 5);
    score += categoryScore;
    reasons.push(`您喜歡${wine.category}類型的酒款`);
  }

  // 產區匹配（最高 25 分）
  if (wine.region && userPreferences.regions[wine.region]) {
    const regionScore = Math.min(25, userPreferences.regions[wine.region] * 4);
    score += regionScore;
    reasons.push(`您常瀏覽${wine.region}產區的酒款`);
  }

  // 價格匹配（最高 20 分）
  if (wine.price && userPreferences.priceRange.avg > 0) {
    const priceDiff = Math.abs(wine.price - userPreferences.priceRange.avg);
    const priceRange = userPreferences.priceRange.max - userPreferences.priceRange.min;
    if (priceRange > 0) {
      const priceScore = Math.max(0, 20 * (1 - priceDiff / priceRange));
      score += priceScore;
      if (priceScore > 15) {
        reasons.push("價格符合您的偏好");
      }
    }
  }

  // 評分加成（最高 15 分）
  if (wine.rating) {
    const ratingScore = (wine.rating / 100) * 15;
    score += ratingScore;
    if (wine.rating >= 95) {
      reasons.push("高評分酒款");
    }
  }

  // 熱門度加成（最高 10 分）
  if (wine.featured || wine.bestseller) {
    score += 10;
    reasons.push("精選/熱銷酒款");
  }

  return {
    wineId: wine.id,
    score: Math.min(100, score),
    reason: reasons.slice(0, 2).join("、") || "為您推薦",
  };
}

/**
 * 生成推薦理由（AI 驅動）
 */
export function generateRecommendationReason(
  wine: any,
  userPreferences: ReturnType<typeof analyzeUserPreferences>
): string {
  const reasons: string[] = [];

  if (wine.category && userPreferences.categories[wine.category]) {
    reasons.push(`基於您對${wine.category}的偏好`);
  }

  if (wine.region && userPreferences.regions[wine.region]) {
    reasons.push(`您常瀏覽${wine.region}產區`);
  }

  if (wine.rating && wine.rating >= 95) {
    reasons.push("高評分精選");
  }

  if (wine.featured) {
    reasons.push("平台精選");
  }

  return reasons.length > 0 ? reasons.join("，") : "為您精心挑選";
}

