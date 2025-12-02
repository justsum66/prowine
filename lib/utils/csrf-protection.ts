/**
 * CSRF 保護工具
 * 用於防止跨站請求偽造攻擊
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const CSRF_TOKEN_HEADER = "X-CSRF-Token";
const CSRF_TOKEN_COOKIE = "csrf-token";

/**
 * 生成 CSRF Token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // 服務器端生成
    const crypto = require("crypto");
    return crypto.randomBytes(32).toString("hex");
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 驗證 CSRF Token
 */
export async function verifyCSRFToken(request: NextRequest): Promise<boolean> {
  // GET 請求不需要 CSRF 保護
  if (request.method === "GET" || request.method === "HEAD") {
    return true;
  }

  const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER);
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  // 使用時間安全的比較防止時間攻擊
  return constantTimeEqual(tokenFromHeader, tokenFromCookie);
}

/**
 * 時間安全的字符串比較
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 獲取 CSRF Token（用於前端）
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  if (!token) {
    token = generateCSRFToken();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 小時
      path: "/",
    });
  }

  return token;
}

/**
 * CSRF 保護中間件
 */
export async function csrfProtection(request: NextRequest): Promise<Response | null> {
  if (!(await verifyCSRFToken(request))) {
    return new Response(
      JSON.stringify({ error: "CSRF token驗證失敗" }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return null;
}

