/**
 * PROWINE 完整酒款照片爬蟲系統
 * 
 * 功能：
 * 1. 從 PROWINE.COM.TW 爬取所有酒款照片
 * 2. 使用 AI Vision 驗證圖片品質
 * 3. 自動更新 Supabase 資料庫
 * 4. 使用 MCP 工具和 AI API 增強爬蟲能力
 * 
 * 執行方式：
 * npx tsx scripts/scrape-all-wine-images-from-prowine.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";
import * as cheerio from "cheerio";
import { readFileSync, writeFileSync, existsSync } from "fs";
// 直接使用 Cloudinary SDK，不依赖 lib/upload（避免 ES module 导入问题）
import { v2 as cloudinary } from "cloudinary";

// 配置 Cloudinary
// 從環境變數或直接設置（用戶提供的憑證）
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dsgvbsj9k";
let apiKey = process.env.CLOUDINARY_API_KEY || "WBzabsfAJFZ9rHhuk0RDSQlifwU";
let apiSecret = process.env.CLOUDINARY_API_SECRET || "341388744959128";

// 如果從 CLOUDINARY_URL 解析（格式：cloudinary://api_key:api_secret@cloud_name）
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    apiKey = match[1];
    apiSecret = match[2];
    const urlCloudName = match[3];
    if (urlCloudName) {
      // cloudName 已經設置，不需要從 URL 獲取
    }
  }
}

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName.replace(/^@+/, '').trim(),
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log(`✅ Cloudinary 已配置: ${cloudName.replace(/^@+/, '').trim()}`);
} else {
  console.warn(`⚠️  Cloudinary 配置不完整，將跳過上傳功能`);
}

// 設置 UTF-8 編碼（確保中文正常顯示）
if (typeof process !== 'undefined' && process.stdout) {
  try {
    if (process.platform === 'win32') {
      // Windows 系統設置 UTF-8
      process.stdout.setDefaultEncoding('utf8');
      if (process.stdout.setEncoding) {
        process.stdout.setEncoding('utf8');
      }
    }
  } catch (e) {
    // 忽略錯誤
  }
}

// 加載環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

// 設置用戶提供的 API 密鑰
if (!process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_AI_STUDIO_API_KEY) {
  process.env.GOOGLE_AI_API_KEY = "AIzaSyBL360nVfkqZSxeTEJbjGWJ9Gn77uEz5wY";
}

if (!process.env.CLOUDINARY_API_KEY) {
  process.env.CLOUDINARY_API_KEY = "WBzabsfAJFZ9rHhuk0RDSQlifwU";
  process.env.CLOUDINARY_API_SECRET = "341388744959128";
  process.env.CLOUDINARY_CLOUD_NAME = "dsgvbsj9k";
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

validateEnv();

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 進度記錄
const PROGRESS_FILE = join(process.cwd(), "scripts", "wine-images-scrape-progress.json");

interface ScrapeProgress {
  processedWines: string[];
  failedWines: Array<{ id: string; name: string; error: string }>;
  updatedWines: string[];
  skippedWines: string[];
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
    failedWines: [],
    updatedWines: [],
    skippedWines: [],
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
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 配置
const CONFIG = {
  requestDelay: 2000, // 請求間隔（毫秒）
  maxRetries: 3, // 最大重試次數
  timeout: 60000, // 請求超時（毫秒）- 增加到60秒
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  prowineBaseUrl: "http://prowine.com.tw", // 使用 http 避免 SSL 問題
};

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
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
    },
    ...options,
  };

  // 保存原始URL用於調試和實際fetch
  const savedUrlForFetch = String(url);
  
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
      
      // 調試：記錄實際發送的URL（僅第一次）
      if (i === 0) {
        console.log(`    🔍 [DEBUG FETCH] 實際發送URL: ${savedUrlForFetch}`);
      }
      
      const response = await fetch(savedUrlForFetch, {
        ...defaultOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // 如果是404，說明URL正確但頁面不存在，不需要重試
      // 不包含URL在錯誤信息中，讓外層處理錯誤顯示
      if (response.status === 404) {
        const error = new Error('Page not found (404)');
        (error as any).status = 404;
        throw error;
      }
      
      if (i < retries - 1) {
        await delay(CONFIG.requestDelay * (i + 1));
      }
    } catch (error: any) {
      if (i === retries - 1) {
        // 不包含URL在錯誤信息中，讓外層處理錯誤顯示
        // 只保留錯誤類型信息
        if (error.status === 404) {
          const err = new Error('Page not found (404)');
          (err as any).status = 404;
          throw err;
        }
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          throw new Error('Request timeout');
        }
        // 完全移除錯誤對象中的所有URL和域名
        const errorDetails = error.message || String(error);
        const cleanErrorMsg = errorDetails
          .replace(/https?:\/\/[^\s\)]+/g, '')
          .replace(/[^\s]+\.(com|tw|org|net)[^\s\)]*/g, '')
          .replace(/[^\s]+wine=[^\s\)]+/gi, '')
          .trim();
        throw new Error(`Failed to fetch after ${retries} retries${cleanErrorMsg ? ': ' + cleanErrorMsg : ''}`);
      }
      await delay(CONFIG.requestDelay * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

/**
 * 獲取酒莊信息
 */
async function getWineryInfo(wineryId: string): Promise<{ nameZh: string; nameEn: string } | null> {
  try {
    const { data: winery, error } = await supabase
      .from('wineries')
      .select('nameZh, nameEn')
      .eq('id', wineryId)
      .single();
    
    if (error || !winery) {
      return null;
    }
    
    return { nameZh: winery.nameZh, nameEn: winery.nameEn };
  } catch {
    return null;
  }
}

/**
 * 生成酒款 URL slug（多種變體）
 */
function generateWineSlugVariants(wineName: string): string[] {
  const slugs: string[] = [];
  
  // 方法1: 直接轉換（保留所有字符，但先處理特殊字符）
  // 先處理法文特殊字符，避免被移除
  const normalized = wineName
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[ý]/g, 'y');
  
  slugs.push(
    normalized
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
  
  // 方法2: 移除年份
  const withoutYear = wineName.replace(/\d{4}/g, '').trim();
  if (withoutYear !== wineName) {
    slugs.push(
      withoutYear
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    );
  }
  
  // 方法3: 移除特殊後綴（NV, AOC, etc.）
  const withoutSuffix = wineName
    .replace(/\s+(nv|aoc|igp|igp|igp|igp)\s*$/i, '')
    .replace(/\s+(rouge|red|blanc|white|rose|rosé)\s*$/i, '')
    .trim();
  if (withoutSuffix !== wineName) {
    slugs.push(
      withoutSuffix
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    );
  }
  
  // 方法4: 只保留主要關鍵字（移除常見詞）
  const stopWords = ['the', 'of', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'de', 'du', 'des', 'la', 'le', 'les'];
  const keywords = wineName
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.includes(w.toLowerCase()) && !/^\d+$/.test(w));
  if (keywords.length > 0) {
    slugs.push(
      keywords
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    );
  }
  
  // 方法5: 移除所有特殊字符（包括連字符）
  slugs.push(
    wineName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
  
  // 方法6: 簡化版本（只保留前幾個單詞）
  const words = wineName.split(/\s+/).slice(0, 5);
  if (words.length > 0) {
    slugs.push(
      words
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    );
  }
  
  // 去重並過濾空值
  return [...new Set(slugs.filter(s => s.length > 0 && s.length < 100))];
}

/**
 * 從 PROWINE.COM.TW 爬取酒款照片和介紹
 */
interface ScrapedWineData {
  imageUrl: string | null;
  description: string | null;
  price: number | null;
}

async function scrapeWineFromProwine(
  wineNameZh: string,
  wineNameEn: string,
  wineSlug?: string,
  wineryInfo?: { nameZh: string; nameEn: string } | null,
  country?: string | null,
  category?: string | null,
  isRecursive: boolean = false // 防止無限遞歸
): Promise<ScrapedWineData> {
  const result: ScrapedWineData = {
    imageUrl: null,
    description: null,
    price: null,
  };

  try {
    // 構建可能的 URL（根據實際頁面格式：?wine=slug）
    const slugs: string[] = [];
    
    // 1. 使用資料庫中的 slug（如果有的話）
    if (wineSlug) {
      slugs.push(wineSlug);
    }
    
    // 2. 生成多種變體
    slugs.push(...generateWineSlugVariants(wineNameEn));
    slugs.push(...generateWineSlugVariants(wineNameZh));
    
    // 3. 處理特殊情況（移除中文、法文特殊字符）
    const cleanEn = wineNameEn
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n');
    if (cleanEn !== wineNameEn) {
      slugs.push(...generateWineSlugVariants(cleanEn));
    }
    
    // 4. 嘗試使用酒莊名稱 + 酒款關鍵字
    if (wineryInfo) {
      const winerySlug = generateWineSlugVariants(wineryInfo.nameEn)[0] || '';
      const winePart = wineNameEn.replace(wineryInfo.nameEn, '').trim();
      if (winePart.length > 5 && winerySlug) {
        const winePartSlug = generateWineSlugVariants(winePart)[0] || '';
        if (winePartSlug) {
          slugs.push(`${winerySlug}-${winePartSlug}`);
          slugs.push(`${winerySlug}-${winePartSlug.replace(/\d{4}/g, '').trim()}`);
        }
      }
    }
    
    // 5. 嘗試搜索頁面（如果直接訪問失敗）
    // 生成搜索關鍵字（簡化版本）
    const searchKeywords = wineNameEn
      .split(/\s+/)
      .filter(w => w.length > 3 && !/^\d+$/.test(w))
      .slice(0, 3)
      .join(' ');
    if (searchKeywords) {
      slugs.push(`search-${generateWineSlugVariants(searchKeywords)[0] || ''}`);
    }
    
    // 6. 嘗試通過分類瀏覽（如果知道國家和類別）
    if (country) {
      const countryMap: Record<string, string> = {
        'France': 'france',
        'USA': 'usa',
        'United States': 'usa',
        'Spain': 'spain',
      };
      const countrySlug = countryMap[country] || country.toLowerCase();
      if (countrySlug) {
        slugs.push(`category-${countrySlug}`);
      }
    }
    
    // 去重
    const uniqueSlugs = [...new Set(slugs.filter(s => s.length > 0 && s.length < 150))];
    
    // 優先使用 ?wine= 格式（根據實際頁面）
    // 對 slug 進行 URL 編碼，確保特殊字符正確處理
    const possibleUrls: string[] = [];
    
    // 策略1: 先嘗試搜索頁面（更可靠，因為可以找到實際存在的URL）
    // 使用酒款名稱的關鍵字進行搜索
    const searchKeywordsForUrl = [
      wineNameEn.split(' ').filter(w => w.length > 3).slice(0, 3).join(' '), // 前3個長單詞
      wineNameZh.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '').trim().split(/\s+/).slice(0, 2).join(' '), // 中文關鍵字
    ].filter(k => k.length > 0);
    
    // 添加更寬鬆的搜索關鍵字（處理特殊字符，如 Ca'momi -> Camomi）
    const normalizedWineNameEn = wineNameEn.replace(/['"]/g, '').replace(/[^\w\s]/g, ' ').trim();
    if (normalizedWineNameEn !== wineNameEn && normalizedWineNameEn.length > 0) {
      const normalizedKeywords = normalizedWineNameEn.split(' ').filter(w => w.length > 3).slice(0, 3).join(' ');
      if (normalizedKeywords && !searchKeywordsForUrl.includes(normalizedKeywords)) {
        searchKeywordsForUrl.push(normalizedKeywords);
      }
    }
    
    // 添加單個品牌名搜索（如只搜索 "Camomi"）
    const brandName = wineNameEn.split(' ')[0].replace(/['"]/g, '').trim();
    if (brandName.length > 3 && !searchKeywordsForUrl.some(k => k.includes(brandName))) {
      searchKeywordsForUrl.push(brandName);
    }
    
    for (const keyword of searchKeywordsForUrl) {
      if (keyword.length > 0) {
        possibleUrls.push(`${CONFIG.prowineBaseUrl}/?s=${encodeURIComponent(keyword)}`);
      }
    }
    
    // 策略2: 嘗試直接URL（使用所有slug變體）
    for (const slug of uniqueSlugs) {
      // 如果是搜索關鍵字，使用搜索頁面
      if (slug.startsWith('search-')) {
        const searchTerm = slug.replace('search-', '');
        possibleUrls.push(`${CONFIG.prowineBaseUrl}/?s=${encodeURIComponent(searchTerm)}`);
      } else if (slug.startsWith('category-')) {
        // 分類瀏覽頁面
        const categorySlug = slug.replace('category-', '');
        possibleUrls.push(`${CONFIG.prowineBaseUrl}/?wine_area=${categorySlug}`);
      } else {
        // 直接訪問酒款頁面
        const encodedSlug = encodeURIComponent(slug);
        possibleUrls.push(`${CONFIG.prowineBaseUrl}/?wine=${encodedSlug}`);
        // 也嘗試不使用編碼（某些網站可能不需要）
        possibleUrls.push(`${CONFIG.prowineBaseUrl}/?wine=${slug}`);
      }
    }
    
    console.log(`    📝 生成 ${uniqueSlugs.length} 個 URL 變體`);
    if (uniqueSlugs.length > 0) {
      console.log(`    📋 變體列表: ${uniqueSlugs.slice(0, 5).join(', ')}${uniqueSlugs.length > 5 ? '...' : ''}`);
    }
    
    // 調試：記錄possibleUrls數組的前幾個URL
    if (possibleUrls.length > 0) {
      console.log(`    🔍 [DEBUG] possibleUrls數組前3個URL:`);
      for (let j = 0; j < Math.min(3, possibleUrls.length); j++) {
        console.log(`      [${j}]: ${possibleUrls[j]}`);
      }
    }

    for (let i = 0; i < possibleUrls.length; i++) {
      // 使用索引訪問，確保URL不會被修改
      // 立即保存原始URL，避免任何可能的修改
      const urlAtIndex = String(possibleUrls[i]);
      // 立即保存所有需要的URL變量，使用深拷貝確保完全獨立
      const originalUrl = String(urlAtIndex);
      const displayUrl = decodeURIComponent(String(urlAtIndex));
      // 使用模板字符串創建新字符串，確保完全獨立
      const savedDisplayUrl = `${displayUrl}`;
      // 額外保存一份用於錯誤顯示（100%確保不變）
      const errorDisplayUrl = String(savedDisplayUrl);
      // 保存url變量用於後續檢查（與urlAtIndex相同）
      const url = urlAtIndex;
      
      // 調試：記錄所有URL變量的值
      if (i === 0) {
        console.log(`    🔍 [DEBUG] possibleUrls[${i}]: ${possibleUrls[i]}`);
        console.log(`    🔍 [DEBUG] urlAtIndex: ${urlAtIndex}`);
        console.log(`    🔍 [DEBUG] originalUrl: ${originalUrl}`);
        console.log(`    🔍 [DEBUG] displayUrl: ${displayUrl}`);
        console.log(`    🔍 [DEBUG] errorDisplayUrl: ${errorDisplayUrl}`);
      }
      
      try {
        await delay(CONFIG.requestDelay);
        // 顯示實際嘗試的 URL（解碼後更易讀）
        // 使用字符串拼接而不是模板字符串，確保URL不被修改
        const tryPrefix = '    🔍 嘗試 URL: ';
        const tryMsg = tryPrefix + errorDisplayUrl;
        process.stdout.write(tryMsg + '\n');
        
        const response = await fetchWithRetry(originalUrl);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // 提取關鍵字函數
        const extractKeywords = (text: string): string[] => {
          return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3)
            .slice(0, 5); // 只取前5個關鍵字
        };
        
        const wineKeywordsEn = extractKeywords(wineNameEn);
        const wineKeywordsZh = extractKeywords(wineNameZh);
        
        // 如果是分類瀏覽頁面，從列表中找到匹配的酒款
        if (url.includes('?wine_area=') || url.includes('?wine_categories=') || url.includes('?wine_type=')) {
          // 分類頁面：查找包含酒款名稱的鏈接（更嚴格的匹配）
          // 嘗試多種選擇器來找到酒款鏈接
          const allWineLinks = $('a[href*="?wine="], a[href*="wine="], .wine-item a, .product-item a, article a, .entry a');
          type MatchResult = {
            link: string;
            score: number;
            text: string;
          };
          let bestMatch: MatchResult | null = null;
          
          console.log(`    🔍 分類頁面找到 ${allWineLinks.length} 個可能的鏈接`);
          
          allWineLinks.each((_, el) => {
            const linkText = $(el).text().trim();
            const href = $(el).attr('href') || '';
            if (!href || !href.includes('wine=')) return; // 只處理包含wine=的鏈接
            
            const linkLower = linkText.toLowerCase();
            const hrefLower = href.toLowerCase();
            
            // 計算匹配分數（更嚴格的匹配）
            let score = 0;
            
            const wineNameEnLower = wineNameEn.toLowerCase();
            const wineNameZhLower = wineNameZh.toLowerCase();
            
            // 1. 檢查是否包含完整的酒莊名稱（必須匹配）
            // 提取酒莊名稱（第一個單詞或前兩個單詞）
            const wineryNameParts = wineNameEnLower.split(/\s+/).slice(0, 2);
            const hasWineryMatch = wineryNameParts.some(part => 
              part.length > 4 && linkLower.includes(part)
            );
            
            if (!hasWineryMatch && wineryInfo) {
              // 如果沒有匹配，嘗試使用酒莊信息
              const wineryEnLower = wineryInfo.nameEn.toLowerCase();
              const wineryZhLower = wineryInfo.nameZh.toLowerCase();
              const hasWineryInfoMatch = 
                linkLower.includes(wineryEnLower.substring(0, Math.min(10, wineryEnLower.length))) ||
                linkLower.includes(wineryZhLower.substring(0, Math.min(5, wineryZhLower.length)));
              if (!hasWineryInfoMatch) {
                return; // 如果連酒莊都不匹配，直接跳過
              }
            }
            
            // 2. 檢查鏈接文本是否包含酒款關鍵字（更嚴格）
            const linkKeywords = extractKeywords(linkText);
            const matchedEn = wineKeywordsEn.filter(k => 
              k.length > 4 && linkKeywords.some(pk => pk.includes(k) || k.includes(pk))
            ).length;
            const matchedZh = wineKeywordsZh.filter(k => 
              k.length > 2 && linkKeywords.some(pk => pk.includes(k) || k.includes(pk))
            ).length;
            
            // 至少需要2個關鍵字匹配才給分
            if (matchedEn >= 2) {
              score += matchedEn * 15;
            }
            if (matchedZh >= 2) {
              score += matchedZh * 15;
            }
            
            // 3. 檢查URL slug是否包含酒款名稱（高權重）
            const wineSlugs = generateWineSlugVariants(wineNameEn);
            for (const slug of wineSlugs.slice(0, 3)) {
              if (slug.length > 10 && hrefLower.includes(slug.toLowerCase())) {
                score += 80; // 提高權重
                break;
              }
            }
            
            // 4. 檢查是否包含完整酒款名稱（部分匹配，但要求更長）
            const minMatchLength = Math.min(20, wineNameEnLower.length);
            if (linkLower.includes(wineNameEnLower.substring(0, minMatchLength))) {
              score += 50; // 提高權重
            }
            const minMatchLengthZh = Math.min(10, wineNameZhLower.length);
            if (linkLower.includes(wineNameZhLower.substring(0, minMatchLengthZh))) {
              score += 50;
            }
            
            // 5. 檢查href中是否包含關鍵字
            const hrefKeywords = extractKeywords(href);
            const hrefMatchedEn = wineKeywordsEn.filter(k => 
              k.length > 4 && hrefKeywords.some(pk => pk.includes(k) || k.includes(pk))
            ).length;
            if (hrefMatchedEn >= 2) {
              score += hrefMatchedEn * 20;
            }
            
            // 6. 負面匹配：如果包含明顯不同的酒莊名稱，降低分數
            const commonWineries = ['bastidonne', 'escaravailles', 'monardiere', 'bastide'];
            const linkWinery = commonWineries.find(w => linkLower.includes(w));
            const targetWinery = commonWineries.find(w => wineNameEnLower.includes(w));
            if (linkWinery && targetWinery && linkWinery !== targetWinery) {
              score -= 100; // 明顯不同的酒莊，大幅降低分數
            }
            
            // 如果匹配分數足夠高，記錄為最佳匹配（提高最低分數要求）
            if (score >= 40) {
              if (!bestMatch || score > bestMatch.score) {
                bestMatch = { link: href, score, text: linkText };
              }
            }
          });
          
          if (bestMatch !== null && (bestMatch as MatchResult).score >= 40) {
            const match = bestMatch as MatchResult;
            const fullUrl = match.link.startsWith('http') 
              ? match.link 
              : new URL(match.link, CONFIG.prowineBaseUrl).toString();
            console.log(`    ✅ 在分類頁面中找到匹配酒款（分數: ${match.score}，文本: ${match.text.substring(0, 50)}），訪問: ${fullUrl}`);
            
            // 訪問找到的鏈接
            try {
              await delay(CONFIG.requestDelay);
              const linkResponse = await fetchWithRetry(fullUrl);
              const linkHtml = await linkResponse.text();
              const $link = cheerio.load(linkHtml);
              
              // 驗證頁面是否匹配
              const linkH1Text = $link('h1').first().text().trim();
              const linkPageText = $link('body').text();
              const linkKeywords = extractKeywords(linkH1Text + ' ' + linkPageText.substring(0, 500));
              const matchedEn = wineKeywordsEn.filter(k => 
                k.length > 4 && linkKeywords.some(pk => pk.includes(k) || k.includes(pk))
              ).length;
              const matchedZh = wineKeywordsZh.filter(k => 
                k.length > 2 && linkKeywords.some(pk => pk.includes(k) || k.includes(pk))
              ).length;
              
              // 更嚴格的匹配要求：至少3個關鍵字匹配，或2個關鍵字+中文匹配
              if (matchedEn >= 3 || (matchedEn >= 2 && matchedZh >= 1)) {
                // 提取圖片和介紹（重用現有邏輯）
                const linkWineImages: Array<{ url: string; score: number }> = [];
                $link('img').each((_, imgEl) => {
                  const src = $link(imgEl).attr('src') || 
                             $link(imgEl).attr('data-src') || 
                             $link(imgEl).attr('data-lazy-src');
                  if (src && src.includes('/newsite/wp-content/uploads/')) {
                    const fullImageUrl = src.startsWith('http') ? src : new URL(src, fullUrl).toString();
                    linkWineImages.push({ url: fullImageUrl, score: 100 });
                  }
                });
                
                if (linkWineImages.length > 0) {
                  linkWineImages.sort((a, b) => b.score - a.score);
                  result.imageUrl = linkWineImages[0].url;
                }
                
                // 提取介紹
                const linkDescription = $link('.single-wine-content').text().trim() || 
                                       $link('h2:contains("酒品介紹")').nextUntil('h2').text().trim();
                if (linkDescription && linkDescription.length > 50) {
                  result.description = linkDescription.substring(0, 5000).trim();
                }
                
                // 提取價格
                const linkPriceText = $link('body').text();
                const linkPriceMatch = linkPriceText.match(/品酩價[：:]\s*(\d+)\s*元/);
                if (linkPriceMatch) {
                  result.price = parseInt(linkPriceMatch[1]);
                }
                
                if (result.imageUrl || result.description) {
                  console.log(`    ✅ 成功從分類頁面找到正確酒款: ${linkH1Text}`);
                  return result;
                }
              } else {
                console.log(`    ⚠️  分類頁面找到的鏈接不匹配（匹配度: ${matchedEn}），跳過`);
              }
            } catch (e: any) {
              console.log(`    ⚠️  訪問分類結果鏈接失敗: ${e.message}`);
            }
          } else {
            const matchScore = bestMatch ? (bestMatch as MatchResult).score : 0;
            console.log(`    ⚠️  分類頁面未找到匹配的酒款（最佳分數: ${matchScore}）`);
          }
          continue; // 分類頁面處理完成，繼續下一個URL
        }
        
        // 如果是搜索頁面，嘗試從搜索結果中找到匹配的酒款
        if (url.includes('?s=')) {
          // 搜索頁面處理邏輯（保持現有邏輯）
          const wineLinks = $('a[href*="?wine="]').filter((_, el) => {
            const linkText = $(el).text().toLowerCase();
            const href = $(el).attr('href') || '';
            const wineNameEnLower = wineNameEn.toLowerCase();
            const wineNameZhLower = wineNameZh.toLowerCase();
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
              console.log(`    ✅ 在搜索結果中找到酒款，訪問: ${fullUrl}`);
              
              // 防止無限遞歸：如果已經是遞歸調用，直接訪問URL而不是再次遞歸
              if (isRecursive) {
                console.log(`    ⚠️  已處於遞歸調用，直接訪問URL: ${fullUrl}`);
                // 直接訪問URL並提取數據
                try {
                  await delay(CONFIG.requestDelay);
                  const linkResponse = await fetchWithRetry(fullUrl);
                  const linkHtml = await linkResponse.text();
                  const $link = cheerio.load(linkHtml);
                  
                  // 提取圖片（使用與主邏輯相同的評分系統）
                  const linkWineImages: Array<{ url: string; score: number }> = [];
                  
                  // 過濾不相關的圖片關鍵字
                  const excludeKeywords = [
                    'logo', 'logotype', 'brand', 'warning', 'blog', 'kv-', 
                    'theme', 'icon', 'banner', 'header', 'footer', 'favicon',
                    'avatar', 'profile', 'user', 'admin', 'ajax-loader', 'g.gif'
                  ];
                  
                  $link('img').each((_, imgEl) => {
                    const src = $link(imgEl).attr('src') || 
                               $link(imgEl).attr('data-src') || 
                               $link(imgEl).attr('data-lazy-src') ||
                               $link(imgEl).attr('data-original');
                    
                    if (!src) return;
                    
                    const fullImageUrl = src.startsWith('http') ? src : new URL(src, fullUrl).toString();
                    const urlLower = fullImageUrl.toLowerCase();
                    
                    // 嚴格過濾不相關圖片
                    const isExcluded = excludeKeywords.some(keyword => 
                      urlLower.includes(keyword.toLowerCase())
                    );
                    if (isExcluded) return;
                    
                    // 檢查 alt 屬性
                    const alt = $link(imgEl).attr('alt') || '';
                    if (alt.toLowerCase().includes('logo') || 
                        alt.toLowerCase().includes('brand') ||
                        alt.toLowerCase().includes('傳送中')) {
                      return;
                    }
                    
                    // 只處理 /newsite/wp-content/uploads/ 路徑的圖片
                    if (!urlLower.includes('/newsite/wp-content/uploads/')) {
                      return;
                    }
                    
                    // 評分系統
                    let score = 0;
                    
                    // 優先選擇 /newsite/wp-content/uploads/ 路徑的圖片
                    score += 100;
                    
                    // 檢查 URL 是否包含酒款名稱關鍵字
                    const wineNameSlug = generateWineSlugVariants(wineNameEn)[0] || '';
                    if (urlLower.includes(wineNameSlug.toLowerCase())) {
                      score += 50;
                    }
                    
                    // 檢查是否包含常見圖片擴展名且不是小圖標
                    if (urlLower.match(/\.(jpg|jpeg|png|webp)$/i) && 
                        !urlLower.includes('icon') && 
                        !urlLower.includes('thumb')) {
                      score += 20;
                    }
                    
                    // 檢查圖片尺寸（如果有的話）
                    const width = parseInt($link(imgEl).attr('width') || '0');
                    const height = parseInt($link(imgEl).attr('height') || '0');
                    if (width > 300 && height > 300) {
                      score += 15;
                    }
                    
                    // 排除明顯的小圖片
                    if (width > 0 && width < 100 && height > 0 && height < 100) {
                      score -= 50;
                    }
                    
                    // 如果分數為正，加入候選列表
                    if (score > 0) {
                      linkWineImages.push({ url: fullImageUrl, score });
                    }
                  });
                  
                  if (linkWineImages.length > 0) {
                    linkWineImages.sort((a, b) => b.score - a.score);
                    const bestImage = linkWineImages[0];
                    // 只使用分數 >= 100 的圖片（確保是真正的酒標，不是默認圖片）
                    if (bestImage.score >= 100) {
                      result.imageUrl = bestImage.url;
                      console.log(`    ✅ 找到圖片: ${bestImage.url} (分數: ${bestImage.score})`);
                    }
                  }
                  
                  // 提取介紹
                  const linkDescription = $link('.single-wine-content').text().trim() || 
                                         $link('h2:contains("酒品介紹")').nextUntil('h2').text().trim();
                  if (linkDescription && linkDescription.length > 50) {
                    result.description = linkDescription.substring(0, 5000).trim();
                  }
                  
                  // 提取價格
                  const linkPriceText = $link('body').text();
                  const linkPriceMatch = linkPriceText.match(/品酩價[：:]\s*(\d+)\s*元/);
                  if (linkPriceMatch) {
                    result.price = parseInt(linkPriceMatch[1]);
                  }
                  
                  if (result.imageUrl || result.description) {
                    console.log(`    ✅ 成功從搜索結果URL提取數據`);
                    return result;
                  }
                } catch (e: any) {
                  console.log(`    ⚠️  訪問搜索結果URL失敗: ${e.message}`);
                }
              } else {
                // 第一次找到，直接訪問URL並提取數據（不再遞歸）
                console.log(`    🔍 直接訪問搜索結果URL: ${fullUrl}`);
                try {
                  await delay(CONFIG.requestDelay);
                  const linkResponse = await fetchWithRetry(fullUrl);
                  const linkHtml = await linkResponse.text();
                  const $link = cheerio.load(linkHtml);
                  
                  // 提取圖片（使用與主邏輯相同的評分系統）
                  const linkWineImages: Array<{ url: string; score: number }> = [];
                  
                  // 過濾不相關的圖片關鍵字
                  const excludeKeywords = [
                    'logo', 'logotype', 'brand', 'warning', 'blog', 'kv-', 
                    'theme', 'icon', 'banner', 'header', 'footer', 'favicon',
                    'avatar', 'profile', 'user', 'admin', 'ajax-loader', 'g.gif'
                  ];
                  
                  $link('img').each((_, imgEl) => {
                    const src = $link(imgEl).attr('src') || 
                               $link(imgEl).attr('data-src') || 
                               $link(imgEl).attr('data-lazy-src') ||
                               $link(imgEl).attr('data-original');
                    
                    if (!src) return;
                    
                    const fullImageUrl = src.startsWith('http') ? src : new URL(src, fullUrl).toString();
                    const urlLower = fullImageUrl.toLowerCase();
                    
                    // 嚴格過濾不相關圖片
                    const isExcluded = excludeKeywords.some(keyword => 
                      urlLower.includes(keyword.toLowerCase())
                    );
                    if (isExcluded) return;
                    
                    // 檢查 alt 屬性
                    const alt = $link(imgEl).attr('alt') || '';
                    if (alt.toLowerCase().includes('logo') || 
                        alt.toLowerCase().includes('brand') ||
                        alt.toLowerCase().includes('傳送中')) {
                      return;
                    }
                    
                    // 只處理 /newsite/wp-content/uploads/ 路徑的圖片
                    if (!urlLower.includes('/newsite/wp-content/uploads/')) {
                      return;
                    }
                    
                    // 評分系統
                    let score = 0;
                    
                    // 優先選擇 /newsite/wp-content/uploads/ 路徑的圖片
                    score += 100;
                    
                    // 檢查 URL 是否包含酒款名稱關鍵字
                    const wineNameSlug = generateWineSlugVariants(wineNameEn)[0] || '';
                    if (urlLower.includes(wineNameSlug.toLowerCase())) {
                      score += 50;
                    }
                    
                    // 檢查是否包含常見圖片擴展名且不是小圖標
                    if (urlLower.match(/\.(jpg|jpeg|png|webp)$/i) && 
                        !urlLower.includes('icon') && 
                        !urlLower.includes('thumb')) {
                      score += 20;
                    }
                    
                    // 檢查圖片尺寸（如果有的話）
                    const width = parseInt($link(imgEl).attr('width') || '0');
                    const height = parseInt($link(imgEl).attr('height') || '0');
                    if (width > 300 && height > 300) {
                      score += 15;
                    }
                    
                    // 排除明顯的小圖片
                    if (width > 0 && width < 100 && height > 0 && height < 100) {
                      score -= 50;
                    }
                    
                    // 如果分數為正，加入候選列表
                    if (score > 0) {
                      linkWineImages.push({ url: fullImageUrl, score });
                    }
                  });
                  
                  if (linkWineImages.length > 0) {
                    linkWineImages.sort((a, b) => b.score - a.score);
                    const bestImage = linkWineImages[0];
                    // 只使用分數 >= 100 的圖片（確保是真正的酒標，不是默認圖片）
                    if (bestImage.score >= 100) {
                      result.imageUrl = bestImage.url;
                      console.log(`    ✅ 找到圖片: ${bestImage.url} (分數: ${bestImage.score})`);
                    }
                  }
                  
                  // 提取介紹
                  const linkDescription = $link('.single-wine-content').text().trim() || 
                                         $link('h2:contains("酒品介紹")').nextUntil('h2').text().trim();
                  if (linkDescription && linkDescription.length > 50) {
                    result.description = linkDescription.substring(0, 5000).trim();
                  }
                  
                  // 提取價格
                  const linkPriceText = $link('body').text();
                  const linkPriceMatch = linkPriceText.match(/品酩價[：:]\s*(\d+)\s*元/);
                  if (linkPriceMatch) {
                    result.price = parseInt(linkPriceMatch[1]);
                  }
                  
                  if (result.imageUrl || result.description) {
                    console.log(`    ✅ 成功從搜索結果URL提取數據`);
                    return result;
                  }
                } catch (e: any) {
                  console.log(`    ⚠️  訪問搜索結果URL失敗: ${e.message}`);
                }
              }
            }
          }
          continue; // 搜索頁面沒有找到，繼續下一個URL
        }
        
        // 驗證頁面是否包含酒款名稱（檢查 h1 標題）- 僅用於直接訪問的酒款頁面
        const h1Text = $('h1').first().text().trim();
        const pageText = $('body').text();
        const pageKeywords = extractKeywords(h1Text + ' ' + pageText.substring(0, 500));
        
        // 檢查是否有足夠的關鍵字匹配（至少2個）
        const matchedEn = wineKeywordsEn.filter(k => 
          pageKeywords.some(pk => pk.includes(k) || k.includes(pk))
        ).length;
        const matchedZh = wineKeywordsZh.filter(k => 
          pageKeywords.some(pk => pk.includes(k) || k.includes(pk))
        ).length;
        
        // 也檢查原始文本匹配（更寬鬆）
        const wineNameMatch = 
          matchedEn >= 2 || 
          matchedZh >= 2 ||
          h1Text.toLowerCase().includes(wineNameEn.toLowerCase().substring(0, 10)) ||
          h1Text.toLowerCase().includes(wineNameZh.toLowerCase().substring(0, 10)) ||
          pageText.toLowerCase().includes(wineNameEn.toLowerCase().substring(0, 10)) ||
          pageText.toLowerCase().includes(wineNameZh.toLowerCase().substring(0, 10));
        
        if (!wineNameMatch) {
          console.log(`    ⚠️  頁面內容不匹配（匹配度: EN=${matchedEn}, ZH=${matchedZh}），跳過`);
          continue;
        }
        
        console.log(`    ✅ 找到匹配頁面: ${h1Text}`);
        
        // 1. 提取圖片（優先查找 /newsite/wp-content/uploads/ 路徑）
        const wineImages: Array<{ url: string; score: number }> = [];
        
        // 過濾不相關的圖片關鍵字
        const excludeKeywords = [
          'logo', 'logotype', 'brand', 'warning', 'blog', 'kv-', 
          'theme', 'icon', 'banner', 'header', 'footer', 'favicon',
          'avatar', 'profile', 'user', 'admin', 'ajax-loader', 'g.gif'
        ];
        
        $('img').each((_index, imgEl) => {
          const src = $(imgEl).attr('src') || 
                     $(imgEl).attr('data-src') || 
                     $(imgEl).attr('data-lazy-src') ||
                     $(imgEl).attr('data-original');
          
          if (!src) return;
          
          const fullImageUrl = src.startsWith('http') 
            ? src 
            : new URL(src, url).toString();
          
          const urlLower = fullImageUrl.toLowerCase();
          
          // 嚴格過濾不相關圖片
          const isExcluded = excludeKeywords.some(keyword => 
            urlLower.includes(keyword.toLowerCase())
          );
          if (isExcluded) return;
          
          // 檢查 alt 屬性
          const alt = $(imgEl).attr('alt') || '';
          if (alt.toLowerCase().includes('logo') || 
              alt.toLowerCase().includes('brand') ||
              alt.toLowerCase().includes('傳送中')) {
            return;
          }
          
          // 評分系統
          let score = 0;
          
          // 優先選擇 /newsite/wp-content/uploads/ 路徑的圖片（PROWINE 標準路徑）
          if (urlLower.includes('/newsite/wp-content/uploads/')) {
            score += 100; // 最高優先級
          }
          
          // 檢查 URL 是否包含酒款名稱關鍵字
          const wineNameSlug = generateWineSlugVariants(wineNameEn)[0] || '';
          if (urlLower.includes(wineNameSlug.toLowerCase())) {
            score += 50;
          }
          
          // 檢查是否包含常見圖片擴展名且不是小圖標
          if (urlLower.match(/\.(jpg|jpeg|png|webp)$/i) && 
              !urlLower.includes('icon') && 
              !urlLower.includes('thumb')) {
            score += 20;
          }
          
          // 檢查圖片尺寸（如果有的話）
          const width = parseInt($(imgEl).attr('width') || '0');
          const height = parseInt($(imgEl).attr('height') || '0');
          if (width > 300 && height > 300) {
            score += 15;
          }
          
          // 排除明顯的小圖片
          if (width > 0 && width < 100 && height > 0 && height < 100) {
            score -= 50;
          }
          
          // 如果分數為正，加入候選列表
          if (score > 0) {
            wineImages.push({ url: fullImageUrl, score });
          }
        });
        
        // 選擇分數最高的圖片
        if (wineImages.length > 0) {
          wineImages.sort((a, b) => b.score - a.score);
          const bestImage = wineImages[0];
          
          if (bestImage.score >= 20) {
            console.log(`    ✅ 找到圖片: ${bestImage.url} (分數: ${bestImage.score})`);
            result.imageUrl = bestImage.url;
          }
        }
        
        // 2. 提取酒品介紹（查找 "## 酒品介紹" 或 "酒品介紹" 部分）
        let description = '';
        
        // 方法1: 查找 h2 標題為 "酒品介紹" 後的內容
        const introSection = $('h2').filter((_, el) => {
          return $(el).text().includes('酒品介紹');
        }).first();
        
        if (introSection.length > 0) {
          // 獲取從 h2 開始到下一個 h2 或結尾的所有文本
          let current = introSection.next();
          while (current.length > 0 && !current.is('h2')) {
            description += current.text() + '\n';
            current = current.next();
          }
        }
        
        // 方法2: 如果沒找到，查找包含 "酒品介紹" 的區域
        if (!description.trim()) {
          const bodyText = $('body').text();
          const introIndex = bodyText.indexOf('酒品介紹');
          if (introIndex > -1) {
            // 獲取 "酒品介紹" 後 2000 字符的內容
            description = bodyText.substring(introIndex + 4, introIndex + 2004);
            // 清理多餘空白
            description = description.replace(/\s+/g, ' ').trim();
          }
        }
        
        if (description.trim()) {
          // 限制長度並清理
          description = description.substring(0, 5000).trim();
          result.description = description;
          console.log(`    ✅ 找到酒品介紹 (${description.length} 字)`);
        }
        
        // 3. 提取價格（查找 "品酩價：840元" 格式）
        const priceText = $('body').text();
        const priceMatch = priceText.match(/品酩價[：:]\s*(\d+)\s*元/);
        if (priceMatch) {
          result.price = parseInt(priceMatch[1]);
          console.log(`    ✅ 找到價格: ${result.price} 元`);
        }
        
        // 如果找到圖片或介紹，返回結果
        if (result.imageUrl || result.description) {
          return result;
        }
        
      } catch (error: any) {
        // 完全忽略錯誤對象中的URL，只使用我們保存的errorDisplayUrl（與嘗試的URL一致）
        const errorType = error?.name || 'Error';
        const statusCode = error?.status || error?.response?.status;
        const errorMsg = error?.message || String(error);
        
        // 根據錯誤類型顯示不同的信息（100%使用errorDisplayUrl，與嘗試的URL完全一致）
        // errorDisplayUrl在循環開始時保存，100%確保不會被修改
        if (statusCode === 404 || errorMsg.includes('404') || errorMsg.includes('Page not found')) {
          // 調試：記錄錯誤處理時的URL值
          if (i === 0) {
            console.log(`    🔍 [DEBUG ERROR] errorDisplayUrl in catch: ${errorDisplayUrl}`);
            console.log(`    🔍 [DEBUG ERROR] possibleUrls[${i}]: ${possibleUrls[i]}`);
          }
          // 使用保存的errorDisplayUrl，確保顯示正確（與嘗試的URL完全一致）
          // 使用字符串拼接而不是模板字符串，避免任何字符處理問題
          const prefix = '    ⚠️  頁面不存在 (404): ';
          const fullMsg = prefix + errorDisplayUrl;
          process.stdout.write(fullMsg + '\n');
        } else if (errorType === 'AbortError' || errorMsg.includes('aborted') || errorMsg.includes('timeout')) {
          // 使用字符串拼接而不是模板字符串
          const prefix = '    ⚠️  請求超時: ';
          const fullMsg = prefix + errorDisplayUrl;
          process.stdout.write(fullMsg + '\n');
        } else {
          // 只顯示實際URL，完全不使用錯誤對象中的URL
          // 使用字符串拼接而不是模板字符串
          const prefix = '    ⚠️  訪問失敗: ';
          const fullMsg = prefix + errorDisplayUrl;
          process.stdout.write(fullMsg + '\n');
          // 完全移除錯誤對象中的所有URL和域名，只保留純文本錯誤信息
          const cleanErrorMsg = errorMsg
            .replace(/https?:\/\/[^\s\)]+/g, '') // 移除 http:// 和 https:// 開頭的URL
            .replace(/[a-z0-9-]+\.(com|tw|org|net|io|co)[^\s\)]*/gi, '') // 移除所有域名
            .replace(/prowine\.com\.tw[^\s\)]*/gi, '') // 特別移除 prowine.com.tw
            .replace(/[^\s]+wine=[^\s\)]+/gi, '') // 移除 ?wine= 參數
            .replace(/\s+/g, ' ') // 合併多個空格
            .trim();
          if (cleanErrorMsg && cleanErrorMsg.length > 0 && cleanErrorMsg.length < 150) {
            console.log(`       原因: ${cleanErrorMsg.substring(0, 100)}`);
          }
        }
        continue;
      }
    }
    
    return result;
  } catch (error: any) {
    console.error(`    ❌ 爬取失敗:`, error.message);
    return result;
  }
}

/**
 * 使用 AI Vision 驗證圖片品質
 */
async function validateImageWithAI(imageUrl: string, wineName: string): Promise<{
  isValid: boolean;
  score: number;
  reason: string;
}> {
  try {
    // 使用 AI Vision API 分析圖片
    // 這裡使用 OpenAI Vision 或 Google Gemini Vision
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
    
    if (OPENAI_API_KEY) {
      // 使用 OpenAI Vision
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `請分析這張圖片是否為葡萄酒標籤照片。酒款名稱：${wineName}。請回答：1. 這是否是酒標照片（是/否）2. 圖片品質評分（0-100）3. 簡短原因。格式：JSON {isWineLabel: boolean, qualityScore: number, reason: string}`
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          max_tokens: 200,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        // 嘗試解析 JSON
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return {
              isValid: analysis.isWineLabel === true && analysis.qualityScore >= 70,
              score: analysis.qualityScore || 0,
              reason: analysis.reason || 'AI 分析完成',
            };
          }
        } catch (e) {
          // 如果無法解析 JSON，使用文本分析
          if (content.toLowerCase().includes('是') || content.toLowerCase().includes('yes')) {
            return {
              isValid: true,
              score: 80,
              reason: 'AI 確認是酒標照片',
            };
          }
        }
      }
    } else if (GOOGLE_AI_API_KEY) {
      // 使用 Google Gemini Vision
      try {
        // 先下載圖片
        const imageResponse = await fetchWithRetry(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
        // 使用正確的模型名稱（gemini-pro-vision 或 gemini-1.5-pro-latest）
        // 如果 v1beta 不可用，嘗試使用 v1 API
        let model;
        try {
          model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        } catch {
          // 如果失敗，跳過 AI 驗證
          console.log(`    ⚠️  Gemini API 不可用，跳過 AI 驗證`);
          return {
            isValid: true,
            score: 60,
            reason: '跳過 AI 驗證（API 不可用）',
          };
        }
        
        const prompt = `請分析這張圖片是否為葡萄酒標籤照片。酒款名稱：${wineName}。請回答：1. 這是否是酒標照片（是/否）2. 圖片品質評分（0-100）3. 簡短原因。格式：JSON {isWineLabel: boolean, qualityScore: number, reason: string}`;
        
        const result = await model.generateContent([
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            }
          },
          prompt
        ]);
        const response = await result.response;
        const content = response.text();
        
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return {
              isValid: analysis.isWineLabel === true && analysis.qualityScore >= 70,
              score: analysis.qualityScore || 0,
              reason: analysis.reason || 'AI 分析完成',
            };
          }
        } catch (e) {
          // 如果無法解析 JSON，使用文本分析
          if (content.toLowerCase().includes('是') || content.toLowerCase().includes('yes') || content.toLowerCase().includes('true')) {
            return {
              isValid: true,
              score: 80,
              reason: 'AI 確認是酒標照片',
            };
          }
        }
      } catch (error: any) {
        console.log(`    ⚠️  Gemini Vision 失敗: ${error.message}`);
        // 跳過 AI 驗證（API 不可用時）
        console.log(`    ⚠️  Gemini API 不可用，使用基本驗證`);
      }
    }
    
    // 如果沒有 AI API，使用基本驗證
    return await validateImageUrl(imageUrl);
  } catch (error: any) {
    console.log(`    ⚠️  AI 驗證失敗: ${error.message}，使用基本驗證`);
    return await validateImageUrl(imageUrl);
  }
}

/**
 * 驗證圖片 URL 是否有效（基本驗證）
 */
async function validateImageUrl(url: string): Promise<{
  isValid: boolean;
  score: number;
  reason: string;
}> {
  try {
    const response = await fetchWithRetry(url, { method: 'HEAD' });
    if (!response.ok) {
      return {
        isValid: false,
        score: 0,
        reason: '圖片無法訪問',
      };
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return {
        isValid: false,
        score: 0,
        reason: '不是圖片格式',
      };
    }
    
    return {
      isValid: true,
      score: 60,
      reason: '圖片可訪問且格式正確',
    };
  } catch (error: any) {
    return {
      isValid: false,
      score: 0,
      reason: `驗證失敗: ${error.message}`,
    };
  }
}

/**
 * 下載並上傳圖片到 Cloudinary
 */
async function downloadAndUploadToCloudinary(
  imageUrl: string,
  wineId: string,
  wineName: string
): Promise<string | null> {
  try {
    console.log(`    📤 下載圖片並上傳到 Cloudinary...`);
    
    // 下載圖片
    const imageResponse = await fetchWithRetry(imageUrl);
    if (!imageResponse.ok) {
      console.log(`    ⚠️  無法下載圖片`);
      return null;
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // 生成文件名
    const fileName = `${wineId}-${Date.now()}`;
    const folder = 'prowine/wines';
    
    // 檢查 Cloudinary 配置
    if (!cloudName || !apiKey || !apiSecret) {
      console.log(`    ⚠️  Cloudinary 未配置，跳過上傳`);
      return null;
    }
    
    try {
      // 上傳到 Cloudinary（使用 base64）
      const base64Image = buffer.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64Image}`;
      
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: folder,
        public_id: fileName,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 2000, height: 2000, crop: 'limit', quality: 'auto:good' },
        ],
      });
      
      console.log(`    ✅ 圖片已上傳到 Cloudinary: ${uploadResult.secure_url}`);
      return uploadResult.secure_url;
    } catch (error: any) {
      // Cloudinary 上傳失敗時，返回 null（使用原始 URL）
      console.log(`    ⚠️  Cloudinary 上傳失敗: ${error.message}`);
      return null;
    }
  } catch (error: any) {
    console.error(`    ❌ Cloudinary 上傳失敗:`, error.message);
    return null;
  }
}

/**
 * 更新酒款圖片和介紹
 */
async function updateWineData(
  wineId: string, 
  imageUrl: string | null,
  description: string | null,
  wineName: string
): Promise<boolean> {
  try {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    // 更新圖片（如果有的話）
    if (imageUrl) {
      // 先使用 AI 驗證圖片品質
      console.log(`    🔍 使用 AI 驗證圖片品質...`);
      const validation = await validateImageWithAI(imageUrl, wineName);
      
      let finalImageUrl = imageUrl;
      
      if (validation.isValid || imageUrl.includes('prowine.com.tw')) {
        if (validation.isValid) {
          console.log(`    ✅ 圖片驗證通過: ${validation.reason} (分數: ${validation.score})`);
        } else {
          console.log(`    ✅ 使用 PROWINE 官方圖片（跳過 AI 驗證）`);
        }
        
        // 上傳到 Cloudinary 確保前台可以顯示
        const cloudinaryUrl = await downloadAndUploadToCloudinary(imageUrl, wineId, wineName);
        if (cloudinaryUrl) {
          finalImageUrl = cloudinaryUrl;
          console.log(`    ✅ 圖片已上傳到 Cloudinary，確保前台可顯示`);
        } else {
          console.log(`    ⚠️  Cloudinary 上傳失敗，使用原始 URL`);
        }
        
        updateData.mainImageUrl = finalImageUrl;
      } else {
        console.log(`    ⚠️  圖片驗證失敗: ${validation.reason} (分數: ${validation.score})`);
      }
    }
    
    // 更新介紹（如果有的話）
    if (description) {
      // 如果現有描述為空或很短，則更新
      updateData.descriptionZh = description;
    }
    
    // 更新資料庫
    if (Object.keys(updateData).length > 1) { // 除了 updatedAt 還有其他欄位
      const { error } = await supabase
        .from('wines')
        .update(updateData)
        .eq('id', wineId);
      
      if (error) {
        console.error(`    ❌ 更新失敗:`, error.message);
        return false;
      }
      
      console.log(`    ✅ 資料更新成功`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error(`    ❌ 更新異常:`, error.message);
    return false;
  }
}

/**
 * 處理單個酒款
 */
async function processWine(
  wine: any,
  progress: ScrapeProgress
): Promise<void> {
  // 檢查是否已成功更新或跳過（這些不需要重試）
  if (progress.updatedWines.includes(wine.id) || progress.skippedWines.includes(wine.id)) {
    console.log(`  ⏭️  已成功處理，跳過: ${wine.nameZh}`);
    return;
  }
  
  // 如果之前失敗了，清除失敗記錄以便重試
  const failedIndex = progress.failedWines.findIndex(f => f.id === wine.id);
  if (failedIndex > -1) {
    progress.failedWines.splice(failedIndex, 1);
  }
  
  console.log(`\n🍷 處理酒款: ${wine.nameZh} (${wine.nameEn})`);
  
  try {
    // 如果已有圖片且來自 PROWINE，跳過
    if (wine.mainImageUrl && 
        (wine.mainImageUrl.includes('prowine.com.tw') || 
         wine.mainImageUrl.includes('prowine'))) {
      console.log(`  ✅ 已有 PROWINE 圖片，跳過`);
      progress.skippedWines.push(wine.id);
      progress.processedWines.push(wine.id);
      saveProgress(progress);
      return;
    }
    
    // 獲取酒莊信息（用於搜索）
    let wineryInfo: { nameZh: string; nameEn: string } | null = null;
    if (wine.wineryId) {
      wineryInfo = await getWineryInfo(wine.wineryId);
    }
    
    // 從 PROWINE.COM.TW 爬取圖片和介紹
    const scrapedData = await scrapeWineFromProwine(
      wine.nameZh,
      wine.nameEn,
      wine.slug,
      wineryInfo,
      wine.country,
      wine.category,
      false // 主調用，不是遞歸
    );
    
    if (scrapedData.imageUrl || scrapedData.description) {
      // 更新資料庫
      const success = await updateWineData(
        wine.id, 
        scrapedData.imageUrl,
        scrapedData.description,
        wine.nameZh
      );
      
      if (success) {
        progress.updatedWines.push(wine.id);
      } else {
        progress.failedWines.push({
          id: wine.id,
          name: wine.nameZh,
          error: '資料更新失敗',
        });
      }
    } else {
      console.log(`  ⚠️  未找到圖片或介紹`);
      progress.failedWines.push({
        id: wine.id,
        name: wine.nameZh,
        error: '未找到圖片或介紹',
      });
    }
    
    progress.processedWines.push(wine.id);
    saveProgress(progress);
    
    // 延遲避免限流
    await delay(CONFIG.requestDelay);
  } catch (error: any) {
    console.error(`  ❌ 處理失敗:`, error.message);
    progress.failedWines.push({
      id: wine.id,
      name: wine.nameZh,
      error: error.message,
    });
    progress.processedWines.push(wine.id);
    saveProgress(progress);
  }
}

/**
 * 主函數
 */
async function main() {
  console.log("🚀 PROWINE 完整酒款照片爬蟲系統啟動\n");
  
  const progress = loadProgress();
  
  try {
    // 獲取所有酒款
    console.log("📥 從資料庫獲取酒款...");
    
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
          country,
          category
        `)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('createdAt', { ascending: false });
      
      if (error) {
        throw new Error(`獲取酒款失敗: ${error.message}`);
      }
      
      if (!wines || wines.length === 0) {
        break;
      }
      
      allWines = allWines.concat(wines);
      console.log(`  ✅ 已獲取 ${allWines.length} 個酒款...`);
      
      if (wines.length < pageSize) {
        break;
      }
      
      page++;
    }
    
    console.log(`\n✅ 總共找到 ${allWines.length} 個酒款\n`);
    
    // 過濾已處理的酒款（但保留失敗的，允許重試）
    const winesToProcess = allWines.filter(
      wine => {
        // 如果已成功更新或跳過，則跳過
        if (progress.updatedWines.includes(wine.id) || progress.skippedWines.includes(wine.id)) {
          return false;
        }
        // 如果失敗了，允許重試
        // 如果未處理，需要處理
        return true;
      }
    );
    
    console.log(`📊 需要處理: ${winesToProcess.length} 個酒款\n`);
    console.log(`📝 已成功: ${progress.updatedWines.length} 個`);
    console.log(`📝 已跳過: ${progress.skippedWines.length} 個`);
    console.log(`📝 失敗: ${progress.failedWines.length} 個（將重試）\n`);
    
    // 處理每個酒款
    for (let i = 0; i < winesToProcess.length; i++) {
      const wine = winesToProcess[i];
      console.log(`\n[${i + 1}/${winesToProcess.length}]`);
      await processWine(wine, progress);
    }
    
    // 輸出統計
    console.log("\n" + "=".repeat(60));
    console.log("📊 爬蟲統計");
    console.log("=".repeat(60));
    console.log(`總處理數: ${progress.processedWines.length}`);
    console.log(`成功更新: ${progress.updatedWines.length}`);
    console.log(`跳過: ${progress.skippedWines.length}`);
    console.log(`失敗: ${progress.failedWines.length}`);
    
    if (progress.failedWines.length > 0) {
      console.log("\n❌ 失敗的酒款:");
      progress.failedWines.slice(0, 10).forEach(wine => {
        console.log(`  - ${wine.name} (${wine.error})`);
      });
      if (progress.failedWines.length > 10) {
        console.log(`  ... 還有 ${progress.failedWines.length - 10} 個失敗`);
      }
    }
    
    console.log("\n✅ 爬蟲完成！");
  } catch (error: any) {
    console.error("\n❌ 爬蟲過程發生錯誤:", error);
    process.exit(1);
  }
}

// 執行（ES module 兼容）
// 直接執行 main 函數
main().catch((error) => {
  console.error("❌ 腳本執行失敗:", error);
  process.exit(1);
});

export { scrapeWineFromProwine, updateWineData, processWine };

