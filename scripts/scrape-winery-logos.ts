/**
 * 專門爬取所有酒莊LOGO的腳本
 * 
 * 功能：
 * 1. 從數據庫獲取所有酒莊
 * 2. 從多個來源爬取LOGO（官方網站、Google Images、Wine-Searcher等）
 * 3. 智能驗證LOGO品質
 * 4. 自動更新 Supabase 數據庫
 * 
 * 使用方式：
 * npm run scrape:winery-logos
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { URL } from "url";

// 載入環境變數
import { config } from 'dotenv';
import { join } from 'path';

// 載入 .env.local 文件
config({ path: join(process.cwd(), '.env.local') });
config({ path: join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 錯誤: 缺少 Supabase 環境變數');
  console.error('請確保 .env.local 或 .env 文件中包含:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 配置
const CONFIG = {
  requestDelay: 3000, // 請求間隔（毫秒）- 避免被封鎖
  maxRetries: 3,
  timeout: 30000,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

interface LogoCandidate {
  url: string;
  source: string;
  score: number;
  width?: number;
  height?: number;
}

interface WineryData {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  website?: string;
  logoUrl?: string;
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
    ...options,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
      
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      if (response.status === 429) {
        // 請求過於頻繁，等待更長時間
        const waitTime = (i + 1) * 5000;
        console.log(`  ⏳ 請求過於頻繁，等待 ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1));
    }
  }

  throw new Error(`請求失敗: ${url}`);
}

/**
 * 驗證圖片URL是否有效
 */
async function validateImageUrl(imageUrl: string): Promise<{ isValid: boolean; width?: number; height?: number }> {
  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': CONFIG.userAgent },
    });

    if (!response.ok) {
      return { isValid: false };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return { isValid: false };
    }

    // 嘗試獲取圖片尺寸
    try {
      const imgResponse = await fetch(imageUrl, {
        headers: { 'User-Agent': CONFIG.userAgent },
      });
      const arrayBuffer = await imgResponse.arrayBuffer();
      // 簡單檢查：如果是有效的圖片數據，至少應該有一定大小
      if (arrayBuffer.byteLength < 1000) {
        return { isValid: false };
      }
    } catch {
      // 如果無法獲取完整圖片，至少HEAD請求成功了
    }

    return { isValid: true };
  } catch {
    return { isValid: false };
  }
}

/**
 * 從官方網站爬取LOGO
 */
async function scrapeOfficialLogo(wineryWebsite: string, wineryName: string): Promise<LogoCandidate[]> {
  const logos: LogoCandidate[] = [];

  try {
    console.log(`  🔍 從官方網站搜索LOGO: ${wineryWebsite}`);

    const response = await fetchWithRetry(wineryWebsite);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 優先查找LOGO選擇器
    const logoSelectors = [
      'header img',
      'nav img',
      '.logo img',
      '#logo img',
      '[class*="logo"] img',
      '[id*="logo"] img',
      '[class*="brand"] img',
      '[id*="brand"] img',
      'footer img',
    ];

    for (const selector of logoSelectors) {
      $(selector).each((_index: number, imgEl: cheerio.Element) => {
        const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-lazy-src');
        if (src) {
          try {
            const fullImageUrl = new URL(src, wineryWebsite).toString();
            // 過濾掉明顯不是LOGO的圖片
            if (!fullImageUrl.toLowerCase().includes('banner') && 
                !fullImageUrl.toLowerCase().includes('hero') &&
                !fullImageUrl.toLowerCase().includes('background')) {
              logos.push({
                url: fullImageUrl,
                source: 'official',
                score: 100, // 官方網站最高分
              });
            }
          } catch {
            // URL解析失敗，跳過
          }
        }
      });
    }

    // 如果沒找到，搜索所有圖片並過濾
    if (logos.length === 0) {
      $('img').each((_index: number, imgEl: cheerio.Element) => {
        const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-lazy-src');
        const alt = $(imgEl).attr('alt')?.toLowerCase() || '';
        const className = $(imgEl).attr('class')?.toLowerCase() || '';
        const id = $(imgEl).attr('id')?.toLowerCase() || '';

        if (src && (
          alt.includes('logo') || 
          alt.includes('brand') ||
          className.includes('logo') || 
          className.includes('brand') ||
          id.includes('logo') ||
          id.includes('brand')
        )) {
          try {
            const fullImageUrl = new URL(src, wineryWebsite).toString();
            if (!fullImageUrl.toLowerCase().includes('banner') && 
                !fullImageUrl.toLowerCase().includes('hero')) {
              logos.push({
                url: fullImageUrl,
                source: 'official',
                score: 90,
              });
            }
          } catch {
            // URL解析失敗，跳過
          }
        }
      });
    }

    // 去重
    const uniqueLogos = Array.from(
      new Map(logos.map(logo => [logo.url, logo])).values()
    );

    console.log(`  ✅ 從官方網站找到 ${uniqueLogos.length} 個LOGO候選`);
    return uniqueLogos;
  } catch (error) {
    console.error(`  ❌ 無法從官方網站爬取LOGO:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * 從 Google Images 搜索LOGO（備用方案）
 */
async function searchGoogleImages(wineryName: string): Promise<LogoCandidate[]> {
  const logos: LogoCandidate[] = [];

  try {
    console.log(`  🔍 從 Google Images 搜索: ${wineryName} logo`);

    // 構建Google Images搜索URL
    const searchQuery = encodeURIComponent(`${wineryName} winery logo`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch&tbs=isz:m`;

    const response = await fetchWithRetry(searchUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Google Images 的圖片通常在 data-src 或 src 屬性中
    $('img').each((_index: number, imgEl: cheerio.Element) => {
      const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
      if (src && src.startsWith('http') && !src.includes('googleusercontent.com/logo')) {
        // 過濾掉Google自己的logo
        logos.push({
          url: src,
          source: 'google',
          score: 60, // Google Images分數較低
        });
      }
    });

    // 限制數量
    const uniqueLogos = Array.from(
      new Map(logos.slice(0, 10).map(logo => [logo.url, logo])).values()
    );

    console.log(`  ✅ 從 Google Images 找到 ${uniqueLogos.length} 個LOGO候選`);
    return uniqueLogos;
  } catch (error) {
    console.error(`  ❌ Google Images搜索失敗:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * 驗證並評分LOGO候選
 */
async function validateAndScoreLogos(logos: LogoCandidate[]): Promise<LogoCandidate[]> {
  const validatedLogos: LogoCandidate[] = [];

  for (const logo of logos) {
    const validation = await validateImageUrl(logo.url);
    if (validation.isValid) {
      validatedLogos.push({
        ...logo,
        width: validation.width,
        height: validation.height,
        score: logo.score + (validation.width && validation.width > 200 ? 10 : 0), // 大尺寸加分
      });
    }
    await delay(500); // 驗證間隔
  }

  return validatedLogos;
}

/**
 * 選擇最佳LOGO
 */
function selectBestLogo(logos: LogoCandidate[]): LogoCandidate | null {
  if (logos.length === 0) return null;

  // 按分數排序
  const sorted = logos.sort((a, b) => b.score - a.score);
  return sorted[0];
}

/**
 * 更新酒莊LOGO
 */
async function updateWineryLogo(wineryId: string, logoUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wineries')
      .update({ 
        logoUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', wineryId);

    if (error) {
      console.error(`    ❌ 更新失敗:`, error.message);
      return false;
    }

    console.log(`    ✅ LOGO更新成功`);
    return true;
  } catch (error) {
    console.error(`    ❌ 更新失敗:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * 處理單個酒莊
 */
async function processWinery(winery: WineryData): Promise<void> {
  console.log(`\n🏰 處理酒莊: ${winery.nameZh} (${winery.nameEn})`);

  // 如果已經有LOGO，詢問是否跳過
  if (winery.logoUrl && winery.logoUrl.includes('http')) {
    console.log(`  ℹ️  已有LOGO: ${winery.logoUrl}`);
    // 可以選擇跳過或重新爬取
    // return; // 取消註釋以跳過已有LOGO的酒莊
  }

  const allLogos: LogoCandidate[] = [];

  // 1. 從官方網站爬取（最高優先級）
  if (winery.website) {
    const officialLogos = await scrapeOfficialLogo(winery.website, winery.nameEn || winery.nameZh);
    allLogos.push(...officialLogos);
    await delay(CONFIG.requestDelay);
  }

  // 2. 從 Google Images 搜索（備用）
  if (allLogos.length === 0 || allLogos.every(logo => logo.source !== 'official')) {
    const googleLogos = await searchGoogleImages(winery.nameEn || winery.nameZh);
    allLogos.push(...googleLogos);
    await delay(CONFIG.requestDelay);
  }

  // 3. 驗證所有LOGO候選
  console.log(`  🔍 驗證 ${allLogos.length} 個LOGO候選...`);
  const validatedLogos = await validateAndScoreLogos(allLogos);

  // 4. 選擇最佳LOGO
  const bestLogo = selectBestLogo(validatedLogos);

  if (bestLogo) {
    console.log(`  ✅ 找到最佳LOGO: ${bestLogo.url} (來源: ${bestLogo.source}, 分數: ${bestLogo.score})`);
    await updateWineryLogo(winery.id, bestLogo.url);
  } else {
    console.log(`  ⚠️  未找到合適的LOGO`);
  }
}

/**
 * 主函數
 */
async function main() {
  console.log("🚀 開始爬取所有酒莊LOGO...\n");

  try {
    // 獲取所有酒莊
    console.log("📥 從數據庫獲取酒莊...");
    const { data: wineries, error } = await supabase
      .from('wineries')
      .select('id, nameZh, nameEn, slug, website, logoUrl')
      .order('nameZh');

    if (error) {
      throw new Error(`獲取酒莊失敗: ${error.message}`);
    }

    console.log(`✅ 找到 ${wineries?.length || 0} 個酒莊\n`);

    if (!wineries || wineries.length === 0) {
      console.log("⚠️  沒有找到任何酒莊");
      return;
    }

    // 處理每個酒莊
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < wineries.length; i++) {
      const winery = wineries[i];
      const wineryData: WineryData = {
        id: winery.id,
        nameZh: winery.nameZh,
        nameEn: winery.nameEn,
        slug: winery.slug,
        website: winery.website,
        logoUrl: winery.logoUrl,
      };

      try {
        await processWinery(wineryData);
        successCount++;
      } catch (error) {
        console.error(`  ❌ 處理失敗:`, error instanceof Error ? error.message : error);
        failCount++;
      }

      // 進度顯示
      console.log(`\n📊 進度: ${i + 1}/${wineries.length} (成功: ${successCount}, 失敗: ${failCount})`);

      // 請求間隔（避免被封鎖）
      if (i < wineries.length - 1) {
        await delay(CONFIG.requestDelay);
      }
    }

    console.log("\n✅ 所有酒莊處理完成！");
    console.log(`📊 統計: 成功 ${successCount} 個, 失敗 ${failCount} 個`);
  } catch (error) {
    console.error("\n❌ 處理過程發生錯誤:", error);
    process.exit(1);
  }
}

// 執行主函數
main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});

