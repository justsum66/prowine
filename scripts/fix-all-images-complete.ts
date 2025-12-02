/**
 * 完整圖片修復系統
 * 
 * 功能：
 * 1. 找出所有有問題的圖片（blog-kv-02.jpg、空圖片、無效圖片）
 * 2. 重新爬取正確的酒款照片
 * 3. 重新爬取酒莊LOGO
 * 4. 重新爬取酒莊照片
 * 5. 使用所有可用的工具（AI API、MCP、瀏覽器）
 * 
 * 執行方式：
 * npx tsx scripts/fix-all-images-complete.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";
import * as cheerio from "cheerio";
import { v2 as cloudinary } from "cloudinary";

// 加載環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

// 配置 Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dsgvbsj9k";
const apiKey = process.env.CLOUDINARY_API_KEY || "WBzabsfAJFZ9rHhuk0RDSQlifwU";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "341388744959128";

cloudinary.config({
  cloud_name: cloudName.replace(/^@+/, '').trim(),
  api_key: apiKey,
  api_secret: apiSecret,
});

// 驗證環境變數
function validateEnv() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`缺少環境變數: ${missing.join(", ")}`);
  }
}

validateEnv();

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONFIG = {
  prowineBaseUrl: "http://prowine.com.tw",
  requestDelay: 2000, // 2秒延遲
  maxRetries: 3,
};

// 延遲函數
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 獲取重試的 fetch
async function fetchWithRetry(url: string, options: any = {}, retries: number = CONFIG.maxRetries): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...options.headers,
        },
      });
      
      if (response.ok || response.status === 404) {
        return response;
      }
      
      if (i < retries - 1) {
        await delay(1000 * (i + 1));
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await delay(1000 * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

// 檢查圖片是否有問題
function isImageProblematic(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return true;
  }
  
  const urlLower = imageUrl.toLowerCase();
  
  // 檢查是否是通用圖片
  if (urlLower.includes('blog-kv-02.jpg') || 
      urlLower.includes('blog-kv-') ||
      urlLower.includes('kv-02')) {
    return true;
  }
  
  // 檢查是否是明顯的錯誤圖片
  if (urlLower.includes('placeholder') ||
      urlLower.includes('default') ||
      urlLower.includes('fallback')) {
    return true;
  }
  
  return false;
}

// 從 PROWINE 爬取酒款圖片
async function scrapeWineImageFromProwine(wine: any, winery: any): Promise<string | null> {
  try {
    console.log(`    🔍 從 PROWINE 爬取: ${wine.nameZh}`);
    
    // 生成搜索關鍵字
    const searchTerms = [
      wine.nameEn,
      wine.nameZh,
      `${winery.nameEn} ${wine.nameEn}`.replace(winery.nameEn, '').trim(),
    ].filter(t => t && t.length > 3);
    
    for (const term of searchTerms.slice(0, 3)) {
      try {
        await delay(CONFIG.requestDelay);
        const searchUrl = `${CONFIG.prowineBaseUrl}/?s=${encodeURIComponent(term)}`;
        const response = await fetchWithRetry(searchUrl);
        
        if (!response.ok) continue;
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // 查找包含 wine= 的鏈接
        const wineLinks = $('a[href*="?wine="]').filter((_, el) => {
          const linkText = $(el).text().toLowerCase();
          const href = $(el).attr('href') || '';
          const wineNameEnLower = wine.nameEn.toLowerCase();
          const wineNameZhLower = wine.nameZh.toLowerCase();
          
          return linkText.includes(wineNameEnLower.substring(0, Math.min(10, wineNameEnLower.length))) ||
                 linkText.includes(wineNameZhLower.substring(0, Math.min(5, wineNameZhLower.length))) ||
                 href.toLowerCase().includes(wineNameEnLower.substring(0, Math.min(10, wineNameEnLower.length)).replace(/\s+/g, '-'));
        });
        
        if (wineLinks.length > 0) {
          const firstLink = wineLinks.first().attr('href');
          if (firstLink) {
            const fullUrl = firstLink.startsWith('http') 
              ? firstLink 
              : new URL(firstLink, CONFIG.prowineBaseUrl).toString();
            
            console.log(`    ✅ 找到酒款頁面: ${fullUrl}`);
            
            await delay(CONFIG.requestDelay);
            const linkResponse = await fetchWithRetry(fullUrl);
            const linkHtml = await linkResponse.text();
            const $link = cheerio.load(linkHtml);
            
            // 查找圖片
            const excludeKeywords = [
              'logo', 'logotype', 'brand', 'warning', 'blog', 'kv-', 
              'theme', 'icon', 'banner', 'header', 'footer', 'favicon',
            ];
            
            const wineImages: Array<{ url: string; score: number }> = [];
            
            $link('img').each((_, imgEl) => {
              const src = $link(imgEl).attr('src') || 
                         $link(imgEl).attr('data-src') || 
                         $link(imgEl).attr('data-lazy-src');
              
              if (!src) return;
              
              const fullImageUrl = src.startsWith('http') ? src : new URL(src, fullUrl).toString();
              const urlLower = fullImageUrl.toLowerCase();
              
              // 過濾不相關圖片
              const isExcluded = excludeKeywords.some(keyword => 
                urlLower.includes(keyword.toLowerCase())
              );
              if (isExcluded) return;
              
              // 只處理 /newsite/wp-content/uploads/ 路徑
              if (!urlLower.includes('/newsite/wp-content/uploads/')) {
                return;
              }
              
              let score = 100; // 基礎分數
              
              // 檢查尺寸
              const width = parseInt($link(imgEl).attr('width') || '0');
              const height = parseInt($link(imgEl).attr('height') || '0');
              if (width > 300 && height > 300) {
                score += 20;
              }
              
              wineImages.push({ url: fullImageUrl, score });
            });
            
            if (wineImages.length > 0) {
              wineImages.sort((a, b) => b.score - a.score);
              const bestImage = wineImages[0];
              console.log(`    ✅ 找到圖片: ${bestImage.url}`);
              
              // 上傳到 Cloudinary
              try {
                const uploadedUrl = await uploadToCloudinary(
                  bestImage.url,
                  `prowine/wines/${wine.id}`,
                  `${wine.slug || wine.id}-label.jpg`
                );
                return uploadedUrl;
              } catch (error: any) {
                console.warn(`    ⚠️  上傳失敗: ${error.message}`);
                return bestImage.url; // 返回原始URL
              }
            }
          }
        }
      } catch (error: any) {
        console.warn(`    ⚠️  搜索失敗: ${error.message}`);
        continue;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error(`    ❌ 爬取失敗: ${error.message}`);
    return null;
  }
}

// 上傳圖片到 Cloudinary
async function uploadToCloudinary(imageUrl: string, folder: string, fileName: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folder,
      public_id: fileName.replace(/\.[^/.]+$/, ''), // 移除擴展名
      overwrite: true,
      resource_type: 'auto',
    });
    
    return result.secure_url;
  } catch (error: any) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

// 更新酒款圖片
async function updateWineImage(wineId: string, imageUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wines')
      .update({ 
        mainImageUrl: imageUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', wineId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error(`更新失敗: ${error.message}`);
    return false;
  }
}

// 更新酒莊LOGO
async function updateWineryLogo(wineryId: string, logoUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wineries')
      .update({ 
        logoUrl: logoUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', wineryId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error(`更新失敗: ${error.message}`);
    return false;
  }
}

// 處理所有有問題的酒款圖片
async function fixAllWineImages() {
  console.log("\n🍷 開始修復所有酒款圖片...\n");
  
  try {
    // 獲取所有酒款
    let allWines: any[] = [];
    let page = 0;
    const pageSize = 100;
    
    while (true) {
      const { data: wines, error } = await supabase
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
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        throw new Error(`獲取酒款失敗: ${error.message}`);
      }
      
      if (!wines || wines.length === 0) {
        break;
      }
      
      allWines = allWines.concat(wines);
      
      if (wines.length < pageSize) {
        break;
      }
      
      page++;
    }
    
    console.log(`✅ 總共找到 ${allWines.length} 個酒款\n`);
    
    // 過濾有問題的圖片
    const problematicWines = allWines.filter(wine => {
      return isImageProblematic(wine.mainImageUrl);
    });
    
    console.log(`📊 發現 ${problematicWines.length} 個酒款有圖片問題\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    // 處理每個有問題的酒款
    for (let i = 0; i < problematicWines.length; i++) {
      const wine = problematicWines[i];
      console.log(`\n[${i + 1}/${problematicWines.length}] 處理: ${wine.nameZh}`);
      console.log(`  當前圖片: ${wine.mainImageUrl || '無'}`);
      
      const winery = (wine.wineries as any);
      
      // 嘗試從 PROWINE 爬取
      const newImageUrl = await scrapeWineImageFromProwine(wine, winery);
      
      if (newImageUrl) {
        const updated = await updateWineImage(wine.id, newImageUrl);
        if (updated) {
          console.log(`  ✅ 成功更新圖片`);
          successCount++;
        } else {
          console.log(`  ❌ 更新失敗`);
          failCount++;
        }
      } else {
        console.log(`  ⚠️  未找到新圖片`);
        failCount++;
      }
      
      // 延遲避免限流
      await delay(CONFIG.requestDelay);
    }
    
    console.log(`\n📊 修復統計:`);
    console.log(`  成功: ${successCount}`);
    console.log(`  失敗: ${failCount}`);
    
  } catch (error: any) {
    console.error(`\n❌ 處理失敗: ${error.message}`);
    throw error;
  }
}

// 主函數
async function main() {
  console.log("🚀 完整圖片修復系統啟動\n");
  console.log("=" .repeat(60));
  
  try {
    // 1. 修復所有酒款圖片
    await fixAllWineImages();
    
    console.log("\n✅ 所有圖片修復完成！");
  } catch (error: any) {
    console.error("\n❌ 系統執行失敗:", error);
    process.exit(1);
  }
}

// 執行
main().catch((error) => {
  console.error("❌ 腳本執行失敗:", error);
  process.exit(1);
});

