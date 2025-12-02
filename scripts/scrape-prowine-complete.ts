/**
 * PROWINE 完整爬蟲系統
 * 
 * 功能：
 * 1. 讀取 MANUS_WINE_LIST/NEW 資料
 * 2. 從 prowine.com.tw 爬取每款酒的完整資料
 * 3. 從酒莊官網爬取 LOGO 和照片
 * 4. 使用 AI 生成文案
 * 5. 上傳圖片到 Cloudinary
 * 6. 更新 Supabase 資料庫
 * 
 * 邏輯：
 * - 讀取 all_wines_list.json 獲取所有酒款名稱
 * - 構建 ProWine URL: http://prowine.com.tw/?wine={slug}
 * - 爬取 ProWine 頁面獲取：價格、圖片、詳細資訊、評分等
 * - 從酒莊官網爬取 LOGO 和照片
 * - 使用 AI 生成中英文文案
 * - 批量更新資料庫
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import * as cheerio from "cheerio";

// 加載環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

// 動態導入模塊
let callLLM: any;
let uploadToCloudinary: any;

async function loadModules() {
  try {
    const uploadModule = await import("../lib/upload.js");
    uploadToCloudinary = uploadModule.uploadToCloudinary;
    
    const llmModule = await import("../lib/ai/multi-llm-provider.js");
    callLLM = llmModule.callLLM;
  } catch (error) {
    console.error("❌ 模塊加載失敗:", error);
    throw error;
  }
}

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

// 初始化 Supabase
let supabase: any;

// 進度記錄
const PROGRESS_FILE = join(process.cwd(), "scripts", "scrape-progress.json");

interface ScrapeProgress {
  processedWines: string[];
  processedWineries: string[];
  failedWines: string[];
  lastUpdate: string;
}

function loadProgress(): ScrapeProgress {
  try {
    if (existsSync(PROGRESS_FILE)) {
      return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
    }
  } catch (error) {
    console.warn("⚠️  無法讀取進度文件");
  }
  return {
    processedWines: [],
    processedWineries: [],
    failedWines: [],
    lastUpdate: new Date().toISOString(),
  };
}

function saveProgress(progress: ScrapeProgress) {
  try {
    progress.lastUpdate = new Date().toISOString();
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
  } catch (error) {
    console.error("⚠️  無法保存進度:", error);
  }
}

// 延遲函數
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 從 prowine_url 提取 slug，如果沒有則生成
function extractSlugFromUrl(prowineUrl?: string): string | null {
  if (!prowineUrl) return null;
  
  const match = prowineUrl.match(/[?&]wine=([^&]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

// 生成 ProWine URL slug（備用，當沒有 prowine_url 時使用）
function generateSlug(wineName: string): string {
  return wineName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// 從 ProWine 官網爬取酒款資料
async function scrapeWineFromProwine(wineName: string, prowineUrl?: string): Promise<any | null> {
  // 優先使用提供的 prowine_url，否則生成 slug
  let slug: string;
  let url: string;
  
  if (prowineUrl) {
    const extractedSlug = extractSlugFromUrl(prowineUrl);
    if (extractedSlug) {
      slug = extractedSlug;
      url = prowineUrl;
    } else {
      slug = generateSlug(wineName);
      url = `http://prowine.com.tw/?wine=${slug}`;
    }
  } else {
    slug = generateSlug(wineName);
    url = `http://prowine.com.tw/?wine=${slug}`;
  }
  
  try {
    console.log(`  🔍 爬取: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.log(`  ⚠️  HTTP ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 提取資料
    const data: any = {
      wine_name: wineName,
      prowine_url: url,
    };
    
    // 提取價格（尋找包含"元"的數字）
    const priceText = $('body').text();
    const priceMatch = priceText.match(/(\d+)\s*元/);
    if (priceMatch) {
      data.price = parseInt(priceMatch[1]);
    }
    
    // 提取圖片 URL
    const imageSelectors = [
      'img[src*="wp-content"]',
      'img[src*="wine"]',
      'img[src*="bottle"]',
      'img[src*="label"]',
      '.wine-image img',
      '.product-image img',
    ];
    
    for (const selector of imageSelectors) {
      const img = $(selector).first();
      if (img.length) {
        const src = img.attr('src') || img.attr('data-src');
        if (src && (src.includes('wine') || src.includes('bottle') || src.includes('label'))) {
          data.image_url = src.startsWith('http') ? src : `http://prowine.com.tw${src}`;
          break;
        }
      }
    }
    
    // 提取酒莊名稱
    const wineryText = $('body').text();
    const wineryMatch = wineryText.match(/酒莊[：:]\s*([^\n]+)/i) || 
                       wineryText.match(/Winery[：:]\s*([^\n]+)/i);
    if (wineryMatch) {
      data.winery = wineryMatch[1].trim();
    }
    
    // 提取產區
    const regionMatch = wineryText.match(/產區[：:]\s*([^\n]+)/i) || 
                       wineryText.match(/Region[：:]\s*([^\n]+)/i);
    if (regionMatch) {
      data.region = regionMatch[1].trim();
    }
    
    // 提取年份
    const vintageMatch = wineName.match(/(\d{4})/);
    if (vintageMatch) {
      data.vintage = parseInt(vintageMatch[1]);
    }
    
    // 提取詳細資訊（從頁面文本中提取）
    const bodyText = $('body').text();
    
    // 提取品酒筆記
    if (bodyText.includes('品酒筆記') || bodyText.includes('Tasting Notes')) {
      const notesMatch = bodyText.match(/(?:品酒筆記|Tasting Notes)[：:]\s*([^\n]{50,500})/i);
      if (notesMatch) {
        data.tasting_notes = notesMatch[1].trim();
      }
    }
    
    // 提取釀造方式
    if (bodyText.includes('釀造') || bodyText.includes('Winemaking')) {
      const winemakingMatch = bodyText.match(/(?:釀造方式|Winemaking)[：:]\s*([^\n]{50,500})/i);
      if (winemakingMatch) {
        data.winemaking = winemakingMatch[1].trim();
      }
    }
    
    // 提取評分
    const ratings: any = {};
    const ratingPatterns = [
      { key: 'decanter', pattern: /Decanter[：:]\s*(\d+)/i },
      { key: 'james_suckling', pattern: /James Suckling[：:]\s*(\d+)/i },
      { key: 'wine_spectator', pattern: /Wine Spectator[：:]\s*(\d+)/i },
      { key: 'wine_enthusiast', pattern: /Wine Enthusiast[：:]\s*(\d+)/i },
      { key: 'robert_parker', pattern: /Robert Parker[：:]\s*(\d+)/i },
    ];
    
    for (const { key, pattern } of ratingPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        ratings[key] = match[1];
      }
    }
    
    if (Object.keys(ratings).length > 0) {
      data.ratings = ratings;
    }
    
    return data;
  } catch (error: any) {
    console.error(`  ❌ 爬取失敗:`, error.message);
    return null;
  }
}

// 從酒莊官網爬取 LOGO
async function scrapeWineryLogo(wineryName: string, officialUrl?: string): Promise<string | null> {
  if (!officialUrl) return null;
  
  try {
    console.log(`  🏛️  爬取酒莊 LOGO: ${officialUrl}`);
    
    const response = await fetch(officialUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 尋找 LOGO（常見選擇器）
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]',
      '.logo img',
      '#logo img',
      'header img',
      '.header img',
      'nav img',
    ];
    
    for (const selector of logoSelectors) {
      const img = $(selector).first();
      if (img.length) {
        let src = img.attr('src') || img.attr('data-src');
        if (src) {
          // 處理相對路徑
          if (src.startsWith('//')) {
            src = `https:${src}`;
          } else if (src.startsWith('/')) {
            const baseUrl = new URL(officialUrl).origin;
            src = `${baseUrl}${src}`;
          } else if (!src.startsWith('http')) {
            const baseUrl = new URL(officialUrl).origin;
            src = `${baseUrl}/${src}`;
          }
          
          // 驗證圖片 URL
          try {
            const imgResponse = await fetch(src, { method: 'HEAD' });
            if (imgResponse.ok) {
              return src;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }
    
    return null;
  } catch (error: any) {
    console.error(`  ❌ LOGO 爬取失敗:`, error.message);
    return null;
  }
}

// 使用 AI 生成酒款文案
async function generateWineCopy(wineData: any): Promise<{
  descriptionZh: string;
  descriptionEn: string;
  storyZh?: string;
}> {
  const prompt = `請為以下酒款生成專業、優雅的中英文介紹文案：

酒款名稱：${wineData.wine_name}
酒莊：${wineData.winery || "未知"}
產區：${wineData.region || "未提供"}
年份：${wineData.vintage || "未提供"}
價格：${wineData.price ? `NT$ ${wineData.price}` : "未提供"}
品酒筆記：${wineData.tasting_notes || "未提供"}
釀造方式：${wineData.winemaking || "未提供"}

要求：
1. 中文描述（descriptionZh）：300-500字，專業、優雅、有故事性
2. 英文描述（descriptionEn）：對應中文，保持同樣風格
3. 中文故事（storyZh，可選）：500-800字，包含釀造工藝、風土特色、品飲建議
4. 風格：新古典主義，強調品質、工藝、風土
5. 避免過度商業化，強調文化與藝術價值

請以 JSON 格式返回：
{
  "descriptionZh": "中文描述",
  "descriptionEn": "English description",
  "storyZh": "中文故事（可選）"
}`;

  try {
    const response = await callLLM(prompt, []);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("AI 生成失敗:", error);
  }

  // 備用內容
  return {
    descriptionZh: `${wineData.wine_name} 是一款來自 ${wineData.region || "優質產區"} 的精品葡萄酒。`,
    descriptionEn: `${wineData.wine_name} is a premium wine from ${wineData.region || "a premium region"}.`,
  };
}

// 下載並上傳圖片到 Cloudinary
async function downloadAndUploadImage(imageUrl: string, folder: string, fileName: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const file = new File([buffer], fileName, { type: response.headers.get('content-type') || 'image/jpeg' });
    
    const result = await uploadToCloudinary(file, folder);
    return result.url; // 返回 URL 字符串，不是整個對象
  } catch (error: any) {
    console.error(`  ❌ 圖片上傳失敗:`, error.message);
    return null;
  }
}

// 讀取資料文件
function loadDataFiles() {
  const dataDir = join(process.cwd(), "MANUS_WINE_LIST", "NEW");
  
  // 讀取酒款列表
  const winesListPath = join(dataDir, "all_wines_list.json");
  const sampleDataPath = join(dataDir, "wines_sample_data.json");
  
  let wineNames: string[] = [];
  let sampleWines: any[] = [];
  let allWines: any[] = []; // 合併後的完整酒款資料
  
  try {
    if (existsSync(winesListPath)) {
      const content = readFileSync(winesListPath, "utf-8");
      wineNames = JSON.parse(content);
      
      // 將名稱列表轉換為物件陣列
      allWines = wineNames.map(name => ({
        wine_name: name,
        prowine_url: null, // 稍後會生成
      }));
    }
    
    if (existsSync(sampleDataPath)) {
      const content = readFileSync(sampleDataPath, "utf-8");
      sampleWines = JSON.parse(content);
      
      // 合併範例資料（優先使用，因為有完整的 prowine_url）
      // 移除重複的（如果名稱相同）
      const existingNames = new Set(allWines.map(w => w.wine_name));
      sampleWines.forEach((wine: any) => {
        if (!existingNames.has(wine.wine_name)) {
          allWines.push(wine);
        } else {
          // 如果已存在，更新為有 prowine_url 的版本
          const index = allWines.findIndex(w => w.wine_name === wine.wine_name);
          if (index >= 0) {
            allWines[index] = wine;
          }
        }
      });
    }
  } catch (error) {
    console.error("讀取資料文件失敗:", error);
  }
  
  // 讀取酒莊清單（從 Markdown）
  const markdownPath = join(dataDir, "ProWine 酩陽實業 - 完整酒莊與酒款資料清單.md");
  const wineries: any[] = [];
  
  try {
    if (existsSync(markdownPath)) {
      const content = readFileSync(markdownPath, "utf-8");
      // 提取酒莊資訊（從 Markdown 中解析）
      const wineryMatches = content.matchAll(/\*\*([^*]+)\*\*\s*-\s*(https?:\/\/[^\s]+)/g);
      for (const match of wineryMatches) {
        wineries.push({
          name: match[1].trim(),
          officialUrl: match[2].trim(),
        });
      }
    }
  } catch (error) {
    console.error("讀取酒莊清單失敗:", error);
  }
  
    return { allWines, wineries };
}

// 主函數
async function main() {
  console.log("🚀 開始爬取 ProWine 完整資料...\n");
  
  try {
    validateEnv();
    await loadModules();
    
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const progress = loadProgress();
    console.log(`📊 已處理: ${progress.processedWines.length} 個酒款\n`);
    
    // 讀取資料
    console.log("📖 讀取資料文件...");
    const { allWines, wineries } = loadDataFiles();
    console.log(`✅ 找到 ${allWines.length} 個酒款，${wineries.length} 個酒莊\n`);
    
    // 🧪 測試模式：只處理前 10 個酒款和 10 個酒莊
    const TEST_MODE = true;
    const TEST_LIMIT = 10;
    const winesToProcess = TEST_MODE ? allWines.slice(0, TEST_LIMIT) : allWines;
    const wineriesToProcess = TEST_MODE ? wineries.slice(0, TEST_LIMIT) : wineries;
    
    if (TEST_MODE) {
      console.log(`🧪 測試模式：只處理前 ${TEST_LIMIT} 個酒款和 ${TEST_LIMIT} 個酒莊\n`);
    }
    
    // 處理酒款
    console.log("🍷 開始爬取酒款資料...\n");
    
    for (let i = 0; i < winesToProcess.length; i++) {
      const wine = winesToProcess[i];
      const wineName = wine.wine_name || wine.wineName || wine.nameZh || wine.nameEn;
      const prowineUrl = wine.prowine_url || wine.prowineUrl;
      
      if (progress.processedWines.includes(wineName)) {
        console.log(`⏭️  [${i + 1}/${winesToProcess.length}] ${wineName} - 已處理，跳過`);
        continue;
      }
      
      if (progress.failedWines.includes(wineName)) {
        console.log(`⏭️  [${i + 1}/${winesToProcess.length}] ${wineName} - 之前失敗，跳過`);
        continue;
      }
      
      console.log(`\n[${i + 1}/${winesToProcess.length}] 處理: ${wineName}`);
      if (prowineUrl) {
        console.log(`  📍 使用已有 URL: ${prowineUrl}`);
      }
      
      try {
        // 1. 從 ProWine 爬取資料（使用已有的 prowine_url 如果有）
        const wineData = await scrapeWineFromProwine(wineName, prowineUrl);
        
        if (!wineData) {
          console.log(`  ⚠️  無法爬取資料，標記為失敗`);
          progress.failedWines.push(wineName);
          saveProgress(progress);
          await delay(2000);
          continue;
        }
        
        // 2. 下載並上傳圖片（只處理真正的酒款圖片，排除 logo）
        let imageUrl: string | null = null;
        if (wineData.image_url && !wineData.image_url.toLowerCase().includes('logo')) {
          console.log(`  📸 下載圖片: ${wineData.image_url}`);
          const extractedSlug = extractSlugFromUrl(wineData.prowine_url || prowineUrl);
          const fileName = `${extractedSlug || generateSlug(wineName)}.jpg`;
          imageUrl = await downloadAndUploadImage(wineData.image_url, "wines", fileName);
          if (imageUrl) {
            console.log(`  ✅ 圖片上傳成功: ${imageUrl}`);
          } else {
            console.log(`  ⚠️  圖片上傳失敗，跳過`);
          }
        } else if (wineData.image_url) {
          console.log(`  ⚠️  跳過 logo 圖片: ${wineData.image_url}`);
        }
        
        // 3. 生成 AI 文案
        console.log(`  🤖 生成 AI 文案...`);
        const copy = await generateWineCopy(wineData);
        
        // 4. 查找或創建酒莊
        let wineryId = null;
        if (wineData.winery) {
          const { data: existingWinery } = await supabase
            .from("wineries")
            .select("id")
            .or(`nameZh.eq.${wineData.winery},nameEn.eq.${wineData.winery}`)
            .limit(1);
          
          if (existingWinery && existingWinery.length > 0) {
            wineryId = existingWinery[0].id;
          } else {
            // 創建新酒莊
            const wineryInfo = wineries.find(w => w.name === wineData.winery);
            const { data: newWinery } = await supabase
              .from("wineries")
              .insert({
                nameZh: wineData.winery,
                nameEn: wineData.winery,
                region: wineData.region,
                website: wineryInfo?.officialUrl,
              })
              .select("id")
              .single();
            
            if (newWinery) {
              wineryId = newWinery.id;
              
              // 爬取酒莊 LOGO
              if (wineryInfo?.officialUrl) {
                const logoUrl = await scrapeWineryLogo(wineData.winery, wineryInfo.officialUrl);
                if (logoUrl) {
                  const logoFileName = `${generateSlug(wineData.winery)}-logo.png`;
                  const uploadedLogo = await downloadAndUploadImage(logoUrl, "wineries", logoFileName);
                  if (uploadedLogo) {
                    await supabase
                      .from("wineries")
                      .update({ logoUrl: uploadedLogo })
                      .eq("id", wineryId);
                  }
                }
              }
            }
          }
        }
        
        // 5. 查找或創建酒款
        // 優先使用從 prowine_url 提取的 slug
        const extractedSlug = extractSlugFromUrl(wineData.prowine_url || prowineUrl);
        const slug = extractedSlug || generateSlug(wineName);
        const { data: existingWine } = await supabase
          .from("wines")
          .select("id")
          .or(`slug.eq.${slug},nameZh.eq.${wineName},nameEn.eq.${wineName}`)
          .limit(1);
        
        const wineUpdateData: any = {
          nameZh: wineName,
          nameEn: wineName,
          slug: slug,
          descriptionZh: copy.descriptionZh,
          descriptionEn: copy.descriptionEn,
          region: wineData.region || null,
        };
        
        // 價格處理（從字符串轉換為數字）
        if (wineData.price) {
          if (typeof wineData.price === 'string') {
            const priceMatch = wineData.price.match(/(\d+)/);
            if (priceMatch) {
              wineUpdateData.price = parseFloat(priceMatch[1]);
            }
          } else {
            wineUpdateData.price = wineData.price;
          }
        }
        
        if (wineData.vintage) {
          wineUpdateData.vintage = typeof wineData.vintage === 'number' ? wineData.vintage : parseInt(wineData.vintage);
        }
        
        if (copy.storyZh) {
          wineUpdateData.storyZh = copy.storyZh;
        }
        
        if (imageUrl) {
          wineUpdateData.mainImageUrl = imageUrl;
        }
        
        if (wineryId) {
          wineUpdateData.wineryId = wineryId;
        }
        
        // 添加評分（如果有的話）
        if (wineData.ratings) {
          wineUpdateData.ratings = wineData.ratings;
        }
        
        // 添加品酒筆記和釀造方式（存儲在 JSON 欄位中）
        const additionalInfo: any = {};
        if (wineData.tasting_notes) {
          additionalInfo.tastingNotes = wineData.tasting_notes;
        }
        if (wineData.winemaking) {
          additionalInfo.winemaking = wineData.winemaking;
        }
        if (wineData.oak_aging) {
          additionalInfo.oakAging = wineData.oak_aging;
        }
        if (wineData.food_pairing) {
          additionalInfo.foodPairing = wineData.food_pairing;
        }
        if (Object.keys(additionalInfo).length > 0) {
          wineUpdateData.images = additionalInfo; // 暫時存儲在 images 欄位，後續可以創建專門的欄位
        }
        
        if (existingWine && existingWine.length > 0) {
          // 更新現有酒款
          const { error: updateError } = await supabase
            .from("wines")
            .update(wineUpdateData)
            .eq("id", existingWine[0].id);
          
          if (updateError) {
            console.error(`  ❌ 更新失敗:`, updateError.message);
          } else {
            console.log(`  ✅ 酒款更新成功`);
          }
        } else {
          // 創建新酒款（需要 category 和 price）
          if (!wineUpdateData.category) {
            // 根據酒款名稱推斷類別
            const nameLower = wineName.toLowerCase();
            if (nameLower.includes('sparkling') || nameLower.includes('brut') || nameLower.includes('champagne')) {
              wineUpdateData.category = 'SPARKLING_WINE';
            } else if (nameLower.includes('white') || nameLower.includes('chardonnay') || nameLower.includes('sauvignon blanc')) {
              wineUpdateData.category = 'WHITE_WINE';
            } else {
              wineUpdateData.category = 'RED_WINE';
            }
          }
          
          if (!wineUpdateData.price) {
            wineUpdateData.price = 0; // 如果沒有價格，設為 0（後續可以更新）
          }
          
          const { error: insertError } = await supabase
            .from("wines")
            .insert(wineUpdateData);
          
          if (insertError) {
            console.error(`  ❌ 創建失敗:`, insertError.message);
          } else {
            console.log(`  ✅ 酒款創建成功`);
          }
        }
        
        progress.processedWines.push(wineName);
        saveProgress(progress);
        
        console.log(`  ✅ [${i + 1}/${winesToProcess.length}] ${wineName} - 完成`);
        
        // 避免限流
        await delay(3000);
      } catch (error: any) {
        console.error(`  ❌ 處理失敗:`, error.message);
        progress.failedWines.push(wineName);
        saveProgress(progress);
        await delay(2000);
      }
    }
    
    // 處理酒莊（測試模式：只處理前 10 個）
    if (wineriesToProcess.length > 0) {
      console.log("\n🏛️  開始處理酒莊 LOGO...\n");
      
      for (let i = 0; i < wineriesToProcess.length; i++) {
        const winery = wineriesToProcess[i];
        const wineryName = winery.name || winery.nameZh || winery.nameEn;
        
        console.log(`\n[${i + 1}/${wineriesToProcess.length}] 處理酒莊: ${wineryName}`);
        
        try {
          // 查找資料庫中的酒莊
          const { data: existingWinery } = await supabase
            .from("wineries")
            .select("id, logoUrl")
            .or(`nameZh.eq.${wineryName},nameEn.eq.${wineryName}`)
            .limit(1);
          
          if (existingWinery && existingWinery.length > 0) {
            // 如果已有 LOGO，跳過
            if (existingWinery[0].logoUrl) {
              console.log(`  ⏭️  已有 LOGO，跳過`);
              continue;
            }
            
            // 爬取 LOGO
            if (winery.officialUrl) {
              const logoUrl = await scrapeWineryLogo(wineryName, winery.officialUrl);
              if (logoUrl) {
                const logoFileName = `${generateSlug(wineryName)}-logo.png`;
                const uploadedLogo = await downloadAndUploadImage(logoUrl, "wineries", logoFileName);
                if (uploadedLogo) {
                  await supabase
                    .from("wineries")
                    .update({ logoUrl: uploadedLogo })
                    .eq("id", existingWinery[0].id);
                  console.log(`  ✅ LOGO 上傳成功: ${uploadedLogo}`);
                }
              }
            }
          }
          
          await delay(2000);
        } catch (error: any) {
          console.error(`  ❌ 處理失敗:`, error.message);
          await delay(2000);
        }
      }
    }
    
    console.log("\n✅ 爬取完成！");
    console.log(`📊 總計處理: ${progress.processedWines.length} 個酒款`);
    console.log(`❌ 失敗: ${progress.failedWines.length} 個酒款`);
    if (TEST_MODE) {
      console.log(`🧪 測試模式：已處理 ${winesToProcess.length} 個酒款，${wineriesToProcess.length} 個酒莊`);
    }
  } catch (error: any) {
    console.error("\n❌ 爬取失敗:", error.message);
    process.exit(1);
  }
}

// ES module 執行
main().catch(console.error);

export { main };

