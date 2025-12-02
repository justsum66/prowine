import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// POST - 發送郵件通知
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證請求體
    const { to, subject, html, text, from } = await validateRequestBody(
      z.object({
        to: z.union([
          z.string().email(),
          z.array(z.string().email()),
        ]),
        subject: z.string().min(1, "主旨不能為空"),
        html: z.string().optional(),
        text: z.string().optional(),
        from: z.string().email().optional(),
      }).refine((data) => data.html || data.text, {
        message: "html或text至少需要一個",
      }),
      request
    );

    // 使用Resend發送郵件
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "郵件服務未配置" }, { status: 500 });
    }

    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from || process.env.SMTP_FROM || "ProWine <noreply@prowine.com.tw>",
        to: recipients,
        subject,
        html: html || text,
        text: text || html?.replace(/<[^>]*>/g, ""),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "發送郵件失敗");
    }

    const data = await response.json();

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Send email error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/notifications/email", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("發送郵件失敗"),
      requestId
    );
  }
}

