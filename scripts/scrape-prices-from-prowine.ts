/**
 * 從 prowine.com.tw 爬取酒款價格
 * 並更新 Supabase 數據庫
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";
import * as cheerio from "cheerio";

// 加載環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 使用 Node.js 內建的 fetch
const fetch = globalThis.fetch;

// 延遲函數
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 從酒款名稱生成可能的 URL slug
function generateWineSlug(wineName: string): string[] {
  // 移除特殊字符，轉換為小寫，用連字符分隔
  const slugs: string[] = [];
  
  // 方法 1: 直接轉換（保留空格為連字符）
  slugs.push(wineName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  
  // 方法 2: 移除年份（如果有）
  const withoutYear = wineName.replace(/\d{4}/g, '').trim();
  slugs.push(withoutYear.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  
  // 方法 3: 只保留主要關鍵字
  const keywords = wineName.split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w));
  if (keywords.length > 0) {
    slugs.push(keywords.join('-').toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }
  
  return [...new Set(slugs.filter(s => s.length > 0))];
}

// 從 prowine.com.tw 搜索酒款並獲取價格
async function scrapePriceFromProwine(wineNameZh: string, wineNameEn: string): Promise<number | null> {
  try {
    console.log(`    💰 搜索價格: ${wineNameZh}`);
    
    const baseUrl = 'http://prowine.com.tw';
    const MIN_PRICE = 480;
    const MAX_PRICE = 50000;
    const wineNameLower = wineNameZh.toLowerCase();
    
    // 策略 1: 直接構建可能的 URL（根據 prowine.com.tw 的 URL 格式：?wine=slug）
    const slugs = [
      ...generateWineSlug(wineNameZh),
      ...generateWineSlug(wineNameEn),
    ];
    
    // 去重
    const uniqueSlugs = [...new Set(slugs)];
    
    console.log(`    🔍 嘗試 ${uniqueSlugs.length} 個可能的 URL slug`);
    
    for (const slug of uniqueSlugs) {
      // prowine.com.tw 使用 ?wine= 查詢參數格式
      const possibleUrls = [
        `${baseUrl}/?wine=${slug}`,
        `${baseUrl}?wine=${slug}`,
        `${baseUrl}/wine/${slug}`,
        `${baseUrl}/product/${slug}`,
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
            const $ = cheerio.load(html);
            const pageText = $('body').text();
            
            // 先嘗試提取價格（不先驗證頁面，因為有些頁面可能沒有完整酒款名稱）
            // 方法 1: 搜索所有可能包含價格的元素（td, span, div, p 等）
            let foundPriceFromElement: number | null = null;
            const priceSelectors = ['td', 'span', 'div', 'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            for (const selector of priceSelectors) {
              try {
                const elements = $(selector);
                elements.each((_index, el) => {
                  if (foundPriceFromElement) return; // 已經找到價格，停止搜索
                  
                  const text = $(el).text();
                  // 優先匹配「品酩價：」格式
                  if (text.includes('品酩價')) {
                    const priceMatch = text.match(/品酩價[：:]\s*(?:NT\$)?\s*(\d{1,3}(?:,\d{3})*)/);
                    if (priceMatch) {
                      const price = parseInt(priceMatch[1].replace(/,/g, ''));
                      if (price >= MIN_PRICE && price <= MAX_PRICE) {
                        foundPriceFromElement = price;
                        console.log(`    ✅ 找到價格: NT$ ${price.toLocaleString()} (來源: ${url}, 方法: 品酩價元素)`);
                      }
                    }
                  }
                });
                if (foundPriceFromElement) {
                  return foundPriceFromElement;
                }
              } catch (e) {
                continue;
              }
            }
            
            // 方法 2: 在整個頁面文本中搜索價格（多種格式）
            const allPricePatterns = [
              /品酩價[：:]\s*NT\$\s*(\d{1,3}(?:,\d{3})*)/g,  // 最高優先級：品酩價：NT$ 1,200
              /品酩價[：:]\s*(\d{1,3}(?:,\d{3})*)\s*元/g,    // 品酩價：1,200 元
              /品酩價[：:]\s*(\d{1,3}(?:,\d{3})*)/g,        // 品酩價：1,200
              /NT\$\s*(\d{1,3}(?:,\d{3})*)/g,                // NT$ 1,200
              /(\d{1,3}(?:,\d{3})*)\s*元/g,                  // 1,200 元
              /價格[：:]\s*NT\$\s*(\d{1,3}(?:,\d{3})*)/g,    // 價格：NT$ 1,200
              /價格[：:]\s*(\d{1,3}(?:,\d{3})*)\s*元/g,      // 價格：1,200 元
            ];
            
            const foundPrices: number[] = [];
            for (const pattern of allPricePatterns) {
              const matches = [...pageText.matchAll(pattern)];
              for (const match of matches) {
                if (match[1]) {
                  const price = parseInt(match[1].replace(/,/g, ''));
                  if (price >= MIN_PRICE && price <= MAX_PRICE) {
                    foundPrices.push(price);
                  }
                }
              }
            }
            
            // 如果找到多個價格，選擇最常見的（可能是正確的價格）
            if (foundPrices.length > 0) {
              // 統計價格出現次數
              const priceCounts = new Map<number, number>();
              foundPrices.forEach(p => priceCounts.set(p, (priceCounts.get(p) || 0) + 1));
              
              // 選擇出現次數最多的價格
              let maxCount = 0;
              let bestPrice = foundPrices[0];
              priceCounts.forEach((count, price) => {
                if (count > maxCount) {
                  maxCount = count;
                  bestPrice = price;
                }
              });
              
              // 驗證頁面是否相關（找到價格後再驗證，降低門檻）
              const wineKeywords = wineNameZh.split(/\s+/).filter(w => w.length > 2);
              const matchedKeywords = wineKeywords.filter(keyword => 
                pageText.toLowerCase().includes(keyword.toLowerCase())
              );
              
              // 如果匹配至少1個關鍵字，認為頁面相關
              if (matchedKeywords.length >= 1) {
                console.log(`    ✅ 找到價格: NT$ ${bestPrice.toLocaleString()} (來源: ${url}, 匹配 ${matchedKeywords.length} 個關鍵字)`);
                return bestPrice;
              } else {
                // 即使關鍵字不匹配，如果價格合理也接受（可能是簡化名稱）
                console.log(`    ⚠️  找到價格但關鍵字不匹配: NT$ ${bestPrice.toLocaleString()} (來源: ${url})`);
                // 仍然返回價格，因為價格本身是可靠的
                return bestPrice;
              }
            }
            
            // 方法 3: 檢查特定的價格元素（CSS 選擇器）
            const cssPriceSelectors = [
              '.price', '.product-price', '[class*="price"]', '[id*="price"]',
              '.amount', '.cost', '[class*="amount"]', '[class*="cost"]',
            ];
            
            for (const selector of cssPriceSelectors) {
              try {
                const priceElements = $(selector);
                priceElements.each((_index, el) => {
                  const priceText = $(el).text();
                  // 優先匹配「品酩價：」格式
                  let priceMatch = priceText.match(/品酩價[：:]\s*(?:NT\$)?\s*(\d{1,3}(?:,\d{3})*)/);
                  if (!priceMatch) {
                    priceMatch = priceText.match(/(?:NT\$|元|價格[：:]|Price[：:]|品酩價[：:])\s*(\d{1,3}(?:,\d{3})*)/);
                  }
                  if (priceMatch) {
                    const price = parseInt(priceMatch[1].replace(/,/g, ''));
                    if (price >= MIN_PRICE && price <= MAX_PRICE) {
                      console.log(`    ✅ 找到價格: NT$ ${price.toLocaleString()} (選擇器: ${selector}, 來源: ${url})`);
                      return price;
                    }
                  }
                });
              } catch (e) {
                continue;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    console.log(`    ⚠️  無法直接找到價格，將使用估算價格`);
    return null;
  } catch (error: any) {
    console.warn(`    ⚠️  價格爬蟲失敗:`, error.message);
    return null;
  }
}

// 從價位等級推斷價格（根據 prowine.com.tw 的分類）
// prowine.com.tw 價位等級：480-800, 801-1500, 1501-2500, 2501-4000, 4001-6500, 6501-8000, 8001-20000
function estimatePriceFromCategory(wine: any): number {
  // 根據酒款類型、產區、年份等推斷價格
  // 最低價格必須 >= 480（根據 prowine.com.tw 的價位等級）
  
  // 頂級酒款（Napa Valley Reserve, Estate 系列等）
  if (wine.nameZh.includes('Reserve') || wine.nameZh.includes('Estate') || 
      (wine.region?.includes('Napa') && wine.nameZh.includes('Cabernet'))) {
    return 8000; // 高級酒款價格範圍：6501-8000
  }
  
  // 高級酒款（Napa Valley, 法國名莊）
  if (wine.region?.includes('Napa') || wine.nameZh.includes('Estate')) {
    return 5000; // 中高級酒款價格範圍：4001-6500
  }
  
  // 中級酒款（法國、西班牙等）
  if (wine.region?.includes('France') || wine.region?.includes('Bordeaux') || 
      wine.region?.includes('Spain') || wine.region?.includes('Rhone')) {
    return 2500; // 中級酒款價格範圍：1501-2500
  }
  
  // 一般酒款（最低價格）
  return 1200; // 一般酒款價格範圍：801-1500
}

// 更新酒款價格
async function updateWinePrice(wineId: string, price: number) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("wines")
    .update({
      price,
      updatedAt: now,
    })
    .eq("id", wineId);
  
  if (error) {
    console.error(`    ❌ 更新價格失敗:`, error.message);
    return false;
  }
  
  console.log(`    ✅ 價格更新成功: NT$ ${price.toLocaleString()}`);
  return true;
}

// 主函數
async function main() {
  console.log("🚀 開始從 prowine.com.tw 爬取價格...\n");
  
  try {
    // 獲取所有酒款（優先處理沒有價格或預設價格的）
    const { data: wines, error: winesError } = await supabase
      .from("wines")
      .select("id, nameZh, nameEn, price, region, category")
      .order("price", { ascending: true, nullsFirst: true })
      .limit(50); // 先處理前50個，避免執行時間過長
    
    if (winesError) {
      throw winesError;
    }
    
    console.log(`📊 找到 ${wines?.length || 0} 個酒款\n`);
    
    if (!wines || wines.length === 0) {
      console.log("⚠️  沒有找到酒款");
      return;
    }
    
    // 處理每個酒款
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const wine of wines) {
      // 強制重新驗證所有價格（即使是預設值 1000 也要重新爬取）
      // 如果價格是明顯的預設值（1000），強制重新爬取
      const isDefaultPrice = wine.price === 1000 || wine.price === 1500 || wine.price === 3000 || wine.price === 5000;
      
      // 檢查價格是否合理（必須 >= 480，根據 prowine.com.tw 的價位等級）
      const MIN_VALID_PRICE = 480;
      const isInvalidPrice = wine.price && (wine.price < MIN_VALID_PRICE || wine.price > 50000);
      
      if (!isDefaultPrice && !isInvalidPrice && wine.price && wine.price >= MIN_VALID_PRICE && wine.price < 100000) {
        console.log(`  ⏭️  跳過 ${wine.nameZh} (已有合理價格: NT$ ${wine.price.toLocaleString()})`);
        skippedCount++;
        continue;
      }
      
      // 如果價格不合理，強制重新爬取
      if (isInvalidPrice) {
        console.log(`  ⚠️  價格不合理，將重新爬取: ${wine.nameZh} (當前: NT$ ${wine.price?.toLocaleString() || '無'})`);
      }
      
      if (isDefaultPrice) {
        console.log(`  🔄 重新驗證價格: ${wine.nameZh} (當前: NT$ ${wine.price?.toLocaleString() || '無'})`);
      }
      
      console.log(`\n🍷 處理: ${wine.nameZh}`);
      
      // 嘗試從 prowine.com.tw 爬取價格
      const price = await scrapePriceFromProwine(wine.nameZh, wine.nameEn);
      
      if (price && price > 0) {
        await updateWinePrice(wine.id, price);
        updatedCount++;
      } else {
        // 如果爬取失敗，使用估算價格
        const estimatedPrice = estimatePriceFromCategory(wine);
        console.log(`    💡 使用估算價格: NT$ ${estimatedPrice.toLocaleString()}`);
        await updateWinePrice(wine.id, estimatedPrice);
        updatedCount++;
      }
      
      // 延遲避免限流
      await delay(2000);
    }
    
    console.log(`\n✅ 價格爬蟲完成！`);
    console.log(`📊 更新: ${updatedCount} 個酒款`);
    console.log(`⏭️  跳過: ${skippedCount} 個酒款`);
  } catch (error: any) {
    console.error("❌ 爬蟲失敗:", error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("執行失敗:", error);
  process.exit(1);
});

