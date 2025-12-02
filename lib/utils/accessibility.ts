/**
 * 無障礙設計工具函數
 * 實現 WCAG AAA 標準支持
 */

/**
 * 檢查顏色對比度是否符合 WCAG AAA 標準
 * @param foreground 前景色（hex）
 * @param background 背景色（hex）
 * @returns 是否符合 AAA 標準
 */
export function checkContrastAAA(
  foreground: string,
  background: string
): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  // WCAG AAA: 正常文字需要 7:1，大文字需要 4.5:1
  return contrast >= 7;
}

/**
 * 生成 ARIA 標籤屬性
 */
export function getAriaLabel(
  label: string,
  description?: string
): {
  "aria-label": string;
  "aria-describedby"?: string;
} {
  return {
    "aria-label": label,
    ...(description && { "aria-describedby": description }),
  };
}

/**
 * 鍵盤導航支持
 */
export function handleKeyboardNavigation(
  e: React.KeyboardEvent,
  actions: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: () => void;
  }
) {
  switch (e.key) {
    case "Enter":
    case " ":
      actions.onEnter?.();
      break;
    case "Escape":
      actions.onEscape?.();
      break;
    case "ArrowUp":
      actions.onArrowUp?.();
      e.preventDefault();
      break;
    case "ArrowDown":
      actions.onArrowDown?.();
      e.preventDefault();
      break;
    case "ArrowLeft":
      actions.onArrowLeft?.();
      e.preventDefault();
      break;
    case "ArrowRight":
      actions.onArrowRight?.();
      e.preventDefault();
      break;
    case "Tab":
      actions.onTab?.();
      break;
  }
}

/**
 * 螢幕閱讀器友好的文字
 */
export function getScreenReaderText(text: string, context?: string): string {
  if (context) {
    return `${text} ${context}`;
  }
  return text;
}

