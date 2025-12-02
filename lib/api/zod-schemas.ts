/**
 * Q42優化：Zod驗證Schema - 統一API輸入驗證
 * 所有API端點應使用這些Schema進行輸入驗證
 */

import { z } from "zod";
import type { NextRequest } from "next/server";
import { ApiError, ApiErrorCode } from "./error-handler";

// ==================== 通用Schema ====================

// 分頁參數
export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => Math.max(1, parseInt(val || "1") || 1)),
  limit: z.string().optional().transform((val) => Math.min(100, Math.max(1, parseInt(val || "20") || 20))),
});

// 排序參數
export const sortSchema = z.object({
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ID參數
export const idSchema = z.object({
  id: z.string().min(1, "ID不能為空"),
});

// ==================== Wine相關Schema ====================

export const wineQuerySchema = z.object({
  search: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  minVintage: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
  maxVintage: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
  minRating: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  category: z.string().optional(),
  featured: z.string().optional().transform((val) => val === "true"),
  published: z.string().optional().transform((val) => val === "true"),
}).merge(paginationSchema).merge(sortSchema);

export const wineIdSchema = z.object({
  wineId: z.string().min(1, "酒款ID不能為空"),
});

export const wineCreateSchema = z.object({
  wineryId: z.string().min(1, "酒莊ID不能為空"),
  nameZh: z.string().min(1, "中文名稱不能為空").max(200, "中文名稱不能超過200字元"),
  nameEn: z.string().optional(),
  slug: z.string().min(1, "Slug不能為空"),
  descriptionZh: z.string().optional(),
  descriptionEn: z.string().optional(),
  category: z.enum([
    "SPARKLING_WINE",
    "WHITE_WINE",
    "RED_WINE",
    "ROSE_WINE",
    "DESSERT_WINE",
    "FORTIFIED_WINE",
  ]),
  region: z.string().optional(),
  country: z.string().optional(),
  vintage: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  grapeVarieties: z.array(z.string()).optional(),
  price: z.number().positive("價格必須大於0"),
  mainImageUrl: z.string().url().optional().or(z.literal("")),
  published: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
});

// ==================== Winery相關Schema ====================

export const wineryQuerySchema = z.object({
  search: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  featured: z.string().optional().transform((val) => val === "true"),
}).merge(paginationSchema).merge(sortSchema);

export const wineryCreateSchema = z.object({
  nameZh: z.string().min(1, "中文名稱不能為空").max(200, "中文名稱不能超過200字元"),
  nameEn: z.string().optional(),
  slug: z.string().min(1, "Slug不能為空"),
  region: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  descriptionZh: z.string().optional(),
  descriptionEn: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().optional().default(false),
});

// ==================== Cart相關Schema ====================

export const cartItemSchema = z.object({
  wineId: z.string().min(1, "酒款ID不能為空"),
  quantity: z.number().int().min(1, "數量必須大於0").max(100, "數量不能超過100"),
});

export const cartUpdateSchema = z.object({
  wineId: z.string().min(1, "酒款ID不能為空"),
  quantity: z.number().int().min(0, "數量不能為負數").max(100, "數量不能超過100"),
});

// ==================== Wishlist相關Schema ====================

export const wishlistAddSchema = z.object({
  wineId: z.string().min(1, "酒款ID不能為空"),
});

// ==================== 用戶相關Schema ====================

export const userUpdateSchema = z.object({
  birthday: z.string().optional(),
  name: z.string().min(2, "姓名至少需要2個字元").max(100, "姓名不能超過100字元").optional(),
  email: z.string().email("請輸入有效的電子郵件地址").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ==================== 聯繫表單Schema ====================

export const contactFormSchema = z.object({
  name: z.string().min(2, "姓名至少需要2個字元").max(100, "姓名不能超過100字元"),
  email: z.string().email("請輸入有效的電子郵件地址"),
  phone: z.string().min(8, "請輸入有效的電話號碼").optional(),
  subject: z.string().min(5, "主題至少需要5個字元").max(200, "主題不能超過200字元"),
  message: z.string().min(10, "訊息至少需要10個字元").max(5000, "訊息不能超過5000字元"),
});

// ==================== 查詢表單Schema ====================

export const inquiryFormSchema = z.object({
  wineId: z.string().optional(),
  name: z.string().min(2, "姓名至少需要2個字元"),
  email: z.string().email("請輸入有效的電子郵件地址"),
  phone: z.string().min(8, "請輸入有效的電話號碼"),
  quantity: z.string().optional(),
  purpose: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
  specialRequest: z.string().optional(),
  deliveryDate: z.string().optional(),
});

// ==================== 退換貨Schema ====================

export const returnFormSchema = z.object({
  orderNumber: z.string().min(1, "訂單編號不能為空"),
  reason: z.string().min(10, "請詳細說明退換貨原因").max(2000, "原因不能超過2000字元"),
  type: z.enum(["return", "exchange"]),
  exchangeProductId: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

// ==================== 搜索相關Schema ====================

export const searchQuerySchema = z.object({
  q: z.string().min(2, "搜索關鍵字至少需要2個字元").max(100, "搜索關鍵字不能超過100個字元"),
});

// ==================== 驗證輔助函數 ====================

/**
 * 驗證查詢參數
 */
export function validateQueryParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
  options?: {
    throwOnError?: boolean;
  }
): z.infer<T> {
  const params: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (options?.throwOnError !== false) {
        throw new ApiError(
          ApiErrorCode.VALIDATION_ERROR,
          "查詢參數驗證失敗",
          400,
          error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })) as unknown as Record<string, unknown>
        );
      }
      throw error;
    }
    throw error;
  }
}

/**
 * 驗證請求體
 */
export async function validateRequestBody<T extends z.ZodType>(
  schema: T,
  request: Request | NextRequest
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        "請求數據驗證失敗",
        400,
        error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })) as unknown as Record<string, unknown>
      );
    }
    throw new ApiError(
      ApiErrorCode.BAD_REQUEST,
      "無效的請求體",
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * 驗證路徑參數
 */
export async function validatePathParams<T extends z.ZodType>(
  schema: T,
  params: Promise<Record<string, string>>
): Promise<z.infer<T>> {
  try {
    const resolvedParams = await params;
    return schema.parse(resolvedParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        "路徑參數驗證失敗",
        400,
        error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })) as unknown as Record<string, unknown>
      );
    }
    throw new ApiError(
      ApiErrorCode.BAD_REQUEST,
      "無效的路徑參數",
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * 安全解析（不拋出錯誤）
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

