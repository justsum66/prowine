import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // 處理 OAuth 錯誤
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
      );
    }

    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(
        new URL("/login?error=missing_code", requestUrl.origin)
      );
    }

    // 交換授權碼為 session
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    // 重定向到會員中心
    return NextResponse.redirect(new URL("/account", requestUrl.origin));
  } catch (error: any) {
    console.error("Unexpected error in OAuth callback:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || "unknown_error")}`, request.url)
    );
  }
}
