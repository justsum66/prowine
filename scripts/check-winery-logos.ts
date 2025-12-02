/**
 * 檢查所有酒莊的LOGO URL
 * 用於診斷LOGO顯示問題
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

async function main() {
  console.log("🔍 檢查所有酒莊的LOGO URL...\n");

  try {
    const { data: wineries, error } = await supabase
      .from('wineries')
      .select('id, nameZh, nameEn, logoUrl')
      .order('nameZh');

    if (error) {
      throw new Error(`獲取酒莊失敗: ${error.message}`);
    }

    console.log(`✅ 找到 ${wineries?.length || 0} 個酒莊\n`);

    const withLogo = wineries?.filter(w => w.logoUrl) || [];
    const withoutLogo = wineries?.filter(w => !w.logoUrl) || [];

    console.log(`📊 統計:`);
    console.log(`   有LOGO: ${withLogo.length} 個`);
    console.log(`   無LOGO: ${withoutLogo.length} 個\n`);

    console.log(`\n📋 有LOGO的酒莊:`);
    withLogo.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.nameZh} (${w.nameEn})`);
      console.log(`      URL: ${w.logoUrl}`);
      console.log(`      域名: ${w.logoUrl ? new URL(w.logoUrl).hostname : 'N/A'}`);
      console.log(``);
    });

    if (withoutLogo.length > 0) {
      console.log(`\n⚠️  無LOGO的酒莊:`);
      withoutLogo.forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.nameZh} (${w.nameEn})`);
      });
    }

    // 檢查域名列表
    const domains = new Set<string>();
    withLogo.forEach(w => {
      if (w.logoUrl) {
        try {
          const url = new URL(w.logoUrl);
          domains.add(url.hostname);
        } catch {
          // 無效URL
        }
      }
    });

    console.log(`\n🌐 LOGO域名列表 (需要添加到 next.config.js):`);
    Array.from(domains).sort().forEach(domain => {
      console.log(`   - ${domain}`);
    });

  } catch (error: any) {
    console.error("\n❌ 處理過程發生錯誤:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});

