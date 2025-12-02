/**
 * 企業級輸入清理工具
 * 防止 XSS、SQL 注入等攻擊
 */

/**
 * 清理 HTML 字符串，移除潛在的 XSS 攻擊
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // 移除 HTML 標籤（保留基本格式）
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "") // 移除事件處理器
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .trim();
}

/**
 * 清理 SQL 注入攻擊
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // 移除 SQL 注入常見字符
  return input
    .replace(/['";\\]/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .replace(/xp_/gi, "")
    .replace(/sp_/gi, "")
    .trim();
}

/**
 * 清理路徑遍歷攻擊
 */
export function sanitizePath(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/\.\./g, "")
    .replace(/\/\//g, "/")
    .replace(/^\/+/, "")
    .trim();
}

/**
 * 清理 URL
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  try {
    const url = new URL(input);
    // 只允許 http 和 https 協議
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * 清理文件名
 */
export function sanitizeFilename(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/\.\./g, "")
    .substring(0, 255) // 限制長度
    .trim();
}

/**
 * 清理數字輸入
 */
export function sanitizeNumber(input: unknown): number | null {
  if (typeof input === "number") {
    return isNaN(input) || !isFinite(input) ? null : input;
  }
  
  if (typeof input === "string") {
    const num = parseFloat(input);
    return isNaN(num) || !isFinite(num) ? null : num;
  }
  
  return null;
}

/**
 * 清理整數輸入
 */
export function sanitizeInteger(input: unknown): number | null {
  const num = sanitizeNumber(input);
  return num !== null ? Math.floor(num) : null;
}

/**
 * 清理電子郵件地址
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // 基本電子郵件格式驗證
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleaned = input.trim().toLowerCase();
  
  if (!emailRegex.test(cleaned)) {
    return "";
  }

  // 移除潛在的注入字符
  return cleaned.replace(/[<>"']/g, "");
}

/**
 * 清理電話號碼
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // 只保留數字、+、-、空格和括號
  return input.replace(/[^\d+\-()\s]/g, "").trim();
}

/**
 * 驗證和清理對象（遞歸）
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  allowedKeys?: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    // 如果指定了允許的鍵，只處理允許的鍵
    if (allowedKeys && !allowedKeys.includes(key)) {
      continue;
    }

    if (typeof value === "string") {
      // 根據鍵名選擇適當的清理方法
      if (key.includes("email")) {
        sanitized[key as keyof T] = sanitizeEmail(value) as T[keyof T];
      } else if (key.includes("phone") || key.includes("tel")) {
        sanitized[key as keyof T] = sanitizePhone(value) as T[keyof T];
      } else if (key.includes("url") || key.includes("link")) {
        sanitized[key as keyof T] = sanitizeUrl(value) as T[keyof T];
      } else if (key.includes("path") || key.includes("file")) {
        sanitized[key as keyof T] = sanitizePath(value) as T[keyof T];
      } else {
        sanitized[key as keyof T] = sanitizeHtml(value) as T[keyof T];
      }
    } else if (typeof value === "number") {
      sanitized[key as keyof T] = sanitizeNumber(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === "string" ? sanitizeHtml(item) : item
      ) as T[keyof T];
    } else if (value !== null && typeof value === "object") {
      sanitized[key as keyof T] = sanitizeObject(
        value as Record<string, unknown>
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}

