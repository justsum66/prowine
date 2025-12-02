/**
 * 路由驗證工具
 * 用於確保所有路由和資源引用都是有效的
 */

export interface RouteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 驗證路由路徑是否有效
 */
export function validateRoute(path: string): RouteValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 檢查路徑格式
  if (!path.startsWith("/")) {
    errors.push(`路由路徑必須以 "/" 開頭: ${path}`);
  }

  // 檢查是否包含無效字符
  if (path.includes("//")) {
    errors.push(`路由路徑不能包含連續斜線: ${path}`);
  }

  // 檢查是否包含特殊字符（除了動態路由參數）
  if (path.match(/[^a-zA-Z0-9/\[\]-_]/)) {
    warnings.push(`路由路徑包含特殊字符: ${path}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 驗證圖片 URL 是否有效
 */
export function validateImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // 檢查是否是有效的 URL
  try {
    new URL(url);
    return true;
  } catch {
    // 檢查是否是相對路徑
    return url.startsWith("/") || url.startsWith("./") || url.startsWith("../");
  }
}

/**
 * 驗證 API 路由是否有效
 */
export function validateApiRoute(route: string): RouteValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // API 路由必須以 /api/ 開頭
  if (!route.startsWith("/api/")) {
    errors.push(`API 路由必須以 "/api/" 開頭: ${route}`);
  }

  // 檢查動態路由參數格式
  const dynamicParams = route.match(/\[([^\]]+)\]/g);
  if (dynamicParams) {
    dynamicParams.forEach((param) => {
      // 動態參數應該是 [id] 或 [slug] 格式
      if (!param.match(/^\[[a-zA-Z0-9_]+\]$/)) {
        errors.push(`無效的動態路由參數格式: ${param}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 常見的無效路由模式
 */
export const INVALID_ROUTE_PATTERNS = [
  /\/\/+/g, // 連續斜線
  /\/\./g, // 包含點的路徑
  /\/$/g, // 結尾斜線（除了根路徑）
];

/**
 * 清理路由路徑
 */
export function sanitizeRoute(path: string): string {
  return path
    .replace(/\/\/+/g, "/") // 移除連續斜線
    .replace(/\/$/, "") // 移除結尾斜線（除了根路徑）
    .replace(/^\/+/, "/"); // 確保以單個斜線開頭
}

