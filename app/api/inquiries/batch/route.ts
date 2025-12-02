import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { createErrorResponse, createSuccessResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";
import { rateLimiter, strictRateLimit } from "@/lib/api/rate-limiter";
import { validateRequest, validators } from "@/lib/api/validation";
import { sanitizeInput } from "@/lib/utils/xss-protection";

/**
 * POST - 批量詢價（優化任務 #51）
 * 允許一次選擇多個商品進行批量詢價
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 速率限制
    rateLimiter.check(request, strictRateLimit);

    const body = await request.json();
    const { wineIds, name, email, phone, quantity, purpose, budget, notes, specialRequest, deliveryDate } = body;

    // XSS 防護：清理所有用戶輸入
    const sanitizedData = {
      wineIds: Array.isArray(wineIds) ? wineIds.map((id: string) => sanitizeInput(id, 'text')) : [],
      name: sanitizeInput(name, 'text'),
      email: sanitizeInput(email, 'text'),
      phone: sanitizeInput(phone, 'text'),
      quantity: quantity ? sanitizeInput(quantity, 'text') : undefined,
      purpose: purpose ? sanitizeInput(purpose, 'text') : undefined,
      budget: budget ? sanitizeInput(budget, 'text') : undefined,
      notes: notes ? sanitizeInput(notes, 'text') : undefined,
      specialRequest: specialRequest ? sanitizeInput(specialRequest, 'text') : undefined,
      deliveryDate: deliveryDate ? sanitizeInput(deliveryDate, 'text') : undefined,
    };

    // Q21優化：使用類型接口，消除any
    // 驗證輸入
    validateRequest(sanitizedData, [
      { field: "wineIds", validator: (value: unknown) => Array.isArray(value) && value.length > 0, message: "請至少選擇一個商品", required: true },
      { field: "name", validator: validators.stringLength(2, 100), message: "姓名長度必須在 2-100 字元之間", required: true },
      { field: "email", validator: validators.email, message: "無效的電子郵件地址", required: true },
      { field: "phone", validator: validators.phone, message: "無效的電話號碼", required: true },
    ]);

    if (!Array.isArray(sanitizedData.wineIds) || sanitizedData.wineIds.length === 0) {
      return NextResponse.json({ error: "請至少選擇一個商品" }, { status: 400 });
    }

    // 批量限制（最多20個商品）
    if (sanitizedData.wineIds.length > 20) {
      return NextResponse.json({ error: "批量詢價最多支持20個商品" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const inquiries = [];

    // 為每個商品創建詢價記錄
    for (const wineId of sanitizedData.wineIds) {
      const inquiryData = {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        wineId,
        quantity: sanitizedData.quantity,
        purpose: sanitizedData.purpose,
        budget: sanitizedData.budget,
        notes: sanitizedData.notes || `批量詢價（共${sanitizedData.wineIds.length}個商品）`,
        specialRequest: sanitizedData.specialRequest,
        deliveryDate: sanitizedData.deliveryDate,
        status: "PENDING",
      };

      const { data: inquiry, error } = await supabase
        .from("inquiries")
        .insert(inquiryData)
        .select()
        .single();

      if (error) {
        logger.error(`Failed to create inquiry for wine ${wineId}`, error, { requestId, wineId });
      } else if (inquiry) {
        inquiries.push(inquiry);
      }
    }

    const duration = Date.now() - startTime;
    logger.logRequest("POST", "/api/inquiries/batch", 200, duration, { requestId, count: inquiries.length });

    return createSuccessResponse({
      message: `成功提交 ${inquiries.length}/${sanitizedData.wineIds.length} 個商品的詢價請求`,
      inquiries: inquiries.map(i => i.id),
      count: inquiries.length,
    });
  } catch (error) {
    // Q21優化：消除any類型
    const duration = Date.now() - startTime;
    logger.error(
      "Error processing batch inquiry",
      error instanceof Error ? error : new Error("Unknown error"),
      { requestId }
    );
    const statusCode = error && typeof error === 'object' && 'statusCode' in error ? (error.statusCode as number) : 500;
    logger.logRequest("POST", "/api/inquiries/batch", statusCode, duration, { requestId });
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to process batch inquiry"),
      requestId
    );
  }
}
