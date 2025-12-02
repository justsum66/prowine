/**
 * 檢查並爬取缺失的資源（酒款照片、酒莊LOGO、酒莊照片）
 * 使用 AI API 生成缺失的圖片（如果需要）
 */

import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

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

interface MissingAsset {
  type: 'wine-image' | 'winery-logo' | 'winery-photo';
  id: string;
  name: string;
  currentValue: string | null;
}

/**
 * 檢查缺失的酒款照片
 */
async function checkMissingWineImages(): Promise<MissingAsset[]> {
  console.log('🔍 檢查缺失的酒款照片...\n');
  
  const { data: wines, error } = await supabase
    .from('wines')
    .select('id, nameZh, nameEn, mainImageUrl, images')
    .or('mainImageUrl.is.null,images.is.null')
    .limit(100);
  
  if (error) {
    console.error('❌ 查詢錯誤:', error);
    return [];
  }
  
  const missing: MissingAsset[] = [];
  
  for (const wine of wines || []) {
    const hasMainImage = !!wine.mainImageUrl;
    const hasImages = Array.isArray(wine.images) && wine.images.length > 0;
    
    if (!hasMainImage && !hasImages) {
      missing.push({
        type: 'wine-image',
        id: wine.id,
        name: wine.nameZh || wine.nameEn || 'Unknown',
        currentValue: null,
      });
    }
  }
  
  console.log(`📊 找到 ${missing.length} 個缺失照片的酒款\n`);
  return missing;
}

/**
 * 檢查缺失的酒莊LOGO
 */
async function checkMissingWineryLogos(): Promise<MissingAsset[]> {
  console.log('🔍 檢查缺失的酒莊LOGO...\n');
  
  const { data: wineries, error } = await supabase
    .from('wineries')
    .select('id, nameZh, nameEn, logoUrl')
    .is('logoUrl', null)
    .limit(100);
  
  if (error) {
    console.error('❌ 查詢錯誤:', error);
    return [];
  }
  
  const missing: MissingAsset[] = (wineries || []).map(winery => ({
    type: 'winery-logo',
    id: winery.id,
    name: winery.nameZh || winery.nameEn || 'Unknown',
    currentValue: null,
  }));
  
  console.log(`📊 找到 ${missing.length} 個缺失LOGO的酒莊\n`);
  return missing;
}

/**
 * 檢查缺失的酒莊照片
 */
async function checkMissingWineryPhotos(): Promise<MissingAsset[]> {
  console.log('🔍 檢查缺失的酒莊照片...\n');
  
  const { data: wineries, error } = await supabase
    .from('wineries')
    .select('id, nameZh, nameEn, images')
    .or('images.is.null')
    .limit(100);
  
  if (error) {
    console.error('❌ 查詢錯誤:', error);
    return [];
  }
  
  const missing: MissingAsset[] = [];
  
  for (const winery of wineries || []) {
    const hasImages = Array.isArray(winery.images) && winery.images.length > 0;
    
    if (!hasImages) {
      missing.push({
        type: 'winery-photo',
        id: winery.id,
        name: winery.nameZh || winery.nameEn || 'Unknown',
        currentValue: null,
      });
    }
  }
  
  console.log(`📊 找到 ${missing.length} 個缺失照片的酒莊\n`);
  return missing;
}

/**
 * 生成報告
 */
async function generateReport() {
  console.log('📋 生成缺失資源報告...\n');
  
  const missingWineImages = await checkMissingWineImages();
  const missingWineryLogos = await checkMissingWineryLogos();
  const missingWineryPhotos = await checkMissingWineryPhotos();
  
  const total = missingWineImages.length + missingWineryLogos.length + missingWineryPhotos.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 缺失資源統計');
  console.log('='.repeat(60));
  console.log(`🍷 缺失酒款照片: ${missingWineImages.length}`);
  console.log(`🏰 缺失酒莊LOGO: ${missingWineryLogos.length}`);
  console.log(`📸 缺失酒莊照片: ${missingWineryPhotos.length}`);
  console.log(`📦 總計: ${total}`);
  console.log('='.repeat(60) + '\n');
  
  // 保存報告到文件
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      wineImages: missingWineImages.length,
      wineryLogos: missingWineryLogos.length,
      wineryPhotos: missingWineryPhotos.length,
    },
    missingWineImages: missingWineImages.map(m => ({ id: m.id, name: m.name })),
    missingWineryLogos: missingWineryLogos.map(m => ({ id: m.id, name: m.name })),
    missingWineryPhotos: missingWineryPhotos.map(m => ({ id: m.id, name: m.name })),
  };
  
  const fs = await import('fs/promises');
  await fs.writeFile(
    join(process.cwd(), 'docs/reports/MISSING_ASSETS_REPORT.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('✅ 報告已保存到 docs/reports/MISSING_ASSETS_REPORT.json\n');
  
  // 如果發現缺失資源，建議運行爬蟲
  if (total > 0) {
    console.log('💡 建議運行以下命令來爬取缺失資源:');
    console.log('   npm run scrape:images-for-import');
    console.log('   npm run scrape:missing-logos');
    console.log('   npm run scrape:winery-logos\n');
  }
  
  return report;
}

// 主函數
async function main() {
  console.log('🚀 開始檢查缺失資源...\n');
  
  try {
    await generateReport();
    console.log('✅ 檢查完成！');
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
    process.exit(1);
  }
}

main();

