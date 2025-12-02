/**
 * 爬取缺失LOGO的12個酒莊
 * 針對無LOGO的酒莊進行深度爬取
 */

import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

// 載入環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 錯誤: 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface LogoCandidate {
  url: string;
  source: string;
  score: number;
  width?: number;
  height?: number;
}

/**
 * 延遲函數
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 帶重試的fetch
 */
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(2000 * (i + 1));
    }
  }
  throw new Error(`Failed to fetch after ${retries} retries`);
}

/**
 * 驗證圖片URL
 */
async function validateImageUrl(url: string): Promise<{ isValid: boolean; width?: number; height?: number }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return { isValid: false };
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) return { isValid: false };
    
    // 嘗試獲取圖片尺寸
    try {
      const imgResponse = await fetch(url);
      const blob = await imgResponse.blob();
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      
      return new Promise((resolve) => {
        img.onload = () => {
          resolve({ isValid: true, width: img.width, height: img.height });
          URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
          resolve({ isValid: false });
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      });
    } catch {
      return { isValid: true }; // 無法獲取尺寸，但URL有效
    }
  } catch {
    return { isValid: false };
  }
}

/**
 * 從官方網站爬取LOGO
 */
async function scrapeFromOfficialWebsite(wineryWebsite: string, wineryName: string): Promise<LogoCandidate[]> {
  const logos: LogoCandidate[] = [];

  try {
    console.log(`  🌐 爬取官方網站: ${wineryWebsite}`);
    const response = await fetchWithRetry(wineryWebsite);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 優先查找常見的LOGO選擇器
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]',
      'img[src*="logo" i]',
      '.logo img',
      '#logo img',
      'header img',
      'nav img',
    ];

    for (const selector of logoSelectors) {
      $(selector).each((_index, imgEl) => {
        const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-lazy-src');
        if (src) {
          try {
            const fullImageUrl = new URL(src, wineryWebsite).toString();
            if (!fullImageUrl.toLowerCase().includes('banner') && 
                !fullImageUrl.toLowerCase().includes('hero') &&
                !fullImageUrl.toLowerCase().includes('background')) {
              logos.push({
                url: fullImageUrl,
                source: 'official',
                score: 100,
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
 * 從Google Images搜索LOGO
 */
async function searchGoogleImages(wineryName: string): Promise<LogoCandidate[]> {
  const logos: LogoCandidate[] = [];

  try {
    console.log(`  🔍 從 Google Images 搜索: ${wineryName} logo`);
    const searchQuery = encodeURIComponent(`${wineryName} winery logo`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch&tbs=isz:m`;

    const response = await fetchWithRetry(searchUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    $('img').each((_index, imgEl) => {
      const src = $(imgEl).attr('src') || $(imgEl).attr('data-src');
      if (src && src.startsWith('http') && !src.includes('googleusercontent.com/logo')) {
        logos.push({
          url: src,
          source: 'google',
          score: 60,
        });
      }
    });

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
        score: logo.score + (validation.width && validation.width > 200 ? 10 : 0),
      });
    }
    await delay(500);
  }

  return validatedLogos;
}

/**
 * 選擇最佳LOGO
 */
function selectBestLogo(logos: LogoCandidate[]): LogoCandidate | null {
  if (logos.length === 0) return null;
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
async function processWinery(winery: any): Promise<void> {
  console.log(`\n🏰 處理: ${winery.nameZh} (${winery.nameEn})`);

  if (winery.logoUrl) {
    console.log(`  ✅ 已有LOGO，跳過`);
    return;
  }

  const allLogos: LogoCandidate[] = [];

  // 1. 從官方網站爬取
  if (winery.website) {
    const officialLogos = await scrapeFromOfficialWebsite(winery.website, winery.nameEn);
    allLogos.push(...officialLogos);
    await delay(3000);
  }

  // 2. 從Google Images搜索
  const googleLogos = await searchGoogleImages(winery.nameEn);
  allLogos.push(...googleLogos);
  await delay(3000);

  // 3. 驗證並評分
  if (allLogos.length > 0) {
    console.log(`  🔍 驗證 ${allLogos.length} 個LOGO候選...`);
    const validatedLogos = await validateAndScoreLogos(allLogos);
    
    // 4. 選擇最佳LOGO
    const bestLogo = selectBestLogo(validatedLogos);
    
    if (bestLogo) {
      console.log(`  🎯 選擇最佳LOGO: ${bestLogo.url} (分數: ${bestLogo.score})`);
      await updateWineryLogo(winery.id, bestLogo.url);
    } else {
      console.log(`  ⚠️  未找到有效LOGO`);
    }
  } else {
    console.log(`  ⚠️  未找到LOGO候選`);
  }
}

/**
 * 主函數
 */
async function main() {
  console.log("🔍 開始爬取缺失LOGO的12個酒莊...\n");

  try {
    // 獲取所有無LOGO的酒莊
    const { data: wineries, error } = await supabase
      .from('wineries')
      .select('id, nameZh, nameEn, website, logoUrl')
      .is('logoUrl', null)
      .order('nameZh');

    if (error) {
      throw new Error(`獲取酒莊失敗: ${error.message}`);
    }

    console.log(`✅ 找到 ${wineries?.length || 0} 個無LOGO的酒莊\n`);

    if (!wineries || wineries.length === 0) {
      console.log("✅ 所有酒莊都有LOGO了！");
      return;
    }

    // 處理每個酒莊
    for (let i = 0; i < wineries.length; i++) {
      const winery = wineries[i];
      console.log(`\n[${i + 1}/${wineries.length}]`);
      await processWinery(winery);
      await delay(5000); // 5秒間隔，避免被限流
    }

    console.log("\n✅ 所有酒莊處理完成！");
  } catch (error: any) {
    console.error("\n❌ 處理過程發生錯誤:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});

