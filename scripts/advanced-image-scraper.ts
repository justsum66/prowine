/**
 * PROWINE 進階圖片爬蟲系統
 * 
 * 功能：
 * 1. 從多個來源爬取酒標照片、LOGO和酒莊照片
 * 2. 智能驗證圖片品質和相關性
 * 3. 自動更新 Supabase 數據庫
 * 4. 處理防爬蟲機制
 * 
 * 數據來源優先級：
 * 1. 官方網站（最高優先級）
 * 2. Wine-Searcher
 * 3. Vivino
 * 4. Google Images（備用）
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { URL } from "url";

// Type definitions for cheerio
type CheerioElement = cheerio.Element;

// 使用 Node.js 內建的 fetch（Node 18+）
const fetch = globalThis.fetch;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 配置
const CONFIG = {
  requestDelay: 2000, // 請求間隔（毫秒）
  maxRetries: 3, // 最大重試次數
  timeout: 30000, // 請求超時（毫秒）
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// 圖片驗證標準
interface ImageValidationResult {
  isValid: boolean;
  score: number; // 0-100，分數越高品質越好
  reasons: string[];
  width?: number;
  height?: number;
  format?: string;
}

interface ScrapedImage {
  url: string;
  source: string; // 'official', 'wine-searcher', 'vivino', 'google'
  type: 'label' | 'logo' | 'winery-photo';
  validation: ImageValidationResult;
}

interface WineData {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  wineryId: string;
  wineryNameZh: string;
  wineryNameEn: string;
  wineryWebsite?: string;
  currentImageUrl?: string;
}

interface WineryData {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  website?: string;
  currentLogoUrl?: string;
  currentImages?: string[];
}

/**
 * 延遲函數
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 帶重試的 HTTP 請求
 */
async function fetchWithRetry(
  url: string,
  options: any = {},
  retries: number = CONFIG.maxRetries
): Promise<Response> {
  const defaultOptions = {
    headers: {
      'User-Agent': CONFIG.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: CONFIG.timeout,
    ...options,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, defaultOptions);
      if (response.ok) {
        return response;
      }
      if (i < retries - 1) {
        await delay(CONFIG.requestDelay * (i + 1));
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await delay(CONFIG.requestDelay * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

/**
 * 驗證圖片URL是否有效
 */
async function validateImageUrl(url: string, type: 'label' | 'logo' | 'winery-photo'): Promise<ImageValidationResult> {
  const result: ImageValidationResult = {
    isValid: false,
    score: 0,
    reasons: [],
  };

  try {
    // 檢查URL格式
    new URL(url);
    result.score += 10;
    result.reasons.push('URL格式有效');

    // 檢查圖片是否可訪問
    const response = await fetchWithRetry(url, { method: 'HEAD' });
    if (response.ok) {
      result.score += 20;
      result.reasons.push('圖片可訪問');

      // 檢查Content-Type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        result.score += 10;
        result.format = contentType.split('/')[1];
        result.reasons.push(`圖片格式: ${result.format}`);

        // 檢查圖片尺寸（如果可能）
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const size = parseInt(contentLength);
          if (size > 10000) { // 至少10KB
            result.score += 10;
            result.reasons.push('圖片大小合理');
          }
        }
      }
    }

    // 根據類型檢查URL關鍵字
    const urlLower = url.toLowerCase();
    if (type === 'label') {
      if (urlLower.includes('label') || urlLower.includes('bottle') || urlLower.includes('wine')) {
        result.score += 20;
        result.reasons.push('URL包含相關關鍵字');
      }
    } else if (type === 'logo') {
      if (urlLower.includes('logo') || urlLower.includes('brand') || urlLower.includes('emblem')) {
        result.score += 20;
        result.reasons.push('URL包含相關關鍵字');
      }
    } else if (type === 'winery-photo') {
      if (urlLower.includes('winery') || urlLower.includes('vineyard') || urlLower.includes('chateau') || urlLower.includes('estate')) {
        result.score += 20;
        result.reasons.push('URL包含相關關鍵字');
      }
    }

    // 檢查是否來自可靠來源
    const reliableDomains = [
      'wine-searcher.com',
      'vivino.com',
      'decanter.com',
      'winespectator.com',
      'robertparker.com',
    ];
    if (reliableDomains.some(domain => urlLower.includes(domain))) {
      result.score += 10;
      result.reasons.push('來自可靠來源');
    }

    result.isValid = result.score >= 50;
  } catch (error) {
    result.reasons.push(`驗證失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * 從官方網站爬取酒標照片
 */
async function scrapeOfficialWineLabel(
  wineName: string,
  wineryWebsite: string
): Promise<ScrapedImage[]> {
  const images: ScrapedImage[] = [];

  try {
    console.log(`🔍 從官方網站搜索酒標: ${wineName} (${wineryWebsite})`);

    // 訪問酒莊網站
    const response = await fetchWithRetry(wineryWebsite);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 搜索酒款頁面連結
    const wineLinks: string[] = [];
    $('a').each((_index: number, el: cheerio.Element) => {
      const href = $(el).attr('href');
      const text = $(el).text().toLowerCase();
      if (href && (text.includes(wineName.toLowerCase()) || text.includes('wine') || text.includes('collection'))) {
        const fullUrl = new URL(href, wineryWebsite).toString();
        wineLinks.push(fullUrl);
      }
    });

    // 訪問每個酒款頁面
    for (const link of wineLinks.slice(0, 3)) { // 限制前3個
      try {
        await delay(CONFIG.requestDelay);
        const winePageResponse = await fetchWithRetry(link);
        const winePageHtml = await winePageResponse.text();
        const $winePage = cheerio.load(winePageHtml);

        // 查找圖片
        $winePage('img').each((_index: number, imgEl: cheerio.Element) => {
          const src = $winePage(imgEl).attr('src') || $winePage(imgEl).attr('data-src');
          if (src) {
            const fullImageUrl = new URL(src, link).toString();
            images.push({
              url: fullImageUrl,
              source: 'official',
              type: 'label',
              validation: { isValid: true, score: 80, reasons: ['來自官方網站'] },
            });
          }
        });
      } catch (error) {
        console.error(`❌ 無法訪問酒款頁面 ${link}:`, error);
      }
    }
  } catch (error) {
    console.error(`❌ 無法從官方網站爬取酒標:`, error);
  }

  return images;
}

/**
 * 從官方網站爬取LOGO
 */
async function scrapeOfficialLogo(wineryWebsite: string): Promise<ScrapedImage[]> {
  const images: ScrapedImage[] = [];

  try {
    console.log(`🔍 從官方網站搜索LOGO: ${wineryWebsite}`);

    const response = await fetchWithRetry(wineryWebsite);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 查找LOGO（通常在header、nav或footer）
    const logoSelectors = [
      'header img',
      'nav img',
      '.logo img',
      '#logo img',
      '[class*="logo"] img',
      '[id*="logo"] img',
      'footer img',
    ];

    for (const selector of logoSelectors) {
      $(selector).each((_index: number, imgEl: cheerio.Element) => {
        const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
        if (src) {
          const fullImageUrl = new URL(src, wineryWebsite).toString();
          images.push({
            url: fullImageUrl,
            source: 'official',
            type: 'logo',
            validation: { isValid: true, score: 90, reasons: ['來自官方網站LOGO區域'] },
          });
        }
      });
    }

    // 如果沒找到，搜索所有圖片並過濾
    if (images.length === 0) {
      $('img').each((_index: number, imgEl: cheerio.Element) => {
        const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
        const alt = $(imgEl).attr('alt')?.toLowerCase() || '';
        const className = $(imgEl).attr('class')?.toLowerCase() || '';

        if (src && (alt.includes('logo') || className.includes('logo'))) {
          const fullImageUrl = new URL(src, wineryWebsite).toString();
          images.push({
            url: fullImageUrl,
            source: 'official',
            type: 'logo',
            validation: { isValid: true, score: 85, reasons: ['圖片alt或class包含logo'] },
          });
        }
      });
    }
  } catch (error) {
    console.error(`❌ 無法從官方網站爬取LOGO:`, error);
  }

  return images;
}

/**
 * 從官方網站爬取酒莊照片
 */
async function scrapeOfficialWineryPhotos(wineryWebsite: string): Promise<ScrapedImage[]> {
  const images: ScrapedImage[] = [];

  try {
    console.log(`🔍 從官方網站搜索酒莊照片: ${wineryWebsite}`);

    // 訪問關於我們、酒莊故事等頁面
    const pagesToCheck = [
      '/about',
      '/story',
      '/history',
      '/vineyard',
      '/winery',
      '/estate',
    ];

    for (const page of pagesToCheck) {
      try {
        await delay(CONFIG.requestDelay);
        const pageUrl = new URL(page, wineryWebsite).toString();
        const response = await fetchWithRetry(pageUrl);
        const html = await response.text();
        const $ = cheerio.load(html);

        // 查找大尺寸圖片（通常是酒莊照片）
        $('img').each((_index: number, imgEl: cheerio.Element) => {
          const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
          const width = $(imgEl).attr('width');
          const height = $(imgEl).attr('height');

          if (src) {
            // 優先選擇大尺寸圖片
            if (width && parseInt(width) > 800) {
              const fullImageUrl = new URL(src, pageUrl).toString();
              images.push({
                url: fullImageUrl,
                source: 'official',
                type: 'winery-photo',
                validation: { isValid: true, score: 85, reasons: ['來自官方網站，大尺寸圖片'] },
              });
            }
          }
        });
      } catch (error) {
        // 頁面不存在，繼續下一個
        continue;
      }
    }
  } catch (error) {
    console.error(`❌ 無法從官方網站爬取酒莊照片:`, error);
  }

  return images;
}

/**
 * 從 Wine-Searcher 搜索圖片（使用Google Images作為備用）
 */
async function searchWineSearcher(
  query: string,
  type: 'label' | 'logo' | 'winery-photo'
): Promise<ScrapedImage[]> {
  const images: ScrapedImage[] = [];

  try {
    console.log(`🔍 從 Wine-Searcher 搜索: ${query}`);

    // 構建搜索URL
    const searchUrl = `https://www.wine-searcher.com/find/${encodeURIComponent(query)}`;
    
    try {
      const response = await fetchWithRetry(searchUrl);
      const html = await response.text();
      const $ = cheerio.load(html);

      // 查找圖片
      $('img').each((_index: number, imgEl: cheerio.Element) => {
        const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
        if (src && (src.includes('label') || src.includes('bottle'))) {
          const fullImageUrl = new URL(src, searchUrl).toString();
          images.push({
            url: fullImageUrl,
            source: 'wine-searcher',
            type,
            validation: { isValid: true, score: 70, reasons: ['來自Wine-Searcher'] },
          });
        }
      });
    } catch (error) {
      console.error(`❌ Wine-Searcher搜索失敗:`, error);
    }
  } catch (error) {
    console.error(`❌ 無法從 Wine-Searcher 搜索:`, error);
  }

  return images;
}

/**
 * 選擇最佳圖片
 */
function selectBestImage(images: ScrapedImage[]): ScrapedImage | null {
  if (images.length === 0) return null;

  // 按來源優先級和驗證分數排序
  const sourcePriority: Record<string, number> = {
    'official': 100,
    'wine-searcher': 80,
    'vivino': 75,
    'google': 50,
  };

  const sorted = images
    .filter(img => img.validation.isValid)
    .sort((a, b) => {
      const aPriority = sourcePriority[a.source] || 0;
      const bPriority = sourcePriority[b.source] || 0;
      const aScore = aPriority + a.validation.score;
      const bScore = bPriority + b.validation.score;
      return bScore - aScore;
    });

  return sorted[0] || null;
}

/**
 * 更新酒款圖片
 */
async function updateWineImage(wineId: string, imageUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wines')
      .update({ mainImageUrl: imageUrl })
      .eq('id', wineId);

    if (error) {
      console.error(`❌ 更新酒款圖片失敗 (${wineId}):`, error);
      return false;
    }

    console.log(`✅ 成功更新酒款圖片: ${wineId}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新酒款圖片異常:`, error);
    return false;
  }
}

/**
 * 更新酒莊LOGO
 */
async function updateWineryLogo(wineryId: string, logoUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wineries')
      .update({ logoUrl })
      .eq('id', wineryId);

    if (error) {
      console.error(`❌ 更新酒莊LOGO失敗 (${wineryId}):`, error);
      return false;
    }

    console.log(`✅ 成功更新酒莊LOGO: ${wineryId}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新酒莊LOGO異常:`, error);
    return false;
  }
}

/**
 * 更新酒莊照片
 */
async function updateWineryPhotos(wineryId: string, photos: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wineries')
      .update({ images: photos })
      .eq('id', wineryId);

    if (error) {
      console.error(`❌ 更新酒莊照片失敗 (${wineryId}):`, error);
      return false;
    }

    console.log(`✅ 成功更新酒莊照片: ${wineryId}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新酒莊照片異常:`, error);
    return false;
  }
}

/**
 * 處理單個酒款
 */
async function processWine(wine: WineData): Promise<void> {
  console.log(`\n🍷 處理酒款: ${wine.nameZh} (${wine.nameEn})`);

  const allImages: ScrapedImage[] = [];

  // 1. 從官方網站爬取
  if (wine.wineryWebsite) {
    const officialImages = await scrapeOfficialWineLabel(
      wine.nameEn,
      wine.wineryWebsite
    );
    allImages.push(...officialImages);
    await delay(CONFIG.requestDelay);
  }

  // 2. 從 Wine-Searcher 搜索
  const wineSearcherImages = await searchWineSearcher(
    `${wine.wineryNameEn} ${wine.nameEn}`,
    'label'
  );
  allImages.push(...wineSearcherImages);
  await delay(CONFIG.requestDelay);

  // 3. 驗證所有圖片
  console.log(`  驗證 ${allImages.length} 張圖片...`);
  for (const image of allImages) {
    image.validation = await validateImageUrl(image.url, image.type);
  }

  // 4. 選擇最佳圖片
  const bestImage = selectBestImage(allImages);
  if (bestImage) {
    console.log(`  ✅ 找到最佳圖片: ${bestImage.url} (分數: ${bestImage.validation.score})`);
    await updateWineImage(wine.id, bestImage.url);
  } else {
    console.log(`  ⚠️  未找到合適的圖片`);
  }
}

/**
 * 處理單個酒莊
 */
async function processWinery(winery: WineryData): Promise<void> {
  console.log(`\n🏰 處理酒莊: ${winery.nameZh} (${winery.nameEn})`);

  if (!winery.website) {
    console.log(`  ⚠️  沒有官方網站，跳過`);
    return;
  }

  // 1. 爬取LOGO
  console.log(`  搜索LOGO...`);
  const logoImages = await scrapeOfficialLogo(winery.website);
  await delay(CONFIG.requestDelay);

  // 驗證LOGO
  for (const image of logoImages) {
    image.validation = await validateImageUrl(image.url, 'logo');
  }

  const bestLogo = selectBestImage(logoImages);
  if (bestLogo) {
    console.log(`  ✅ 找到最佳LOGO: ${bestLogo.url} (分數: ${bestLogo.validation.score})`);
    await updateWineryLogo(winery.id, bestLogo.url);
  } else {
    console.log(`  ⚠️  未找到合適的LOGO`);
  }

  // 2. 爬取酒莊照片
  console.log(`  搜索酒莊照片...`);
  const wineryPhotos = await scrapeOfficialWineryPhotos(winery.website);
  await delay(CONFIG.requestDelay);

  // 驗證照片
  for (const image of wineryPhotos) {
    image.validation = await validateImageUrl(image.url, 'winery-photo');
  }

  const validPhotos = wineryPhotos
    .filter(img => img.validation.isValid)
    .slice(0, 6) // 最多6張
    .map(img => img.url);

  if (validPhotos.length > 0) {
    console.log(`  ✅ 找到 ${validPhotos.length} 張酒莊照片`);
    await updateWineryPhotos(winery.id, validPhotos);
  } else {
    console.log(`  ⚠️  未找到合適的酒莊照片`);
  }
}

/**
 * 主函數
 */
async function main() {
  console.log("🚀 PROWINE 進階圖片爬蟲系統啟動\n");

  try {
    // 1. 獲取所有酒款
    console.log("📥 從數據庫獲取酒款...");
    const { data: wines, error: winesError } = await supabase
      .from('wines')
      .select(`
        id,
        nameZh,
        nameEn,
        slug,
        mainImageUrl,
        wineryId,
        wineries!inner (
          id,
          nameZh,
          nameEn,
          website
        )
      `)
      .limit(100);

    if (winesError) {
      throw new Error(`獲取酒款失敗: ${winesError.message}`);
    }

    console.log(`✅ 找到 ${wines?.length || 0} 個酒款\n`);

    // 處理每個酒款
    for (const wine of wines || []) {
      const wineData: WineData = {
        id: wine.id,
        nameZh: wine.nameZh,
        nameEn: wine.nameEn,
        slug: wine.slug,
        wineryId: wine.wineryId,
        wineryNameZh: (wine.wineries as any).nameZh,
        wineryNameEn: (wine.wineries as any).nameEn,
        wineryWebsite: (wine.wineries as any).website,
        currentImageUrl: wine.mainImageUrl,
      };

      await processWine(wineData);
      await delay(CONFIG.requestDelay * 2); // 處理間隔
    }

    // 2. 獲取所有酒莊
    console.log("\n📥 從數據庫獲取酒莊...");
    const { data: wineries, error: wineriesError } = await supabase
      .from('wineries')
      .select('id, nameZh, nameEn, slug, website, logoUrl, images')
      .limit(100);

    if (wineriesError) {
      throw new Error(`獲取酒莊失敗: ${wineriesError.message}`);
    }

    console.log(`✅ 找到 ${wineries?.length || 0} 個酒莊\n`);

    // 處理每個酒莊
    for (const winery of wineries || []) {
      const wineryData: WineryData = {
        id: winery.id,
        nameZh: winery.nameZh,
        nameEn: winery.nameEn,
        slug: winery.slug,
        website: winery.website,
        currentLogoUrl: winery.logoUrl,
        currentImages: winery.images as string[],
      };

      await processWinery(wineryData);
      await delay(CONFIG.requestDelay * 2); // 處理間隔
    }

    console.log("\n✅ 爬蟲完成！");
  } catch (error) {
    console.error("\n❌ 爬蟲過程發生錯誤:", error);
    process.exit(1);
  }
}

// 執行（ES module 兼容）
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  scrapeOfficialWineLabel,
  scrapeOfficialLogo,
  scrapeOfficialWineryPhotos,
  validateImageUrl,
  selectBestImage,
  processWine,
  processWinery,
};

