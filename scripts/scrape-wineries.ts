/**
 * 專門爬取酒莊LOGO和照片的腳本
 * 使用進階爬蟲系統自動獲取真正的LOGO和照片
 */

import { processWinery } from './advanced-image-scraper';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface WineryData {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  website?: string;
  currentLogoUrl?: string;
  currentImages?: string[];
}

async function main() {
  console.log("🏰 開始爬取酒莊LOGO和照片...\n");

  try {
    // 獲取所有酒莊
    const { data: wineries, error } = await supabase
      .from('wineries')
      .select('id, nameZh, nameEn, slug, website, logoUrl, images')
      .limit(100);

    if (error) {
      throw new Error(`獲取酒莊失敗: ${error.message}`);
    }

    console.log(`✅ 找到 ${wineries?.length || 0} 個酒莊\n`);

    // 處理每個酒莊
    for (const winery of wineries || []) {
      const wineryData: WineryData = {
        id: winery.id,
        nameZh: winery.nameZh,
        nameEn: winery.nameEn,
        slug: winery.slug,
        website: winery.website,
        currentLogoUrl: winery.logoUrl,
        currentImages: winery.images as string[],
      };

      await processWinery(wineryData);
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒間隔
    }

    console.log("\n✅ 所有酒莊處理完成！");
  } catch (error) {
    console.error("\n❌ 處理過程發生錯誤:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

