import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validatePathParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { idSchema } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取單個會員詳情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證路徑參數
    const { id } = await validatePathParams(idSchema, params);

    const supabase = createServerSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error fetching user",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/users/${id}`, requestId }
      );
      return createErrorResponse(new Error("獲取會員詳情失敗"), requestId);
    }

    if (!user) {
      return createErrorResponse(new Error("會員未找到"), requestId);
    }

    return NextResponse.json({ user });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin user GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/users/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// PUT - 更新會員信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck) return authCheck;

    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("未授權"), requestId);
    }

    // Q42優化：使用Zod驗證路徑參數和請求體
    const { id } = await validatePathParams(idSchema, params);
    const body = await validateRequestBody(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        membershipLevel: z.enum(["REGULAR", "VIP", "PREMIUM"]).optional(),
        points: z.union([z.string(), z.number()]).optional().transform((val) => {
          if (typeof val === "string") {
            const num = parseInt(val, 10);
            return isNaN(num) ? undefined : num;
          }
          return val;
        }),
        active: z.union([z.boolean(), z.string()]).optional().transform((val) => {
          if (typeof val === "string") return val === "true";
          return val;
        }),
        emailVerified: z.union([z.boolean(), z.string()]).optional().transform((val) => {
          if (typeof val === "string") return val === "true";
          return val;
        }),
      }),
      request
    );
    
    const { name, phone, membershipLevel, points, active, emailVerified } = body;

    const supabase = createServerSupabaseClient();

    // 先獲取原始數據用於審計日誌
    const { data: oldUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldUser) {
      return createErrorResponse(new Error("會員未找到"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface UserUpdateData {
      updatedAt: string;
      name?: string;
      phone?: string;
      membershipLevel?: "REGULAR" | "VIP" | "PREMIUM";
      points?: number;
      active?: boolean;
      emailVerified?: boolean;
    }
    
    // 構建更新數據
    const updateData: UserUpdateData = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (membershipLevel !== undefined) {
      updateData.membershipLevel = membershipLevel;
    }
    if (points !== undefined) {
      if (points < 0) {
        return createErrorResponse(new Error("積分必須為非負整數"), requestId);
      }
      updateData.points = points;
    }
    if (active !== undefined) updateData.active = active;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error updating user",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/users/${id}`, requestId }
      );
      return createErrorResponse(new Error("更新會員失敗"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface ChangeRecord {
      old: unknown;
      new: unknown;
    }
    
    // 創建審計日誌
    const changes: Record<string, ChangeRecord> = {};
    if (name !== undefined && name !== oldUser.name) changes.name = { old: oldUser.name, new: name };
    if (phone !== undefined && phone !== oldUser.phone) changes.phone = { old: oldUser.phone, new: phone };
    if (membershipLevel !== undefined && membershipLevel !== oldUser.membershipLevel) {
      changes.membershipLevel = { old: oldUser.membershipLevel, new: membershipLevel };
    }
    if (points !== undefined && points !== oldUser.points) changes.points = { old: oldUser.points, new: points };
    if (active !== undefined && active !== oldUser.active) changes.active = { old: oldUser.active, new: active };
    if (emailVerified !== undefined && emailVerified !== oldUser.emailVerified) {
      changes.emailVerified = { old: oldUser.emailVerified, new: emailVerified };
    }

    await createAuditLog(
      admin.id,
      "UPDATE_USER",
      "USER",
      id,
      changes,
      request
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin user PUT error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/users/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

