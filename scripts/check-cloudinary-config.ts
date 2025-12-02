/**
 * 檢查 Cloudinary 配置
 */

import { config } from "dotenv";
import { join } from "path";

// 加載環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

console.log("🔍 檢查 Cloudinary 配置...\n");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("環境變數狀態:");
console.log(`  CLOUDINARY_CLOUD_NAME: ${cloudName ? `✅ 已設置 (${cloudName})` : "❌ 未設置"}`);
console.log(`  CLOUDINARY_API_KEY: ${apiKey ? `✅ 已設置 (${apiKey.substring(0, 10)}...)` : "❌ 未設置"}`);
console.log(`  CLOUDINARY_API_SECRET: ${apiSecret ? `✅ 已設置 (${apiSecret.substring(0, 10)}...)` : "❌ 未設置"}`);

console.log("\n配置驗證:");

// 清理 cloud_name
const cleanCloudName = cloudName?.replace(/^@+/, '').trim();

if (!cleanCloudName || !apiKey || !apiSecret) {
  console.log("  ❌ 配置不完整");
  console.log("\n請在 .env.local 文件中添加以下配置:");
  console.log("  CLOUDINARY_CLOUD_NAME=dsgvbsj9k");
  console.log("  CLOUDINARY_API_KEY=341388744959128");
  console.log("  CLOUDINARY_API_SECRET=你的_API_Secret");
  process.exit(1);
}

if (cleanCloudName === 'Root' || cleanCloudName === '') {
  console.log("  ❌ cloud_name 無效 (不能是 'Root' 或空字符串)");
  process.exit(1);
}

console.log("  ✅ 所有配置已設置");
console.log(`  ✅ cloud_name: ${cleanCloudName}`);
console.log(`  ✅ API Key: ${apiKey.substring(0, 10)}...`);
console.log(`  ✅ API Secret: ${apiSecret.substring(0, 10)}...`);

console.log("\n✅ Cloudinary 配置正確！");

