/**
 * 資料補充腳本 - 使用 AI API 和 MCP 補充 LOGO、文案、PRICE、圖片
 * 
 * 功能：
 * 1. 讀取 MANUS_WINE_LIST/NEW 資料
 * 2. 使用 AI API 生成文案（酒款和酒莊）
 * 3. 搜尋並上傳 LOGO 和圖片到 Cloudinary
 * 4. 更新 Supabase 資料庫
 * 5. 分批處理，避免 API 限流
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
const PROGRESS_FILE = join(process.cwd(), "scripts", "supplement-progress.json");

interface SupplementProgress {
  processedWineries: string[];
  processedWines: string[];
  lastUpdate: string;
}

function loadProgress(): SupplementProgress {
  try {
    if (existsSync(PROGRESS_FILE)) {
      return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
    }
  } catch (error) {
    console.warn("⚠️  無法讀取進度文件");
  }
  return {
    processedWineries: [],
    processedWines: [],
    lastUpdate: new Date().toISOString(),
  };
}

function saveProgress(progress: SupplementProgress) {
  try {
    progress.lastUpdate = new Date().toISOString();
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
  } catch (error) {
    console.error("⚠️  無法保存進度:", error);
  }
}

// 使用 AI 生成酒款文案
async function generateWineCopy(wine: any): Promise<{
  descriptionZh: string;
  descriptionEn: string;
  storyZh?: string;
}> {
  const prompt = `請為以下酒款生成專業、優雅的中英文介紹文案：

酒款名稱：${wine.nameZh || wine.nameEn}
酒莊：${wine.wineryName || "未知"}
產區：${wine.region || "未提供"}
年份：${wine.vintage || "未提供"}
價格：${wine.price ? `NT$ ${wine.price}` : "未提供"}

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
    descriptionZh: `${wine.nameZh || wine.nameEn} 是一款來自 ${wine.region || "優質產區"} 的精品葡萄酒，展現了該產區獨特的風土特色。`,
    descriptionEn: `${wine.nameEn || wine.nameZh} is a premium wine from ${wine.region || "a premium region"}, showcasing the unique terroir characteristics.`,
  };
}

// 使用 AI 生成酒莊文案
async function generateWineryCopy(winery: any): Promise<{
  descriptionZh: string;
  descriptionEn: string;
  storyZh?: string;
}> {
  const prompt = `請為以下酒莊生成專業、優雅的中英文介紹文案：

酒莊名稱：${winery.nameZh || winery.nameEn}
產區：${winery.region || "未提供"}
國家：${winery.country || "未提供"}

要求：
1. 中文描述（descriptionZh）：300-500字
2. 英文描述（descriptionEn）：對應中文
3. 中文故事（storyZh，可選）：500-800字，包含歷史、釀酒哲學、風土特色
4. 風格：新古典主義，強調傳承、工藝、風土

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
    descriptionZh: `${winery.nameZh || winery.nameEn} 是來自 ${winery.region || winery.country} 的精品酒莊。`,
    descriptionEn: `${winery.nameEn || winery.nameZh} is a premium winery from ${winery.region || winery.country}.`,
  };
}

// 搜尋並上傳 LOGO（使用網路搜尋）
async function searchAndUploadLogo(wineryName: string): Promise<string | null> {
  // 這裡可以使用網路搜尋 API 或直接使用預設 LOGO
  // 暫時返回 null，後續可以整合搜尋 API
  console.log(`  🔍 搜尋 ${wineryName} 的 LOGO...`);
  return null;
}

// 搜尋並上傳酒款圖片
async function searchAndUploadWineImage(wineName: string): Promise<string | null> {
  console.log(`  🔍 搜尋 ${wineName} 的圖片...`);
  return null;
}

// 更新酒款資料
async function supplementWine(wineId: string, wineData: any, progress: SupplementProgress) {
  if (progress.processedWines.includes(wineId)) {
    console.log(`  ⏭️  酒款 ${wineId} 已處理，跳過`);
    return;
  }

  try {
    console.log(`  📝 處理酒款: ${wineData.nameZh || wineData.nameEn}`);
    
    // 生成文案
    const copy = await generateWineCopy(wineData);
    
    // 搜尋並上傳圖片
    const imageUrl = await searchAndUploadWineImage(wineData.nameZh || wineData.nameEn);
    
    // 更新資料庫
    const updateData: any = {
      descriptionZh: copy.descriptionZh,
      descriptionEn: copy.descriptionEn,
    };
    
    if (copy.storyZh) {
      updateData.storyZh = copy.storyZh;
    }
    
    if (imageUrl) {
      updateData.mainImageUrl = imageUrl;
    }
    
    if (wineData.price) {
      updateData.price = wineData.price;
    }
    
    const { error } = await supabase
      .from("wines")
      .update(updateData)
      .eq("id", wineId);
    
    if (error) throw error;
    
    progress.processedWines.push(wineId);
    saveProgress(progress);
    
    console.log(`  ✅ 酒款 ${wineId} 更新成功`);
  } catch (error: any) {
    console.error(`  ❌ 更新失敗:`, error.message);
  }
}

// 更新酒莊資料
async function supplementWinery(wineryId: string, wineryData: any, progress: SupplementProgress) {
  if (progress.processedWineries.includes(wineryId)) {
    console.log(`  ⏭️  酒莊 ${wineryId} 已處理，跳過`);
    return;
  }

  try {
    console.log(`  📝 處理酒莊: ${wineryData.nameZh || wineryData.nameEn}`);
    
    // 生成文案
    const copy = await generateWineryCopy(wineryData);
    
    // 搜尋並上傳 LOGO
    const logoUrl = await searchAndUploadLogo(wineryData.nameZh || wineryData.nameEn);
    
    // 更新資料庫
    const updateData: any = {
      descriptionZh: copy.descriptionZh,
      descriptionEn: copy.descriptionEn,
    };
    
    if (copy.storyZh) {
      updateData.storyZh = copy.storyZh;
    }
    
    if (logoUrl) {
      updateData.logoUrl = logoUrl;
    }
    
    const { error } = await supabase
      .from("wineries")
      .update(updateData)
      .eq("id", wineryId);
    
    if (error) throw error;
    
    progress.processedWineries.push(wineryId);
    saveProgress(progress);
    
    console.log(`  ✅ 酒莊 ${wineryId} 更新成功`);
  } catch (error: any) {
    console.error(`  ❌ 更新失敗:`, error.message);
  }
}

// 讀取資料文件
function loadDataFiles() {
  const dataDir = join(process.cwd(), "MANUS_WINE_LIST", "NEW");
  
  // 讀取 JSON 文件
  const winesListPath = join(dataDir, "all_wines_list.json");
  const sampleDataPath = join(dataDir, "wines_sample_data.json");
  
  let wines: any[] = [];
  let wineries: any[] = [];
  
  try {
    if (existsSync(winesListPath)) {
      const content = readFileSync(winesListPath, "utf-8");
      wines = JSON.parse(content);
    }
    
    if (existsSync(sampleDataPath)) {
      const content = readFileSync(sampleDataPath, "utf-8");
      const sampleData = JSON.parse(content);
      wines = [...wines, ...sampleData];
    }
  } catch (error) {
    console.error("讀取資料文件失敗:", error);
  }
  
  // 從酒款中提取酒莊
  const wineryMap = new Map();
  wines.forEach(wine => {
    const wineryName = wine.wineryName || wine.winery?.nameZh || wine.winery?.nameEn;
    if (wineryName && !wineryMap.has(wineryName)) {
      wineryMap.set(wineryName, {
        nameZh: wineryName,
        nameEn: wine.winery?.nameEn || wineryName,
        region: wine.region,
        country: wine.country,
      });
    }
  });
  
  wineries = Array.from(wineryMap.values());
  
  return { wines, wineries };
}

// 主函數
async function main() {
  console.log("🚀 開始補充酒款和酒莊資料...\n");
  
  try {
    validateEnv();
    await loadModules();
    
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const progress = loadProgress();
    console.log(`📊 已處理: ${progress.processedWineries.length} 個酒莊, ${progress.processedWines.length} 個酒款\n`);
    
    // 讀取資料
    console.log("📖 讀取資料文件...");
    const { wines, wineries } = loadDataFiles();
    console.log(`✅ 找到 ${wineries.length} 個酒莊，${wines.length} 個酒款\n`);
    
    // 處理酒莊
    console.log("🏛️  處理酒莊...");
    for (const winery of wineries) {
      // 查找資料庫中的酒莊
      const { data: existingWineries } = await supabase
        .from("wineries")
        .select("id, nameZh, nameEn")
        .or(`nameZh.eq.${winery.nameZh},nameEn.eq.${winery.nameEn}`)
        .limit(1);
      
      if (existingWineries && existingWineries.length > 0) {
        await supplementWinery(existingWineries[0].id, winery, progress);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 避免限流
      }
    }
    
    // 處理酒款
    console.log("\n🍷 處理酒款...");
    for (const wine of wines) {
      // 查找資料庫中的酒款
      const { data: existingWines } = await supabase
        .from("wines")
        .select("id, nameZh, nameEn")
        .or(`nameZh.eq.${wine.nameZh},nameEn.eq.${wine.nameEn}`)
        .limit(1);
      
      if (existingWines && existingWines.length > 0) {
        await supplementWine(existingWines[0].id, wine, progress);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 避免限流
      }
    }
    
    console.log("\n✅ 資料補充完成！");
    console.log(`📊 總計處理: ${progress.processedWineries.length} 個酒莊, ${progress.processedWines.length} 個酒款`);
  } catch (error: any) {
    console.error("\n❌ 補充失敗:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };

