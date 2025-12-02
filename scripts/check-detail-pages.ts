/**
 * 檢查所有酒款和酒莊是否都有詳細頁面
 */

import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// 載入環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

const apiKey = supabaseServiceRoleKey || supabaseAnonKey;
if (!apiKey) {
  throw new Error("Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set");
}

const supabase = createClient(supabaseUrl, apiKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkDetailPages() {
  console.log("🔍 開始檢查所有酒款和酒莊的詳細頁面...\n");

  // 檢查酒款
  console.log("📊 檢查酒款...");
  const { data: wines, error: wineError } = await supabase
    .from("wines")
    .select("id, slug, nameZh, published")
    .eq("published", true);

  if (wineError) {
    console.error("❌ 查詢酒款失敗:", wineError.message);
    return;
  }

  const winesWithoutSlug = wines?.filter((w) => !w.slug || w.slug.trim() === "") || [];
  const winesWithSlug = wines?.filter((w) => w.slug && w.slug.trim() !== "") || [];

  console.log(`  ✅ 已發布酒款總數: ${wines?.length || 0}`);
  console.log(`  ✅ 有 slug 的酒款: ${winesWithSlug.length}`);
  if (winesWithoutSlug.length > 0) {
    console.log(`  ⚠️  缺少 slug 的酒款: ${winesWithoutSlug.length}`);
    winesWithoutSlug.forEach((w) => {
      console.log(`     - ${w.nameZh} (ID: ${w.id})`);
    });
  }

  // 檢查酒莊
  console.log("\n📊 檢查酒莊...");
  const { data: wineries, error: wineryError } = await supabase
    .from("wineries")
    .select("id, slug, nameZh");

  if (wineryError) {
    console.error("❌ 查詢酒莊失敗:", wineryError.message);
    return;
  }

  const wineriesWithoutSlug = wineries?.filter((w) => !w.slug || w.slug.trim() === "") || [];
  const wineriesWithSlug = wineries?.filter((w) => w.slug && w.slug.trim() !== "") || [];

  console.log(`  ✅ 酒莊總數: ${wineries?.length || 0}`);
  console.log(`  ✅ 有 slug 的酒莊: ${wineriesWithSlug.length}`);
  if (wineriesWithoutSlug.length > 0) {
    console.log(`  ⚠️  缺少 slug 的酒莊: ${wineriesWithoutSlug.length}`);
    wineriesWithoutSlug.forEach((w) => {
      console.log(`     - ${w.nameZh} (ID: ${w.id})`);
    });
  }

  // 總結
  console.log("\n📋 總結:");
  console.log(`  ✅ 酒款詳細頁面: ${winesWithSlug.length}/${wines?.length || 0} 可訪問`);
  console.log(`  ✅ 酒莊詳細頁面: ${wineriesWithSlug.length}/${wineries?.length || 0} 可訪問`);

  if (winesWithoutSlug.length === 0 && wineriesWithoutSlug.length === 0) {
    console.log("\n✅ 所有酒款和酒莊都有詳細頁面！");
  } else {
    console.log("\n⚠️  部分酒款或酒莊缺少 slug，需要修復。");
  }

  // 測試幾個詳細頁面的 URL
  console.log("\n🔗 示例詳細頁面 URL:");
  if (winesWithSlug.length > 0) {
    const sampleWine = winesWithSlug[0];
    console.log(`  酒款: /wines/${sampleWine.slug}`);
  }
  if (wineriesWithSlug.length > 0) {
    const sampleWinery = wineriesWithSlug[0];
    console.log(`  酒莊: /wineries/${sampleWinery.slug}`);
  }
}

// 執行檢查
checkDetailPages()
  .then(() => {
    console.log("\n✅ 檢查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 檢查失敗:", error);
    process.exit(1);
  });

