import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/middleware/admin-middleware";
import {
  sendNotification,
  NotificationData,
  NotificationType,
} from "@/lib/services/notification-service";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 檢查管理員權限
    const adminCheck = await requireAdminRole(request, "ADMIN");
    if (adminCheck) {
      return adminCheck; // 返回錯誤響應
    }

    // Q42優化：使用Zod驗證請求體
    const notificationSchema = z.object({
      type: z.enum([
        "new_inquiry",
        "order_status_change",
        "low_stock",
        "user_registration",
        "important_article",
        "system_maintenance"
      ]),
      recipients: z.object({
        userIds: z.array(z.string()).optional(),
        emails: z.array(z.string().email()).optional(),
        allUsers: z.boolean().optional(),
      }),
      notification: z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        url: z.string().url().optional(),
        icon: z.string().url().optional(),
        badge: z.string().url().optional(),
        data: z.record(z.string(), z.unknown()).optional(),
      }),
    });
    
    const body = await validateRequestBody(notificationSchema, request);
    
    const { type, recipients, notification: notificationData } = body;
    
    // 構建NotificationData對象
    const notification: NotificationData = {
      type: type as NotificationType,
      title: notificationData.title,
      body: notificationData.body,
      url: notificationData.url,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data as Record<string, unknown> | undefined,
    };

    // 發送通知
    const results = await sendNotification(type, recipients, notification);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "發送通知失敗",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/notifications/send", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("發送通知失敗"),
      requestId
    );
  }
}

