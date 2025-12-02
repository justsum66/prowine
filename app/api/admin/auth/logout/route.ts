import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth();

    if (admin) {
      // 創建審計日誌
      await createAuditLog(
        admin.id,
        "LOGOUT",
        "ADMIN",
        admin.id,
        { email: admin.email },
        request
      );
    }

    // 登出 Supabase Auth
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Admin logout error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/auth/logout", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("登出失敗"),
      requestId
    );
  }
}

