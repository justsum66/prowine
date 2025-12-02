/**
 * 日誌清理工具
 * 確保日誌中不包含敏感信息（密碼、API keys、令牌等）
 */

/**
 * 敏感字段列表
 */
const SENSITIVE_FIELDS = [
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "apiKey",
  "api_key",
  "apikey",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "authorization",
  "auth",
  "credential",
  "credentials",
  "privateKey",
  "private_key",
  "sessionId",
  "session_id",
  "cookie",
  "ssn",
  "socialSecurityNumber",
  "creditCard",
  "credit_card",
  "cardNumber",
  "card_number",
  "cvv",
  "cvc",
  "pin",
  "ssn",
];

/**
 * 敏感模式（用於匹配部分敏感信息）
 */
const SENSITIVE_PATTERNS = [
  /password[=:]\s*[^\s,}]+/gi,
  /token[=:]\s*[^\s,}]+/gi,
  /key[=:]\s*[^\s,}]+/gi,
  /secret[=:]\s*[^\s,}]+/gi,
  /api[_-]?key[=:]\s*[^\s,}]+/gi,
  /authorization[=:]\s*[^\s,}]+/gi,
  /bearer\s+[^\s,}]+/gi,
  /basic\s+[^\s,}]+/gi,
];

/**
 * 清理字符串中的敏感信息
 */
export function sanitizeLogString(input: string): string {
  if (typeof input !== "string") {
    return String(input);
  }

  let sanitized = input;

  // 移除敏感模式
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      const parts = match.split(/[=:]/);
      if (parts.length >= 2) {
        return `${parts[0]}=***`;
      }
      return "***";
    });
  }

  return sanitized;
}

/**
 * 清理對象中的敏感字段
 */
export function sanitizeLogObject<T extends Record<string, unknown>>(
  obj: T,
  depth: number = 0
): Partial<T> {
  if (depth > 10) {
    // 防止無限遞歸
    return {};
  }

  const sanitized: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // 檢查是否為敏感字段
    const isSensitive = SENSITIVE_FIELDS.some((field) =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      // 替換為掩碼
      sanitized[key as keyof T] = "***" as T[keyof T];
    } else if (typeof value === "string") {
      // 清理字符串中的敏感信息
      sanitized[key as keyof T] = sanitizeLogString(value) as T[keyof T];
    } else if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        // 處理數組
        sanitized[key as keyof T] = value.map((item) =>
          typeof item === "string"
            ? sanitizeLogString(item)
            : typeof item === "object" && item !== null
            ? sanitizeLogObject(item as Record<string, unknown>, depth + 1)
            : item
        ) as T[keyof T];
      } else {
        // 遞歸處理對象
        sanitized[key as keyof T] = sanitizeLogObject(
          value as Record<string, unknown>,
          depth + 1
        ) as T[keyof T];
      }
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * 清理錯誤對象
 */
export function sanitizeError(error: Error | unknown): {
  message: string;
  stack?: string;
  name?: string;
  [key: string]: unknown;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeLogString(error.message),
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  if (typeof error === "object" && error !== null) {
    const sanitized = sanitizeLogObject(error as Record<string, unknown>);
    const message = (typeof sanitized.message === 'string' ? sanitized.message : sanitizeLogString(String(error)));
    return {
      message,
      ...(typeof sanitized === 'object' && sanitized !== null ? sanitized : {}),
    };
  }

  return {
    message: sanitizeLogString(String(error)),
  };
}

/**
 * 清理 URL 中的敏感參數
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const sensitiveParams = ["token", "key", "secret", "password", "api_key"];

    for (const param of sensitiveParams) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, "***");
      }
    }

    return urlObj.toString();
  } catch {
    return sanitizeLogString(url);
  }
}

/**
 * 檢查字符串是否包含敏感信息
 */
export function containsSensitiveInfo(input: string): boolean {
  if (typeof input !== "string") {
    return false;
  }

  const lowerInput = input.toLowerCase();

  // 檢查敏感字段
  for (const field of SENSITIVE_FIELDS) {
    if (lowerInput.includes(field.toLowerCase())) {
      return true;
    }
  }

  // 檢查敏感模式
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }

  return false;
}

