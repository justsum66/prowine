import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/utils/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { v2 as cloudinary } from "cloudinary";
import { rateLimiter, strictRateLimit } from "@/lib/api/rate-limiter";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { logger } from "@/lib/api/logger";
import { validateQueryParams } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義Cloudinary資源類型接口，消除any
interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  folder?: string;
  filename?: string;
  created_at: string;
}

interface CloudinarySearchResult {
  resources: CloudinaryResource[];
  total_count: number;
}

interface ImageItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  size: number;
  folder?: string;
  filename?: string;
  createdAt: string;
}

// 初始化 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 獲取圖片列表
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 速率限制（管理員API使用嚴格限制）
    if (process.env.NODE_ENV === "production") {
      try {
        rateLimiter.check(request, strictRateLimit);
      } catch (rateLimitError) {
        return createErrorResponse(rateLimitError as Error, requestId);
      }
    }
    
    // 檢查管理員權限
    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("需要管理員權限"), requestId);
    }

    // Q42優化：使用Zod驗證查詢參數
    const { searchParams } = new URL(request.url);
    const queryParams = validateQueryParams(
      z.object({
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
        search: z.string().optional().default(""),
        folder: z.string().optional().default("prowine"),
      }),
      searchParams
    );
    
    const page = typeof queryParams.page === "number" ? queryParams.page : 1;
    const limit = typeof queryParams.limit === "number" ? queryParams.limit : 20;
    const search = queryParams.search || "";
    const folder = queryParams.folder || "prowine";

    // 從 Cloudinary 獲取圖片列表
    const result = (await cloudinary.search
      .expression(`folder:${folder}${search ? ` AND filename:${search}*` : ""}`)
      .sort_by("created_at", "desc")
      .max_results(limit)
      .execute()) as CloudinarySearchResult;

    // Q21優化：使用類型接口，消除any
    const images: ImageItem[] = result.resources.map((resource: CloudinaryResource) => ({
      id: resource.public_id,
      url: resource.secure_url,
      thumbnailUrl: cloudinary.url(resource.public_id, {
        width: 300,
        height: 300,
        crop: "fill",
        quality: "auto",
      }),
      width: resource.width,
      height: resource.height,
      format: resource.format,
      size: resource.bytes,
      folder: resource.folder,
      filename: resource.filename,
      createdAt: resource.created_at,
    }));

    return NextResponse.json({
      success: true,
      images,
      pagination: {
        page,
        limit,
        total: result.total_count || images.length,
        totalPages: Math.ceil((result.total_count || images.length) / limit),
      },
    });
  } catch (error) {
    // Q21優化：消除any類型
    logger.error(
      "Error fetching images",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/images", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("獲取圖片列表失敗"),
      requestId
    );
  }
}

// 刪除圖片
export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // 速率限制（管理員API使用嚴格限制）
    if (process.env.NODE_ENV === "production") {
      try {
        rateLimiter.check(request, strictRateLimit);
      } catch (rateLimitError) {
        return createErrorResponse(rateLimitError as Error, requestId);
      }
    }
    
    // 檢查管理員權限
    const admin = await checkAdminAuth();
    if (!admin) {
      return createErrorResponse(new Error("需要管理員權限"), requestId);
    }

    // Q42優化：使用Zod驗證查詢參數
    const { searchParams } = new URL(request.url);
    const queryParams = validateQueryParams(
      z.object({
        id: z.string().min(1, "圖片ID不能為空"),
      }),
      searchParams
    );
    
    const imageId = queryParams.id;

    // 從 Cloudinary 刪除圖片
    const result = await cloudinary.uploader.destroy(imageId);

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({
        success: true,
        message: "圖片已刪除",
      });
    } else {
      return NextResponse.json(
        { error: "刪除失敗" },
        { status: 500 }
      );
    }
  } catch (error) {
    // Q21優化：消除any類型
    logger.error(
      "Error deleting image",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/admin/images", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("刪除圖片失敗"),
      requestId
    );
  }
}

