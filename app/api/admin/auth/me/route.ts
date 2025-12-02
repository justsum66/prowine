import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth();

    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    return NextResponse.json({
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
      "Get admin error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/auth/me", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("獲取管理員資訊失敗"),
      requestId
    );
  }
}

