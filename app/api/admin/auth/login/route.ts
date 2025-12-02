import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Q42優化：使用Zod驗證請求體
    const { email, password } = await validateRequestBody(
      z.object({
        email: z.string().email("無效的電子郵件地址"),
        password: z.string().min(1, "密碼不能為空"),
      }),
      request
    );

    // 使用 Supabase Auth 登入
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      logger.warn("Admin login failed - invalid credentials", {
        endpoint: "/api/admin/auth/login",
        requestId,
        email,
      });
      return createErrorResponse(new Error("帳號或密碼錯誤"), requestId);
    }

    // 檢查是否為管理員
    const admin = await checkAdminAuth();

    if (!admin) {
      // 登出（因為不是管理員）
      await supabase.auth.signOut();
      logger.warn("Admin login failed - not admin", {
        endpoint: "/api/admin/auth/login",
        requestId,
        userId: data.user.id,
      });
      return createErrorResponse(new Error("您沒有管理員權限"), requestId);
    }

    // 創建審計日誌
    await createAuditLog(
      admin.id,
      "LOGIN",
      "ADMIN",
      admin.id,
      { email: admin.email },
      request
    );

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        active: admin.active,
      },
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Admin login error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/auth/login", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("登入失敗"),
      requestId
    );
  }
}

