import { NextRequest, NextResponse } from "next/server";
import { sendReturnNotification, sendReturnConfirmation } from "@/lib/email";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { returnFormSchema, validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義類型接口，消除any
interface OrderData {
  id: string;
  createdAt: string;
  shippingAddress?: {
    phone?: string;
    [key: string]: unknown;
  } | null;
  users?: {
    email?: string;
    name?: string;
  } | Array<{
    email?: string;
    name?: string;
  }> | null;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(
      returnFormSchema.extend({
        customerEmail: z.string().email().optional(),
        customerName: z.string().optional(),
      }),
      request
    );
    
    const { orderNumber, reason, type, exchangeProductId, images, customerEmail, customerName } = body;

    // 驗證訂單是否存在（從資料庫查詢）
    const supabase = createServerSupabaseClient();
    let order = null;
    
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          createdAt,
          shippingAddress,
          users (
            email,
            name
          )
        `)
        .eq("id", orderNumber)
        .single();

      if (orderError || !orderData) {
        return createErrorResponse(
          new Error("找不到此訂單"),
          requestId
        );
      }

      order = orderData as OrderData;

      // 檢查訂單是否符合退換貨條件
      const orderDate = new Date(order.createdAt);
      const daysSinceOrder = Math.floor(
        (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceOrder > 7) {
        return NextResponse.json(
          { error: "訂單已超過 7 天退換貨期限" },
          { status: 400 }
        );
      }

      // 使用訂單中的客戶資訊
      const user = Array.isArray(order.users) ? order.users[0] : order.users;
      const finalCustomerEmail = customerEmail || user?.email || "";
      const finalCustomerName = customerName || user?.name || "";

      // Q21優化：使用類型接口，消除any
      // 從 shippingAddress 獲取電話（如果有的話）
      const shippingInfo = order.shippingAddress as { phone?: string; [key: string]: unknown } | null | undefined;
      const shippingPhone = shippingInfo?.phone || "";

      // 生成申請編號
      const applicationId = `RET-${Date.now().toString().slice(-8)}`;

      // 儲存退換貨申請到資料庫
      try {
        await supabase
          .from("inquiries")
          .insert({
            name: finalCustomerName || "客戶",
            email: finalCustomerEmail,
            phone: shippingPhone,
            notes: `退換貨申請 - 訂單編號：${orderNumber}\n申請類型：${type === "return" ? "退貨" : "換貨"}\n原因：${reason}${exchangeProductId ? `\n換貨商品 ID：${exchangeProductId}` : ""}${images && images.length > 0 ? `\n圖片：${images.join(", ")}` : ""}`,
            specialRequest: JSON.stringify({
              orderNumber,
              applicationId,
              exchangeProductId,
              images: images || [],
              type,
            }),
            status: "PENDING",
          });
      } catch (dbError) {
        // Q22優化：使用logger替代console.warn
        logger.warn("Failed to save return application to database", {
          endpoint: "/api/returns",
          requestId,
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }

      // 發送郵件通知
      try {
        // 發送通知給客服
        await sendReturnNotification({
          orderNumber,
          reason,
          type,
          customerEmail: finalCustomerEmail,
          customerName: finalCustomerName,
          exchangeProductId,
        });

        // 發送確認郵件給客戶
        if (finalCustomerEmail) {
          await sendReturnConfirmation({
            email: finalCustomerEmail,
            name: finalCustomerName,
            orderNumber,
            applicationId,
            type,
          });
        }
      } catch (emailError) {
        // Q22優化：使用logger替代console.error
        // Q21優化：消除any類型
        logger.error(
          "Failed to send emails",
          emailError instanceof Error ? emailError : new Error("Email error"),
          { endpoint: "/api/returns", requestId }
        );
        // 即使郵件發送失敗，也繼續處理
      }

      return NextResponse.json({
        success: true,
        applicationId,
        message: "退換貨申請已成功提交",
      });
    } catch (dbError) {
      // Q22優化：使用logger替代console.error
      // Q21優化：消除any類型
      logger.error(
        "Database error",
        dbError instanceof Error ? dbError : new Error("Database error"),
        { endpoint: "/api/returns", requestId }
      );
      // 如果資料庫操作失敗，仍然嘗試發送郵件
    }

    // 如果資料庫不可用，仍然生成申請編號並返回
    const applicationId = `RET-${Date.now().toString().slice(-8)}`;

    // 嘗試發送郵件（如果提供了客戶 Email）
    if (customerEmail) {
      try {
        await sendReturnNotification({
          orderNumber,
          reason,
          type,
          customerEmail,
          customerName: customerName || "",
          exchangeProductId,
        });

        await sendReturnConfirmation({
          email: customerEmail,
          name: customerName,
          orderNumber,
          applicationId,
          type,
        });
      } catch (emailError) {
        // Q22優化：使用logger替代console.error
        logger.error(
          "Failed to send emails",
          emailError instanceof Error ? emailError : new Error("Email error"),
          { endpoint: "/api/returns", requestId }
        );
      }
    }

    return NextResponse.json({
      success: true,
      applicationId,
      message: "退換貨申請已成功提交",
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Error processing return application",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/returns", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("處理申請時發生錯誤"),
      requestId
    );
  }
}
