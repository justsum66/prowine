import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId, ApiError, ApiErrorCode } from "@/lib/api/error-handler";
import { userUpdateSchema, validateRequestBody } from "@/lib/api/zod-schemas";

// Q21優化：定義類型接口，消除any
interface UserData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  membershipLevel?: string;
  address?: string;
  birthday?: string | null;
}

interface UserUpdateData {
  name?: string;
  phone?: string;
  address?: string;
  birthday?: string | null;
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      // 未登錄時返回 401 Unauthorized，使用 ApiError 確保正確的狀態碼
      return createErrorResponse(
        new ApiError(ApiErrorCode.UNAUTHORIZED, "未登錄，請先登入", 401),
        requestId
      );
    }

    // 使用 serverSupabase 查詢用戶資料（繞過 RLS）
    let serverSupabase;
    try {
      serverSupabase = createServerSupabaseClient();
    } catch (supabaseError) {
      logger.error("Failed to create server Supabase client", supabaseError instanceof Error ? supabaseError : new Error(String(supabaseError)), { requestId });
      return createErrorResponse(
        new ApiError(ApiErrorCode.EXTERNAL_SERVICE_ERROR, "服務暫時無法使用", 503),
        requestId
      );
    }
    
    // 查找用戶
    const { data: user, error: findError } = await serverSupabase
      .from("users")
      .select("id, email, name, phone, membershipLevel, address, birthday")
      .eq("id", authUser.id)
      .single();

    if (findError || !user) {
      // 如果用戶不存在，創建一個
      const { data: newUser, error: createError } = await serverSupabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name,
        })
        .select("id, email, name, phone, membershipLevel, address, birthday")
        .single();

      if (createError || !newUser) {
        logger.error("Failed to create user", createError instanceof Error ? createError : new Error("Create user error"), { requestId });
        return createErrorResponse(new Error("Failed to create user"), requestId);
      }

      return NextResponse.json(newUser as UserData);
    }

    return NextResponse.json(user as UserData);
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "User API Error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/user/me", method: "GET", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to fetch user"),
      requestId
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      // 未登錄時返回 401 Unauthorized，使用 ApiError 確保正確的狀態碼
      return createErrorResponse(
        new ApiError(ApiErrorCode.UNAUTHORIZED, "未登錄，請先登入", 401),
        requestId
      );
    }

    const serverSupabase = createServerSupabaseClient();
    
    // Q42優化：使用Zod驗證請求體
    const data = await validateRequestBody(userUpdateSchema, request);

    // Q21優化：使用類型接口，消除any
    const updateData: UserUpdateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.birthday !== undefined) updateData.birthday = data.birthday ? new Date(data.birthday).toISOString() : null;

    const { data: user, error } = await serverSupabase
      .from("users")
      .update(updateData)
      .eq("id", authUser.id)
      .select("id, email, name, phone, membershipLevel, address, birthday")
      .single();

    if (error || !user) {
      logger.error("Failed to update user", error instanceof Error ? error : new Error("Update error"), { requestId });
      return createErrorResponse(new Error("Failed to update user"), requestId);
    }

    return NextResponse.json(user as UserData);
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "User API Error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/user/me", method: "PATCH", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to update user"),
      requestId
    );
  }
}
