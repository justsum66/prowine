#!/usr/bin/env tsx
/**
 * 清理不必要的檔案和腳本
 * 保留必要的核心功能腳本
 */

import { unlink, stat, readdir } from "fs/promises";
import { join } from "path";

// 需要保留的核心腳本
const KEEP_SCRIPTS = [
  "test-api-keys.ts",
  "test-runner.ts",
  "run-smoke-test.ts",
  "pre-deployment-check.ts",
  "setup-admin.sql",
];

// 需要刪除的腳本類別
const SCRIPTS_TO_DELETE = [
  // 舊版爬蟲腳本
  "scraper.ts",
  "winery-scraper.ts",
  "scrape-demo-items.ts",
  "scrape-demo-items-simple.ts",
  "scrape-demo-items-fixed.ts",
  "scrape-demo-items-improved.ts",
  "improved-scraper-with-better-selectors.ts",
  "active-scraper-with-monitoring.ts",
  "enhanced-ai-scraper-executor.ts",
  "complete-ai-scraper-executor.ts",
  "monitored-scraper-executor.ts",
  "ai-powered-image-scraper.ts",
  
  // 重複的優化腳本
  "execute-all-optimizations.ts",
  "execute-final-100-optimizations.ts",
  "batch-optimization-executor.ts",
  
  // 重複的檢查腳本
  "run-all-checks.ts",
  "run-all-tests.ts",
  "code-health-check.ts",
  "security-check.ts",
  "final-phase-comprehensive-audit.ts",
  
  // 重複的清理腳本
  "cleanup-repo.ts",
  "remove-console-logs.ts",
  
  // 臨時/測試腳本
  "check-scrape-progress.ts",
  "monitor-scraper-progress.ts",
  "query-missing-assets.ts",
  "check-missing-images.ts",
  "check-wine-data.ts",
  
  // 重複的上傳腳本
  "upload-local-logos.ts",
  "upload-all-logos-from-local.ts",
  "upload-user-logos-complete.ts",
  "process-user-logos.ts",
  
  // 重複的生成腳本
  "generate-wine-descriptions-ai.ts",
  "generate-wine-winery-copy.ts",
  
  // 舊版導入腳本（保留 v2）
  "import-wine-data.ts",
  
  // PowerShell/Shell 腳本（如果不需要）
  "cleanup-files.ps1",
  "monitor-scraper.ps1",
  "get-ngrok-url.ps1",
  "start-ngrok.ps1",
  "start-ngrok.sh",
  
  // 移動報告腳本（一次性使用）
  "move-reports-to-docs.ts",
  
  // 刪除測試數據腳本（謹慎使用）
  "delete-all-demo-data.ts",
];

// 需要刪除的 JSON 進度文件
const JSON_FILES_TO_DELETE = [
  "import-progress.json",
  "scraper-progress.json",
  "wine-images-scrape-progress.json",
  "logo-upload-results.json",
  "missing-assets-report.json",
];

// 需要刪除的 README 文件（保留主要的）
const README_TO_DELETE = [
  "README_SCRAPER.md",
  "README_TESTS.md",
  "README-wine-images-scraper.md",
  "AI_IMAGE_SCRAPER_GUIDE.md",
  "complete-scraper-and-p0-tasks.md",
];

async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await unlink(filePath);
    return true;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return false; // 文件不存在，不算錯誤
    }
    console.error(`❌ 刪除失敗: ${filePath}`, error.message);
    return false;
  }
}

async function cleanupScripts() {
  console.log("🧹 開始清理不必要的腳本文件...\n");
  
  const scriptsDir = join(process.cwd(), "scripts");
  const deleted: string[] = [];
  const failed: string[] = [];
  const notFound: string[] = [];
  
  // 刪除腳本文件
  for (const script of SCRIPTS_TO_DELETE) {
    const filePath = join(scriptsDir, script);
    try {
      await stat(filePath);
      const success = await deleteFile(filePath);
      if (success) {
        deleted.push(script);
        console.log(`✅ 已刪除: ${script}`);
      } else {
        failed.push(script);
      }
    } catch (error: any) {
      if (error.code === "ENOENT") {
        notFound.push(script);
      } else {
        failed.push(script);
      }
    }
  }
  
  // 刪除 JSON 文件
  for (const jsonFile of JSON_FILES_TO_DELETE) {
    const filePath = join(scriptsDir, jsonFile);
    try {
      await stat(filePath);
      const success = await deleteFile(filePath);
      if (success) {
        deleted.push(jsonFile);
        console.log(`✅ 已刪除: ${jsonFile}`);
      }
    } catch (error: any) {
      // 文件不存在，忽略
    }
  }
  
  // 刪除 README 文件
  for (const readme of README_TO_DELETE) {
    const filePath = join(scriptsDir, readme);
    try {
      await stat(filePath);
      const success = await deleteFile(filePath);
      if (success) {
        deleted.push(readme);
        console.log(`✅ 已刪除: ${readme}`);
      }
    } catch (error: any) {
      // 文件不存在，忽略
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 清理總結");
  console.log("=".repeat(60));
  console.log(`✅ 已刪除: ${deleted.length} 個文件`);
  if (notFound.length > 0) {
    console.log(`ℹ️  未找到: ${notFound.length} 個文件（可能已刪除）`);
  }
  if (failed.length > 0) {
    console.log(`❌ 失敗: ${failed.length} 個文件`);
  }
  console.log("=".repeat(60) + "\n");
  
  return { deleted, failed, notFound };
}

async function main() {
  try {
    await cleanupScripts();
    console.log("🎉 清理完成！");
  } catch (error) {
    console.error("❌ 清理過程出錯:", error);
    process.exit(1);
  }
}

main();

