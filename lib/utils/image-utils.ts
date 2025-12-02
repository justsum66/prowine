/**
 * 圖片工具函數
 * 用於驗證圖片URL、獲取fallback圖片、處理圖片錯誤
 */

// 預設的fallback圖片（使用Unsplash的葡萄酒相關圖片）
const FALLBACK_WINE_IMAGES = [
  "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80",
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
  "https://images.unsplash.com/photo-1506377247727-4b5c465f6e3a?w=800&q=80",
  "https://images.unsplash.com/photo-1506377247727-4b5c465f6e3a?w=800&q=80",
  "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80",
];

const FALLBACK_WINERY_LOGOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
];

/**
 * 驗證圖片URL是否有效
 * 檢查URL格式和域名
 */
// 緩存驗證結果，避免重複計算
const urlValidationCache = new Map<string, boolean>();

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 檢查緩存
  if (urlValidationCache.has(url)) {
    return urlValidationCache.get(url)!;
  }

  // 允許 data URL（base64 圖片）
  if (url.startsWith('data:image/')) {
    urlValidationCache.set(url, true);
    return true;
  }

  // 如果是本地路徑（以 / 開頭），也允許
  if (url.startsWith('/')) {
    urlValidationCache.set(url, true);
    return true;
  }

  // 檢查是否為有效的URL格式
  try {
    const urlObj = new URL(url);
    
    // 允許的協議
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      urlValidationCache.set(url, false);
      return false;
    }

    // 檢查是否為 Cloudinary URL（支持多種格式）
    if (urlObj.hostname.includes('cloudinary.com') || urlObj.hostname.includes('res.cloudinary.com')) {
      urlValidationCache.set(url, true);
      return true;
    }
    
    // 檢查是否為 PROWINE 官方圖片（強制使用 HTTPS）
    if (urlObj.hostname.includes('prowine.com.tw') && urlObj.pathname.includes('/wp-content/uploads/')) {
      // 如果是 HTTP，轉換為 HTTPS
      if (urlObj.protocol === 'http:') {
        const httpsUrl = url.replace('http://', 'https://');
        urlValidationCache.set(url, true);
        urlValidationCache.set(httpsUrl, true);
        return true;
      }
      urlValidationCache.set(url, true);
      return true;
    }
    
    // 更寬鬆的策略：只要URL看起來像圖片URL就允許
    // 這樣可以支持所有外部LOGO，不需要維護白名單
    const looksLikeImageUrl = url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$|#)/i) !== null;
    
    // 如果URL包含圖片擴展名，直接允許
    if (looksLikeImageUrl) {
      urlValidationCache.set(url, true);
      return true;
    }

    // 檢查是否為已知的圖片域名（保留作為備用檢查）
    const allowedDomains = [
      'images.unsplash.com',
      'unsplash.com',
      'localhost',
      'supabase.co',
      'supabase.in',
      's3.amazonaws.com',
      'amazonaws.com',
      'cloudinary.com', // Cloudinary 圖片服務
      'res.cloudinary.com', // Cloudinary CDN
      'images.squarespace-cdn.com',
      'prowine.com.tw', // PROWINE 官方網站
      'www.brcohn.com',
      'www.camomiwinery.com',
      'cartlidgeandbrowne.com',
      'www.chateau-trinquevedel.fr',
      'www.cosentinowinery.com',
      'cgdiarie.com',
      'www.champagne-dissaux-brochot.com',
      'www.domaine-la-bastidonne.com',
      'www.domaine-escaravailles.com',
      'www.monardiere.com',
      'grgich.com',
      'kanpai.wine',
      'bastide-st-dominique.com',
      'peterfranus.com',
      'cdn.shopify.com',
      'silverghost.wpengine.com',
      'somerstonwineco.com',
      'cdn.prod.website-files.com',
      'www.swansonvineyards.com',
    ];

    // 檢查是否為已知的圖片域名
    let isAllowedDomain = allowedDomains.some(domain => {
      return urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`);
    });

    // 如果域名在白名單中，允許
    if (isAllowedDomain) {
      urlValidationCache.set(url, true);
      return true;
    }

    // 最後的寬鬆策略：對於任何 http/https URL，如果沒有明顯的錯誤標誌，就允許
    // 這樣可以支持所有外部LOGO
    urlValidationCache.set(url, true);
    return true;
  } catch {
    // 如果不是有效的URL格式，返回false
    urlValidationCache.set(url, false);
    return false;
  }
}

/**
 * 獲取酒款fallback圖片
 * 根據索引返回不同的fallback圖片，確保多個酒款不會顯示相同圖片
 */
export function getFallbackWineImage(index: number = 0): string {
  return FALLBACK_WINE_IMAGES[index % FALLBACK_WINE_IMAGES.length];
}

/**
 * 獲取酒莊fallback LOGO
 */
export function getFallbackWineryLogo(index: number = 0): string {
  return FALLBACK_WINERY_LOGOS[index % FALLBACK_WINERY_LOGOS.length];
}

/**
 * 處理圖片URL，返回有效的URL或fallback
 * @param url 原始圖片URL
 * @param type 圖片類型（'wine' 或 'winery'）
 * @param index 索引（用於選擇不同的fallback圖片）
 * @returns 有效的圖片URL
 */
export function getValidImageUrl(
  url: string | null | undefined,
  type: 'wine' | 'winery' = 'wine',
  index: number = 0
): string {
  // 如果URL有效，直接返回
  if (isValidImageUrl(url)) {
    return url!;
  }

  // 如果URL無效，返回fallback
  if (type === 'wine') {
    return getFallbackWineImage(index);
  } else {
    return getFallbackWineryLogo(index);
  }
}

/**
 * 從圖片數組中獲取第一個有效圖片
 * @param images 圖片數組
 * @param type 圖片類型
 * @param index 索引
 * @returns 有效的圖片URL或null
 */
export function getFirstValidImage(
  images: string[] | null | undefined,
  type: 'wine' | 'winery' = 'wine',
  index: number = 0
): string | null {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  // 嘗試找到第一個有效的圖片
  for (const img of images) {
    if (isValidImageUrl(img)) {
      return img;
    }
  }

  // 如果沒有有效圖片，返回null（讓調用者使用fallback）
  return null;
}

/**
 * 處理圖片URL優先級：
 * 1. mainImageUrl/logoUrl（優先使用，即使是PROWINE或Cloudinary URL）
 * 2. images數組中的第一個有效圖片
 * 3. fallback圖片（僅在完全沒有圖片時使用）
 */
export function processImageUrl(
  primaryUrl: string | null | undefined,
  images: string[] | null | undefined,
  type: 'wine' | 'winery' = 'wine',
  index: number = 0
): string {
  // 優先使用primaryUrl（即使包含prowine.com.tw或cloudinary.com也優先使用）
  if (primaryUrl && typeof primaryUrl === 'string' && primaryUrl.trim().length > 0) {
    // 強制將 HTTP 轉換為 HTTPS（安全性）
    let processedUrl = primaryUrl;
    if (processedUrl.startsWith('http://') && !processedUrl.startsWith('http://localhost')) {
      processedUrl = processedUrl.replace('http://', 'https://');
    }
    
    // 如果是PROWINE或Cloudinary URL，直接返回（已轉換為HTTPS）
    if (processedUrl.includes('prowine.com.tw') || processedUrl.includes('cloudinary.com') || processedUrl.includes('res.cloudinary.com')) {
      return processedUrl;
    }
    // 其他URL也檢查有效性
    if (isValidImageUrl(processedUrl)) {
      return processedUrl;
    }
  }

  // 嘗試從images數組中獲取（處理JSON格式的images）
  let imagesArray: string[] = [];
  if (Array.isArray(images)) {
    imagesArray = images;
  } else if (images && typeof images === 'object') {
    // 如果是JSON對象，嘗試提取圖片URL數組
    const imgObj = images as any;
    if (Array.isArray(imgObj.urls)) {
      imagesArray = imgObj.urls;
    } else if (typeof imgObj === 'object') {
      // 嘗試找到包含URL的字段
      Object.values(imgObj).forEach((val: any) => {
        if (typeof val === 'string' && isValidImageUrl(val)) {
          imagesArray.push(val);
        }
      });
    }
  }
  
  const firstValid = getFirstValidImage(imagesArray, type, index);
  if (firstValid) {
    return firstValid;
  }

  // 最後使用fallback（僅在完全沒有圖片時）
  return type === 'wine' 
    ? getFallbackWineImage(index)
    : getFallbackWineryLogo(index);
}

