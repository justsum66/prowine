/**
 * 觸控事件處理工具函數
 * 用於統一處理手機版的觸控優化
 */

import type { MouseEvent, TouchEvent, ChangeEvent } from "react";

/**
 * 標準的觸控事件處理器配置
 */
export const TOUCH_STYLES = {
  WebkitTapHighlightColor: "transparent",
} as const;

/**
 * 標準的觸控類名
 */
export const TOUCH_CLASSES = "touch-manipulation min-h-[44px] min-w-[44px]";

/**
 * 創建標準的點擊事件處理器
 * 防止事件冒泡並執行回調
 */
export function createClickHandler<T = void>(
  callback: (e?: MouseEvent<HTMLElement>) => T,
  options?: {
    preventDefault?: boolean;
    stopPropagation?: boolean;
  }
) {
  return (e: MouseEvent<HTMLElement>) => {
    if (options?.preventDefault) {
      e.preventDefault();
    }
    if (options?.stopPropagation !== false) {
      e.stopPropagation();
    }
    return callback(e);
  };
}

/**
 * 創建標準的觸控事件處理器
 * 防止事件冒泡
 */
export function createTouchHandler(
  options?: {
    stopPropagation?: boolean;
  }
) {
  return (e: TouchEvent<HTMLElement>) => {
    if (options?.stopPropagation !== false) {
      e.stopPropagation();
    }
  };
}

/**
 * 創建導航處理器（用於 router.push）
 */
export function createNavigationHandler(
  router: { push: (url: string) => void },
  url: string
) {
  return createClickHandler(() => {
    router.push(url);
  });
}

/**
 * 導航到指定 URL（統一導航處理）
 * 優先使用 Next.js router，回退到 window.location
 */
export function navigateToUrl(
  url: string,
  router?: { push: (url: string) => void }
) {
  if (router) {
    router.push(url);
  } else if (typeof window !== "undefined") {
    window.location.href = url;
  }
}

/**
 * 創建切換狀態處理器
 */
export function createToggleHandler(
  setter: (value: boolean) => void,
  currentValue: boolean
) {
  return createClickHandler(() => {
    setter(!currentValue);
  });
}

/**
 * 創建標準的變更事件處理器（用於 input onChange）
 */
export function createChangeHandler<T = void>(
  callback: (e: ChangeEvent<HTMLInputElement>) => T,
  options?: {
    stopPropagation?: boolean;
  }
) {
  return (e: ChangeEvent<HTMLInputElement>) => {
    if (options?.stopPropagation !== false) {
      e.stopPropagation();
    }
    return callback(e);
  };
}

