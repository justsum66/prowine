/**
 * 健康檢查端點
 * 用於監控系統狀態
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";

// Q21優化：定義類型接口，消除any
interface HealthCheck {
  status: "ok" | "error";
  latency?: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  checks: Record<string, HealthCheck>;
  latency: number;
}

export async function GET() {
  const startTime = Date.now();
  // Q21優化：使用類型接口，消除any
  const checks: Record<string, HealthCheck> = {};

  // 檢查數據庫連接
  try {
    const dbStartTime = Date.now();
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("wines").select("id").limit(1);
    const dbLatency = Date.now() - dbStartTime;
    
    if (error) {
      checks.database = { status: "error", error: error.message };
    } else {
      checks.database = { status: "ok", latency: dbLatency };
    }
  } catch (error) {
    // Q21優化：消除any類型
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    checks.database = { status: "error", error: errorMessage };
  }

  // 檢查環境變量
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key]
  );
  
  if (missingEnvVars.length > 0) {
    checks.environment = {
      status: "error",
      error: `缺少環境變量: ${missingEnvVars.join(", ")}`,
    };
  } else {
    checks.environment = { status: "ok" };
  }

  const totalLatency = Date.now() - startTime;
  const allHealthy = Object.values(checks).every((check) => check.status === "ok");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      latency: totalLatency,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

