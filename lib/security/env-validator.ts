/**
 * 環境變數安全驗證工具
 * 確保所有必需的環境變數都已設置，並驗證其格式
 */

interface EnvValidationRule {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "url" | "email";
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => boolean;
  sensitive?: boolean; // 標記為敏感信息，不會在錯誤中顯示
}

interface EnvConfig {
  [key: string]: EnvValidationRule;
}

const ENV_CONFIG: EnvConfig = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    type: "url",
    sensitive: false,
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    type: "string",
    minLength: 100,
    sensitive: true,
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    type: "string",
    minLength: 100,
    sensitive: true,
  },
  SUPABASE_JWT_SECRET: {
    required: true,
    type: "string",
    minLength: 32,
    sensitive: true,
  },
  
  // Database
  DATABASE_URL: {
    required: true,
    type: "url",
    sensitive: true,
  },
  
  // API Keys
  RESEND_API_KEY: {
    required: true,
    type: "string",
    pattern: /^re_/,
    sensitive: true,
  },
  GROQ_API_KEY: {
    required: false,
    type: "string",
    pattern: /^gsk_/,
    sensitive: true,
  },
  GOOGLE_AI_API_KEY: {
    required: false,
    type: "string",
    sensitive: true,
  },
  OPENROUTER_API_KEY: {
    required: false,
    type: "string",
    pattern: /^sk-or-v1-/,
    sensitive: true,
  },
  CLOUDINARY_CLOUD_NAME: {
    required: true,
    type: "string",
    sensitive: false,
  },
  CLOUDINARY_API_KEY: {
    required: true,
    type: "string",
    sensitive: true,
  },
  CLOUDINARY_API_SECRET: {
    required: true,
    type: "string",
    minLength: 20,
    sensitive: true,
  },
  
  // Site Configuration
  NEXT_PUBLIC_SITE_URL: {
    required: true,
    type: "url",
    sensitive: false,
  },
  NEXT_PUBLIC_SITE_NAME: {
    required: true,
    type: "string",
    minLength: 1,
    sensitive: false,
  },
  
  // Contact
  CONTACT_EMAIL: {
    required: true,
    type: "email",
    sensitive: false,
  },
  
  // Node Environment
  NODE_ENV: {
    required: true,
    type: "string",
    pattern: /^(development|production|test)$/,
    sensitive: false,
  },
};

/**
 * 驗證單個環境變數
 */
function validateEnvVar(
  key: string,
  value: string | undefined,
  rule: EnvValidationRule
): { valid: boolean; error?: string } {
  // 檢查必需性
  if (rule.required && (!value || value.trim() === "")) {
    return {
      valid: false,
      error: `環境變數 ${key} 是必需的但未設置`,
    };
  }

  // 如果值為空且不是必需的，跳過驗證
  if (!value || value.trim() === "") {
    return { valid: true };
  }

  // 類型驗證
  if (rule.type) {
    switch (rule.type) {
      case "number":
        if (isNaN(Number(value))) {
          return {
            valid: false,
            error: `環境變數 ${key} 必須是數字`,
          };
        }
        break;
      case "boolean":
        if (value !== "true" && value !== "false") {
          return {
            valid: false,
            error: `環境變數 ${key} 必須是布爾值 (true/false)`,
          };
        }
        break;
      case "url":
        try {
          new URL(value);
        } catch {
          return {
            valid: false,
            error: `環境變數 ${key} 必須是有效的 URL`,
          };
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return {
            valid: false,
            error: `環境變數 ${key} 必須是有效的電子郵件地址`,
          };
        }
        break;
    }
  }

  // 長度驗證
  if (rule.minLength && value.length < rule.minLength) {
    return {
      valid: false,
      error: `環境變數 ${key} 長度必須至少為 ${rule.minLength} 個字符`,
    };
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    return {
      valid: false,
      error: `環境變數 ${key} 長度不能超過 ${rule.maxLength} 個字符`,
    };
  }

  // 模式驗證
  if (rule.pattern && !rule.pattern.test(value)) {
    return {
      valid: false,
      error: `環境變數 ${key} 格式無效`,
    };
  }

  // 自定義驗證器
  if (rule.customValidator && !rule.customValidator(value)) {
    return {
      valid: false,
      error: `環境變數 ${key} 驗證失敗`,
    };
  }

  return { valid: true };
}

/**
 * 驗證所有環境變數
 */
export function validateEnvironmentVariables(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [key, rule] of Object.entries(ENV_CONFIG)) {
    const value = process.env[key];
    const result = validateEnvVar(key, value, rule);

    if (!result.valid) {
      const errorMsg = rule.sensitive
        ? result.error?.replace(value || "", "***")
        : result.error;
      errors.push(errorMsg || `環境變數 ${key} 驗證失敗`);
    }
  }

  // 檢查是否有敏感信息洩露
  const sensitiveVars = Object.entries(ENV_CONFIG)
    .filter(([, rule]) => rule.sensitive)
    .map(([key]) => key);

  for (const key of sensitiveVars) {
    const value = process.env[key];
    if (value && value.length > 0 && value.length < 10) {
      warnings.push(`環境變數 ${key} 的值似乎過短，請確認是否正確`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 獲取環境變數（帶驗證）
 */
export function getEnvVar(
  key: string,
  defaultValue?: string
): string | undefined {
  const rule = ENV_CONFIG[key];
  const value = process.env[key] || defaultValue;

  if (rule?.required && !value) {
    throw new Error(`必需的環境變數 ${key} 未設置`);
  }

  if (value && rule) {
    const result = validateEnvVar(key, value, rule);
    if (!result.valid) {
      throw new Error(result.error || `環境變數 ${key} 驗證失敗`);
    }
  }

  return value;
}

/**
 * 檢查環境變數是否在生產環境中正確設置
 */
export function checkProductionEnv(): {
  ready: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (process.env.NODE_ENV === "production") {
    // 檢查關鍵環境變數
    const criticalVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "DATABASE_URL",
      "RESEND_API_KEY",
    ];

    for (const key of criticalVars) {
      if (!process.env[key]) {
        issues.push(`生產環境缺少關鍵環境變數: ${key}`);
      }
    }

    // 檢查是否使用了開發環境的配置
    if (process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost")) {
      issues.push("生產環境不應使用 localhost URL");
    }

    // 檢查敏感信息是否使用了默認值
    if (process.env.SUPABASE_SERVICE_ROLE_KEY?.includes("placeholder")) {
      issues.push("生產環境不應使用占位符 API 密鑰");
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}

