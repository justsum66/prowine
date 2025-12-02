"use client";

/**
 * 觸覺反饋 Hook（P1 BATCH6）
 * 為移動端提供觸覺反饋
 */

interface HapticFeedbackOptions {
  type?: "light" | "medium" | "heavy" | "success" | "warning" | "error";
}

/**
 * 觸覺反饋類型映射
 */
const hapticPatterns: Record<string, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 20, 10],
  warning: [20, 10, 20],
  error: [30, 20, 30],
};

export function useHapticFeedback() {
  const trigger = (options: HapticFeedbackOptions = {}) => {
    const { type = "medium" } = options;

    // 檢查是否支持觸覺反饋
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
      return;
    }

    const pattern = hapticPatterns[type] || hapticPatterns.medium;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // 靜默失敗，不影響功能
      console.debug("Haptic feedback not available:", error);
    }
  };

  return { trigger };
}

