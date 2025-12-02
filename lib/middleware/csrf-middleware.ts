/**
 * CSRF 保護中間件
 * 自動為所有 POST/PUT/DELETE 請求添加 CSRF 驗證
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken } from "@/lib/utils/csrf-protection";

/**
 * CSRF 保護中間件
 * 用於保護需要狀態改變的請求
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // 只對會改變狀態的方法進行保護
  const protectedMethods = ["POST", "PUT", "DELETE", "PATCH"];

  if (protectedMethods.includes(request.method)) {
    const isValid = await verifyCSRFToken(request);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "CSRF token驗證失敗，請重新整理頁面後再試" },
        { status: 403 }
      );
    }
  }

  return handler(request);
}

