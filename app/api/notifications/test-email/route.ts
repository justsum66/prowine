import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/middleware/admin-middleware";
import { sendEmailNotification } from "@/lib/services/notification-service";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

/**
 * 測試 Email 通知發送
 * 僅管理員可訪問
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 檢查管理員權限
    const adminCheck = await requireAdminRole(request, "ADMIN");
    if (adminCheck) {
      return adminCheck;
    }

    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(
      z.object({
        to: z.string().email("無效的電子郵件地址"),
        subject: z.string().min(1, "主旨不能為空"),
        html: z.string().min(1, "HTML內容不能為空"),
      }),
      request
    );
    
    const { to, subject, html } = body;

    // 發送測試郵件
    const success = await sendEmailNotification(
      to,
      subject,
      html,
      html.replace(/<[^>]*>/g, "") // 純文本版本
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "測試郵件已發送",
      });
    } else {
      return createErrorResponse(new Error("郵件發送失敗"), requestId);
    }
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "測試 Email 發送失敗",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/notifications/test-email", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("發送失敗"),
      requestId
    );
  }
}

