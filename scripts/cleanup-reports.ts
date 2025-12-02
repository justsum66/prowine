#!/usr/bin/env tsx
/**
 * 清理 docs/reports 中的重複和過時報告
 * 只保留最新的重要報告
 */

import { unlink, stat, readdir } from "fs/promises";
import { join } from "path";

// 需要保留的重要報告
const KEEP_REPORTS = [
  "FINAL_TEST_EXECUTION_REPORT.md",
  "COMPLETE_ERROR_CHECK_AND_TEST_REPORT.md",
  "2026_LUXURY_DESIGN_FINAL_SUMMARY.md",
  "FRONTEND_OPTIMIZATION_100_RECOMMENDATIONS.md",
  "ALL_TASKS_COMPLETE_SUMMARY.md",
  "COMPREHENSIVE_FINAL_REPORT.md",
];

// 需要刪除的報告模式（重複、過時、臨時）
const REPORTS_TO_DELETE_PATTERNS = [
  // 重複的完成報告
  /^ALL_TASKS.*COMPLETE.*\.md$/i,
  /^FINAL.*COMPLETE.*\.md$/i,
  /^COMPLETE.*REPORT.*\.md$/i,
  /^COMPLETE.*SUMMARY.*\.md$/i,
  /^FINAL.*SUMMARY.*\.md$/i,
  /^FINAL.*REPORT.*\.md$/i,
  
  // 重複的優化報告
  /^OPTIMIZATION.*COMPLETE.*\.md$/i,
  /^OPTIMIZATION.*REPORT.*\.md$/i,
  /^OPTIMIZATION.*SUMMARY.*\.md$/i,
  /^OPTIMIZATION.*PROGRESS.*\.md$/i,
  /^OPTIMIZATION.*STATUS.*\.md$/i,
  
  // 重複的修復報告
  /^FIX.*REPORT.*\.md$/i,
  /^FIX.*SUMMARY.*\.md$/i,
  /^ERROR.*FIX.*\.md$/i,
  /^CRITICAL.*FIX.*\.md$/i,
  
  // 重複的爬蟲報告
  /^SCRAPER.*REPORT.*\.md$/i,
  /^SCRAPER.*STATUS.*\.md$/i,
  /^SCRAPER.*FIX.*\.md$/i,
  /^SCRAPER.*COMPLETE.*\.md$/i,
  /^SCRAPER.*EXECUTION.*\.md$/i,
  /^SCRAPER.*MONITORING.*\.md$/i,
  
  // 批次進度報告（保留最新的）
  /^P0_BATCH\d+.*\.md$/i,
  /^P1_BATCH\d+.*\.md$/i,
  /^ADMIN_\d+.*\.md$/i,
  
  // 臨時和調試報告
  /^.*DEBUG.*\.md$/i,
  /^.*STATUS.*\.md$/i,
  /^.*PROGRESS.*\.md$/i,
  /^.*QUESTIONS.*\.md$/i,
  /^.*PLAN.*\.md$/i,
];

async function shouldDelete(fileName: string): Promise<boolean> {
  // 保留重要報告
  if (KEEP_REPORTS.includes(fileName)) {
    return false;
  }
  
  // 檢查是否匹配刪除模式
  for (const pattern of REPORTS_TO_DELETE_PATTERNS) {
    if (pattern.test(fileName)) {
      return true;
    }
  }
  
  return false;
}

async function cleanupReports() {
  console.log("🧹 開始清理 docs/reports 中的重複報告...\n");
  
  const reportsDir = join(process.cwd(), "docs", "reports");
  const deleted: string[] = [];
  const failed: string[] = [];
  const kept: string[] = [];
  
  try {
    const files = await readdir(reportsDir);
    
    for (const file of files) {
      if (!file.endsWith(".md")) {
        continue;
      }
      
      const shouldDel = await shouldDelete(file);
      
      if (shouldDel) {
        const filePath = join(reportsDir, file);
        try {
          await unlink(filePath);
          deleted.push(file);
          console.log(`✅ 已刪除: ${file}`);
        } catch (error: any) {
          failed.push(file);
          console.error(`❌ 刪除失敗: ${file}`, error.message);
        }
      } else {
        kept.push(file);
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 清理總結");
    console.log("=".repeat(60));
    console.log(`✅ 已刪除: ${deleted.length} 個報告`);
    console.log(`📁 保留: ${kept.length} 個報告`);
    if (failed.length > 0) {
      console.log(`❌ 失敗: ${failed.length} 個報告`);
    }
    console.log("=".repeat(60) + "\n");
    
    return { deleted, kept, failed };
  } catch (error) {
    console.error("❌ 讀取報告目錄失敗:", error);
    throw error;
  }
}

async function main() {
  try {
    await cleanupReports();
    console.log("🎉 報告清理完成！");
  } catch (error) {
    console.error("❌ 清理過程出錯:", error);
    process.exit(1);
  }
}

main();

