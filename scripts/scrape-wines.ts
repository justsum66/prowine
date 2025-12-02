/**
 * 專門爬取酒款酒標照片的腳本
 * 使用進階爬蟲系統自動獲取真正的酒標照片
 */

import { processWine } from './advanced-image-scraper';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface WineData {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  wineryId: string;
  wineryNameZh: string;
  wineryNameEn: string;
  wineryWebsite?: string;
  currentImageUrl?: string;
}

async function main() {
  console.log("🍷 開始爬取酒款酒標照片...\n");

  try {
    // 獲取所有酒款
    const { data: wines, error } = await supabase
      .from('wines')
      .select(`
        id,
        nameZh,
        nameEn,
        slug,
        mainImageUrl,
        wineryId,
        wineries!inner (
          id,
          nameZh,
          nameEn,
          website
        )
      `)
      .limit(100);

    if (error) {
      throw new Error(`獲取酒款失敗: ${error.message}`);
    }

    console.log(`✅ 找到 ${wines?.length || 0} 個酒款\n`);

    // 處理每個酒款
    for (const wine of wines || []) {
      const wineData: WineData = {
        id: wine.id,
        nameZh: wine.nameZh,
        nameEn: wine.nameEn,
        slug: wine.slug,
        wineryId: wine.wineryId,
        wineryNameZh: (wine.wineries as any).nameZh,
        wineryNameEn: (wine.wineries as any).nameEn,
        wineryWebsite: (wine.wineries as any).website,
        currentImageUrl: wine.mainImageUrl,
      };

      await processWine(wineData);
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒間隔
    }

    console.log("\n✅ 所有酒款處理完成！");
  } catch (error) {
    console.error("\n❌ 處理過程發生錯誤:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

