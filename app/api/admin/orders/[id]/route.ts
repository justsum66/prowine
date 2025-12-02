import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin-middleware";
import { checkAdminAuth, createAuditLog } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validatePathParams, validateRequestBody } from "@/lib/api/zod-schemas";
import { idSchema } from "@/lib/api/zod-schemas";
import { z } from "zod";

// GET - 獲取單個詢價單詳情
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

    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .select(
        `
        *,
        wines (
          id,
          nameZh,
          nameEn,
          mainImageUrl
        ),
        users (
          id,
          email,
          name
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !inquiry) {
      return createErrorResponse(new Error("詢價單不存在"), requestId);
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin inquiry GET error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/orders/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

// PUT - 更新詢價單狀態和回覆
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
        status: z.enum(["PENDING", "IN_PROGRESS", "RESPONDED", "CLOSED"]).optional(),
        assignedTo: z.string().nullable().optional(),
        response: z.string().nullable().optional(),
      }),
      request
    );
    const supabase = createServerSupabaseClient();

    // 獲取原始數據（用於審計日誌）
    const { data: oldInquiry } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", id)
      .single();

    if (!oldInquiry) {
      return createErrorResponse(new Error("詢價單不存在"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface InquiryUpdateData {
      status?: string;
      assignedTo?: string | null;
      response?: string | null;
      respondedAt?: string | null;
      respondedBy?: string | null;
      [key: string]: string | null | undefined;
    }
    
    // 準備更新數據
    const updateData: InquiryUpdateData = {};

    // 更新狀態
    if (body.status) {
      updateData.status = body.status;
    }

    // 更新指派
    if (body.assignedTo !== undefined) {
      updateData.assignedTo = body.assignedTo || null;
    }

    // 更新回覆
    if (body.response !== undefined) {
      updateData.response = body.response || null;
      if (body.response) {
        updateData.respondedAt = new Date().toISOString();
        updateData.respondedBy = admin.id;
        // 如果回覆了，自動將狀態設為已回覆
        if (!body.status) {
          updateData.status = "RESPONDED";
        }
      } else {
        updateData.respondedAt = null;
        updateData.respondedBy = null;
      }
    }

    // 更新詢價單
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Q22優化：使用logger替代console.error
      logger.error(
        "Error updating inquiry",
        error instanceof Error ? error : new Error("Database error"),
        { endpoint: `/api/admin/orders/${id}`, requestId }
      );
      return createErrorResponse(new Error("更新詢價單失敗"), requestId);
    }

    // Q21優化：使用類型接口，消除any
    interface ChangeRecord {
      from: unknown;
      to: unknown;
    }
    
    // 創建審計日誌
    const changes: Record<string, ChangeRecord> = {};
    Object.keys(updateData).forEach((key) => {
      if (oldInquiry[key] !== updateData[key]) {
        changes[key] = { from: oldInquiry[key], to: updateData[key] };
      }
    });

    await createAuditLog(
      admin.id,
      "UPDATE",
      "INQUIRY",
      id,
      changes,
      request
    );

    return NextResponse.json({ inquiry });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorId = await params.then(p => p.id).catch(() => "unknown");
    logger.error(
      "Admin inquiry PUT error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/admin/orders/${errorId}`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("服務器錯誤"),
      requestId
    );
  }
}

