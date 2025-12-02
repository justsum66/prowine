import { NextRequest } from "next/server";
import { sendContactNotification, sendContactConfirmation } from "@/lib/email";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createErrorResponse, createSuccessResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";
import { rateLimiter, strictRateLimit } from "@/lib/api/rate-limiter";
import { contactFormSchema, validateRequestBody } from "@/lib/api/zod-schemas";

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    // 嚴格速率限制（防止垃圾郵件）
    rateLimiter.check(request, strictRateLimit);
    
    // Q42優化：使用Zod驗證請求體
    const { name, email, phone, subject, message } = await validateRequestBody(contactFormSchema, request);

    // 儲存到資料庫（使用 Supabase）
    const supabase = createServerSupabaseClient();
    let inquiryId: string | undefined;
    
    try {
      const { data: inquiry, error: dbError } = await supabase
        .from("inquiries")
        .insert({
          name,
          email,
          phone,
          notes: `主旨：${subject}\n\n訊息：${message}`,
          status: "PENDING",
        })
        .select()
        .single();
      
      if (dbError) {
        logger.error("Failed to save inquiry to database", dbError, { requestId });
        // 資料庫錯誤不應該阻止郵件發送
      } else {
        inquiryId = inquiry?.id;
        logger.info("Contact inquiry saved", { requestId, inquiryId });
      }
    } catch (dbError) {
      // Q22優化：使用logger（已使用）
      // Q21優化：消除any類型
      logger.error(
        "Failed to save inquiry to database",
        dbError instanceof Error ? dbError : new Error("Database error"),
        { requestId }
      );
      // 資料庫錯誤不應該阻止郵件發送
    }

    // 發送郵件通知（非阻塞）
    const emailPromises = [
      sendContactNotification({
        name,
        email,
        phone: phone || "", // Q21優化：提供默認值，修復類型錯誤
        subject,
        message,
      }).catch((error) => {
        logger.error("Failed to send contact notification", error instanceof Error ? error : new Error("Email error"), { requestId });
      }),
      sendContactConfirmation({
        name,
        email,
        subject,
      }).catch((error) => {
        logger.error("Failed to send contact confirmation", error instanceof Error ? error : new Error("Email error"), { requestId });
      }),
    ];

    // 不等待郵件發送完成（提高響應速度）
    Promise.all(emailPromises).catch(() => {
      // 錯誤已在上面記錄
    });

    const duration = Date.now() - startTime;
    logger.logRequest("POST", "/api/contact", 200, duration, { requestId, inquiryId });

    return createSuccessResponse({
      message: "訊息已成功送出，我們將盡快與您聯繫",
      inquiryId,
    });
  } catch (error) {
    // Q21優化：消除any類型
    const duration = Date.now() - startTime;
    logger.error(
      "Error processing contact form",
      error instanceof Error ? error : new Error("Unknown error"),
      { requestId }
    );
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
    logger.logRequest("POST", "/api/contact", statusCode, duration, { requestId });
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to process contact form"),
      requestId
    );
  }
}
