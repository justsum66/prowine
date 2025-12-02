/**
 * API Keys 測試工具
 * 測試所有 API KEY 的有效性
 */

import dotenv from "dotenv";
import { config } from "dotenv";

// 載入環境變數
dotenv.config();

interface ApiKeyTest {
  name: string;
  key: string | undefined;
  testUrl?: string;
  testMethod?: (key: string) => Promise<boolean>;
  status: "pending" | "testing" | "valid" | "invalid" | "missing" | "error";
  message?: string;
}

const tests: ApiKeyTest[] = [
  // AI APIs
  {
    name: "GROQ_API_KEY",
    key: process.env.GROQ_API_KEY,
    testMethod: async (key: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("https://api.groq.com/openai/v1/models", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("請求超時（10秒）");
        }
        throw error;
      }
    },
    status: "pending",
  },
  {
    name: "GOOGLE_AI_API_KEY",
    key: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY,
    testMethod: async (key: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${key}`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("請求超時（10秒）");
        }
        throw error;
      }
    },
    status: "pending",
  },
  {
    name: "OPENROUTER_API_KEY",
    key: process.env.OPENROUTER_API_KEY,
    testMethod: async (key: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("請求超時（10秒）");
        }
        throw error;
      }
    },
    status: "pending",
  },
  // Email API
  {
    name: "RESEND_API_KEY",
    key: process.env.RESEND_API_KEY,
    testMethod: async (key: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("https://api.resend.com/domains", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok || response.status === 403; // 403 也表示 key 有效
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("請求超時（10秒）");
        }
        throw error;
      }
    },
    status: "pending",
  },
  // Cloudinary
  {
    name: "CLOUDINARY_API_KEY",
    key: process.env.CLOUDINARY_API_KEY,
    status: "pending",
    message: "需要配合 CLOUDINARY_CLOUD_NAME 和 CLOUDINARY_API_SECRET 測試",
  },
  {
    name: "CLOUDINARY_CLOUD_NAME",
    key: process.env.CLOUDINARY_CLOUD_NAME,
    status: "pending",
  },
  {
    name: "CLOUDINARY_API_SECRET",
    key: process.env.CLOUDINARY_API_SECRET,
    status: "pending",
  },
  // Supabase
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    key: process.env.NEXT_PUBLIC_SUPABASE_URL,
    testMethod: async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        // 測試 Supabase REST API 健康檢查端點
        // 使用 /rest/v1/ 端點，即使返回 406 也表示連接成功
        const response = await fetch(`${url}/rest/v1/`, {
          method: "GET",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        // 200, 406 (Not Acceptable), 或任何非 5xx 錯誤都表示連接成功
        return response.status < 500;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("請求超時（10秒）");
        }
        // 網絡錯誤，可能是 URL 無效
        if (error.message?.includes("fetch failed") || error.message?.includes("ENOTFOUND")) {
          throw new Error("無法連接到 Supabase URL，請檢查 URL 是否正確");
        }
        return false;
      }
    },
    status: "pending",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    status: "pending",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    status: "pending",
  },
  // Google Maps
  {
    name: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    testMethod: async (key: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        // 測試 Geocoding API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${key}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        clearTimeout(timeoutId);
        // REQUEST_DENIED 或 OK 都表示 key 有效（只是可能沒有權限）
        return data.status === "OK" || data.status === "REQUEST_DENIED";
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("請求超時（10秒）");
        }
        throw error;
      }
    },
    status: "pending",
  },
  // Web Scraping
  {
    name: "APIFY_API_KEY",
    key: process.env.APIFY_API_KEY,
    testMethod: async (key: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("https://api.apify.com/v2/user", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("請求超時（10秒）");
        }
        throw error;
      }
    },
    status: "pending",
  },
];

async function testApiKey(test: ApiKeyTest): Promise<void> {
  if (!test.key || test.key.trim() === "") {
    test.status = "missing";
    test.message = "API Key 未設置";
    return;
  }

  // 遮罩顯示（只顯示前後各4個字符）
  const maskedKey =
    test.key.length > 8
      ? `${test.key.substring(0, 4)}...${test.key.substring(test.key.length - 4)}`
      : "****";

  console.log(`\n🔍 測試 ${test.name} (${maskedKey})...`);
  test.status = "testing";

  try {
    if (test.testMethod) {
      // 使用 Promise.race 確保 10 秒超時
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("請求超時（10秒）")), 10000);
      });

      const isValid = await Promise.race([
        test.testMethod(test.key!),
        timeoutPromise,
      ]).catch((error) => {
        if (error.message?.includes("超時")) {
          throw error;
        }
        return false;
      });

      if (isValid === true) {
        test.status = "valid";
        test.message = "✅ API Key 有效";
      } else {
        test.status = "invalid";
        test.message = "❌ API Key 無效或已過期";
      }
    } else {
      // 沒有測試方法，只檢查是否存在
      test.status = "valid";
      test.message = "✅ API Key 已設置（未測試）";
    }
  } catch (error: any) {
    test.status = "error";
    const errorMsg = error.message || "未知錯誤";
    if (errorMsg.includes("超時") || errorMsg.includes("timeout")) {
      test.status = "error";
      test.message = `⏱️ 測試超時: 請求超過 10 秒未響應`;
    } else {
      test.message = `❌ 測試失敗: ${errorMsg}`;
    }
  }
}

async function main() {
  console.log("🚀 開始測試所有 API Keys...\n");
  console.log("=".repeat(60));
  console.log(`⏱️ 每個 API Key 測試最多 10 秒\n`);

  const startTime = Date.now();

  // 順序測試，每個都有超時保護（更安全，避免並行請求過多）
  console.log(`\n開始測試 ${tests.length} 個 API Keys...\n`);
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`[${i + 1}/${tests.length}] 正在測試: ${test.name}`);
    await testApiKey(test);
    
    // 顯示進度
    if (test.status === "valid") {
      console.log(`✅ ${test.name}: 通過`);
    } else if (test.status === "missing") {
      console.log(`⚠️ ${test.name}: 未設置`);
    } else {
      console.log(`❌ ${test.name}: ${test.message || "失敗"}`);
    }
    
    // 添加小延遲避免請求過快
    if (i < tests.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️ 總測試時間: ${duration} 秒\n`);

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 測試結果總結:\n");

  const results = {
    valid: tests.filter((t) => t.status === "valid").length,
    invalid: tests.filter((t) => t.status === "invalid").length,
    missing: tests.filter((t) => t.status === "missing").length,
    error: tests.filter((t) => t.status === "error").length,
  };

  // 顯示詳細結果
  for (const test of tests) {
    const icon =
      test.status === "valid"
        ? "✅"
        : test.status === "invalid"
          ? "❌"
          : test.status === "missing"
            ? "⚠️"
            : "🔴";
    console.log(`${icon} ${test.name}: ${test.message || test.status}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📈 統計:`);
  console.log(`  ✅ 有效: ${results.valid}`);
  console.log(`  ❌ 無效: ${results.invalid}`);
  console.log(`  ⚠️  缺失: ${results.missing}`);
  console.log(`  🔴 錯誤: ${results.error}`);
  console.log(`  📦 總計: ${tests.length}`);

  // 建議
  console.log("\n💡 建議:");
  if (results.invalid > 0) {
    console.log("  - 部分 API Key 無效，請檢查並更新");
  }
  if (results.missing > 0) {
    console.log("  - 部分 API Key 缺失，請在 .env 文件中設置");
  }
  if (results.error > 0) {
    console.log("  - 部分 API Key 測試時出錯，請檢查網絡連接");
  }
  if (results.valid === tests.length) {
    console.log("  - 所有 API Key 都已正確設置！🎉");
  }

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);

