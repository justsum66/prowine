/**
 * 上傳酒莊 LOGO 到 Supabase Storage 並更新數據庫
 * 
 * 此腳本用於：
 * 1. 審查 LOGO 圖片品質
 * 2. 上傳到 Supabase Storage
 * 3. 更新數據庫中的 logoUrl
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

// Load environment variables
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase URL or Service Key is not defined.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface LogoUploadTask {
  wineryId: string;
  wineryNameZh: string;
  wineryNameEn: string;
  slug: string;
  logoUrl?: string; // 外部 URL 或本地文件路徑
  logoFile?: Buffer; // 圖片文件 buffer
  source: 'url' | 'file';
  description: string;
}

interface LogoValidation {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * 驗證 LOGO 品質和適用性
 */
function validateLogo(url: string, wineryName: string): LogoValidation {
  const validation: LogoValidation = {
    isValid: true,
    issues: [],
    recommendations: [],
  };

  // 檢查 URL 格式
  try {
    new URL(url);
  } catch {
    validation.isValid = false;
    validation.issues.push("URL 格式無效");
    return validation;
  }

  // 檢查圖片格式
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  const hasValidExtension = imageExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  if (!hasValidExtension) {
    validation.issues.push("圖片格式可能不標準（建議使用 PNG/SVG）");
    validation.recommendations.push("建議使用 PNG（透明背景）或 SVG 格式");
  }

  // 檢查是否需要透明背景版本
  if (url.includes('white') || url.includes('light')) {
    validation.recommendations.push("建議準備深色背景適配版本");
  }

  return validation;
}

/**
 * 從外部 URL 下載圖片並上傳到 Supabase Storage
 */
async function uploadLogoFromUrl(
  logoUrl: string,
  winerySlug: string,
  wineryName: string
): Promise<string | null> {
  try {
    console.log(`  📥 下載 LOGO: ${logoUrl}`);
    
    const response = await fetch(logoUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // 確定文件擴展名
    const extension = contentType.includes('svg') ? '.svg' : 
                     contentType.includes('jpg') || contentType.includes('jpeg') ? '.jpg' :
                     contentType.includes('webp') ? '.webp' : '.png';
    
    const fileName = `winery-logos/${winerySlug}${extension}`;
    
    console.log(`  📤 上傳到 Supabase Storage: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('images') // 假設 storage bucket 名稱為 'images'
      .upload(fileName, buffer, {
        contentType,
        upsert: true, // 如果已存在則覆蓋
      });

    if (error) {
      throw error;
    }

    // 獲取公開 URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log(`  ✅ 上傳成功: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error(`  ❌ 上傳失敗:`, error.message);
    return null;
  }
}

/**
 * 從本地文件上傳 LOGO
 */
async function uploadLogoFromFile(
  filePath: string,
  winerySlug: string
): Promise<string | null> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const buffer = readFileSync(filePath);
    const extension = filePath.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `winery-logos/${winerySlug}.${extension}`;
    
    const contentType = extension === 'svg' ? 'image/svg+xml' :
                       extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                       extension === 'webp' ? 'image/webp' : 'image/png';

    console.log(`  📤 上傳本地文件到 Supabase Storage: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log(`  ✅ 上傳成功: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error(`  ❌ 上傳失敗:`, error.message);
    return null;
  }
}

/**
 * 更新數據庫中的 logoUrl
 */
async function updateWineryLogo(
  wineryId: string,
  logoUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wineries')
      .update({
        logoUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', wineryId);

    if (error) {
      throw error;
    }

    console.log(`  ✅ 數據庫更新成功`);
    return true;
  } catch (error: any) {
    console.error(`  ❌ 數據庫更新失敗:`, error.message);
    return false;
  }
}

/**
 * 處理單個 LOGO 上傳任務
 */
async function processLogoUpload(task: LogoUploadTask): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏛️  處理: ${task.wineryNameZh} (${task.wineryNameEn})`);
  console.log(`📋 ID: ${task.wineryId}`);
  console.log(`📝 描述: ${task.description}`);
  console.log(`${'='.repeat(60)}\n`);

  // 驗證 LOGO
  if (task.source === 'url' && task.logoUrl) {
    const validation = validateLogo(task.logoUrl, task.wineryNameZh);
    if (!validation.isValid) {
      console.log(`  ⚠️  驗證問題:`, validation.issues.join(', '));
    }
    if (validation.recommendations.length > 0) {
      console.log(`  💡 建議:`, validation.recommendations.join(', '));
    }
  }

  // 上傳 LOGO
  let uploadedUrl: string | null = null;
  
  if (task.source === 'url' && task.logoUrl) {
    uploadedUrl = await uploadLogoFromUrl(
      task.logoUrl,
      task.slug,
      task.wineryNameZh
    );
  } else if (task.source === 'file' && task.logoFile) {
    // 處理文件上傳
    console.log(`  ⚠️  文件上傳功能需要本地文件路徑`);
  }

  if (!uploadedUrl) {
    console.log(`  ❌ 上傳失敗，跳過數據庫更新`);
    return false;
  }

  // 更新數據庫
  const updated = await updateWineryLogo(task.wineryId, uploadedUrl);
  
  if (updated) {
    console.log(`\n  ✅ ${task.wineryNameZh} LOGO 處理完成！`);
    return true;
  }

  return false;
}

/**
 * 主函數：處理所有 LOGO 上傳任務
 */
async function main() {
  console.log("🚀 開始處理酒莊 LOGO 上傳\n");

  // 讀取待處理的 LOGO 清單
  // 這裡我們手動定義需要處理的 LOGO
  const logoTasks: LogoUploadTask[] = [
    {
      wineryId: 'winery_horseplay',
      wineryNameZh: 'Horseplay',
      wineryNameEn: 'Horseplay',
      slug: 'horseplay',
      source: 'url',
      description: '黑白棋馬圖案 LOGO（用戶提供）',
      logoUrl: '', // 需要用戶提供實際 URL
    },
    {
      wineryId: 'winery_lamborn-family',
      wineryNameZh: 'Lamborn Family',
      wineryNameEn: 'Lamborn Family',
      slug: 'lamborn-family',
      source: 'url',
      description: '金色/米色徽章風格 LOGO（用戶提供）',
      logoUrl: '', // 需要用戶提供實際 URL
    },
    {
      wineryId: 'winery_staglin-family',
      wineryNameZh: 'Staglin Family',
      wineryNameEn: 'Staglin Family',
      slug: 'staglin-family',
      source: 'url',
      description: '黑色文字，金色邊框 LOGO（用戶提供）',
      logoUrl: '', // 需要用戶提供實際 URL
    },
    {
      wineryId: 'winery_darioush',
      wineryNameZh: 'Darioush',
      wineryNameEn: 'Darioush',
      slug: 'darioush',
      source: 'url',
      description: '灰色文字，帶皇冠圖標 LOGO（用戶提供）',
      logoUrl: '', // 需要用戶提供實際 URL
    },
    {
      wineryId: 'winery_domaine-yann-chave',
      wineryNameZh: 'Domaine Yann Chave',
      wineryNameEn: 'Domaine Yann Chave',
      slug: 'domaine-yann-chave',
      source: 'url',
      description: '黑色手寫字體 LOGO（用戶提供）',
      logoUrl: '', // 需要用戶提供實際 URL
    },
    {
      wineryId: 'winery_bodegas-leza-garcia',
      wineryNameZh: 'Bodegas Leza Garcia',
      wineryNameEn: 'Bodegas Leza Garcia',
      slug: 'bodegas-leza-garcia',
      source: 'url',
      description: '金色/紅色圓形徽章 LOGO（用戶提供）',
      logoUrl: '', // 需要用戶提供實際 URL
    },
  ];

  console.log(`📊 待處理 LOGO 數量: ${logoTasks.length}\n`);

  // 處理每個 LOGO
  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const task of logoTasks) {
    if (!task.logoUrl || task.logoUrl.trim() === '') {
      console.log(`\n⚠️  跳過 ${task.wineryNameZh}：未提供 LOGO URL`);
      results.failed.push(`${task.wineryNameZh}: 未提供 LOGO URL`);
      continue;
    }

    const success = await processLogoUpload(task);
    if (success) {
      results.success.push(task.wineryNameZh);
    } else {
      results.failed.push(task.wineryNameZh);
    }
  }

  // 輸出總結
  console.log(`\n${'='.repeat(60)}`);
  console.log("📊 處理結果總結");
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ 成功: ${results.success.length} 個`);
  console.log(`❌ 失敗: ${results.failed.length} 個`);

  if (results.success.length > 0) {
    console.log(`\n✅ 成功處理的 LOGO:`);
    results.success.forEach(name => console.log(`  - ${name}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ 失敗的 LOGO:`);
    results.failed.forEach(name => console.log(`  - ${name}`));
  }

  console.log(`\n${'='.repeat(60)}\n`);
}

// 如果直接運行此腳本
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  });
}

export { processLogoUpload, uploadLogoFromUrl, uploadLogoFromFile, updateWineryLogo };

