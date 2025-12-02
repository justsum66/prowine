#!/usr/bin/env tsx
/**
 * 部署前全面檢查腳本
 * 檢查所有潛在錯誤和問題
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface CheckResult {
  category: string;
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function addResult(
  category: string,
  name: string,
  status: "pass" | "fail" | "warning",
  message: string,
  details?: string
) {
  results.push({ category, name, status, message, details });
}

// 1. 環境變數檢查
async function checkEnvironmentVariables() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 檢查環境變數");
  console.log("=".repeat(60) + "\n");

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const optional = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "GOOGLE_AI_API_KEY",
    "GROQ_API_KEY",
  ];

  // 檢查必需環境變數
  for (const key of required) {
    if (process.env[key]) {
      addResult("環境變數", key, "pass", "已設置");
    } else {
      addResult("環境變數", key, "fail", "未設置 - 必需！");
    }
  }

  // 檢查可選環境變數
  for (const key of optional) {
    if (process.env[key]) {
      addResult("環境變數", key, "pass", "已設置");
    } else {
      addResult("環境變數", key, "warning", "未設置 - 可選");
    }
  }
}

// 2. API 端點健康檢查
async function checkApiEndpoints() {
  console.log("\n" + "=".repeat(60));
  console.log("🔌 檢查 API 端點");
  console.log("=".repeat(60) + "\n");

  const endpoints = [
    { name: "GET /api/wines", url: `${BASE_URL}/api/wines?limit=1` },
    { name: "GET /api/wineries", url: `${BASE_URL}/api/wineries?limit=1` },
    { name: "GET /api/user/me", url: `${BASE_URL}/api/user/me` },
    { name: "GET /api/health", url: `${BASE_URL}/api/health` },
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint.url, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status < 500) {
        addResult(
          "API端點",
          endpoint.name,
          "pass",
          `HTTP ${response.status}`,
          `響應時間正常`
        );
      } else {
        addResult(
          "API端點",
          endpoint.name,
          "fail",
          `HTTP ${response.status} - 服務器錯誤`,
          `需要修復`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("abort")) {
        addResult(
          "API端點",
          endpoint.name,
          "warning",
          "請求超時或服務器未運行",
          "開發環境可能需要啟動服務器"
        );
      } else {
        addResult(
          "API端點",
          endpoint.name,
          "fail",
          `連接失敗: ${errorMessage}`,
          "檢查服務器狀態"
        );
      }
    }
  }
}

// 3. 頁面可訪問性檢查
async function checkPages() {
  console.log("\n" + "=".repeat(60));
  console.log("📄 檢查頁面");
  console.log("=".repeat(60) + "\n");

  const pages = [
    { name: "首頁", path: "/" },
    { name: "酒款列表", path: "/wines" },
    { name: "酒莊列表", path: "/wineries" },
  ];

  for (const page of pages) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}${page.path}`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 200) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          addResult("頁面", page.name, "pass", `HTTP ${response.status}`, "正常");
        } else {
          addResult(
            "頁面",
            page.name,
            "warning",
            `HTTP ${response.status}`,
            `內容類型: ${contentType}`
          );
        }
      } else {
        addResult(
          "頁面",
          page.name,
          "fail",
          `HTTP ${response.status}`,
          "頁面無法訪問"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addResult(
        "頁面",
        page.name,
        "warning",
        "無法檢查（服務器可能未運行）",
        errorMessage
      );
    }
  }
}

// 4. 文件完整性檢查
async function checkFileIntegrity() {
  console.log("\n" + "=".repeat(60));
  console.log("📁 檢查關鍵文件");
  console.log("=".repeat(60) + "\n");

  const fs = await import("fs/promises");
  const path = await import("path");

  const criticalFiles = [
    "app/layout.tsx",
    "app/page.tsx",
    "components/HeroCarousel.tsx",
    "components/WineCard.tsx",
    "components/WineryCard.tsx",
    "app/globals.css",
    "tailwind.config.js",
    "next.config.js",
    "tsconfig.json",
  ];

  for (const file of criticalFiles) {
    try {
      const filePath = path.join(process.cwd(), file);
      await fs.access(filePath);
      addResult("文件完整性", file, "pass", "文件存在");
    } catch (error) {
      addResult("文件完整性", file, "fail", "文件不存在", file);
    }
  }
}

// 5. 依賴檢查
async function checkDependencies() {
  console.log("\n" + "=".repeat(60));
  console.log("📦 檢查依賴");
  console.log("=".repeat(60) + "\n");

  try {
    const packageJson = await import("../package.json");
    const dependencies = Object.keys(packageJson.default.dependencies || {});

    const critical = [
      "next",
      "react",
      "react-dom",
      "@supabase/supabase-js",
      "framer-motion",
    ];

    for (const dep of critical) {
      if (dependencies.includes(dep)) {
        addResult("依賴", dep, "pass", "已安裝");
      } else {
        addResult("依賴", dep, "fail", "未安裝 - 必需！");
      }
    }
  } catch (error) {
    addResult("依賴", "檢查失敗", "warning", "無法讀取package.json");
  }
}

// 打印總結
function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 檢查總結");
  console.log("=".repeat(60) + "\n");

  const byCategory: Record<string, CheckResult[]> = {};
  results.forEach((result) => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  });

  Object.keys(byCategory).forEach((category) => {
    console.log(`\n📂 ${category}:`);
    byCategory[category].forEach((result) => {
      const icon =
        result.status === "pass"
          ? "✅"
          : result.status === "fail"
          ? "❌"
          : "⚠️";
      console.log(`  ${icon} ${result.name}: ${result.message}`);
      if (result.details) {
        console.log(`     └─ ${result.details}`);
      }
    });
  });

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;

  console.log("\n" + "=".repeat(60));
  console.log(`✅ 通過: ${passed}`);
  console.log(`⚠️  警告: ${warnings}`);
  console.log(`❌ 失敗: ${failed}`);
  console.log(`📊 總計: ${results.length}`);
  console.log("=".repeat(60) + "\n");

  if (failed > 0) {
    console.log("⚠️  發現關鍵錯誤，請修復後再部署！\n");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("⚠️  有一些警告，建議檢查後再部署。\n");
  } else {
    console.log("🎉 所有檢查通過，準備部署！\n");
  }
}

// 主函數
async function main() {
  console.log("🚀 開始執行部署前檢查...\n");
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  try {
    await checkEnvironmentVariables();
    await checkFileIntegrity();
    await checkDependencies();
    await checkApiEndpoints();
    await checkPages();
  } catch (error) {
    console.error("\n❌ 檢查過程出錯:", error);
    process.exit(1);
  }

  printSummary();
}

main().catch((error) => {
  console.error("❌ 檢查腳本出錯:", error);
  process.exit(1);
});

