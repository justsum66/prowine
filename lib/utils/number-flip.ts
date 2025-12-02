"use client";

/**
 * 數字翻轉動畫工具（P1 BATCH7）
 * 實現數量變化的數字翻轉動畫
 */

export interface NumberFlipOptions {
  element: HTMLElement;
  fromValue: number;
  toValue: number;
  duration?: number;
  onComplete?: () => void;
}

/**
 * 執行數字翻轉動畫
 */
export function animateNumberFlip(options: NumberFlipOptions): void {
  const { element, fromValue, toValue, duration = 500 } = options;
  
  if (fromValue === toValue) {
    options.onComplete?.();
    return;
  }
  
  const startTime = Date.now();
  const difference = toValue - fromValue;
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 使用緩動函數
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(fromValue + difference * easeOutCubic);
    
    element.textContent = currentValue.toString();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.textContent = toValue.toString();
      options.onComplete?.();
    }
  };
  
  animate();
}

