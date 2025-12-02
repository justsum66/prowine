/**
 * 專門處理 missing-assets-report.json 中的項目
 * 使用完整的爬蟲邏輯
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { config } from "dotenv";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ 缺少 Supabase 環境變數");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CONFIG = {
  requestDelay: 3000,
  maxRetries: 3,
  timeout: 30000,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

interface MissingAssetsReport {
  summary: { winesWithoutImages: number; wineriesWithoutLogos: number; total: number };
  wines: Array<{ id: string; nameZh: string; nameEn: string; wineryWebsite?: string }>;
  wineriesWithoutLogos: Array<{ id: string; nameZh: string; nameEn: string; website?: string }>;
}

interface Progress {
  total: number;
  completed: number;
  failed: number;
  currentItem: string;
  startTime: number;
  results: { success: Array<{ item: string; url: string }>; failed: Array<{ item: string; reason: string }> };
}

const progress: Progress = {
  total: 0,
  completed: 0,
  failed: 0,
  currentItem: "",
  startTime: Date.now(),
  results: { success: [], failed: [] },
};

function saveProgress() {
  writeFileSync(join(process.cwd(), "scripts", "scraper-progress.json"), JSON.stringify(progress, null, 2), "utf-8");
}

function printProgress() {
  const elapsed = Math.floor((Date.now() - progress.startTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const p = progress.total > 0 ? ((progress.completed / progress.total) * 100).toFixed(1) : "0.0";
  console.log(`\n[${m}分${s}秒] 進度: ${progress.completed}/${progress.total} (${p}%) | 當前: ${progress.currentItem}`);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response | null> {
  const headers = {
    'User-Agent': CONFIG.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) return null;
      await delay(2000 * (i + 1));
    }
  }
  return null;
}

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetchWithRetry(url, 1);
    if (!response || !response.ok) return false;
    const contentType = response.headers.get("content-type");
    return contentType?.startsWith("image/") ?? false;
  } catch {
    return false;
  }
}

async function scrapeWineryLogo(wineryWebsite: string): Promise<string | null> {
  try {
    const response = await fetchWithRetry(wineryWebsite);
    if (!response || !response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const logoSelectors = [
      'header img', 'nav img', '.logo img', '#logo img',
      '[class*="logo"] img', '[id*="logo"] img',
      '[class*="brand"] img', '[id*="brand"] img',
    ];
    
    const candidates: string[] = [];
    
    for (const selector of logoSelectors) {
      $(selector).each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
        if (src) {
          try {
            const imageUrl = new URL(src, wineryWebsite).toString();
            if (!imageUrl.toLowerCase().includes('banner') && 
                !imageUrl.toLowerCase().includes('hero')) {
              candidates.push(imageUrl);
            }
          } catch {}
        }
      });
    }
    
    if (candidates.length === 0) {
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        const alt = $(el).attr('alt')?.toLowerCase() || '';
        const className = $(el).attr('class')?.toLowerCase() || '';
        if (src && (alt.includes('logo') || className.includes('logo'))) {
          try {
            const imageUrl = new URL(src, wineryWebsite).toString();
            candidates.push(imageUrl);
          } catch {}
        }
      });
    }
    
    for (const candidate of Array.from(new Set(candidates)).slice(0, 5)) {
      if (await validateImageUrl(candidate)) {
        return candidate;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

async function updateWineryLogo(wineryId: string, logoUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("wineries").update({ logoUrl }).eq("id", wineryId);
    return !error;
  } catch {
    return false;
  }
}

async function processMissingWineryLogos(report: MissingAssetsReport) {
  console.log("\n🏛️ 處理缺少 LOGO 的酒莊...\n");
  
  for (const winery of report.wineriesWithoutLogos) {
    progress.currentItem = winery.nameZh;
    printProgress();
    
    console.log(`\n處理: ${winery.nameZh} (${winery.nameEn})`);
    
    if (!winery.website) {
      console.log(`  ⚠️ 無網站資訊`);
      progress.failed++;
      progress.results.failed.push({ item: winery.nameZh, reason: "無網站資訊" });
      saveProgress();
      continue;
    }
    
    console.log(`  🌐 訪問: ${winery.website}`);
    const logoUrl = await scrapeWineryLogo(winery.website);
    
    if (logoUrl) {
      const updated = await updateWineryLogo(winery.id, logoUrl);
      if (updated) {
        console.log(`  ✅ 成功: ${logoUrl}`);
        progress.completed++;
        progress.results.success.push({ item: winery.nameZh, url: logoUrl });
      } else {
        console.log(`  ❌ 數據庫更新失敗`);
        progress.failed++;
        progress.results.failed.push({ item: winery.nameZh, reason: "數據庫更新失敗" });
      }
    } else {
      console.log(`  ⚠️ 未找到 LOGO`);
      progress.failed++;
      progress.results.failed.push({ item: winery.nameZh, reason: "未找到 LOGO" });
    }
    
    saveProgress();
    await delay(CONFIG.requestDelay);
  }
}

async function main() {
  console.log("🚀 開始處理缺少的資產...\n");
  
  try {
    const reportPath = join(process.cwd(), "scripts", "missing-assets-report.json");
    if (!existsSync(reportPath)) {
      console.error(`❌ 找不到: ${reportPath}`);
      process.exit(1);
    }
    
    const report: MissingAssetsReport = JSON.parse(readFileSync(reportPath, "utf-8"));
    progress.total = report.summary.total;
    progress.startTime = Date.now();
    
    console.log(`📊 任務: ${report.summary.total} 項\n`);
    
    if (report.wineriesWithoutLogos.length > 0) {
      await processMissingWineryLogos(report);
    }
    
    console.log("\n✅ 完成！");
    printProgress();
    console.log(`\n成功: ${progress.results.success.length} | 失敗: ${progress.results.failed.length}`);
    
  } catch (error) {
    console.error("\n❌ 錯誤:", error);
    saveProgress();
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.log("\n⚠️ 中斷，保存進度...");
  saveProgress();
  process.exit(0);
});

main();

