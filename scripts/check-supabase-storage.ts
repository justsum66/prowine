/**
 * 檢查 Supabase Storage 配置和可用的 buckets
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase URL or Service Key is not defined.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkStorage() {
  console.log("🔍 檢查 Supabase Storage 配置...\n");
  console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

  // 列出所有 buckets
  console.log("📦 可用的 Storage Buckets:");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error("❌ 無法列出 buckets:", bucketsError.message);
    return;
  }

  if (!buckets || buckets.length === 0) {
    console.log("  ⚠️  沒有找到任何 bucket");
    return;
  }

  buckets.forEach((bucket, index) => {
    console.log(`  ${index + 1}. ${bucket.name} (${bucket.public ? '公開' : '私有'})`);
  });

  // 檢查 'images' bucket 是否存在
  const imagesBucket = buckets.find(b => b.name === 'images');
  if (imagesBucket) {
    console.log(`\n✅ 'images' bucket 存在且為 ${imagesBucket.public ? '公開' : '私有'}`);
    
    // 嘗試列出文件
    console.log("\n📁 'images' bucket 中的文件夾:");
    const { data: files, error: listError } = await supabase.storage
      .from('images')
      .list('', {
        limit: 10,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error("  ❌ 無法列出文件:", listError.message);
    } else if (files && files.length > 0) {
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || '?'} bytes)`);
      });
    } else {
      console.log("  (空)");
    }
  } else {
    console.log("\n⚠️  'images' bucket 不存在");
    console.log("\n建議：");
    console.log("  1. 在 Supabase Dashboard 中創建 'images' bucket");
    console.log("  2. 或使用現有的 bucket 名稱");
  }
}

checkStorage().catch(console.error);

