/**
 * 圖像優化工具（使用 Vertex 和 Comet API）
 * 優化所有頁面的圖片（排除 WineryCard 和 WineCard）
 */

// 緩存優化後的圖片 URL
const optimizationCache = new Map<string, string>();

/**
 * 優化圖片 URL（使用 Vertex 和 Comet 的組合策略）
 * @param imageUrl 原始圖片 URL
 * @param strategy 優化策略：'vertex' | 'comet' | 'both' (默認: 'comet')
 * @returns 優化後的圖片 URL
 */
export async function optimizeImageUrl(
  imageUrl: string,
  strategy: "vertex" | "comet" | "both" = "comet"
): Promise<string> {
  if (!imageUrl || typeof imageUrl !== "string") {
    return imageUrl;
  }

  // 如果是 data URL 或已經優化過的 URL，直接返回
  if (imageUrl.startsWith("data:") || imageUrl.includes("optimized")) {
    return imageUrl;
  }

  // 檢查緩存
  const cacheKey = `${strategy}_${imageUrl}`;
  if (optimizationCache.has(cacheKey)) {
    return optimizationCache.get(cacheKey)!;
  }

  try {
    // 調用 API 路由進行優化
    const response = await fetch("/api/images/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        strategy,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const optimizedUrl = data.optimizedUrl || imageUrl;
      
      // 緩存結果
      optimizationCache.set(cacheKey, optimizedUrl);
      return optimizedUrl;
    } else {
      console.warn("圖片優化 API 失敗:", response.statusText);
      return imageUrl; // 返回原始 URL
    }
  } catch (error) {
    console.error("圖片優化錯誤:", error);
    return imageUrl; // 返回原始 URL
  }
}

/**
 * 批量優化圖片 URL
 * @param imageUrls 圖片 URL 數組
 * @param strategy 優化策略
 * @returns 優化後的圖片 URL 數組
 */
export async function optimizeImageUrls(
  imageUrls: string[],
  strategy: "vertex" | "comet" | "both" = "comet"
): Promise<string[]> {
  const promises = imageUrls.map((url) => optimizeImageUrl(url, strategy));
  return Promise.all(promises);
}

/**
 * 預加載並優化圖片（用於關鍵圖片）
 * @param imageUrl 圖片 URL
 * @param strategy 優化策略
 */
export async function preloadAndOptimizeImage(
  imageUrl: string,
  strategy: "vertex" | "comet" | "both" = "comet"
): Promise<string> {
  const optimizedUrl = await optimizeImageUrl(imageUrl, strategy);
  
  // 預加載圖片
  if (typeof window !== "undefined") {
    const img = new Image();
    img.src = optimizedUrl;
  }
  
  return optimizedUrl;
}

