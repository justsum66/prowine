/**
 * 使用 Cloudinary 上傳 LOGO 文件
 */

import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "path";
import { readFileSync, existsSync, writeFileSync } from "fs";

config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cloudinary 配置
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/^@+/, '').trim();
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase URL or Service Key is not defined.");
  process.exit(1);
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Cloudinary 配置不完整。");
  console.log("請確保 .env.local 中包含：");
  console.log("  CLOUDINARY_CLOUD_NAME=...");
  console.log("  CLOUDINARY_API_KEY=...");
  console.log("  CLOUDINARY_API_SECRET=...");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface LogoMapping {
  filePath: string;
  wineryId: string;
  wineryNameZh: string;
  slug: string;
}

const LOGO_MAPPINGS: LogoMapping[] = [
  {
    filePath: "C:\\Users\\paul0\\Downloads\\Staglin Family-800HW.jpg",
    wineryId: "winery_staglin-family",
    wineryNameZh: "Staglin Family",
    slug: "staglin-family",
  },
  {
    filePath: "C:\\Users\\paul0\\Downloads\\LambornLogo.jpg",
    wineryId: "winery_lamborn-family",
    wineryNameZh: "Lamborn Family",
    slug: "lamborn-family",
  },
  {
    filePath: "C:\\Users\\paul0\\Downloads\\images.png",
    wineryId: "winery_horseplay",
    wineryNameZh: "Horseplay",
    slug: "horseplay",
  },
  {
    filePath: "C:\\Users\\paul0\\Downloads\\images (1).png",
    wineryId: "winery_domaine-yann-chave",
    wineryNameZh: "Domaine Yann Chave",
    slug: "domaine-yann-chave",
  },
  {
    filePath: "C:\\Users\\paul0\\Downloads\\images (2).png",
    wineryId: "winery_bodegas-leza-garcia",
    wineryNameZh: "Bodegas Leza Garcia",
    slug: "bodegas-leza-garcia",
  },
  {
    filePath: "C:\\Users\\paul0\\Downloads\\49787-27185169.jpeg",
    wineryId: "winery_darioush",
    wineryNameZh: "Darioush",
    slug: "darioush",
  },
  {
    filePath: "C:\\Users\\paul0\\Downloads\\logog.jpg",
    wineryId: "winery_miner-family",
    wineryNameZh: "Miner Family",
    slug: "miner-family",
  },
];

async function uploadToCloudinary(
  filePath: string,
  winerySlug: string
): Promise<string | null> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const buffer = readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/${filePath.split('.').pop()?.toLowerCase() || 'png'};base64,${base64}`;

    console.log(`  📤 上傳到 Cloudinary: prowine/wineries/${winerySlug}/logo`);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataUri,
        {
          folder: `prowine/wineries/${winerySlug}`,
          public_id: 'logo',
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    if (result && result.secure_url) {
      console.log(`  ✅ 上傳成功: ${result.secure_url}`);
      return result.secure_url;
    }

    return null;
  } catch (error: any) {
    console.error(`  ❌ 上傳失敗: ${error.message}`);
    return null;
  }
}

async function updateDatabase(
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

    return !error;
  } catch (error: any) {
    return false;
  }
}

async function main() {
  console.log("🚀 開始上傳 LOGO 文件到 Cloudinary\n");
  console.log(`📊 待處理數量: ${LOGO_MAPPINGS.length}\n`);

  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const mapping of LOGO_MAPPINGS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏛️  ${mapping.wineryNameZh}`);
    console.log(`📁 ${mapping.filePath.split(/[/\\]/).pop()}`);
    console.log(`${'='.repeat(60)}`);

    if (!existsSync(mapping.filePath)) {
      console.log(`  ❌ 文件不存在，跳過`);
      results.failed.push(mapping.wineryNameZh);
      continue;
    }

    const uploadedUrl = await uploadToCloudinary(
      mapping.filePath,
      mapping.slug
    );

    if (!uploadedUrl) {
      results.failed.push(mapping.wineryNameZh);
      continue;
    }

    const updated = await updateDatabase(mapping.wineryId, uploadedUrl);
    if (updated) {
      console.log(`  ✅ 數據庫更新成功`);
      results.success.push(mapping.wineryNameZh);
    } else {
      console.log(`  ❌ 數據庫更新失敗`);
      results.failed.push(mapping.wineryNameZh);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log("📊 處理結果");
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ 成功: ${results.success.length} 個`);
  console.log(`❌ 失敗: ${results.failed.length} 個`);

  if (results.success.length > 0) {
    console.log(`\n✅ 成功:`);
    results.success.forEach(name => console.log(`  - ${name}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ 失敗:`);
    results.failed.forEach(name => console.log(`  - ${name}`));
  }

  // 保存結果
  const resultPath = join(process.cwd(), 'scripts', 'logo-upload-results.json');
  writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
  }, null, 2));
  console.log(`\n💾 結果已保存到: ${resultPath}`);
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});

export { uploadToCloudinary, updateDatabase };

