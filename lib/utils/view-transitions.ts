"use client";

/**
 * View Transitions API 工具函數（P1 BATCH5）
 * 實現頁面間平滑過渡和共享元素過渡
 */

// 檢查瀏覽器是否支持 View Transitions API
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * 啟動視圖轉換
 */
export function startViewTransition(callback: () => void | Promise<void>) {
  if (supportsViewTransitions()) {
    (document as any).startViewTransition(callback);
  } else {
    callback();
  }
}

/**
 * 為元素添加視圖轉換名稱（用於共享元素過渡）
 */
export function setViewTransitionName(element: HTMLElement | null, name: string) {
  if (!element || !supportsViewTransitions()) return;
  element.style.viewTransitionName = name;
}

/**
 * 移除視圖轉換名稱
 */
export function removeViewTransitionName(element: HTMLElement | null) {
  if (!element || !supportsViewTransitions()) return;
  element.style.viewTransitionName = "";
}

/**
 * 頁面轉換動畫配置
 */
export const pageTransitionConfig = {
  duration: 300,
  easing: "ease-in-out",
};

