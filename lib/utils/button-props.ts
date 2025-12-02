/**
 * 按鈕屬性工具
 * 提供標準化的按鈕屬性配置
 */

import type { MouseEvent, TouchEvent, CSSProperties } from "react";
import { TOUCH_STYLES, TOUCH_CLASSES, createClickHandler, createTouchHandler } from "./touch-handlers";

/**
 * 標準按鈕屬性接口
 */
export interface StandardButtonProps {
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  onTouchStart?: (e: TouchEvent<HTMLElement>) => void;
  onTouchEnd?: (e: TouchEvent<HTMLElement>) => void;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  type?: "button" | "submit" | "reset";
}

/**
 * 創建標準按鈕屬性
 */
export function createButtonProps(
  onClick: () => void,
  options?: {
    className?: string;
    disabled?: boolean;
    "aria-label"?: string;
    "aria-describedby"?: string;
    "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
    type?: "button" | "submit" | "reset";
    preventDefault?: boolean;
    stopPropagation?: boolean;
  }
): StandardButtonProps {
  const handleTouchEnd = (e: TouchEvent<HTMLElement>) => {
    if (options?.stopPropagation !== false) {
      e.stopPropagation();
    }
    if (!options?.disabled) {
      e.preventDefault();
      onClick();
    }
  };

  return {
    onClick: createClickHandler(onClick, {
      preventDefault: options?.preventDefault,
      stopPropagation: options?.stopPropagation,
    }),
    onTouchStart: createTouchHandler({
      stopPropagation: options?.stopPropagation,
    }),
    onTouchEnd: handleTouchEnd,
    className: `${TOUCH_CLASSES} ${options?.className || ""}`.trim(),
    style: TOUCH_STYLES,
    disabled: options?.disabled,
    "aria-label": options?.["aria-label"],
    "aria-describedby": options?.["aria-describedby"],
    "aria-current": options?.["aria-current"],
    "aria-expanded": options?.["aria-expanded"],
    "aria-controls": options?.["aria-controls"],
    type: options?.type || "button",
  };
}

/**
 * 創建標準連結屬性（用於 Next.js Link）
 */
export function createLinkProps(
  onClick?: () => void,
  options?: {
    className?: string;
    "aria-label"?: string;
  }
) {
  return {
    onClick: onClick
      ? createClickHandler(() => onClick(), { stopPropagation: true })
      : undefined,
    onTouchStart: createTouchHandler({ stopPropagation: true }),
    className: `${TOUCH_CLASSES} ${options?.className || ""}`.trim(),
    style: TOUCH_STYLES,
    "aria-label": options?.["aria-label"],
  };
}

