/**
 * 企業級認證強化工具
 * 提供會話管理、密碼策略、帳戶鎖定等功能
 */

import { cookies } from "next/headers";

export interface SessionConfig {
  maxAge: number; // 會話最大存活時間（秒）
  refreshThreshold: number; // 刷新閾值（秒）
  secure: boolean; // 是否僅在 HTTPS 下傳輸
  httpOnly: boolean; // 是否僅通過 HTTP 傳輸（防止 XSS）
  sameSite: "strict" | "lax" | "none"; // SameSite 策略
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: 60 * 60 * 24 * 7, // 7 天
  refreshThreshold: 60 * 60 * 24, // 1 天
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "strict",
};

/**
 * 密碼強度驗證
 */
export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-4 (0=弱, 4=強)
  issues: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const issues: string[] = [];
  let score = 0;

  // 長度檢查
  if (password.length < 8) {
    issues.push("密碼長度至少需要 8 個字符");
  } else if (password.length >= 12) {
    score += 1;
  }

  // 包含大寫字母
  if (!/[A-Z]/.test(password)) {
    issues.push("密碼必須包含至少一個大寫字母");
  } else {
    score += 1;
  }

  // 包含小寫字母
  if (!/[a-z]/.test(password)) {
    issues.push("密碼必須包含至少一個小寫字母");
  } else {
    score += 1;
  }

  // 包含數字
  if (!/\d/.test(password)) {
    issues.push("密碼必須包含至少一個數字");
  } else {
    score += 1;
  }

  // 包含特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push("密碼必須包含至少一個特殊字符");
  } else {
    score += 1;
  }

  // 檢查常見弱密碼
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
  ];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    issues.push("密碼過於常見，請使用更複雜的密碼");
    score = Math.max(0, score - 1);
  }

  return {
    valid: issues.length === 0 && score >= 3,
    score: Math.min(4, score),
    issues,
  };
}

/**
 * 帳戶鎖定管理
 */
interface AccountLockoutRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

class AccountLockoutManager {
  private lockouts: Map<string, AccountLockoutRecord> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 分鐘
  private readonly RESET_WINDOW = 60 * 60 * 1000; // 1 小時

  /**
   * 記錄登入失敗嘗試
   */
  recordFailedAttempt(identifier: string): {
    locked: boolean;
    remainingAttempts: number;
    lockoutUntil?: number;
  } {
    const now = Date.now();
    let record = this.lockouts.get(identifier);

    if (!record) {
      record = {
        attempts: 0,
        lockedUntil: null,
        lastAttempt: now,
      };
    }

    // 如果超過重置窗口，重置計數
    if (now - record.lastAttempt > this.RESET_WINDOW) {
      record.attempts = 0;
    }

    // 檢查是否已鎖定
    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        locked: true,
        remainingAttempts: 0,
        lockoutUntil: record.lockedUntil,
      };
    }

    // 如果鎖定期已過，重置
    if (record.lockedUntil && now >= record.lockedUntil) {
      record.attempts = 0;
      record.lockedUntil = null;
    }

    // 增加失敗次數
    record.attempts += 1;
    record.lastAttempt = now;

    // 如果超過最大嘗試次數，鎖定帳戶
    if (record.attempts >= this.MAX_ATTEMPTS) {
      record.lockedUntil = now + this.LOCKOUT_DURATION;
      this.lockouts.set(identifier, record);
      return {
        locked: true,
        remainingAttempts: 0,
        lockoutUntil: record.lockedUntil,
      };
    }

    this.lockouts.set(identifier, record);
    return {
      locked: false,
      remainingAttempts: this.MAX_ATTEMPTS - record.attempts,
    };
  }

  /**
   * 清除失敗嘗試記錄（登入成功時調用）
   */
  clearFailedAttempts(identifier: string): void {
    this.lockouts.delete(identifier);
  }

  /**
   * 檢查帳戶是否被鎖定
   */
  isLocked(identifier: string): boolean {
    const record = this.lockouts.get(identifier);
    if (!record || !record.lockedUntil) {
      return false;
    }

    const now = Date.now();
    if (now >= record.lockedUntil) {
      // 鎖定期已過，清除記錄
      this.lockouts.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * 獲取鎖定信息
   */
  getLockoutInfo(identifier: string): {
    locked: boolean;
    remainingTime?: number;
    remainingAttempts?: number;
  } | null {
    const record = this.lockouts.get(identifier);
    if (!record) {
      return { locked: false, remainingAttempts: this.MAX_ATTEMPTS };
    }

    const now = Date.now();
    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        locked: true,
        remainingTime: record.lockedUntil - now,
      };
    }

    return {
      locked: false,
      remainingAttempts: this.MAX_ATTEMPTS - record.attempts,
    };
  }
}

export const accountLockoutManager = new AccountLockoutManager();

/**
 * 會話管理
 */
export async function createSecureSession(
  sessionId: string,
  userId: string,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set("session_id", sessionId, {
    maxAge: config.maxAge,
    secure: config.secure,
    httpOnly: config.httpOnly,
    sameSite: config.sameSite,
    path: "/",
  });

  cookieStore.set("user_id", userId, {
    maxAge: config.maxAge,
    secure: config.secure,
    httpOnly: config.httpOnly,
    sameSite: config.sameSite,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.delete("session_id");
  cookieStore.delete("user_id");
}

/**
 * 生成安全的隨機令牌
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
}

/**
 * 驗證令牌格式
 */
export function validateTokenFormat(token: string, expectedLength?: number): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  if (expectedLength && token.length !== expectedLength) {
    return false;
  }

  // 檢查是否只包含十六進制字符
  return /^[a-f0-9]+$/i.test(token);
}

