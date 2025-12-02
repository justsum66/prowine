/**
 * 為導入的數據爬蟲圖片
 * 1. 酒款照片：優先從 prowine.com.tw 爬取，備選從酒莊官網
 * 2. LOGO：從酒莊官網爬取 → 顯示在 WineryCard
 * 3. 酒莊照片：從酒莊官網爬取特色照片、釀酒照片 → 放到酒莊細節頁面
 * 4. 上傳所有圖片到 Cloudinary
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";

// 加載環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 動態導入 uploadToCloudinary
let uploadToCloudinary: any;
try {
  const uploadModule = await import("../lib/upload.js");
  uploadToCloudinary = uploadModule.uploadToCloudinary;
} catch (error) {
  console.warn("無法導入 uploadToCloudinary，將直接使用圖片 URL");
}

// 延遲函數
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 下載圖片並上傳到 Cloudinary
async function downloadAndUploadImage(imageUrl: string, folder: string, fileName: string): Promise<string | null> {
  try {
    // 檢查 Cloudinary 配置
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    // 清理 cloud_name（移除 @ 符號）
    const cleanCloudName = cloudName?.replace(/^@+/, '').trim();
    
    // 調試信息
    if (!cleanCloudName || !apiKey || !apiSecret) {
      console.log(`    ⚠️  Cloudinary 配置檢查:`);
      console.log(`        CLOUDINARY_CLOUD_NAME: ${cloudName ? '已設置' : '未設置'}`);
      console.log(`        CLOUDINARY_API_KEY: ${apiKey ? '已設置' : '未設置'}`);
      console.log(`        CLOUDINARY_API_SECRET: ${apiSecret ? '已設置' : '未設置'}`);
    }
    
    // 如果 Cloudinary 未配置或配置無效，直接返回原 URL
    // 注意：'Root' 是無效的 cloud_name，應該使用實際的 cloud_name（如 dsgvbsj9k）
    if (!cleanCloudName || !apiKey || !apiSecret || cleanCloudName === '' || cleanCloudName === 'Root') {
      console.log(`    ⚠️  Cloudinary 未配置或配置無效 (cloud_name: ${cloudName}), 直接使用原 URL: ${imageUrl}`);
      console.log(`    💡 提示: 請在 .env.local 中設置 CLOUDINARY_CLOUD_NAME=dsgvbsj9k`);
      return imageUrl;
    }
    
    // 如果沒有 uploadToCloudinary 函數，直接返回原 URL
    if (!uploadToCloudinary) {
      console.log(`    ⚠️  無法導入 uploadToCloudinary，直接使用 URL: ${imageUrl}`);
      return imageUrl;
    }

    // 下載圖片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`下載失敗: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const file = Buffer.from(buffer);

    // 上傳到 Cloudinary
    const result = await uploadToCloudinary(file, folder, {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 85,
      format: "auto",
      generateSizes: true,
    });

    console.log(`    ✅ 已上傳到 Cloudinary: ${result.url}`);
    return result.url;
  } catch (error: any) {
    console.warn(`    ⚠️  上傳到 Cloudinary 失敗:`, error.message);
    // 如果上傳失敗，返回原 URL
    return imageUrl;
  }
}

// 爬蟲酒款圖片（優先從 prowine.com.tw，備選從酒莊官網）
async function scrapeWineImage(wine: any, winery: any): Promise<string | null> {
  try {
    console.log(`    📸 爬蟲酒款圖片: ${wine.nameZh}`);
    
    // 策略 1: 優先從 prowine.com.tw 爬取（主要來源）
    console.log(`    🔍 優先從 prowine.com.tw 搜索酒標: ${wine.nameZh}`);
    try {
      const prowineUrl = `http://prowine.com.tw`;
      
      // 構建搜索 URL（根據酒款名稱，使用 ?wine= 格式）
      const wineNameSlug = wine.nameZh
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // 嘗試直接訪問酒款頁面（使用 ?wine= 查詢參數）
      const possibleUrls = [
        `${prowineUrl}/?wine=${wineNameSlug}`,
        `${prowineUrl}?wine=${wineNameSlug}`,
        `${prowineUrl}/wine/${wineNameSlug}`,
        `${prowineUrl}/product/${wineNameSlug}`,
      ];
      
      for (const url of possibleUrls) {
        try {
          await delay(1000);
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          
          if (response.ok) {
            const html = await response.text();
            const cheerio = await import("cheerio");
            const $ = cheerio.load(html);
            
            // 驗證頁面是否包含酒款名稱（避免匹配錯誤頁面）
            const pageText = $('body').text();
            const wineKeywords = wine.nameZh.split(/\s+/).filter(w => w.length > 2);
            const matchedKeywords = wineKeywords.filter(keyword => 
              pageText.toLowerCase().includes(keyword.toLowerCase())
            );
            
            // 如果匹配的關鍵字少於 2 個，跳過這個頁面
            if (matchedKeywords.length < 2) {
              continue;
            }
            
            // 查找圖片，優先匹配酒標圖片（排除 LOGO）
            const wineImages: Array<{ url: string; score: number }> = [];
            
            // 過濾不相關的圖片關鍵字（加強 LOGO 過濾）
            const excludeKeywords = ['logo', 'logotype', 'brand', 'warning', 'blog', 'kv-', 'theme', 'icon', 'banner', 'header', 'footer', 'favicon'];
            
            $('img').each((_index, imgEl) => {
              const src = $(imgEl).attr('src') || $(imgEl).attr('data-src') || $(imgEl).attr('data-lazy-src');
              if (!src) return;
              
              const fullImageUrl = src.startsWith('http') ? src : new URL(src, url).toString();
              const urlLower = fullImageUrl.toLowerCase();
              
              // 嚴格過濾 LOGO 和不相關圖片
              const isExcluded = excludeKeywords.some(keyword => 
                urlLower.includes(keyword.toLowerCase())
              );
              if (isExcluded) return;
              
              // 檢查 alt 屬性，如果包含 logo 也排除
              const alt = $(imgEl).attr('alt') || '';
              if (alt.toLowerCase().includes('logo') || alt.toLowerCase().includes('brand')) {
                return;
              }
              
              // 評分：優先匹配酒標圖片
              let score = 0;
              const wineNameLower = wine.nameZh.toLowerCase();
              
              // 檢查 URL 或 alt 是否包含酒款名稱
              if (urlLower.includes(wineNameLower) || alt.toLowerCase().includes(wineNameLower)) {
                score += 50;
              }
              
              // 檢查是否包含酒標相關關鍵字（加分）
              if (urlLower.includes('wine') || urlLower.includes('label') || urlLower.includes('bottle') || 
                  urlLower.includes('product') || urlLower.includes('wine-label')) {
                score += 30;
              }
              
              // 檢查圖片尺寸（大圖片優先，酒標通常是 300x300 以上）
              const width = parseInt($(imgEl).attr('width') || '0');
              const height = parseInt($(imgEl).attr('height') || '0');
              if (width > 400 && height > 400) {
                score += 20;
              } else if (width > 300 && height > 300) {
                score += 10;
              }
              
              // 排除小圖片（可能是 icon）
              if (width < 200 || height < 200) {
                score -= 50; // 大幅扣分
              }
              
              // 如果分數為正，加入候選列表
              if (score > 0) {
                wineImages.push({ url: fullImageUrl, score });
              }
            });
            
            // 選擇分數最高的圖片（要求分數 >= 30，確保是酒標而非 LOGO）
            if (wineImages.length > 0) {
              wineImages.sort((a, b) => b.score - a.score);
              const bestImage = wineImages[0];
              if (bestImage.score >= 30) { // 提高門檻，確保是酒標
                console.log(`    ✅ 從 prowine.com.tw 找到圖片: ${bestImage.url} (分數: ${bestImage.score})`);
                // 上傳到 Cloudinary
                const uploadedUrl = await downloadAndUploadImage(
                  bestImage.url,
                  `prowine/wines/${wine.id}`,
                  `${wine.slug || wine.id}-label.jpg`
                );
                return uploadedUrl;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error: any) {
      console.warn(`    ⚠️  從 prowine.com.tw 爬取失敗:`, error.message);
    }
    
    // 策略 2: 備選從酒莊官網爬取（僅當 prowine.com.tw 失敗時）
    if (winery.website) {
      console.log(`    🔍 備選從酒莊官網搜索酒標: ${wine.nameZh} (${winery.website})`);
      try {
        const scraperModule = await import("./advanced-image-scraper.js");
        const wineImages = await scraperModule.scrapeOfficialWineLabel(
          wine.nameZh,
          winery.website
        );
        
        if (wineImages && wineImages.length > 0) {
          // 過濾掉 LOGO（評分較低或包含 logo 關鍵字）
          const validImages = wineImages.filter(img => {
            const urlLower = img.url.toLowerCase();
            return !urlLower.includes('logo') && 
                   !urlLower.includes('brand') && 
                   img.validation.isValid && 
                   img.validation.score >= 20;
          });
          
          if (validImages.length > 0) {
            const bestImage = validImages.sort((a, b) => b.validation.score - a.validation.score)[0];
            console.log(`    ✅ 從酒莊官網找到圖片: ${bestImage.url}`);
            // 上傳到 Cloudinary
            const uploadedUrl = await downloadAndUploadImage(
              bestImage.url,
              `prowine/wines/${wine.id}`,
              `${wine.slug || wine.id}-label.jpg`
            );
            return uploadedUrl;
          }
        }
      } catch (error: any) {
        console.warn(`    ⚠️  從酒莊官網爬取失敗:`, error.message);
      }
    }
    
    return null;
  } catch (error: any) {
    console.warn(`    ⚠️  酒款圖片爬蟲失敗:`, error.message);
    return null;
  }
}

// 爬蟲酒莊 LOGO
async function scrapeWineryLogo(winery: any): Promise<string | null> {
  if (!winery.website) {
    return null;
  }

  try {
    console.log(`    📸 爬蟲酒莊 LOGO: ${winery.nameZh} (${winery.website})`);
    
    const scraperModule = await import("./advanced-image-scraper.js");
    const logoImages = await scraperModule.scrapeOfficialLogo(winery.website);
    
    if (logoImages && logoImages.length > 0) {
      const bestLogo = logoImages.sort((a, b) => b.validation.score - a.validation.score)[0];
      if (bestLogo && bestLogo.validation.isValid) {
        console.log(`    ✅ 找到 LOGO: ${bestLogo.url}`);
        // 上傳到 Cloudinary
        const uploadedUrl = await downloadAndUploadImage(
          bestLogo.url,
          `prowine/wineries/${winery.id}`,
          `${winery.slug || winery.id}-logo.png`
        );
        return uploadedUrl;
      }
    }
    
    return null;
  } catch (error: any) {
    console.warn(`    ⚠️  LOGO 爬蟲失敗:`, error.message);
    return null;
  }
}

// 爬蟲酒莊照片（特色照片、釀酒照片等）
async function scrapeWineryPhotos(winery: any): Promise<string[]> {
  if (!winery.website) {
    return [];
  }

  try {
    console.log(`    📸 爬蟲酒莊照片: ${winery.nameZh} (${winery.website})`);
    
    const scraperModule = await import("./advanced-image-scraper.js");
    const wineryPhotos = await scraperModule.scrapeOfficialWineryPhotos(winery.website);
    
    if (wineryPhotos && wineryPhotos.length > 0) {
      // 選擇最好的 5 張照片
      const bestPhotos = wineryPhotos
        .sort((a, b) => b.validation.score - a.validation.score)
        .slice(0, 5)
        .filter(photo => photo.validation.isValid);
      
      console.log(`    ✅ 找到 ${bestPhotos.length} 張酒莊照片`);
      
      // 上傳所有照片到 Cloudinary
      const uploadedUrls: string[] = [];
      for (let i = 0; i < bestPhotos.length; i++) {
        const photo = bestPhotos[i];
        const uploadedUrl = await downloadAndUploadImage(
          photo.url,
          `prowine/wineries/${winery.id}/photos`,
          `${winery.slug || winery.id}-photo-${i + 1}.jpg`
        );
        if (uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
        }
        await delay(1000); // 延遲避免限流
      }
      
      return uploadedUrls;
    }
    
    return [];
  } catch (error: any) {
    console.warn(`    ⚠️  酒莊照片爬蟲失敗:`, error.message);
    return [];
  }
}

// 更新酒款圖片
async function updateWineImage(wineId: string, imageUrl: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("wines")
    .update({
      mainImageUrl: imageUrl,
      updatedAt: now,
    })
    .eq("id", wineId);
  
  if (error) {
    console.error(`    ❌ 更新失敗:`, error.message);
    return false;
  }
  
  console.log(`    ✅ 圖片更新成功`);
  return true;
}

// 更新酒莊 LOGO
async function updateWineryLogo(wineryId: string, logoUrl: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("wineries")
    .update({
      logoUrl,
      updatedAt: now,
    })
    .eq("id", wineryId);
  
  if (error) {
    console.error(`    ❌ 更新失敗:`, error.message);
    return false;
  }
  
  console.log(`    ✅ LOGO 更新成功`);
  return true;
}

// 更新酒莊照片
async function updateWineryPhotos(wineryId: string, photoUrls: string[]) {
  if (photoUrls.length === 0) {
    return false;
  }

  const now = new Date().toISOString();
  
  // 獲取現有照片
  const { data: winery } = await supabase
    .from("wineries")
    .select("images")
    .eq("id", wineryId)
    .single();
  
  // 合併現有照片和新照片（去重）
  const existingImages = (winery?.images as string[]) || [];
  const allImages = [...new Set([...existingImages, ...photoUrls])];
  
  const { error } = await supabase
    .from("wineries")
    .update({
      images: allImages,
      updatedAt: now,
    })
    .eq("id", wineryId);
  
  if (error) {
    console.error(`    ❌ 更新失敗:`, error.message);
    return false;
  }
  
  console.log(`    ✅ 已更新 ${photoUrls.length} 張酒莊照片`);
  return true;
}

// 主函數
async function main() {
  console.log("🚀 開始爬蟲圖片...\n");
  
  try {
    // 1. 獲取所有沒有圖片的酒款
    const { data: wines, error: winesError } = await supabase
      .from("wines")
      .select("id, nameZh, nameEn, slug, wineryId, mainImageUrl")
      .is("mainImageUrl", null)
      .limit(50);
    
    if (winesError) {
      throw winesError;
    }
    
    console.log(`📊 找到 ${wines?.length || 0} 個沒有圖片的酒款\n`);
    
    // 2. 獲取所有酒莊（處理 LOGO 和照片）
    const { data: wineries, error: wineriesError } = await supabase
      .from("wineries")
      .select("id, nameZh, nameEn, slug, website, logoUrl, images")
      .limit(50);
    
    if (wineriesError) {
      throw wineriesError;
    }
    
    console.log(`📊 找到 ${wineries?.length || 0} 個酒莊\n`);
    
    // 3. 處理酒款圖片
    if (wines && wines.length > 0) {
      console.log("🍷 處理酒款圖片...\n");
      
      for (const wine of wines) {
        // 獲取酒莊信息
        const { data: winery } = await supabase
          .from("wineries")
          .select("*")
          .eq("id", wine.wineryId)
          .single();
        
        if (winery) {
          const imageUrl = await scrapeWineImage(wine, winery);
          if (imageUrl) {
            await updateWineImage(wine.id, imageUrl);
          }
          
          // 延遲避免限流
          await delay(3000);
        }
      }
    }
    
    // 4. 處理酒莊 LOGO 和照片
    if (wineries && wineries.length > 0) {
      console.log("\n🏛️  處理酒莊 LOGO 和照片...\n");
      
      for (const winery of wineries) {
        console.log(`\n🏛️  處理酒莊: ${winery.nameZh}`);
        
        // 處理 LOGO
        if (!winery.logoUrl) {
          const logoUrl = await scrapeWineryLogo(winery);
          if (logoUrl) {
            await updateWineryLogo(winery.id, logoUrl);
          }
        } else {
          console.log(`  ⏭️  跳過 LOGO (已有)`);
        }
        
        // 處理酒莊照片
        const existingPhotos = (winery.images as string[]) || [];
        if (existingPhotos.length < 3) {
          const photoUrls = await scrapeWineryPhotos(winery);
          if (photoUrls.length > 0) {
            await updateWineryPhotos(winery.id, photoUrls);
          }
        } else {
          console.log(`  ⏭️  跳過照片 (已有 ${existingPhotos.length} 張)`);
        }
        
        // 延遲避免限流
        await delay(3000);
      }
    }
    
    console.log("\n✅ 圖片爬蟲完成！");
  } catch (error: any) {
    console.error("❌ 爬蟲失敗:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("執行失敗:", error);
  process.exit(1);
});
