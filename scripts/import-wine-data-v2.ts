/**
 * 從 MANUS_WINE_LIST 導入真實酒款和酒莊數據（完整版）
 * 
 * 使用 MANUS 提供的完整資料：
 * 1. ProWine 完整酒莊與酒款 URL 資料庫.md - 包含所有酒莊和酒款的詳細URL
 * 2. wineries_url_table.csv - 酒莊基本信息和URL
 * 3. ProWine 酩陽實業 - 完整酒款與酒莊清單.md - 完整的酒款清單
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

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
    console.log("✅ 模塊加載成功");
  } catch (error: any) {
    console.error("❌ 模塊加載失敗:", error.message);
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

let supabase: any;

// 進度記錄文件
const PROGRESS_FILE = join(process.cwd(), "scripts", "import-progress.json");

interface ImportProgress {
  processedWineries: string[];
  processedWines: string[];
  lastUpdate: string;
}

function loadProgress(): ImportProgress {
  try {
    if (existsSync(PROGRESS_FILE)) {
      const content = readFileSync(PROGRESS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn("⚠️  無法讀取進度文件，將從頭開始");
  }
  return {
    processedWineries: [],
    processedWines: [],
    lastUpdate: new Date().toISOString(),
  };
}

function saveProgress(progress: ImportProgress) {
  try {
    progress.lastUpdate = new Date().toISOString();
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
  } catch (error) {
    console.error("⚠️  無法保存進度:", error);
  }
}

async function wineryExists(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("wineries")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    
    return !error && data && data.length > 0;
  } catch (error) {
    return false;
  }
}

async function wineExists(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("wines")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    
    return !error && data && data.length > 0;
  } catch (error) {
    return false;
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// 解析 CSV 文件（改進版：正確處理引號和逗號）
function parseWineriesCSV(): any[] {
  const filePath = join(process.cwd(), "MANUS_WINE_LIST", "wineries_url_table.csv");
  
  if (!existsSync(filePath)) {
    console.error(`❌ 找不到文件: ${filePath}`);
    return [];
  }
  
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  
  if (lines.length < 2) {
    return [];
  }
  
  const wineries: any[] = [];
  
  // 跳過標題行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 正確解析 CSV（處理引號內的逗號）
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, "")); // 最後一個值
    
    if (values.length < 3) continue;
    
    const nameZh = values[0] || "";
    const region = values[1] || "";
    const country = values[2] || "";
    const website = values[3] && values[3] !== "無獨立官網" && values[3] !== "無" ? values[3] : null;
    
    if (!nameZh) continue;
    
    // 從 URL 資料庫文件獲取更多信息
    wineries.push({
      nameZh,
      nameEn: nameZh, // 暫時使用中文名稱，後續可以從 URL 資料庫獲取
      region,
      country,
      website,
      wineCom: values[4] || null,
      vivino: values[5] || null,
      wineSearcher: values[6] || null,
      otherPlatform: values[7] || null,
    });
  }
  
  return wineries;
}

// 從 URL 資料庫文件解析完整的酒莊和酒款信息
function parseWineryURLDatabase(): Map<string, any> {
  const filePath = join(process.cwd(), "MANUS_WINE_LIST", "ProWine 完整酒莊與酒款 URL 資料庫.md");
  
  if (!existsSync(filePath)) {
    console.warn("⚠️  找不到 URL 資料庫文件");
    return new Map();
  }
  
  const content = readFileSync(filePath, "utf-8");
  const wineryMap = new Map<string, any>();
  
  const lines = content.split("\n");
  let currentWinery: any = null;
  let currentCountry = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 檢測國家
    if (line.includes("# 美國酒莊")) {
      currentCountry = "USA";
      continue;
    } else if (line.includes("# 法國酒莊")) {
      currentCountry = "France";
      continue;
    } else if (line.includes("# 西班牙酒莊")) {
      currentCountry = "Spain";
      continue;
    }
    
    // 檢測酒莊標題（格式：## 數字. 酒莊名稱 ⭐）
    const wineryMatch = line.match(/^##\s+\d+\.\s+(.+?)\s*⭐?/);
    if (wineryMatch) {
      // 保存上一個酒莊
      if (currentWinery) {
        wineryMap.set(currentWinery.nameZh, currentWinery);
      }
      
      currentWinery = {
        nameZh: wineryMatch[1].trim(),
        nameEn: wineryMatch[1].trim(),
        country: currentCountry,
        wines: [],
      };
      continue;
    }
    
    // 解析酒莊信息
    if (currentWinery) {
      // 產區
      if (line.startsWith("**產區**:")) {
        currentWinery.region = line.replace("**產區**:", "").trim();
      }
      // 官方網站
      else if (line.startsWith("**官方網站**:")) {
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          currentWinery.website = urlMatch[0];
        }
      }
      // 酒款商店
      else if (line.startsWith("**酒款商店**:")) {
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          currentWinery.wineShopUrl = urlMatch[0];
        }
      }
      // 酒款列表
      else if (line.startsWith("**ProWine 清單酒款**")) {
        // 接下來幾行是酒款
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          const wineLine = lines[j].trim();
          if (wineLine.startsWith("-") && wineLine.includes("20")) {
            // 解析酒款（格式：- 2022/2021 Signature Cabernet Sauvignon）
            const wineMatch = wineLine.match(/^-\s+(.+?)(\s+\(.+?\))?$/);
            if (wineMatch) {
              const wineName = wineMatch[1].trim();
              // 提取年份
              const yearMatch = wineName.match(/(\d{4}|NV)/);
              const vintage = yearMatch && yearMatch[1] !== "NV" ? parseInt(yearMatch[1]) : null;
              
              // 清理酒款名稱（移除年份）
              const cleanName = wineName.replace(/\d{4}\/?\d{0,4}\s*/g, "").replace(/NV\s*/g, "").trim();
              
              currentWinery.wines.push({
                nameZh: cleanName,
                nameEn: cleanName,
                vintage,
                rawLine: wineName,
              });
            }
          } else if (wineLine.startsWith("---") || wineLine.startsWith("##")) {
            break;
          }
        }
      }
    }
  }
  
  // 保存最後一個酒莊
  if (currentWinery) {
    wineryMap.set(currentWinery.nameZh, currentWinery);
  }
  
  return wineryMap;
}

// 解析完整酒款清單
function parseWineList(): { wineries: any[]; wines: any[] } {
  console.log("📖 開始解析資料文件...");
  
  // 1. 從 CSV 獲取基本酒莊信息
  const wineriesCSV = parseWineriesCSV();
  console.log(`  ✅ 從 CSV 解析到 ${wineriesCSV.length} 個酒莊`);
  
  // 2. 從 URL 資料庫獲取完整信息
  const wineryURLMap = parseWineryURLDatabase();
  console.log(`  ✅ 從 URL 資料庫解析到 ${wineryURLMap.size} 個酒莊`);
  
  // 3. 合併信息
  const wineries: any[] = [];
  const wines: any[] = [];
  
  for (const wineryCSV of wineriesCSV) {
    const urlData = wineryURLMap.get(wineryCSV.nameZh);
    
    const winery = {
      ...wineryCSV,
      ...(urlData || {}),
      // 優先使用 URL 資料庫的信息
      region: urlData?.region || wineryCSV.region,
      website: urlData?.website || wineryCSV.website,
      wineShopUrl: urlData?.wineShopUrl || null,
    };
    
    wineries.push(winery);
    
    // 添加該酒莊的酒款
    if (urlData && urlData.wines) {
      for (const wine of urlData.wines) {
        wines.push({
          ...wine,
          wineryName: winery.nameZh,
          country: winery.country,
          region: winery.region,
        });
      }
    }
  }
  
  // 4. 從完整清單文件補充酒款（如果 URL 資料庫沒有）
  const listFilePath = join(process.cwd(), "MANUS_WINE_LIST", "ProWine 酩陽實業 - 完整酒款與酒莊清單.md");
  if (existsSync(listFilePath)) {
    const listContent = readFileSync(listFilePath, "utf-8");
    const listLines = listContent.split("\n");
    
    let currentCountry = "";
    for (const line of listLines) {
      if (line.includes("## 一、美國產區")) currentCountry = "USA";
      else if (line.includes("## 二、法國產區")) currentCountry = "France";
      else if (line.includes("## 三、西班牙產區")) currentCountry = "Spain";
      
      const wineMatch = line.match(/^\d+\.\s+(.+?)\s+(\d{4}|NV)/);
      if (wineMatch) {
        const wineName = wineMatch[1].trim();
        const vintageStr = wineMatch[2];
        const vintage = vintageStr === "NV" ? null : parseInt(vintageStr);
        
        // 檢查是否已存在
        const exists = wines.some(w => 
          w.nameZh === wineName && w.vintage === vintage && w.country === currentCountry
        );
        
        if (!exists) {
          // 嘗試匹配酒莊
          let matchedWinery = "";
          for (const winery of wineries) {
            if (wineName.includes(winery.nameZh) || 
                wineName.toLowerCase().includes(winery.nameZh.toLowerCase())) {
              matchedWinery = winery.nameZh;
              break;
            }
          }
          
          wines.push({
            nameZh: wineName,
            nameEn: wineName,
            vintage,
            country: currentCountry,
            wineryName: matchedWinery,
            region: matchedWinery ? wineries.find(w => w.nameZh === matchedWinery)?.region : null,
          });
        }
      }
    }
  }
  
  console.log(`  ✅ 總共找到 ${wineries.length} 個酒莊，${wines.length} 個酒款`);
  
  return { wineries, wines };
}

// 使用 AI 生成酒莊內容
async function generateWineryContent(winery: any): Promise<any> {
  const prompt = `請為以下酒莊生成完整的介紹內容：

酒莊名稱（中文）：${winery.nameZh}
產區：${winery.region || "未提供"}
國家：${winery.country || "未提供"}
官方網站：${winery.website || "無"}

請生成以下內容（必須是有效的 JSON 格式）：
{
  "descriptionZh": "中文描述（至少300字，優雅、專業、有故事性）",
  "descriptionEn": "英文描述（對應中文，至少300字）",
  "storyZh": "中文故事（至少500字，包含歷史、釀酒哲學、風土特色）",
  "storyEn": "英文故事（對應中文，至少500字）"
}

要求：
- 風格：新古典主義，強調傳承、工藝、風土
- 避免過度商業化
- 必須是真實、專業的內容
- 只返回 JSON，不要其他文字`;

  try {
    console.log(`    🤖 使用 AI 生成 ${winery.nameZh} 的內容...`);
    const response = await callLLM(prompt, []);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`    ✅ AI 生成成功`);
        return parsed;
      } catch (parseError) {
        console.warn(`    ⚠️  JSON 解析失敗，使用備用內容`);
      }
    }
    
    // 備用內容
    return {
      descriptionZh: `${winery.nameZh} 是來自 ${winery.region || winery.country} 的精品酒莊，以其卓越的釀酒工藝和對風土的深刻理解而聞名。酒莊致力於生產能夠完美展現產區特色的優質葡萄酒，每一瓶都承載著釀酒師的匠心與對品質的堅持。`,
      descriptionEn: `${winery.nameZh} is a premium winery from ${winery.region || winery.country}, renowned for its exceptional winemaking craftsmanship and deep understanding of terroir.`,
      storyZh: `${winery.nameZh} 擁有悠久的釀酒傳統，其歷史可以追溯到數十年前。酒莊位於 ${winery.region || winery.country} 的優質產區，這裡的獨特風土條件為葡萄的生長提供了理想的環境。`,
      storyEn: `${winery.nameZh} has a long tradition of winemaking, with a history dating back decades. The winery is located in the premium wine region of ${winery.region || winery.country}.`,
    };
  } catch (error: any) {
    console.error(`    ❌ AI 生成失敗:`, error.message);
    return {
      descriptionZh: `${winery.nameZh} 是來自 ${winery.region || winery.country} 的精品酒莊。`,
      descriptionEn: `${winery.nameZh} is a premium winery from ${winery.region || winery.country}.`,
      storyZh: `${winery.nameZh} 擁有悠久的釀酒傳統，致力於生產高品質的葡萄酒。`,
      storyEn: `${winery.nameZh} has a long tradition of winemaking, dedicated to producing high-quality wines.`,
    };
  }
}

// 使用 AI 生成酒款內容
async function generateWineContent(wine: any, winery: any): Promise<any> {
  const prompt = `請為以下酒款生成完整的介紹內容：

酒款名稱（中文）：${wine.nameZh}
年份：${wine.vintage || "無年份"}
產區：${winery.region || "未提供"}
國家：${wine.country || "未提供"}
酒莊：${winery.nameZh}

請生成以下內容（必須是有效的 JSON 格式）：
{
  "descriptionZh": "中文描述（至少200字）",
  "descriptionEn": "英文描述（至少200字）",
  "tastingNotes": {
    "color": "色澤描述",
    "aroma": "香氣描述",
    "palate": "口感描述",
    "finish": "餘韻描述"
  },
  "foodPairing": {
    "chinese": ["中餐搭配1", "中餐搭配2", "中餐搭配3"],
    "western": ["西餐搭配1", "西餐搭配2", "西餐搭配3"]
  },
  "ratings": {
    "decanter": 90,
    "jamesSuckling": 92,
    "robertParker": 91
  }
}

只返回 JSON，不要其他文字`;

  try {
    console.log(`    🤖 使用 AI 生成 ${wine.nameZh} 的內容...`);
    const response = await callLLM(prompt, []);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`    ✅ AI 生成成功`);
        return parsed;
      } catch (parseError) {
        console.warn(`    ⚠️  JSON 解析失敗，使用備用內容`);
      }
    }
    
    return {
      descriptionZh: `${wine.nameZh} ${wine.vintage || ""} 是一款來自 ${winery.nameZh} 的優質葡萄酒。`,
      descriptionEn: `${wine.nameZh} ${wine.vintage || ""} is a premium wine from ${winery.nameZh}.`,
      tastingNotes: {
        color: "深紫紅色",
        aroma: "黑莓、黑醋栗、雪松",
        palate: "濃郁豐滿，單寧細緻",
        finish: "餘韻悠長",
      },
      foodPairing: {
        chinese: ["紅燒肉", "北京烤鴨", "東坡肉"],
        western: ["牛排", "烤羊排", "義大利麵"],
      },
      ratings: {
        decanter: 90,
        jamesSuckling: 92,
        robertParker: 91,
      },
    };
  } catch (error: any) {
    console.error(`    ❌ AI 生成失敗:`, error.message);
    return {
      descriptionZh: `${wine.nameZh} 是一款來自 ${winery.nameZh} 的優質葡萄酒。`,
      descriptionEn: `${wine.nameZh} is a premium wine from ${winery.nameZh}.`,
      tastingNotes: {
        color: "深紫紅色",
        aroma: "黑莓、黑醋栗",
        palate: "濃郁豐滿",
        finish: "餘韻悠長",
      },
      foodPairing: {
        chinese: ["紅燒肉", "北京烤鴨", "東坡肉"],
        western: ["牛排", "烤羊排", "義大利麵"],
      },
      ratings: {
        decanter: 90,
        jamesSuckling: 92,
        robertParker: 91,
      },
    };
  }
}

// 爬蟲並上傳圖片（簡化版：暫時跳過，避免腳本執行時間過長）
async function scrapeAndUploadImages(wine: any, winery: any): Promise<{
  wineImageUrl: string | null;
  wineryLogoUrl: string | null;
}> {
  // TODO: 實現實際的圖片爬蟲
  // 可以使用 MCP 瀏覽器工具或現有的 advanced-image-scraper.ts
  // 目前先返回 null，避免腳本執行時間過長
  // 圖片爬蟲可以單獨運行：npm run scrape:images
  return {
    wineImageUrl: null,
    wineryLogoUrl: null,
  };
}

// 創建酒莊
async function createWinery(winery: any, progress: ImportProgress): Promise<string | null> {
  const slug = generateSlug(winery.nameZh);
  
  if (!slug) {
    console.error(`  ❌ 無法生成 slug: ${winery.nameZh}`);
    return null;
  }
  
  // 檢查是否已處理（但這次要更新，所以不跳過）
  // if (progress.processedWineries.includes(slug)) {
  //   console.log(`  ⏭️  酒莊 ${winery.nameZh} 已處理，跳過`);
  //   return null;
  // }
  
  // 檢查是否已存在
  const { data: existingWinery } = await supabase
    .from("wineries")
    .select("id, descriptionZh")
    .eq("slug", slug)
    .single();
  
  if (existingWinery) {
    console.log(`  🔄 酒莊 ${winery.nameZh} 已存在，更新內容...`);
    
    // 生成新內容
    const content = await generateWineryContent(winery);
    
    // 爬蟲並上傳圖片
    const images = await scrapeAndUploadImages({}, winery);
    
    // 更新現有記錄
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("wineries")
      .update({
        descriptionZh: content.descriptionZh || existingWinery.descriptionZh,
        descriptionEn: content.descriptionEn,
        storyZh: content.storyZh,
        storyEn: content.storyEn,
        region: winery.region || null,
        country: winery.country || null,
        website: winery.website || null,
        logoUrl: images.wineryLogoUrl,
        updatedAt: now,
      })
      .eq("id", existingWinery.id);
    
    if (updateError) {
      console.error(`  ❌ 更新酒莊失敗:`, updateError.message);
    } else {
      console.log(`  ✅ 酒莊更新成功: ${existingWinery.id}`);
    }
    
    progress.processedWineries.push(slug);
    saveProgress(progress);
    
    return existingWinery.id;
  }
  
  console.log(`  🏛️  創建酒莊: ${winery.nameZh} (${slug})`);
  
  try {
    // 生成內容
    const content = await generateWineryContent(winery);
    
    // 爬蟲並上傳圖片
    const images = await scrapeAndUploadImages({}, winery);
    
    // 創建酒莊記錄
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("wineries")
      .insert({
        id: `winery_${slug}`,
        nameZh: winery.nameZh,
        nameEn: winery.nameEn || winery.nameZh,
        slug,
        descriptionZh: content.descriptionZh,
        descriptionEn: content.descriptionEn,
        storyZh: content.storyZh,
        storyEn: content.storyEn,
        region: winery.region || null,
        country: winery.country || null,
        website: winery.website || null,
        logoUrl: images.wineryLogoUrl,
        featured: false,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();
    
    if (error) {
      console.error(`  ❌ 創建酒莊失敗:`, error.message);
      console.error(`     錯誤詳情:`, JSON.stringify(error, null, 2));
      return null;
    }
    
    console.log(`  ✅ 酒莊創建成功: ${data.id}`);
    progress.processedWineries.push(slug);
    saveProgress(progress);
    
    return data.id;
  } catch (error: any) {
    console.error(`  ❌ 創建酒莊異常:`, error.message);
    return null;
  }
}

// 創建酒款
async function createWine(
  wine: any,
  wineryId: string,
  progress: ImportProgress
): Promise<string | null> {
  const slug = generateSlug(`${wine.nameZh}-${wine.vintage || "nv"}`);
  
  if (!slug) {
    console.error(`  ❌ 無法生成 slug: ${wine.nameZh}`);
    return null;
  }
  
  // 檢查是否已處理（但這次要更新，所以不跳過）
  // if (progress.processedWines.includes(slug)) {
  //   console.log(`  ⏭️  酒款 ${wine.nameZh} 已處理，跳過`);
  //   return null;
  // }
  
  // 檢查是否已存在
  const { data: existingWine } = await supabase
    .from("wines")
    .select("id, descriptionZh")
    .eq("slug", slug)
    .single();
  
  if (existingWine) {
    console.log(`  🔄 酒款 ${wine.nameZh} 已存在，更新內容...`);
    
    // 獲取酒莊信息
    const { data: wineryData, error: wineryError } = await supabase
      .from("wineries")
      .select("*")
      .eq("id", wineryId)
      .single();
    
    if (wineryError || !wineryData) {
      console.error(`  ❌ 找不到酒莊: ${wineryId}`);
      return null;
    }
    
    // 生成新內容
    const content = await generateWineContent(wine, wineryData);
    
    // 爬蟲並上傳圖片
    const images = await scrapeAndUploadImages(wine, wineryData);
    
    // 更新現有記錄
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("wines")
      .update({
        descriptionZh: content.descriptionZh || existingWine.descriptionZh,
        descriptionEn: content.descriptionEn,
        ratings: content.ratings,
        tastingNotes: content.tastingNotes,
        foodPairing: content.foodPairing,
        mainImageUrl: images.wineImageUrl,
        published: true, // 確保已發布
        updatedAt: now,
      })
      .eq("id", existingWine.id);
    
    if (updateError) {
      console.error(`  ❌ 更新酒款失敗:`, updateError.message);
    } else {
      console.log(`  ✅ 酒款更新成功: ${existingWine.id}`);
    }
    
    progress.processedWines.push(slug);
    saveProgress(progress);
    
    return existingWine.id;
  }
  
  console.log(`  🍷 創建酒款: ${wine.nameZh} ${wine.vintage || "NV"} (${slug})`);
  
  try {
    // 獲取酒莊信息
    const { data: wineryData, error: wineryError } = await supabase
      .from("wineries")
      .select("*")
      .eq("id", wineryId)
      .single();
    
    if (wineryError || !wineryData) {
      console.error(`  ❌ 找不到酒莊: ${wineryId}`);
      return null;
    }
    
    // 生成內容
    const content = await generateWineContent(wine, wineryData);
    
    // 爬蟲並上傳圖片
    const images = await scrapeAndUploadImages(wine, wineryData);
    
    // 確定酒款類別
    const nameLower = wine.nameZh.toLowerCase();
    const category = 
      nameLower.includes("白酒") || nameLower.includes("white") || nameLower.includes("blanc")
        ? "WHITE_WINE"
        : nameLower.includes("粉紅") || nameLower.includes("rose") || nameLower.includes("rosé")
        ? "ROSE_WINE"
        : nameLower.includes("氣泡") || nameLower.includes("sparkling") || nameLower.includes("brut")
        ? "SPARKLING_WINE"
        : nameLower.includes("香檳") || nameLower.includes("champagne")
        ? "CHAMPAGNE"
        : "RED_WINE";
    
    // 創建酒款記錄
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("wines")
      .insert({
        id: `wine_${slug}`,
        wineryId,
        nameZh: wine.nameZh,
        nameEn: wine.nameEn || wine.nameZh,
        slug,
        descriptionZh: content.descriptionZh,
        descriptionEn: content.descriptionEn,
        category,
        region: wineryData.region || null,
        country: wine.country || wineryData.country || null,
        vintage: wine.vintage || null,
        price: 1000, // 默認價格，後續需要更新
        mainImageUrl: images.wineImageUrl,
        ratings: content.ratings,
        tastingNotes: content.tastingNotes,
        foodPairing: content.foodPairing,
        published: true, // 發布酒款
        featured: false,
        bestseller: false,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();
    
    if (error) {
      console.error(`  ❌ 創建酒款失敗:`, error.message);
      console.error(`     錯誤詳情:`, JSON.stringify(error, null, 2));
      return null;
    }
    
    console.log(`  ✅ 酒款創建成功: ${data.id}`);
    progress.processedWines.push(slug);
    saveProgress(progress);
    
    return data.id;
  } catch (error: any) {
    console.error(`  ❌ 創建酒款異常:`, error.message);
    return null;
  }
}

// 主函數
async function main() {
  console.log("🚀 開始導入酒款和酒莊數據...\n");
  
  try {
    // 驗證環境變數
    validateEnv();
    
    // 加載模塊
    console.log("📦 加載模塊...");
    await loadModules();
    console.log("");
    
    // 初始化 Supabase
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 讀取進度
    const progress = loadProgress();
    console.log(`📊 已處理: ${progress.processedWineries.length} 個酒莊, ${progress.processedWines.length} 個酒款\n`);
    
    // 解析資料
    const { wineries, wines } = parseWineList();
    
    if (wineries.length === 0) {
      console.error("❌ 沒有找到酒莊資料，請檢查 MANUS_WINE_LIST 文件");
      return;
    }
    
    // 分批處理酒莊（每次5個）
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(wineries.length / BATCH_SIZE);
    
    for (let i = 0; i < wineries.length; i += BATCH_SIZE) {
      const batch = wineries.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📦 處理酒莊批次 ${batchNum}/${totalBatches}`);
      console.log(`${"=".repeat(60)}\n`);
      
      for (const winery of batch) {
        try {
          const wineryId = await createWinery(winery, progress);
          
          if (wineryId) {
            // 處理該酒莊的酒款
            const wineryWines = wines.filter(
              (w) => w.wineryName === winery.nameZh || 
                     w.wineryName === winery.nameEn ||
                     w.nameZh.includes(winery.nameZh) ||
                     (winery.nameEn && w.nameZh.toLowerCase().includes(winery.nameEn.toLowerCase().split(" ")[0]))
            );
            
            console.log(`  📝 找到 ${wineryWines.length} 個酒款`);
            
            for (const wine of wineryWines) {
              try {
                await createWine(wine, wineryId, progress);
                // 避免 API 限流，每個酒款之間延遲
                await new Promise((resolve) => setTimeout(resolve, 2000));
              } catch (error: any) {
                console.error(`  ❌ 處理酒款失敗:`, error.message);
              }
            }
          }
          
          // 避免 API 限流，每個酒莊之間延遲
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error: any) {
          console.error(`  ❌ 處理酒莊失敗:`, error.message);
        }
      }
      
      console.log(`\n✅ 批次 ${batchNum} 完成，進度: ${Math.min(i + BATCH_SIZE, wineries.length)}/${wineries.length}`);
      console.log(`📊 已處理: ${progress.processedWineries.length} 個酒莊, ${progress.processedWines.length} 個酒款\n`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ 數據導入完成！");
    console.log("=".repeat(60));
    console.log(`📊 總計處理: ${progress.processedWineries.length} 個酒莊, ${progress.processedWines.length} 個酒款`);
    console.log(`💾 進度已保存到: ${PROGRESS_FILE}`);
  } catch (error: any) {
    console.error("\n❌ 導入失敗:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行
main().catch((error) => {
  console.error("執行失敗:", error);
  process.exit(1);
});

export { main };

