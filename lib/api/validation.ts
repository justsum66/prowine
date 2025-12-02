import { ApiError, ApiErrorCode } from "./error-handler";

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  message: string;
  required?: boolean;
}

export function validateRequest(
  data: Record<string, any>,
  rules: ValidationRule[]
): void {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // 檢查必填欄位
    if (rule.required && (value === undefined || value === null || value === "")) {
      errors.push(`${rule.field} 是必填欄位`);
      continue;
    }

    // 如果欄位有值，進行驗證
    if (value !== undefined && value !== null && value !== "" && !rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  if (errors.length > 0) {
    throw new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      "驗證失敗",
      400,
      { errors }
    );
  }
}

// 常用驗證器
export const validators = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  phone: (value: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(value) && value.replace(/\D/g, "").length >= 8;
  },
  
  positiveNumber: (value: number) => {
    return typeof value === "number" && value > 0;
  },
  
  nonNegativeNumber: (value: number) => {
    return typeof value === "number" && value >= 0;
  },
  
  stringLength: (min: number, max: number) => (value: string) => {
    return typeof value === "string" && value.length >= min && value.length <= max;
  },
  
  url: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  enum: (allowedValues: any[]) => (value: any) => {
    return allowedValues.includes(value);
  },
  
  arrayMinLength: (minLength: number = 0, maxLength?: number) => (value: any[]) => {
    if (!Array.isArray(value)) return false;
    if (value.length < minLength) return false;
    if (maxLength !== undefined && value.length > maxLength) return false;
    return true;
  },
  
  // 簡單數組驗證（僅檢查是否為數組且不為空）
  array: (value: any) => {
    return Array.isArray(value) && value.length > 0;
  },
};

